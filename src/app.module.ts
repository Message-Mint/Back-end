import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './Modules/Auth/auth-module';
import { HelperModule } from './Helpers/helper-module';
import { PrismaModule } from './Common/Database-Management/Prisma/prisma-module';
import { CommonModule } from './Common/common-module';
import { InstanceModule } from './Modules/Instance/instance-module';
import { FileModule } from './Modules/File-Transfer/file-transfer-module';
import { WhatsappModule } from './Modules/Whatsapp/whatsapp-module';
import { PostgresSQLModule } from './Common/Database-Management/PostgreSQL/postgresql-module';
import { MongoDBModule } from './Common/Database-Management/MongoDB/mongoDB-module';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: '.env',
        }),
        AuthModule,
        HelperModule,
        PrismaModule,
        PostgresSQLModule,
        MongoDBModule,
        CommonModule,
        InstanceModule,
        FileModule,
        WhatsappModule
    ],
})
export class AppModule { }
