import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './Modules/Auth/auth-module';
import { HelperModule } from './Helpers/helper-module';
import { PrismaModule } from './Common/Database-Management/Prisma/prisma-module';
import { CommonModule } from './Common/common-module';
import { InstanceModule } from './Modules/Instance/instance-module';
import { FileModule } from './Modules/File-Transfer/file-transfer-module';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: '.env',
        }),
        AuthModule,
        HelperModule,
        PrismaModule,
        CommonModule,
        InstanceModule,
        FileModule
    ],
})
export class AppModule { }
