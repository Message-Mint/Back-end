// src/instance/dto/create-instance.dto.ts
import { IsBoolean, IsNotEmpty, IsString } from 'class-validator';
import { InstanceEnvironment, SessionStorageType } from '@prisma/client';
import { JwtPayload } from 'src/Modules/Auth/Dto/Auth-Dto';
import { Request } from 'express';

export class CreateInstanceDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsString()
  businessName?: string;

  @IsString()
  businessWhatsAppNo?: string;

  @IsString()
  businessCountry?: string;

  @IsNotEmpty()
  environment: InstanceEnvironment;

  @IsNotEmpty()
  sessionStorage: SessionStorageType;
}

export class UpdateInstanceDto {
  @IsString()
  name?: string;

  @IsString()
  businessName?: string;

  @IsString()
  businessWhatsAppNo?: string;

  @IsString()
  businessCountry?: string;

  environment?: InstanceEnvironment;

  sessionStorage?: SessionStorageType;

  @IsBoolean()
  isActive?: boolean;
}

export interface AuthenticatedRequest extends Request {
  user: JwtPayload;
}
