import { Module } from "@nestjs/common";
import { WhatsappController } from "./whatsapp-controller";
import { SocketService } from "./services/socket-service";
import { LoggerService } from "src/Helpers/Logger/logger-service";
import { PostgreSQLService } from "src/Common/Database-Management/PostgreSQL/postgresql-service";
import { MongoDBService } from "src/Common/Database-Management/MongoDB/mongoDB-service";
import { InstanceRepository } from "src/Common/Repositorys/instance-repository";
import { PrismaService } from "src/Common/Database-Management/Prisma/prisma-service";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { MessagingService } from "./services/message-service";
import { MessagingController } from "./messageing-controller";

@Module({
    providers: [SocketService, LoggerService, PostgreSQLService, MongoDBService, InstanceRepository, PrismaService, EventEmitter2, MessagingService],
    controllers: [WhatsappController, MessagingController]
})

export class WhatsappModule { }