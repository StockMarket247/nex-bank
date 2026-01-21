import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class FreezeAccountDto {
  @ApiProperty({ example: true })
  @IsBoolean()
  isFrozen: boolean;
}

