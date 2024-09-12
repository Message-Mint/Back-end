import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './Modules/Auth/auth-module';
import { HelperModule } from './Modules/Helpers/helper-module';
import { PrismaModule } from './Modules/Common/Database-Management/Prisma/prisma-module';
import { CommonModule } from './Modules/Common/common-module';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: '.env',
        }),
        AuthModule,
        HelperModule,
        PrismaModule,
        CommonModule
    ],
})
export class AppModule { }
