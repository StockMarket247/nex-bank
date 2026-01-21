import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, Min, IsOptional } from 'class-validator';

export class CreateAdminInternalTransferDto {
  @ApiProperty({ example: 'user-id-here', description: 'Sender user ID' })
  @IsString()
  fromUserId: string;

  @ApiProperty({ example: 'user-id-here', description: 'Recipient user ID' })
  @IsString()
  toUserId: string;

  @ApiProperty({ example: 100.50, description: 'Transfer amount' })
  @IsNumber()
  @Min(0.01)
  amount: number;

  @ApiProperty({ example: 'account-id-here', required: false, description: 'Sender account ID (optional, will use first account if not provided)' })
  @IsOptional()
  @IsString()
  fromAccountId?: string;

  @ApiProperty({ example: 'account-id-here', required: false, description: 'Recipient account ID (optional, will use first account if not provided)' })
  @IsOptional()
  @IsString()
  toAccountId?: string;

  @ApiProperty({ example: 'Payment for services', required: false })
  @IsOptional()
  @IsString()
  reference?: string;

  @ApiProperty({ example: 'Monthly subscription payment', required: false })
  @IsOptional()
  @IsString()
  description?: string;
}
