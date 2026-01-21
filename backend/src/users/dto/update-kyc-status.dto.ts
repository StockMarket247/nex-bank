import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { KYCStatus } from '../../database/schemas/user.schema';

export class UpdateKycStatusDto {
  @ApiProperty({ enum: KYCStatus })
  @IsEnum(KYCStatus)
  kycStatus: KYCStatus;
}

