import { Controller, Post, Get, Param, UseInterceptors, UploadedFile, Res, BadRequestException, Delete, UseGuards, Req } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { FileService } from './file-transfer-service';
import { JwtAuthGuard } from '../Auth/jwt-auth-guard';
import { FileMetadataDto } from './Dto/file-metadata.dto';
import { AuthenticatedRequest } from '../Instance/Dto/Instance-dto';

@Controller('files')
@UseGuards(JwtAuthGuard)
export class FileController {
    constructor(private readonly fileService: FileService) { }

    @Post('upload')
    @UseInterceptors(FileInterceptor('file'))
    async uploadFile(@UploadedFile() file: Express.Multer.File, @Req() req: AuthenticatedRequest) {
        if (!file) {
            throw new BadRequestException('No file uploaded');
        }
        const fileName = await this.fileService.saveFile(file, req.user.userId);
        return { fileName };
    }

    @Get('user/:userId')
    async getUserFiles(@Param('userId') userId: string): Promise<FileMetadataDto[]> {
        return this.fileService.getFilesByUserId(userId);
    }

    @Get('file/:fileName')
    async getFile(@Param('fileName') fileName: string, @Req() req: AuthenticatedRequest, @Res({ passthrough: true }) res: Response) {
        const file = await this.fileService.getFile(fileName, req.user.userId);
        res.set({
            'Content-Type': 'application/octet-stream',
            'Content-Disposition': `attachment; filename="${fileName}"`,
        });
        return file;
    }

    @Delete(':fileName')
    async deleteFile(@Param('fileName') fileName: string, @Req() req: AuthenticatedRequest) {
        await this.fileService.deleteFile(fileName, req.user.userId);
        return { message: 'File deleted successfully' };
    }

    @Get('all-users')
    async getAllUserDirectories(): Promise<string[]> {
        return this.fileService.getAllUserDirectories();
    }
}
