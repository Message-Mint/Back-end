import { Module } from "@nestjs/common";
import { UserRepository } from "./Repositorys/user-repository";
import { PrismaService } from "./Database-Management/Prisma/prisma-service";

@Module({
    providers: [UserRepository, PrismaService],
    exports: [UserRepository]
})

export class CommonModule { };