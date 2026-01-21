import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, Min, IsOptional } from 'class-validator';

export class CreateInternalTransferDto {
  @ApiProperty({ example: 'account-id-here' })
  @IsString()
  fromAccountId: string;

  @ApiProperty({ example: '1234567890' })
  @IsString()
  toAccountNumber: string;

  @ApiProperty({ example: 100.50 })
  @IsNumber()
  @Min(0.01)
  amount: number;

  @ApiProperty({ example: 'Payment for services', required: false })
  @IsOptional()
  @IsString()
  reference?: string;

  @ApiProperty({ example: 'Monthly subscription payment', required: false })
  @IsOptional()
  @IsString()
  description?: string;
}

