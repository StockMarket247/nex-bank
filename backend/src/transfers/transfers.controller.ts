import { Controller, Get, Post, Put, Body, Param, Query, UseGuards, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { TransfersService } from './transfers.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CreateExternalTransferDto, CreateInternationalTransferDto, ApproveTransferDto, RejectTransferDto } from './dto';
import { AdminRole } from '../database/schemas/admin.schema';
import { TransferRequestStatus } from '../database/schemas/transfer-request.schema';

@ApiTags('transfers')
@Controller('transfers')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class TransfersController {
  constructor(private transfersService: TransfersService) {}

  @Post('external')
  @ApiOperation({ summary: 'Create external transfer request' })
  async createExternalTransfer(@CurrentUser() user: any, @Body() dto: CreateExternalTransferDto) {
    return this.transfersService.createExternalTransfer(user.id, dto);
  }

  @Post('international')
  @ApiOperation({ summary: 'Create international transfer request' })
  async createInternationalTransfer(@CurrentUser() user: any, @Body() dto: CreateInternationalTransferDto) {
    return this.transfersService.createInternationalTransfer(user.id, dto);
  }

  @Get('me')
  @ApiOperation({ summary: 'Get current user transfer requests' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getMyTransferRequests(
    @CurrentUser() user: any,
    @Query('page', new ParseIntPipe({ optional: true })) page?: number,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
  ) {
    return this.transfersService.getUserTransferRequests(user.id, page || 1, limit || 20);
  }

  @Get('pending')
  @UseGuards(RolesGuard)
  @Roles(AdminRole.SUPER_ADMIN, AdminRole.ADMIN)
  @ApiOperation({ summary: 'Get pending transfer requests (Admin only)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getPendingTransfers(
    @Query('page', new ParseIntPipe({ optional: true })) page?: number,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
  ) {
    return this.transfersService.getPendingTransferRequests(page || 1, limit || 20);
  }

  @Put(':requestId/approve')
  @UseGuards(RolesGuard)
  @Roles(AdminRole.SUPER_ADMIN, AdminRole.ADMIN)
  @ApiOperation({ summary: 'Approve transfer request (Admin only)' })
  async approveTransfer(
    @CurrentUser() admin: any,
    @Param('requestId') requestId: string,
    @Body() dto: ApproveTransferDto,
  ) {
    return this.transfersService.approveTransfer(admin.id, requestId, dto);
  }

  @Put(':requestId/reject')
  @UseGuards(RolesGuard)
  @Roles(AdminRole.SUPER_ADMIN, AdminRole.ADMIN)
  @ApiOperation({ summary: 'Reject transfer request (Admin only)' })
  async rejectTransfer(
    @CurrentUser() admin: any,
    @Param('requestId') requestId: string,
    @Body() dto: RejectTransferDto,
  ) {
    return this.transfersService.rejectTransfer(admin.id, requestId, dto);
  }

  @Get(':requestId')
  @ApiOperation({ summary: 'Get transfer request by ID' })
  async getTransferRequest(@Param('requestId') requestId: string): Promise<any> {
    return this.transfersService.getTransferRequestById(requestId);
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles(AdminRole.SUPER_ADMIN, AdminRole.ADMIN, AdminRole.AUDITOR)
  @ApiOperation({ summary: 'Get all transfer requests (Admin only)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, enum: TransferRequestStatus })
  async getAllTransferRequests(
    @Query('page', new ParseIntPipe({ optional: true })) page?: number,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
    @Query('status') status?: TransferRequestStatus,
  ) {
    return this.transfersService.getAllTransferRequests(page || 1, limit || 20, status);
  }
}

