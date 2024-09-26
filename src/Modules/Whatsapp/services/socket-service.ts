import { Injectable, NotFoundException, OnModuleInit } from "@nestjs/common";
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
import { parsePhoneNumber, isValidPhoneNumber } from 'libphonenumber-js';

@Injectable()
export class SocketService implements OnModuleInit {
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

    async onModuleInit() {
        await this.initializeActiveSockets();
    }

    private async initializeActiveSockets(): Promise<void> {
        try {
            const activeInstances = await this.instanceDB.findActiveInstances();

            this.logger.log(`Found ${activeInstances.length} active instances. Initializing sockets...`);

            for (const instance of activeInstances) {
                try {
                    await this.makeSocket(instance.id.toString(), instance.sessionStorage);
                    this.logger.log(`Initialized socket for instance ${instance.id}`);
                } catch (error) {
                    this.logger.error(`Failed to initialize socket for instance ${instance.id}`, error);
                }
                await delay(1000);
            }

            this.logger.log('Finished initializing all active sockets');
        } catch (error) {
            this.logger.error('Failed to initialize active sockets', error);
        }
    }

    async getOrCreateSocket(instanceId: string): Promise<WASocket> {
        if (!instanceId) {
            throw new NotFoundException("Instance ID is required");
        }

        const instance = await this.instanceDB.findInstanceById(instanceId);
        if (!instance) {
            throw new NotFoundException(`Instance with ID ${instanceId} not found`);
        }

        try {
            return await this.makeSocket(instanceId, instance.sessionStorage);
        } catch (error) {
            if (error instanceof Boom) {
                throw new Error(`Failed to create socket: ${error.output?.payload?.message || error.message}`);
            }
            throw error;
        }
    }

    async makeSocket(instanceId: string, sessionStorage: string): Promise<WASocket> {
        const existingSocket = this.socketMap.get(instanceId);
        if (existingSocket && existingSocket?.ws.readyState === existingSocket?.ws.OPEN) {
            this.logger.log(`Socket already exists and is open for instance ${instanceId}`);
            return existingSocket;
        }

        this.socketMap.delete(instanceId);

        const { state, saveCreds } = await this.getInstanceSessionStorage({ id: instanceId, sessionStorage });

        const socket: WASocket = makeWASocket({
            logger: pino({ level: 'silent' }),
            printQRInTerminal: false,
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
            cachedGroupMetadata: async (jid) => {
                return this.groupMetadataCache.get(jid);
            },
            patchMessageBeforeSending: (message) => {
                const requiresPatch = !!(
                    message.buttonsMessage ||
                    message.templateMessage ||
                    message.listMessage
                );
                if (requiresPatch) {
                    message = {
                        viewOnceMessage: {
                            message: {
                                messageContextInfo: {
                                    deviceListMetadataVersion: 2,
                                    deviceListMetadata: {},
                                },
                                ...message,
                            },
                        },
                    };
                }
                return message;
            },
        });

        this.setupSocketListeners(socket, instanceId, saveCreds, sessionStorage);
        this.socketMap.set(instanceId, socket);
        return socket;
    }

    private setupSocketListeners(socket: WASocket, instanceId: string, saveCreds: () => Promise<void>, sessionStorage: string) {
        socket.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect, qr, isNewLogin } = update;

            if (qr) {
                this.logger.info(`[QR] Generated for Instance: ${instanceId}`)
                const qrBase64 = await this.generateQRBase64(qr);
                this.eventEmitter.emit(`qr.update.${instanceId}`, { data: qrBase64 });
            }

            if (isNewLogin) {
                this.eventEmitter.emit(`qr.update.${instanceId}`, { data: "Connected!" });
                this.eventEmitter.removeAllListeners(`qr.update.${instanceId}`);
            }

            if (connection === 'open') {
                await this.instanceDB.updateInstanceById(instanceId, { isActive: true })
                this.logger.log(`Connection opened for instance ${instanceId}`);
                this.scheduleSocketRenewal(instanceId);
                return;
            }

            if (connection !== 'close') return;

            const statusCode = (lastDisconnect?.error as Boom)?.output?.statusCode;
            const shouldReconnect = this.shouldReconnect(statusCode);

            await this.instanceDB.updateInstanceById(instanceId, { isActive: false })

            this.logger.log(`Connection closed due to ${lastDisconnect?.error}, reconnecting: ${shouldReconnect}`);

            if ((lastDisconnect?.error as Boom)?.message.toLowerCase() === 'user choice!') {
                return;
            }

