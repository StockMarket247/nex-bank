import { ApiProperty } from '@nestjs/swagger';

export class ApproveTransferDto {
  @ApiProperty({ example: 'Approved after verification', required: false })
  notes?: string;
}

