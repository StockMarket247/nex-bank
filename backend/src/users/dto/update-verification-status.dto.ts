import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString, IsOptional } from 'class-validator';
import { VerificationStatus } from '../../database/schemas/verification-document.schema';

export class UpdateVerificationStatusDto {
  @ApiProperty({ 
    enum: VerificationStatus,
    description: 'New verification status'
  })
  @IsEnum(VerificationStatus)
  status: VerificationStatus;

  @ApiProperty({ 
    description: 'Reason for rejection (required if status is REJECTED)',
    required: false,
    example: 'Document image is not clear or blurry'
  })
  @IsString()
  @IsOptional()
  rejectionReason?: string;

  @ApiProperty({ 
    description: 'Admin notes',
    required: false,
    example: 'Document verified and approved'
  })
  @IsString()
  @IsOptional()
  notes?: string;
}
