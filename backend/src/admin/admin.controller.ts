import { Controller, Get, Post, Put, Body, Param, Query, UseGuards, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { SuspendUserDto, AdjustBalanceDto, UpdateTransactionStatusDto, SendNotificationDto, CreateAdminInternalTransferDto, CreateAdminExternalTransferDto } from './dto';
import { UsersService } from '../users/users.service';
import { UpdateVerificationStatusDto } from '../users/dto';
import { AdminRole } from '../database/schemas/admin.schema';
import { VerificationStatus } from '../database/schemas/verification-document.schema';

@ApiTags('admin')
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(AdminRole.SUPER_ADMIN, AdminRole.ADMIN)
@ApiBearerAuth()
export class AdminController {
  constructor(
    private adminService: AdminService,
    private usersService: UsersService,
  ) {}

  @Get('me')
  @ApiOperation({ summary: 'Get current admin profile' })
  async getProfile(@CurrentUser() admin: any) {
    return this.adminService.getAdminProfile(admin.id);
  }

  @Get('dashboard')
  @ApiOperation({ summary: 'Get admin dashboard statistics' })
  async getDashboardStats() {
    return this.adminService.getDashboardStats();
  }

  @Put('users/:userId/suspend')
  @ApiOperation({ summary: 'Suspend or unsuspend user account' })
  async suspendUser(@CurrentUser() admin: any, @Param('userId') userId: string, @Body() dto: SuspendUserDto) {
    return this.adminService.suspendUser(admin.id, userId, dto);
  }

  @Put('users/:userId/close')
  @ApiOperation({ summary: 'Close user account' })
  async closeUserAccount(@CurrentUser() admin: any, @Param('userId') userId: string) {
    return this.adminService.closeUserAccount(admin.id, userId);
  }

  @Put('accounts/:accountId/adjust-balance')
  @ApiOperation({ summary: 'Adjust account balance' })
  async adjustBalance(
    @CurrentUser() admin: any,
    @Param('accountId') accountId: string,
    @Body() dto: AdjustBalanceDto,
  ) {
    return this.adminService.adjustBalance(admin.id, accountId, dto);
  }

  @Put('transactions/:transactionId/status')
  @ApiOperation({ summary: 'Update transaction status' })
  async updateTransactionStatus(
    @CurrentUser() admin: any,
    @Param('transactionId') transactionId: string,
    @Body() dto: UpdateTransactionStatusDto,
  ) {
    return this.adminService.updateTransactionStatus(admin.id, transactionId, dto);
  }

  @Post('notifications/send')
  @ApiOperation({ summary: 'Send notification to users' })
  async sendNotification(
    @CurrentUser() admin: any,
    @Body() dto: SendNotificationDto,
  ) {
    return this.adminService.sendNotification(admin.id, dto);
  }

  @Post('transfers/internal')
  @ApiOperation({ summary: 'Create internal transfer on behalf of users (Admin only)' })
  async createInternalTransfer(
    @CurrentUser() admin: any,
    @Body() dto: CreateAdminInternalTransferDto,
  ) {
    return this.adminService.createAdminInternalTransfer(admin.id, dto);
  }

  @Post('transfers/external')
  @ApiOperation({ summary: 'Create external transfer on behalf of users (Admin only)' })
  async createExternalTransfer(
    @CurrentUser() admin: any,
    @Body() dto: CreateAdminExternalTransferDto,
  ) {
    return this.adminService.createAdminExternalTransfer(admin.id, dto);
  }

  @Get('verifications')
  @ApiOperation({ summary: 'Get all verification requests (Admin only)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, enum: VerificationStatus })
  async getAllVerificationRequests(
    @Query('page', new ParseIntPipe({ optional: true })) page?: number,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
    @Query('status') status?: VerificationStatus,
  ) {
    return this.usersService.getAllVerificationRequests(page || 1, limit || 20, status);
  }

  @Put('verifications/:verificationId/status')
  @ApiOperation({ summary: 'Update verification status (Approve/Reject) (Admin only)' })
  async updateVerificationStatus(
    @CurrentUser() admin: any,
    @Param('verificationId') verificationId: string,
    @Body() dto: UpdateVerificationStatusDto,
  ) {
    return this.usersService.updateVerificationStatus(admin.id, verificationId, dto);
  }
}

