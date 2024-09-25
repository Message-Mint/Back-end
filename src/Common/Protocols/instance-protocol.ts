import { Prisma } from "@prisma/client";
import { InstanceEntity } from "../Entities/instance-entities";

export interface InstanceProtocol {
    findInstanceById(id: bigint): Promise<InstanceEntity | null>;
    findInstanceByName(name: string): Promise<InstanceEntity | null>;
    findInstancesByUserId(userId: string): Promise<InstanceEntity[]>;
    createInstance(data: Prisma.InstanceCreateInput): Promise<InstanceEntity>;
    updateInstanceById(id: bigint, data: Prisma.InstanceUpdateInput): Promise<InstanceEntity>;
    deleteInstanceById(id: bigint): Promise<InstanceEntity>;
}
