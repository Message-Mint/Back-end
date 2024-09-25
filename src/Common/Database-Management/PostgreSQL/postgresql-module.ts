import { Module } from "@nestjs/common";
import { PostgreSQLService } from "./postgresql-service";
import { LoggerService } from "src/Helpers/Logger/logger-service";

@Module({
    providers: [PostgreSQLService, LoggerService],
    exports: [PostgreSQLService]
})

export class PostgresSQLModule { }