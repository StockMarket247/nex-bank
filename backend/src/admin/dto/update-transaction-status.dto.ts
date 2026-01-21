import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { TransactionStatus } from '../../database/schemas/transaction.schema';

export class UpdateTransactionStatusDto {
  @ApiProperty({ enum: TransactionStatus, example: TransactionStatus.COMPLETED })
  @IsEnum(TransactionStatus)
  status: TransactionStatus;

  @ApiProperty({ example: 'Transaction approved by admin', required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}

