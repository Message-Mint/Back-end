import { Controller, Post, Put, Delete, Get, UseGuards, Body, Param, Req } from "@nestjs/common";
import { JwtAuthGuard } from "../Auth/jwt-auth-guard";
import { InstanceService } from "./instance-service";
import { AuthenticatedRequest, CreateInstanceDto, UpdateInstanceDto } from "./Dto/Instance-dto";
import { Request } from 'express';

@Controller('instance')
export class InstanceController {
    constructor(private readonly instanceService: InstanceService) { }

    @Post('create')
    @UseGuards(JwtAuthGuard)
    async createInstance(@Body() createInstanceDto: CreateInstanceDto, @Req() req: Request) {
        const userId = (req as AuthenticatedRequest).user.userId;
        return this.instanceService.createInstance(createInstanceDto, userId);
    }

    @Put(':id')
    @UseGuards(JwtAuthGuard)
    async updateInstance(@Param('id') id: string, @Body() updateInstanceDto: UpdateInstanceDto, @Req() req: Request) {
        const userId = (req as AuthenticatedRequest).user.userId;
        return this.instanceService.updateInstance(BigInt(id), updateInstanceDto, userId);
    }

    @Delete(':id')
    @UseGuards(JwtAuthGuard)
    async deleteInstance(@Param('id') id: string, @Req() req: Request) {
        const userId = (req as AuthenticatedRequest).user.userId;
        await this.instanceService.deleteInstance(BigInt(id), userId);
        return { message: 'Instance deleted successfully' };
    }

    @Get(':id')
    @UseGuards(JwtAuthGuard)
    async getInstanceById(@Param('id') id: string, @Req() req: Request) {
        const userId = (req as AuthenticatedRequest).user.userId;
        return this.instanceService.getInstanceById(BigInt(id), userId);
    }

    @Get()
    @UseGuards(JwtAuthGuard)
    async getAllInstances(@Req() req: Request) {
        const userId = (req as AuthenticatedRequest).user.userId;
        return this.instanceService.getAllInstancesForUser(userId);
    }

    @Put(':id/toggle-active')
    @UseGuards(JwtAuthGuard)
    async toggleInstanceActive(@Param('id') id: string, @Req() req: Request) {
        const userId = (req as AuthenticatedRequest).user.userId;
        return this.instanceService.toggleInstanceActive(BigInt(id), userId);
    }
}
