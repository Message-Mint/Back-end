import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './Helpers/customExceptions/customexceptions-service';
import { LoggerService } from './Helpers/Logger/logger-service';
import * as cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: process.env.CORS_ORIGIN?.split(',') || ['*'],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type, Authorization',
    credentials: true,
  });
  app.useGlobalFilters(new GlobalExceptionFilter());
  const logger = await app.resolve(LoggerService);
  app.use(logger.use.bind(logger));
  app.use(cookieParser());
  await app.listen(process.env.PORT || 5555);
}
bootstrap();
