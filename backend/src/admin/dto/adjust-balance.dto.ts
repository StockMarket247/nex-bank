import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString, IsOptional } from 'class-validator';

export class AdjustBalanceDto {
  @ApiProperty({ example: 100.50 })
  @IsNumber()
  amount: number;

  @ApiProperty({ example: 'Correction for transaction error', required: false })
  @IsOptional()
  @IsString()
  reason?: string;
}

