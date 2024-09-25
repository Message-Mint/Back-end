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

@Injectable()
export class SocketService {
    private msgRetryCounterCache = new NodeCache();
    private socketMap: Map<string, WASocket> = new Map();
    private groupMetadataCache: NodeCache;

    constructor(
        private readonly instanceDB: InstanceRepository,
        private readonly configService: ConfigService,
        private readonly mongoDb: MongoDBService,
        private readonly logger: LoggerService
    ) {
        this.groupMetadataCache = new NodeCache({ stdTTL: 3600, checkperiod: 120 });
    }

    async makeSocket(userId: string): Promise<WASocket> {
        try {
            // Check if a socket already exists for this user
            if (this.socketMap.has(userId)) {
                const existingSocket = this.socketMap.get(userId);
                if (existingSocket.ws.readyState === existingSocket.ws.OPEN) {
                    this.logger.log(`Socket already exists and is open for user ${userId}`);
                    return existingSocket;
                } else {
                    this.logger.log(`Existing socket for user ${userId} is not open. Creating a new one.`);
                    this.socketMap.delete(userId);
                }
            }

            const users = await this.instanceDB.findInstancesByUserId(userId);

            if (!users || users.length === 0) {
                throw new Error(`User Not Found for ID: ${userId}`);
            }

            const { state, saveCreds } = await this.getUserSessionStorage(users[0]);

            const logger = pino({ level: 'silent' });

            const socket: WASocket = makeWASocket({
                logger,
                printQRInTerminal: false,
                auth: {
                    creds: state.creds,
                    keys: makeCacheableSignalKeyStore(state.keys, logger),
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
        } catch (error) {
            this.logger.error(`Failed to make socket for user ${userId}`, error);
            throw new Error(`Socket creation failed: ${error.message}`);
        }
    }

    private setupSocketListeners(socket: WASocket, userId: string, saveCreds: () => Promise<void>) {
        socket.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect } = update;
            if (connection === 'close') {
                const statusCode = (lastDisconnect?.error as Boom)?.output?.statusCode;
                const shouldReconnect = this.shouldReconnect(statusCode);

                this.logger.log(`Connection closed due to ${lastDisconnect?.error}, reconnecting: ${shouldReconnect}`);

                if (shouldReconnect) {
                    await delay(this.getExponentialBackoffDelay(statusCode));
                    try {
                        await this.makeSocket(userId);
                    } catch (error) {
                        this.logger.error(`Failed to reconnect for user ${userId}`, error);
                    }
                } else {
                    this.logger.log(`Stopping reconnection attempts for user ${userId}`);
                    this.socketMap.delete(userId);
                }
            } else if (connection === 'open') {
                this.logger.log(`Connection opened for user ${userId}`);
                this.scheduleSocketRenewal(userId);
            }
        });

        socket.ev.on('creds.update', async () => {
            try {
                await saveCreds();
            } catch (error) {
                this.logger.error(`Failed to save credentials for user ${userId}`, error);
            }
        });

        socket.ev.on('groups.upsert', (groupMetadata) => {
            for (const metadata of groupMetadata) {
                this.groupMetadataCache.set(metadata.id, metadata);
            }
        });

        socket.ev.on('groups.update', (groupMetadata) => {
            for (const metadata of groupMetadata) {
                const cachedMetadata = this.groupMetadataCache.get<GroupMetadata>(metadata.id);
                if (cachedMetadata) {
                    this.groupMetadataCache.set(metadata.id, { ...cachedMetadata, ...metadata });
                }
            }
        });
    }

    private shouldReconnect(statusCode: number | undefined): boolean {
        return statusCode !== DisconnectReason.loggedOut &&
            statusCode !== DisconnectReason.timedOut;
    }

    private getExponentialBackoffDelay(statusCode: number | undefined): number {
        const baseDelay = 5000; // 5 seconds
        const maxDelay = 300000; // 5 minutes
        const factor = statusCode === DisconnectReason.restartRequired ? 1.5 : 2;
        const attemptCount = this.msgRetryCounterCache.get('reconnectAttempts') as number || 0;
        this.msgRetryCounterCache.set('reconnectAttempts', attemptCount + 1);
        return Math.min(baseDelay * Math.pow(factor, attemptCount), maxDelay);
    }

    private scheduleSocketRenewal(userId: string) {
        setTimeout(() => {
            this.logger.log(`Renewing socket for user ${userId}`);
            this.closeAndRenewSocket(userId);
        }, 20 * 60 * 1000); // 20 minutes
    }

    private async closeAndRenewSocket(userId: string) {
        try {
            const oldSocket = this.socketMap.get(userId);
            if (oldSocket) {
                oldSocket.end(new Error('Scheduled socket renewal'));
                this.socketMap.delete(userId);
            }
            await this.makeSocket(userId);
        } catch (error) {
            this.logger.error(`Failed to renew socket for user ${userId}`, error);
        }
    }

    private async getUserSessionStorage(instance: InstanceEntity): Promise<{ state: AuthenticationState, saveCreds: () => Promise<void> }> {
        const sessionName = `${this.configService.get<string>("SESSION_STORAGE_NAME", "default")}/${instance.id}`;

        try {
            switch (instance.sessionStorage) {
                case "REDIS":
                    return await this.getRedisAuthState(sessionName);
                case "POSTGRESQL":
                    return await this.getPostgresAuthState(sessionName);
                case "MONGODB":
                    return await this.getMongoAuthState(sessionName);
                default:
                    this.logger.warn(`Unknown storage type: ${instance.sessionStorage}. Using MultiFileAuth as fallback.`);
                    return await useMultiFileAuthState(sessionName);
            }
        } catch (error) {
            this.logger.error(`Failed to get auth state for ${instance.sessionStorage}`, error);
            this.logger.log(`Falling back to MultiFileAuth for session: ${sessionName}`);
            return await useMultiFileAuthState(sessionName);
        }
    }

    private async getRedisAuthState(sessionName: string): Promise<{ state: AuthenticationState, saveCreds: () => Promise<void> }> {
        const redisHost = this.configService.get<string>("REDIS_HOST");
        const redisPort = this.configService.get<number>("REDIS_PORT");
        const redisPassword = this.configService.get<string>("REDIS_PASSWORD");

        if (!redisHost || !redisPort || !redisPassword) {
            throw new Error("Redis configuration is incomplete");
        }

        return await useRedisAuthState({ host: redisHost, port: redisPort, password: redisPassword }, sessionName);
    }

    private async getPostgresAuthState(sessionName: string): Promise<{ state: AuthenticationState, saveCreds: () => Promise<void> }> {
        const postgresConfig = this.configService.get("POSTGRES_CONFIG");
        if (!postgresConfig) {
            throw new Error("PostgreSQL configuration is missing");
        }

        return await usePostgreSQLAuthState(postgresConfig, sessionName);
    }

    private async getMongoAuthState(sessionName: string): Promise<{ state: AuthenticationState, saveCreds: () => Promise<void> }> {
        const mongoUrl = this.configService.get<string>("MONGO_URL");
        if (!mongoUrl) {
            throw new Error("MongoDB URL is missing");
        }

        const client = this.mongoDb.getConnectedClient().db(this.configService.get<string>("SESSION_STORAGE_NAME", "default")).collection<AuthDocument>(sessionName);
        return await useMongoDBAuthState(client);
    }
}