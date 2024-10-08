import { Module } from '@nestjs/common';
import { LoggerService } from './Logger/logger-service';

@Module({
  providers: [LoggerService],
  exports: [LoggerService],
})
export class HelperModule {}
