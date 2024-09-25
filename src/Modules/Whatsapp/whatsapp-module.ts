import { Module } from "@nestjs/common";
import { WhatsappController } from "./whatsapp-controller";
import { SocketService } from "./services/socket-service";
import { LoggerService } from "src/Helpers/Logger/logger-service";
import { PostgreSQLService } from "src/Common/Database-Management/PostgreSQL/postgresql-service";
import { MongoDBService } from "src/Common/Database-Management/MongoDB/mongoDB-service";
import { InstanceRepository } from "src/Common/Repositorys/instance-repository";
import { PrismaService } from "src/Common/Database-Management/Prisma/prisma-service";

@Module({
    providers: [SocketService, LoggerService, PostgreSQLService, MongoDBService, InstanceRepository, PrismaService],
    controllers: [WhatsappController]
})

export class WhatsappModule { }