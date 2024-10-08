import { Module, DynamicModule } from '@nestjs/common';
import { PostgreSQLService } from './postgresql-service';
import { LoggerService } from 'src/Helpers/Logger/logger-service';

@Module({})
export class PostgresSQLModule {
  static forRoot(): DynamicModule {
    return {
      module: PostgresSQLModule,
      providers: [PostgreSQLService, LoggerService],
      exports: [PostgreSQLService],
      global: true,
    };
  }
}
