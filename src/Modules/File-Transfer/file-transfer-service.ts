import {
  Injectable,
  StreamableFile,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  createWriteStream,
  createReadStream,
  promises as fsPromises,
} from 'fs';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import * as mime from 'mime-types';
import { FileMetadata } from './Dto/file-metadata.dto';

@Injectable()
export class FileService {
  private fileMetadata: FileMetadata[] = [];

  constructor(private configService: ConfigService) {}

  async saveFile(file: Express.Multer.File, userId: string): Promise<string> {
    const maxSizeMB = this.configService.get<number>('MAX_FILE_SIZE_MB', 10);
    const maxSizeBytes = maxSizeMB * 1024 * 1024;

    if (file.size > maxSizeBytes) {
      throw new BadRequestException(
        `File size exceeds the maximum limit of ${maxSizeMB}MB`,
      );
    }

    const uploadDir = this.configService.get<string>('UPLOAD_DIR', './uploads');
    const userDir = join(uploadDir, userId);
    await this.ensureDirectoryExists(userDir);

    const fileName = await this.processAndSaveFile(file, userDir, userId);
    return fileName;
  }

  async getFile(fileName: string, userId: string): Promise<StreamableFile> {
    const uploadDir = this.configService.get<string>('UPLOAD_DIR', './uploads');
    const filePath = join(uploadDir, userId, fileName);

    try {
      await fsPromises.access(filePath);
      const file = createReadStream(filePath);
      return new StreamableFile(file);
    } catch (error) {
      throw new NotFoundException('File not found');
    }
  }

  async getUserFiles(userId: string): Promise<FileMetadata[]> {
    return this.fileMetadata.filter((file) => file.userId === userId);
  }

  async deleteFile(fileName: string, userId: string): Promise<void> {
    const uploadDir = this.configService.get<string>('UPLOAD_DIR', './uploads');
    const filePath = join(uploadDir, userId, fileName);

    const fileIndex = this.fileMetadata.findIndex(
      (file) => file.fileName === fileName && file.userId === userId,
    );
    if (fileIndex === -1) {
      throw new NotFoundException('File not found');
    }

    try {
      await fsPromises.unlink(filePath);
      this.fileMetadata.splice(fileIndex, 1);
    } catch (error) {
      if (error.code === 'ENOENT') {
        throw new NotFoundException('File not found');
      }
      throw error;
    }
  }

  private async processAndSaveFile(
    file: Express.Multer.File,
    userDir: string,
    userId: string,
  ): Promise<string> {
    const fileExtension = mime.extension(file.mimetype) || 'bin';
    const fileName = `${uuidv4()}_${Date.now()}.${fileExtension}`;
    const filePath = join(userDir, fileName);

    return new Promise((resolve, reject) => {
      const writeStream = createWriteStream(filePath);
      writeStream.write(file.buffer);
      writeStream.end();
      writeStream.on('finish', () => {
        this.fileMetadata.push({
          fileName,
          originalName: file.originalname,
          userId,
          uploadDate: new Date(),
        });

        file.buffer = Buffer.alloc(0);
        this.cleanupTempFiles();
        resolve(fileName);
      });
      writeStream.on('error', (error) => {
        file.buffer = Buffer.alloc(0);
        reject(error);
      });
    });
  }

  private async cleanupTempFiles(): Promise<void> {
    const uploadDir = this.configService.get<string>('UPLOAD_DIR', './uploads');
    const tempDir = join(uploadDir, 'temp');

    try {
      const files = await fsPromises.readdir(tempDir);
      const oneHourAgo = Date.now() - 3600000; // 1 hour in milliseconds

      for (const file of files) {
        const filePath = join(tempDir, file);
        const stats = await fsPromises.stat(filePath);

        if (stats.mtimeMs < oneHourAgo) {
          await fsPromises.unlink(filePath);
        }
      }
    } catch (error) {
      if (error.code === 'ENOENT') {
        return;
      }
      console.error('Error cleaning up temp files:', error);
    }
  }

  private async ensureDirectoryExists(directory: string): Promise<void> {
    try {
      await fsPromises.access(directory);
    } catch (error) {
      await fsPromises.mkdir(directory, { recursive: true });
    }
  }

  async getAllUserDirectories(): Promise<string[]> {
    const uploadDir = this.configService.get<string>('UPLOAD_DIR', './uploads');
    try {
      const directories = await fsPromises.readdir(uploadDir, {
        withFileTypes: true,
      });
      return directories
        .filter((dirent) => dirent.isDirectory())
        .map((dirent) => dirent.name);
    } catch (error) {
      if (error.code === 'ENOENT') {
        return [];
      }
      console.error('Error reading user directories:', error);
      return [];
    }
  }

  async getFilesByUserId(userId: string): Promise<FileMetadata[]> {
    const uploadDir = this.configService.get<string>('UPLOAD_DIR', './uploads');
    const userDir = join(uploadDir, userId);

    try {
      const files = await fsPromises.readdir(userDir);
      return files.map((fileName) => {
        const metadata = this.fileMetadata.find(
          (fm) => fm.fileName === fileName && fm.userId === userId,
        );
        return (
          metadata || {
            fileName,
            originalName: fileName,
            userId,
            uploadDate: new Date(parseInt(fileName.split('_')[1])),
          }
        );
      });
    } catch (error) {
      if (error.code === 'ENOENT') {
        return [];
      }
      throw error;
    }
  }
}
