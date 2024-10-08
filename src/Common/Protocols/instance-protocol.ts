// src/Protocols/instance-protocol.ts
import { Prisma } from '@prisma/client';
import { InstanceEntity } from '../Entities/instance-entities';

export interface InstanceProtocol {
  findInstanceById(id: string): Promise<InstanceEntity | null>;
  findInstanceByName(name: string): Promise<InstanceEntity | null>;
  findInstancesByUserId(userId: string): Promise<InstanceEntity[]>;
  createInstance(data: Prisma.InstanceCreateInput): Promise<InstanceEntity>;
  updateInstanceById(
    id: string,
    data: Prisma.InstanceUpdateInput,
  ): Promise<InstanceEntity>;
  deleteInstanceById(id: string): Promise<InstanceEntity>;
  findActiveInstances(): Promise<
    { id: string; userId: string; sessionStorage: string }[]
  >;
}
