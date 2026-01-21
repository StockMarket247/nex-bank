import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length, Matches } from 'class-validator';

export class UpdateTransferPinDto {
  @ApiProperty({ example: '1234', description: 'Current 4-digit transfer PIN' })
  @IsString()
  @Length(4, 4, { message: 'Current PIN must be exactly 4 digits' })
  @Matches(/^\d+$/, { message: 'Current PIN must contain only digits' })
  currentPin: string;

  @ApiProperty({ example: '5678', description: 'New 4-digit transfer PIN' })
  @IsString()
  @Length(4, 4, { message: 'New PIN must be exactly 4 digits' })
  @Matches(/^\d+$/, { message: 'New PIN must contain only digits' })
  newPin: string;
}

