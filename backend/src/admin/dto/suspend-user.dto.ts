import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class SuspendUserDto {
  @ApiProperty({ example: true })
  @IsBoolean()
  suspended: boolean;

  @ApiProperty({ example: 'Suspicious activity detected', required: false })
  @IsOptional()
  @IsString()
  reason?: string;
}

