import { Injectable, OnModuleInit, OnModuleDestroy } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { MongoClient, Db, Collection, ObjectId, WithId, IndexSpecification, Document, FindOneAndUpdateOptions } from "mongodb";
import { LoggerService } from "src/Helpers/Logger/logger-service";

@Injectable()
export class MongoDBService implements OnModuleInit, OnModuleDestroy {
    private client: MongoClient;
    private db: Db;

    constructor(
        private configService: ConfigService,
        private readonly logger: LoggerService
    ) { }

    async onModuleInit() {
        const mongoUrl = this.configService.get<string>("MONGO_URL");
        if (!mongoUrl) {
            throw new Error("MongoDB URL is not defined in the configuration");
        }

        this.client = new MongoClient(mongoUrl);

        try {
            await this.client.connect();
            this.logger.log("Successfully connected to MongoDB");
            this.db = this.client.db();
        } catch (error) {
            this.logger.error("Failed to connect to MongoDB", error);
            throw error;
        }
    }

    async onModuleDestroy() {
        if (this.client) {
            await this.client.close();
            this.logger.log("MongoDB connection closed");
        }
    }

    getConnectedClient(): MongoClient {
        if (!this.client) {
            throw new Error("MongoDB client is not initialized");
        }
        return this.client;
    }

    getCollection<T extends Document>(collectionName: string): Collection<T> {
        return this.db.collection<T>(collectionName);
    }

    async insertOne<T extends Document>(collectionName: string, document: Omit<T, '_id'>): Promise<WithId<T>> {
        const collection = this.getCollection<T>(collectionName);
        const result = await collection.insertOne(document as any);
        return { ...document, _id: result.insertedId } as WithId<T>;
    }

    async findOne<T extends Document>(collectionName: string, filter: Partial<T>): Promise<WithId<T> | null> {
        const collection = this.getCollection<T>(collectionName);
        return await collection.findOne(filter as any);
    }

    async find<T extends Document>(collectionName: string, filter: Partial<T>, options?: { limit?: number, skip?: number }): Promise<WithId<T>[]> {
        const collection = this.getCollection<T>(collectionName);
        return await collection.find(filter as any, options).toArray();
    }

    async updateOne<T extends Document>(collectionName: string, filter: Partial<T>, update: Partial<T>): Promise<WithId<T> | null> {
        const collection = this.getCollection<T>(collectionName);
        const options: FindOneAndUpdateOptions = { returnDocument: 'after' };
        const result = await collection.findOneAndUpdate(
            filter as any,
            { $set: update },
            options
        );
        return result as WithId<T> | null;
    }

    async deleteOne<T extends Document>(collectionName: string, filter: Partial<T>): Promise<boolean> {
        const collection = this.getCollection<T>(collectionName);
        const result = await collection.deleteOne(filter as any);
        return result.deletedCount > 0;
    }

    async count<T extends Document>(collectionName: string, filter: Partial<T>): Promise<number> {
        const collection = this.getCollection<T>(collectionName);
        return await collection.countDocuments(filter as any);
    }

    async aggregate<T extends Document, R>(collectionName: string, pipeline: object[]): Promise<R[]> {
        const collection = this.getCollection<T>(collectionName);
        return await collection.aggregate<R>(pipeline).toArray();
    }

    async createIndex<T extends Document>(collectionName: string, fieldOrSpec: IndexSpecification, options?: object): Promise<string> {
        const collection = this.getCollection<T>(collectionName);
        return await collection.createIndex(fieldOrSpec, options);
    }

    async transaction<T>(callback: (session: any) => Promise<T>): Promise<T> {
        const session = this.client.startSession();
        try {
            session.startTransaction();
            const result = await callback(session);
            await session.commitTransaction();
            return result;
        } catch (error) {
            await session.abortTransaction();
            throw error;
        } finally {
            session.endSession();
        }
    }

    toObjectId(id: string): ObjectId {
        return new ObjectId(id);
    }
}
