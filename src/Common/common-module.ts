import { Module } from "@nestjs/common";
import { UserRepository } from "./Repositorys/user-repository";
import { PrismaService } from "./Database-Management/Prisma/prisma-service";
import { InstanceRepository } from "./Repositorys/instance-repository";

@Module({
    providers: [UserRepository, PrismaService],
    exports: [UserRepository, InstanceRepository]
})

export class CommonModule { };