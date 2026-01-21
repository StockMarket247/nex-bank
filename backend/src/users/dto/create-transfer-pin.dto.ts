import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length, Matches } from 'class-validator';

export class CreateTransferPinDto {
  @ApiProperty({ example: '1234', description: '4-digit transfer PIN' })
  @IsString()
  @Length(4, 4, { message: 'Transfer PIN must be exactly 4 digits' })
  @Matches(/^\d+$/, { message: 'Transfer PIN must contain only digits' })
  pin: string;
}

