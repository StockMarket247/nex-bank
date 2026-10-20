import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class SendMessageDto {
  @ApiProperty({ example: 'I need help with my account' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  content: string;
}
