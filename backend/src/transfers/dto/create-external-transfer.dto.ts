import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, Min, IsEmail, IsOptional } from 'class-validator';

export class CreateExternalTransferDto {
  @ApiProperty({ example: 'account-id-here' })
  @IsString()
  accountId: string;

  @ApiProperty({ example: 500.00 })
  @IsNumber()
  @Min(0.01)
  amount: number;

  @ApiProperty({ example: 'Chase Bank' })
  @IsString()
  recipientBankName: string;

  @ApiProperty({ example: 'CHASEUS33', required: false })
  @IsOptional()
  @IsString()
  recipientBankCode?: string;

  @ApiProperty({ example: '9876543210' })
  @IsString()
  recipientAccountNumber: string;

  @ApiProperty({ example: 'Jane Smith' })
  @IsString()
  recipientName: string;

  @ApiProperty({ example: 'jane@example.com', required: false })
  @IsOptional()
  @IsEmail()
  recipientEmail?: string;

  @ApiProperty({ example: '+19876543210', required: false })
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

