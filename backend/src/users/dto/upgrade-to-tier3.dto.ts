import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEnum, IsNotEmpty, Matches, MaxLength, MinLength } from 'class-validator';
import { DocumentType } from '../../database/schemas/verification-document.schema';

export class UpgradeToTier3Dto {
  @ApiProperty({ 
    description: 'Residential street address',
    example: '123 Main Street'
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  address: string;

  @ApiProperty({ 
    description: 'City',
    example: 'New York'
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  city: string;

  @ApiProperty({ 
    description: 'Country',
    example: 'United States'
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  country: string;

  @ApiProperty({ 
    description: 'Postal/ZIP code',
    example: '10001'
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  postalCode: string;

  @ApiProperty({ 
    enum: [DocumentType.UTILITY_BILL, DocumentType.BANK_STATEMENT, DocumentType.GOVERNMENT_LETTER],
    description: 'Type of address verification document',
    example: DocumentType.UTILITY_BILL
  })
  @IsEnum([DocumentType.UTILITY_BILL, DocumentType.BANK_STATEMENT, DocumentType.GOVERNMENT_LETTER])
  documentType: DocumentType;

  @ApiProperty({ 
    description: 'Base64 encoded image of the address verification document',
    example: 'data:image/jpeg;base64,/9j/4AAQSkZJRg...'
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^data:image\/(jpeg|jpg|png|pdf);base64,/, {
    message: 'Document image must be a valid base64 encoded image (JPEG, JPG, PNG, or PDF)',
  })
  documentImage: string;
}
