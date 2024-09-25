import { Controller, Post, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../Auth/jwt-auth-guard";

@Controller('instance')
export class InstanceController {

    @Post()
    @UseGuards(JwtAuthGuard)
    async createInstance() {

    }
}