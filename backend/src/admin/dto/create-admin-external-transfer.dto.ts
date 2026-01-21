import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, Min, IsOptional, IsEnum } from 'class-validator';
import { TransactionStatus } from '../../database/schemas/transaction.schema';

export class CreateAdminExternalTransferDto {
  @ApiProperty({ example: 'user-id-here', description: 'Sender user ID' })
  @IsString()
  fromUserId: string;

  @ApiProperty({ example: 'account-id-here', required: false, description: 'Sender account ID (optional, will use first account if not provided)' })
  @IsOptional()
  @IsString()
  fromAccountId?: string;

  @ApiProperty({ example: '100.50', description: 'Transfer amount' })
  @IsNumber()
  @Min(0.01)
  amount: number;

  @ApiProperty({ example: 'Chase Bank', description: 'Recipient bank name' })
  @IsString()
  recipientBankName: string;

  @ApiProperty({ example: '1234567890', description: 'Recipient account number' })
  @IsString()
  recipientAccountNumber: string;

  @ApiProperty({ example: 'John Doe', description: 'Recipient name' })
  @IsString()
  recipientName: string;

  @ApiProperty({ example: 'john@example.com', required: false })
  @IsOptional()
  @IsString()
  recipientEmail?: string;

  @ApiProperty({ example: '+1234567890', required: false })
  @IsOptional()
  @IsString()
  recipientPhone?: string;

  @ApiProperty({ example: 'CHASE', required: false, description: 'Recipient bank code' })
  @IsOptional()
  @IsString()
  recipientBankCode?: string;

  @ApiProperty({ 
    example: 'PENDING', 
    enum: TransactionStatus, 
    required: false,
    description: 'Transaction status (defaults to COMPLETED if not specified)' 
  })
  @IsOptional()
  @IsEnum(TransactionStatus)
  status?: TransactionStatus;

  @ApiProperty({ example: 'REF123456', required: false })
  @IsOptional()
  @IsString()
  reference?: string;

  @ApiProperty({ example: 'Payment for invoice', required: false })
  @IsOptional()
  @IsString()
  description?: string;
}
