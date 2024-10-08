import { Module } from '@nestjs/common';
import { FileService } from './file-transfer-service';
import { FileController } from './file-transfer-controller';

@Module({
  providers: [FileService],
  controllers: [FileController],
})
export class FileModule {}
