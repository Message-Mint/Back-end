import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import makeWASocket, {
    AuthenticationState,
    makeCacheableSignalKeyStore,
    useMultiFileAuthState,
    WASocket,
    DisconnectReason,
    GroupMetadata,
    delay,
} from '@whiskeysockets/baileys';
import { useRedisAuthState } from 'redis-baileys';
import { usePostgreSQLAuthState } from "postgres-baileys";
import { useMongoDBAuthState } from "mongo-baileys";
import { InstanceEntity } from "src/Common/Entities/instance-entities";
import { MongoDBService } from "src/Common/Database-Management/MongoDB/mongoDB-service";
import { AuthDocument } from "../types/wasocket-types";
import { LoggerService } from "src/Helpers/Logger/logger-service";
import { InstanceRepository } from "src/Common/Repositorys/instance-repository";
import { Boom } from '@hapi/boom';
import * as NodeCache from 'node-cache';
import pino from 'pino';
import { PostgreSQLService } from "src/Common/Database-Management/PostgreSQL/postgresql-service";
import { EventEmitter2 } from '@nestjs/event-emitter';
import * as qrcode from 'qrcode';

@Injectable()
export class SocketService {
    private msgRetryCounterCache = new NodeCache();
    private socketMap: Map<string, WASocket> = new Map();
    private groupMetadataCache: NodeCache;

    constructor(
        private readonly instanceDB: InstanceRepository,
        private readonly configService: ConfigService,
        private readonly mongoDb: MongoDBService,
        private readonly logger: LoggerService,
        private readonly pgPool: PostgreSQLService,
        private readonly eventEmitter: EventEmitter2
    ) {
        this.groupMetadataCache = new NodeCache({ stdTTL: 3600, checkperiod: 120 });
    }

