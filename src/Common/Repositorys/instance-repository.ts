// src/Repositories/instance-repository.ts
import { Injectable } from "@nestjs/common";
import { PrismaService } from "../Database-Management/Prisma/prisma-service";
import { InstanceProtocol } from "../Protocols/instance-protocol";
import { InstanceEntity } from "../Entities/instance-entities";
import { Prisma } from "@prisma/client";

@Injectable()
export class InstanceRepository implements InstanceProtocol {
    constructor(private readonly prisma: PrismaService) { }

    async findInstanceById(id: bigint): Promise<InstanceEntity | null> {
        return await this.prisma.instance.findUnique({ where: { id } });
    }

    async findInstanceByName(name: string): Promise<InstanceEntity | null> {
        return await this.prisma.instance.findUnique({ where: { name } });
    }

    async findInstancesByUserId(userId: string): Promise<InstanceEntity[]> {
        return await this.prisma.instance.findMany({ where: { userId } });
    }

    async createInstance(data: Prisma.InstanceCreateInput): Promise<InstanceEntity> {
        return await this.prisma.instance.create({ data });
    }

    async updateInstanceById(id: bigint, data: Prisma.InstanceUpdateInput): Promise<InstanceEntity> {
        return await this.prisma.instance.update({
            where: { id },
            data,
        });
    }

    async deleteInstanceById(id: bigint): Promise<InstanceEntity> {
        return await this.prisma.instance.delete({ where: { id } });
    }

    async findActiveInstances(): Promise<{ id: bigint; userId: string; sessionStorage: string }[]> {
        return await this.prisma.instance.findMany({
            where: { isActive: true },
            select: { id: true, userId: true, sessionStorage: true }
        });
    }
}
