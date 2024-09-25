import { Module } from "@nestjs/common";
import { MongoDBService } from "./mongoDB-service";
import { LoggerService } from "src/Helpers/Logger/logger-service";

@Module({
    providers: [MongoDBService, LoggerService],
    exports: [MongoDBService]
})

export class MongoDBModule { }