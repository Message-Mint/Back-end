import { Controller, Post, Put, Delete, Get, UseGuards, Body, Param, Req } from "@nestjs/common";
import { JwtAuthGuard } from "../Auth/jwt-auth-guard";
import { InstanceService } from "./instance-service";
import { AuthenticatedRequest, CreateInstanceDto, UpdateInstanceDto } from "./Dto/Instance-dto";
import { Request } from 'express';

@Controller('instance')
@UseGuards(JwtAuthGuard)
export class InstanceController {
    constructor(private readonly instanceService: InstanceService) { }

    @Post('create')
    async createInstance(@Body() createInstanceDto: CreateInstanceDto, @Req() req: Request) {
        const userId = (req as AuthenticatedRequest).user.userId;
        return this.instanceService.createInstance(createInstanceDto, userId);
    }

    @Put(':id')
    async updateInstance(@Param('id') id: string, @Body() updateInstanceDto: UpdateInstanceDto, @Req() req: Request) {
        const userId = (req as AuthenticatedRequest).user.userId;
        return this.instanceService.updateInstance(BigInt(id), updateInstanceDto, userId);
    }

    @Delete(':id')
    async deleteInstance(@Param('id') id: string, @Req() req: Request) {
        const userId = (req as AuthenticatedRequest).user.userId;
        await this.instanceService.deleteInstance(BigInt(id), userId);
        return { message: 'Instance deleted successfully' };
    }

    @Get(':id')
    async getInstanceById(@Param('id') id: string, @Req() req: Request) {
        const userId = (req as AuthenticatedRequest).user.userId;
        return this.instanceService.getInstanceById(BigInt(id), userId);
    }

    @Get()
    async getAllInstances(@Req() req: Request) {
        const userId = (req as AuthenticatedRequest).user.userId;
        return this.instanceService.getAllInstancesForUser(userId);
    }

    @Put(':id/toggle-active')
    async toggleInstanceActive(@Param('id') id: string, @Req() req: Request) {
        const userId = (req as AuthenticatedRequest).user.userId;
        return this.instanceService.toggleInstanceActive(BigInt(id), userId);
    }
}
