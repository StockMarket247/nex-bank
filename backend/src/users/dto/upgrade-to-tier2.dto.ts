import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEnum, IsNotEmpty, Matches } from 'class-validator';
import { DocumentType } from '../../database/schemas/verification-document.schema';

export class UpgradeToTier2Dto {
  @ApiProperty({ 
    description: 'Identity number (e.g., National ID number, Passport number)',
    example: '123456789'
  })
  @IsString()
  @IsNotEmpty()
  identityNumber: string;

  @ApiProperty({ 
    enum: DocumentType,
    description: 'Type of identity document',
    example: DocumentType.NATIONAL_ID
  })
  @IsEnum(DocumentType)
  documentType: DocumentType;

  @ApiProperty({ 
    description: 'Base64 encoded image of the front of the identity document',
    example: 'data:image/jpeg;base64,/9j/4AAQSkZJRg...'
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^data:image\/(jpeg|jpg|png|pdf);base64,/, {
    message: 'Front image must be a valid base64 encoded image (JPEG, JPG, PNG, or PDF)',
  })
  frontImage: string;

  @ApiProperty({ 
    description: 'Base64 encoded image of the back of the identity document',
    example: 'data:image/jpeg;base64,/9j/4AAQSkZJRg...',
    required: false
  })
  @IsString()
  @Matches(/^data:image\/(jpeg|jpg|png|pdf);base64,/, {
    message: 'Back image must be a valid base64 encoded image (JPEG, JPG, PNG, or PDF)',
  })
  backImage?: string;
}