            if (!shouldReconnect) {
                this.eventEmitter.removeAllListeners(`qr.update.${instanceId}`);
                this.logger.log(`Stopping reconnection attempts for instance ${instanceId}`);
                this.socketMap.delete(instanceId);
                await this.deleteSession(instanceId);
                return;
            }

            if (statusCode === DisconnectReason.restartRequired) {
                await this.immediateReconnect(instanceId, sessionStorage);
            } else {
                await this.reconnectWithBackoff(instanceId, sessionStorage);
            }
        });

        socket.ev.on('creds.update', () => {
            saveCreds().catch(error =>
                this.logger.error(`Failed to save credentials for instance ${instanceId}` + error)
            );
        });

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

    async generatePairingCode(instanceId: string, phoneNumber: string): Promise<string> {
        // Validate phone number
        if (!isValidPhoneNumber(phoneNumber)) {
            throw new Error('Invalid phone number');
        }

        // Parse and format the phone number
        const parsedNumber = parsePhoneNumber(phoneNumber);
        const formattedNumber = parsedNumber.format('E.164');

        const socket = await this.getOrCreateSocket(instanceId);
        if (!socket) {
            throw new Error('Failed to create or retrieve socket');
        }

        try {
            await delay(1200);
            const pairingCode = await socket.requestPairingCode(formattedNumber);
            return pairingCode;
        } catch (error) {
            await this.deleteSession(instanceId);
            this.logger.error(`Failed to generate pairing code for instance ${instanceId}`, error);
            throw new Error('Failed to generate pairing code');
        }
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

    private async immediateReconnect(userId: string, sessionStorage: string): Promise<void> {
        this.logger.log(`Immediate reconnect for user ${userId}`);
        await this.makeSocket(userId, sessionStorage);
    }

    private async reconnectWithBackoff(userId: string, sessionStorage: string): Promise<void> {
        const attemptCount = this.msgRetryCounterCache.get('reconnectAttempts') as number || 0;
        const delay = this.calculateBackoffDelay(attemptCount);

        this.logger.log(`Reconnecting for user ${userId} in ${delay}ms (attempt ${attemptCount + 1})`);

        this.msgRetryCounterCache.set('reconnectAttempts', attemptCount + 1);

        await new Promise(resolve => setTimeout(resolve, delay));
        await this.makeSocket(userId, sessionStorage);
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

    private async getInstanceSessionStorage(instance: { id: string, sessionStorage: string }): Promise<{ state: AuthenticationState, saveCreds: () => Promise<void> }> {
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
        try {
            const { host, port, password } = this.getRedisConfig();
            //   return await useRedisAuthState({ host, port, password }, sessionName);
            return
        } catch (err) {
            this.logger.error(err?.message || err)
        }
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

    async stopSocket(instanceId: string) {
        const existingSocket = this.socketMap.get(instanceId);
        if (existingSocket && existingSocket?.ws.readyState === existingSocket?.ws.OPEN) {
            existingSocket.end(new Error("user choice!"))
            await this.instanceDB.updateInstanceById(instanceId, { isActive: false });
        }
    }

    async loggedOutEndSocket(instanceId: string): Promise<void> {
        try {
            // Get the existing socket
            const existingSocket = this.socketMap.get(instanceId);

            if (existingSocket && existingSocket?.ws.readyState === existingSocket?.ws.OPEN) {
                // Close the existing socket
                await existingSocket.logout("User Logged Out!");
                existingSocket.end(new Error('User logged out!'));
                this.socketMap.delete(instanceId);
                this.logger.log(`Socket closed for logged out instance ${instanceId}`);
            }

            // Update instance status in the database
            await this.instanceDB.updateInstanceById(instanceId, { isActive: false });

            // Delete the session
            await this.deleteSession(instanceId);

            // Remove any existing QR code listeners
            this.eventEmitter.removeAllListeners(`qr.update.${instanceId}`);

            this.logger.log(`Logged out end socket process completed for instance ${instanceId}`);
        } catch (error) {
            this.logger.error(`Error in loggedOutEndSocket for instance ${instanceId}`, error);
            throw error;
        }
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

    private async deleteSession(instanceID: string): Promise<void> {
        const users = await this.instanceDB.findInstanceById(instanceID);
        if (!users) return;

        const sessionName = `${this.configService.get<string>("SESSION_STORAGE_NAME", "default")}/${users.id}`;

        const deletionHandlers = {
            REDIS: () => this.deleteRedisSession(sessionName),
            POSTGRESQL: () => this.deletePostgresSession(sessionName),
            MONGODB: () => this.deleteMongoSession(sessionName),
            default: () => this.deleteMultiFileSession(sessionName),
        };

        const handler = deletionHandlers[users.sessionStorage] || deletionHandlers.default;
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