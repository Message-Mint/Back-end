import { Module, DynamicModule } from '@nestjs/common';
import { MongoDBService } from './mongoDB-service';
import { LoggerService } from 'src/Helpers/Logger/logger-service';

@Module({})
export class MongoDBModule {
  static forRoot(): DynamicModule {
    return {
      module: MongoDBModule,
      providers: [MongoDBService, LoggerService],
      exports: [MongoDBService],
      global: true,
    };
  }
}
