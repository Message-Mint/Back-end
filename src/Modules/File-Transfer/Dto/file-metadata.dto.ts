export class FileMetadataDto {
    fileName: string;
    originalName: string;
    userId: string;
    uploadDate: Date;
}

export interface FileMetadata {
    fileName: string;
    originalName: string;
    userId: string;
    uploadDate: Date;
}