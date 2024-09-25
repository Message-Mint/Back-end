import { ConflictException, Injectable, BadRequestException, InternalServerErrorException, NotFoundException } from "@nestjs/common";
import { CreateInstanceDto, UpdateInstanceDto } from "./Dto/Instance-dto";
import { Prisma } from "@prisma/client";
import { InstanceRepository } from "src/Common/Repositorys/instance-repository";
import { InstanceEntity } from "src/Common/Entities/instance-entities";

@Injectable()
export class InstanceService {
    constructor(
        private readonly instanceRepo: InstanceRepository
    ) { }

    async createInstance(createInstanceDto: CreateInstanceDto, userId: string): Promise<InstanceEntity> {
        try {
            const existingInstance = await this.instanceRepo.findInstanceByName(createInstanceDto.name);
            if (existingInstance) {
                throw new ConflictException(`Instance with name '${createInstanceDto.name}' already exists`);
            }

            const newInstance = await this.instanceRepo.createInstance({
                ...createInstanceDto,
                isActive: true,
                user: { connect: { id: userId } }
            });

            if (!newInstance) {
                throw new InternalServerErrorException('Failed to create instance');
            }

            return newInstance;
        } catch (error) {
            if (error instanceof ConflictException) {
                throw error;
            }
            if (error instanceof Prisma.PrismaClientKnownRequestError) {
                if (error.code === 'P2002') {
                    throw new ConflictException('Instance name already exists');
                }
            }
            console.error('Error creating instance:', error);
            throw new InternalServerErrorException('An error occurred while creating the instance');
        }
    }

    async updateInstance(id: bigint, updateInstanceDto: UpdateInstanceDto, userId: string): Promise<InstanceEntity> {
        try {
            const existingInstance = await this.instanceRepo.findInstanceById(id);
            if (!existingInstance) {
                throw new NotFoundException(`Instance with id '${id}' not found`);
            }

            if (existingInstance.userId !== userId) {
                throw new BadRequestException('You do not have permission to update this instance');
            }

            const updatedInstance = await this.instanceRepo.updateInstanceById(id, updateInstanceDto);
            return updatedInstance;
        } catch (error) {
            if (error instanceof NotFoundException || error instanceof BadRequestException) {
                throw error;
            }
            console.error('Error updating instance:', error);
            throw new InternalServerErrorException('An error occurred while updating the instance');
        }
    }

    async deleteInstance(id: bigint, userId: string): Promise<void> {
        try {
            const existingInstance = await this.instanceRepo.findInstanceById(id);
            if (!existingInstance) {
                throw new NotFoundException(`Instance with id '${id}' not found`);
            }

            if (existingInstance.userId !== userId) {
                throw new BadRequestException('You do not have permission to delete this instance');
            }

            await this.instanceRepo.deleteInstanceById(id);
        } catch (error) {
            if (error instanceof NotFoundException || error instanceof BadRequestException) {
                throw error;
            }
            console.error('Error deleting instance:', error);
            throw new InternalServerErrorException('An error occurred while deleting the instance');
        }
    }

    async getInstanceById(id: bigint, userId: string): Promise<InstanceEntity> {
        const instance = await this.instanceRepo.findInstanceById(id);
        if (!instance) {
            throw new NotFoundException(`Instance with id '${id}' not found`);
        }

        if (instance.userId !== userId) {
            throw new BadRequestException('You do not have permission to view this instance');
        }

        return instance;
    }

    async getAllInstancesForUser(userId: string): Promise<InstanceEntity[]> {
        return await this.instanceRepo.findInstancesByUserId(userId);
    }

    async toggleInstanceActive(id: bigint, userId: string): Promise<InstanceEntity> {
        const instance = await this.getInstanceById(id, userId);
        const updatedInstance = await this.instanceRepo.updateInstanceById(id, { isActive: !instance.isActive });
        return updatedInstance;
    }
}
