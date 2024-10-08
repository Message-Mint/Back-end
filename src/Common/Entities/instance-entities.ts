import { InstanceEnvironment, SessionStorageType } from '@prisma/client';

export interface InstanceEntity {
  id: string;
  name: string;
  businessName?: string | null;
  businessWhatsAppNo?: string | null;
  businessCountry?: string | null;
  isActive: boolean;
  environment: InstanceEnvironment;
  sessionStorage: SessionStorageType;
  createdAt: Date;
  userId: string;
}
