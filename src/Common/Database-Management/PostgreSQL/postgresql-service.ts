import { Injectable, OnModuleInit, OnModuleDestroy } from "@nestjs/common";
import { Pool, PoolClient, QueryResult } from "pg";
import { ConfigService } from "@nestjs/config";
import { LoggerService } from "src/Helpers/Logger/logger-service";

@Injectable()
export class PostgreSQLService implements OnModuleInit, OnModuleDestroy {
    private pool: Pool;

    constructor(
        private configService: ConfigService,
        private readonly logger: LoggerService
    ) { }

    async onModuleInit() {
        this.pool = new Pool({
            host: this.configService.get<string>("POSTGRES_HOST"),
            port: this.configService.get<number>("POSTGRES_PORT"),
            user: this.configService.get<string>("POSTGRES_USER"),
            password: this.configService.get<string>("POSTGRES_PASSWORD"),
            database: this.configService.get<string>("POSTGRES_DB"),
            max: this.configService.get<number>("POSTGRES_POOL_MAX", 20),
            idleTimeoutMillis: this.configService.get<number>("POSTGRES_POOL_IDLE_TIMEOUT", 30000),
            ssl: {
                rejectUnauthorized: false
            },
            connectionTimeoutMillis: 10000
        });

        // Test the connection
        try {
            const client = await this.pool.connect();
            this.logger.log("Successfully connected to PostgreSQL");
            client.release();
        } catch (error) {
            this.logger.error("Failed to connect to PostgreSQL", error);
        }
    }

    async onModuleDestroy() {
        await this.pool.end();
        this.logger.log("PostgreSQL pool has ended");
    }

    async getClient(): Promise<PoolClient> {
        return await this.pool.connect();
    }

    async query<T = any>(text: string, params?: any[]): Promise<QueryResult<T>> {
        const client = await this.getClient();
        try {
            return await client.query(text, params);
        } finally {
            client.release();
        }
    }

    async transaction<T>(callback: (client: PoolClient) => Promise<T>): Promise<T> {
        const client = await this.getClient();
        try {
            await client.query('BEGIN');
            const result = await callback(client);
            await client.query('COMMIT');
            return result;
        } catch (e) {
            await client.query('ROLLBACK');
            throw e;
        } finally {
            client.release();
        }
    }

    async insertOne<T = any>(table: string, data: Record<string, any>): Promise<T | null> {
        const keys = Object.keys(data);
        const values = Object.values(data);
        const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');

        const query = `
            INSERT INTO ${table} (${keys.join(', ')})
            VALUES (${placeholders})
            RETURNING *
        `;

        const result = await this.query<T>(query, values);
        return result.rows[0] || null;
    }

    async findOne<T = any>(table: string, conditions: Record<string, any>): Promise<T | null> {
        const keys = Object.keys(conditions);
        const values = Object.values(conditions);
        const whereClause = keys.map((key, i) => `${key} = $${i + 1}`).join(' AND ');

        const query = `
            SELECT * FROM ${table}
            WHERE ${whereClause}
            LIMIT 1
        `;

        const result = await this.query<T>(query, values);
        return result.rows[0] || null;
    }

    async updateOne<T = any>(table: string, id: number | string, data: Record<string, any>): Promise<T | null> {
        const keys = Object.keys(data);
        const values = Object.values(data);
        const setClause = keys.map((key, i) => `${key} = $${i + 2}`).join(', ');

        const query = `
            UPDATE ${table}
            SET ${setClause}
            WHERE id = $1
            RETURNING *
        `;

        const result = await this.query<T>(query, [id, ...values]);
        return result.rows[0] || null;
    }

    async deleteOne(table: string, id: number | string): Promise<boolean> {
        const query = `
            DELETE FROM ${table}
            WHERE id = $1
        `;

        const result = await this.query(query, [id]);
        return result.rowCount > 0;
    }
}