    async makeSocket(userId: string): Promise<WASocket> {
        const existingSocket = this.socketMap.get(userId);
        if (existingSocket?.ws.readyState === existingSocket.ws.OPEN) {
            this.logger.log(`Socket already exists and is open for user ${userId}`);
            return existingSocket;
        }

        this.socketMap.delete(userId);

        const users = await this.instanceDB.findInstancesByUserId(userId);
        if (!users?.length) {
            throw new Error(`User Not Found for ID: ${userId}`);
        }

        const { state, saveCreds } = await this.getUserSessionStorage(users[0]);

        const socket: WASocket = makeWASocket({
            logger: pino({ level: 'silent' }),
            printQRInTerminal: false,
            qrTimeout: 12000,
            auth: {
                creds: state.creds,
                keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'silent' })),
            },
            msgRetryCounterCache: this.msgRetryCounterCache,
            generateHighQualityLinkPreview: true,
            browser: ['Safari (Mac)', 'Safari', '16.5'],
            markOnlineOnConnect: false,
            retryRequestDelayMs: 2000,
            fireInitQueries: false,
            syncFullHistory: false,
            shouldSyncHistoryMessage: () => false,
            userDevicesCache: new NodeCache({ stdTTL: 86400, checkperiod: 3600 }),
            transactionOpts: { maxCommitRetries: 10, delayBetweenTriesMs: 1000 },
        });

        this.setupSocketListeners(socket, userId, saveCreds);
        this.socketMap.set(userId, socket);

        return socket;
    }

    private setupSocketListeners(socket: WASocket, userId: string, saveCreds: () => Promise<void>) {
        socket.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect, qr } = update;

            if (qr) {
                const qrBase64 = await this.generateQRBase64(qr);
                this.eventEmitter.emit('qr.update', { userId, qrBase64 });
            }

            if (connection === 'open') {
                this.logger.log(`Connection opened for user ${userId}`);
                this.scheduleSocketRenewal(userId);
                return;
            }

            if (connection !== 'close') return;

            const statusCode = (lastDisconnect?.error as Boom)?.output?.statusCode;
            const shouldReconnect = this.shouldReconnect(statusCode);

            this.logger.log(`Connection closed due to ${lastDisconnect?.error}, reconnecting: ${shouldReconnect}`);

            if (!shouldReconnect) {
                this.logger.log(`Stopping reconnection attempts for user ${userId}`);
                this.socketMap.delete(userId);
                await this.deleteSession(userId);
                return;
            }

            if (statusCode === DisconnectReason.restartRequired) {
                await this.immediateReconnect(userId);
            } else {
                await this.reconnectWithBackoff(userId);
            }
        });

        socket.ev.on('creds.update', saveCreds);

        socket.ev.on('groups.upsert', (groupMetadata) => {
            groupMetadata.forEach(metadata => this.groupMetadataCache.set(metadata.id, metadata));
        });

        socket.ev.on('groups.update', (groupMetadata) => {
            groupMetadata.forEach(metadata => {
                const cachedMetadata = this.groupMetadataCache.get<GroupMetadata>(metadata.id);
                if (cachedMetadata) {
                    this.groupMetadataCache.set(metadata.id, { ...cachedMetadata, ...metadata });
                }
            });
        });
    }

    private async generateQRBase64(qr: string): Promise<string> {
        try {
            const qrBuffer = await qrcode.toBuffer(qr, {
                errorCorrectionLevel: 'H',
                type: 'png',
                margin: 1,
                scale: 8
            });
            return `data:image/png;base64,${qrBuffer.toString('base64')}`;
        } catch (error) {
            this.logger.error('Failed to generate QR code', error);
            throw error;
        }
    }

    private shouldReconnect(statusCode: number | undefined): boolean {
        return ![DisconnectReason.loggedOut, DisconnectReason.timedOut, DisconnectReason.badSession].includes(statusCode);
    }

    private async immediateReconnect(userId: string): Promise<void> {
        this.logger.log(`Immediate reconnect for user ${userId}`);
        await this.makeSocket(userId);
    }

    private async reconnectWithBackoff(userId: string): Promise<void> {
        const attemptCount = this.msgRetryCounterCache.get('reconnectAttempts') as number || 0;
        const delay = this.calculateBackoffDelay(attemptCount);

        this.logger.log(`Reconnecting for user ${userId} in ${delay}ms (attempt ${attemptCount + 1})`);

        this.msgRetryCounterCache.set('reconnectAttempts', attemptCount + 1);

        await new Promise(resolve => setTimeout(resolve, delay));
        await this.makeSocket(userId);
    }

    private calculateBackoffDelay(attemptCount: number): number {
        const baseDelay = 5000;
        const maxDelay = 300000;
        const factor = 2;
        return Math.min(baseDelay * Math.pow(factor, attemptCount), maxDelay);
    }

    private scheduleSocketRenewal(userId: string) {
        const renewalTime = 20 * 60 * 1000; // 20 minutes
        setTimeout(() => this.closeAndRenewSocket(userId), renewalTime);
    }

    private async closeAndRenewSocket(userId: string) {
        this.logger.log(`Renewing socket for user ${userId}`);
        const oldSocket = this.socketMap.get(userId);
        if (oldSocket) {
            oldSocket.end(new Error('Scheduled socket renewal'));
            this.socketMap.delete(userId);
        }
    }

    private async getUserSessionStorage(instance: InstanceEntity): Promise<{ state: AuthenticationState, saveCreds: () => Promise<void> }> {
        const sessionName = `${this.configService.get<string>("SESSION_STORAGE_NAME", "default")}/${instance.id}`;

        const storageHandlers = {
            REDIS: () => this.getRedisAuthState(sessionName),
            POSTGRESQL: () => this.getPostgresAuthState(sessionName),
            MONGODB: () => this.getMongoAuthState(sessionName),
            default: () => useMultiFileAuthState(sessionName),
        };

        const handler = storageHandlers[instance.sessionStorage] || storageHandlers.default;

        try {
            return await handler();
        } catch (error) {
            this.logger.error(`Failed to get auth state for ${instance.sessionStorage}`, error);
            this.logger.log(`Falling back to MultiFileAuth for session: ${sessionName}`);
            return storageHandlers.default();
        }
    }

    private async getRedisAuthState(sessionName: string): Promise<{ state: AuthenticationState, saveCreds: () => Promise<void> }> {
        const { host, port, password } = this.getRedisConfig();
        return await useRedisAuthState({ host, port, password }, sessionName);
    }

    private getRedisConfig() {
        const host = this.configService.get<string>("REDIS_HOST");
        const port = this.configService.get<number>("REDIS_PORT");
        const password = this.configService.get<string>("REDIS_PASSWORD");

        if (!host || !port || !password) {
            throw new Error("Redis configuration is incomplete");
        }

        return { host, port, password };
    }

    private async getPostgresAuthState(sessionName: string): Promise<{ state: AuthenticationState, saveCreds: () => Promise<void> }> {
        return await usePostgreSQLAuthState(this.pgPool, sessionName);
    }

    private async getMongoAuthState(sessionName: string): Promise<{ state: AuthenticationState, saveCreds: () => Promise<void> }> {
        const mongoUrl = this.configService.get<string>("MONGO_URL");
        if (!mongoUrl) {
            throw new Error("MongoDB URL is missing");
        }

        const client = this.mongoDb.getConnectedClient().db(this.configService.get<string>("SESSION_STORAGE_NAME", "default")).collection<AuthDocument>(sessionName);
        return await useMongoDBAuthState(client);
    }

    private async deleteSession(userId: string): Promise<void> {
        const users = await this.instanceDB.findInstancesByUserId(userId);
        if (!users?.length) return;

        const instance = users[0];
        const sessionName = `${this.configService.get<string>("SESSION_STORAGE_NAME", "default")}/${instance.id}`;

        const deletionHandlers = {
            REDIS: () => this.deleteRedisSession(sessionName),
            POSTGRESQL: () => this.deletePostgresSession(sessionName),
            MONGODB: () => this.deleteMongoSession(sessionName),
            default: () => this.deleteMultiFileSession(sessionName),
        };

        const handler = deletionHandlers[instance.sessionStorage] || deletionHandlers.default;
        await handler();
    }

    private async deleteRedisSession(sessionName: string): Promise<void> {
        const { host, port, password } = this.getRedisConfig();
        const { deleteSession } = await useRedisAuthState({ host, port, password }, sessionName);
        await deleteSession();
    }

    private async deletePostgresSession(sessionName: string): Promise<void> {
        const { deleteSession } = await usePostgreSQLAuthState(this.pgPool, sessionName);
        await deleteSession();
    }

    private async deleteMongoSession(sessionName: string): Promise<void> {
        const client = this.mongoDb.getConnectedClient().db(this.configService.get<string>("SESSION_STORAGE_NAME", "default")).collection<AuthDocument>(sessionName);
        await client.deleteMany({});
    }

    private async deleteMultiFileSession(sessionName: string): Promise<void> {
        const fs = await import('fs/promises');
        const path = await import('path');

        try {
            await fs.rm(path.join(process.cwd(), sessionName), { recursive: true, force: true });
        } catch (error) {
            this.logger.error(`Failed to delete multi-file session: ${sessionName}`, error);
        }
    }
}