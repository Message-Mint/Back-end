import { IsString, IsNotEmpty, IsNumber, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class SendTextMessageDto {
    @IsString()
    @IsNotEmpty()
    recipient: string;

    @IsString()
    @IsNotEmpty()
    message: string;
}

export class SendMediaMessageDto {
    @IsString()
    @IsNotEmpty()
    recipient: string;

    mediaType: 'image' | 'video' | 'document';

    @IsString()
    @IsNotEmpty()
    mediaUrl: string;

    @IsString()
    caption?: string;

    @IsString()
    fileName?: string;

    @IsString()
    mimeType?: string;
}

export class ButtonDto {
    @IsString()
    @IsNotEmpty()
    displayText: string;

    @IsString()
    @IsNotEmpty()
    id: string;
}

export class SendButtonMessageDto {
    @IsString()
    @IsNotEmpty()
    recipient: string;

    @IsString()
    @IsNotEmpty()
    content: string;

    @ValidateNested({ each: true })
    @Type(() => ButtonDto)
    buttons: ButtonDto[];
}

export class SectionDto {
    @IsString()
    @IsNotEmpty()
    title: string;

    @IsString({ each: true })
    rows: string[];
}

export class SendListMessageDto {
    @IsString()
    @IsNotEmpty()
    recipient: string;

    @IsString()
    @IsNotEmpty()
    title: string;

    @IsString()
    @IsNotEmpty()
    text: string;

    @IsString()
    @IsNotEmpty()
    buttonText: string;

    @ValidateNested({ each: true })
    @Type(() => SectionDto)
    sections: SectionDto[];
}

export class SendLocationMessageDto {
    @IsString()
    @IsNotEmpty()
    recipient: string;

    @IsNumber()
    latitude: number;

    @IsNumber()
    longitude: number;

    @IsString()
    name?: string;
}

export class SendContactMessageDto {
    @IsString()
    @IsNotEmpty()
    recipient: string;

    @IsString()
    @IsNotEmpty()
    contactNumber: string;

    @IsString()
    @IsNotEmpty()
    contactName: string;
}
