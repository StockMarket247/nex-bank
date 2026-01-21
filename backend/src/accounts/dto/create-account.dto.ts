import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsNumber, Min } from 'class-validator';
import { AccountType } from '../../database/schemas/bank-account.schema';

export class CreateAccountDto {
  @ApiProperty({ enum: AccountType })
  @IsEnum(AccountType)
  type: AccountType;

  @ApiProperty({ example: 'USD', required: false, default: 'USD' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiProperty({ example: 1000, required: false, default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  initialBalance?: number;
}

