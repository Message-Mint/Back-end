import { Module } from "@nestjs/common";
import { InstanceService } from "./instance-service";
import { InstanceController } from "./instance-controller";
import { InstanceRepository } from "src/Common/Repositorys/instance-repository";
import { PrismaService } from "src/Common/Database-Management/Prisma/prisma-service";

@Module({
    providers: [InstanceService, InstanceRepository, PrismaService],
    controllers: [InstanceController]
})

export class InstanceModule { };