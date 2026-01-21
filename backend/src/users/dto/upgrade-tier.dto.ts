import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { AccountTier } from '../../database/schemas/user.schema';

export class UpgradeTierDto {
  @ApiProperty({ enum: AccountTier, example: AccountTier.TIER_2 })
  @IsEnum(AccountTier)
  targetTier: AccountTier;
}

