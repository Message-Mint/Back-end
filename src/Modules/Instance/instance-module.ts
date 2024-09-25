import { Module } from "@nestjs/common";
import { InstanceService } from "./instance-service";
import { InstanceController } from "./insatnce-controller";

@Module({
    providers: [InstanceService],
    controllers: [InstanceController]
})

export class InstanceModule { };