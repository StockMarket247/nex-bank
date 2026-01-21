import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, Min, IsOptional } from 'class-validator';

export class CreateInternationalTransferDto {
  @ApiProperty({ example: 'account-id-here' })
  @IsString()
  accountId: string;

  @ApiProperty({ example: 500.00 })
  @IsNumber()
  @Min(0.01)
  amount: number;

  @ApiProperty({ example: 'GBP' })
  @IsString()
  currency: string;

  @ApiProperty({ example: 'United Kingdom' })
  @IsString()
  recipientCountry: string;

  @ApiProperty({ example: 'GB82WEST12345698765432' })
  @IsString()
  recipientAccountNumber: string;

  @ApiProperty({ example: 'WESTGB2L', required: false })
  @IsOptional()
  @IsString()
  swiftBicCode?: string;

  @ApiProperty({ example: 'Jane Smith' })
  @IsString()
  recipientName: string;

  @ApiProperty({ example: 'jane@example.com', required: false })
  @IsOptional()
  @IsString()
  recipientEmail?: string;

  @ApiProperty({ example: '+44123456789', required: false })
  @IsOptional()
  @IsString()
  recipientPhone?: string;

  @ApiProperty({ example: 'Payment for invoice #123', required: false })
  @IsOptional()
  @IsString()
  reference?: string;

  @ApiProperty({ example: 'Monthly payment', required: false })
  @IsOptional()
  @IsString()
  description?: string;
}

