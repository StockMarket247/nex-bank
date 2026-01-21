import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class RejectTransferDto {
  @ApiProperty({ example: 'Insufficient verification documents' })
  @IsString()
  @MinLength(5)
  reason: string;
}

