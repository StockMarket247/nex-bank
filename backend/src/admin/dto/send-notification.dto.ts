import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsEmail, IsArray, ValidateIf } from 'class-validator';

export class SendNotificationDto {
  @ApiProperty({ example: 'Account Update', description: 'Notification title' })
  @IsString()
  title: string;

  @ApiProperty({ example: 'Your account balance has been updated.', description: 'Notification message' })
  @IsString()
  message: string;

  @ApiProperty({ 
    example: ['user-id-1', 'user-id-2'], 
    description: 'Array of user IDs to send notification to. If not provided, sends to all users.',
    required: false 
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  userIds?: string[];

  @ApiProperty({ 
    example: 'info', 
    description: 'Notification type',
    enum: ['info', 'success', 'warning', 'error'],
    required: false 
  })
  @IsOptional()
  @IsString()
  type?: string;
}

