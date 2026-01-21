import { Controller, Get, Put, Body, Param, Query, UseGuards, ParseIntPipe, Post } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UpdateProfileDto, UpdateKycStatusDto, UpgradeTierDto, CreateTransferPinDto, VerifyTransferPinDto, UpdateTransferPinDto, UpgradeToTier2Dto, UpgradeToTier3Dto } from './dto';
import { AdminRole } from '../database/schemas/admin.schema';
import { UserStatus } from '../database/schemas/user.schema';

@ApiTags('users')
@Controller('users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  async getProfile(@CurrentUser() user: any) {
    return this.usersService.findById(user.id);
  }

  @Put('me')
  @ApiOperation({ summary: 'Update current user profile' })
  async updateProfile(@CurrentUser() user: any, @Body() dto: UpdateProfileDto) {
    return this.usersService.updateProfile(user.id, dto);
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles(AdminRole.SUPER_ADMIN, AdminRole.ADMIN, AdminRole.AUDITOR)
  @ApiOperation({ summary: 'Get all users (Admin only)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, enum: UserStatus })
  async findAll(
    @Query('page', new ParseIntPipe({ optional: true })) page?: number,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
    @Query('status') status?: UserStatus,
  ) {
    return this.usersService.findAll(page || 1, limit || 10, status);
  }

  @Get(':id')
  @UseGuards(RolesGuard)
  @Roles(AdminRole.SUPER_ADMIN, AdminRole.ADMIN, AdminRole.AUDITOR)
  @ApiOperation({ summary: 'Get user by ID (Admin only)' })
  async findOne(@Param('id') id: string) {
    return this.usersService.findById(id);
  }

  @Put(':id/kyc-status')
  @UseGuards(RolesGuard)
  @Roles(AdminRole.SUPER_ADMIN, AdminRole.ADMIN)
  @ApiOperation({ summary: 'Update user KYC status (Admin only)' })
  async updateKycStatus(@Param('id') id: string, @Body() dto: UpdateKycStatusDto) {
    return this.usersService.updateKycStatus(id, dto);
  }

  @Get('me/tier-info')
  @ApiOperation({ summary: 'Get current user tier information' })
  async getTierInfo(@CurrentUser() user: any) {
    return this.usersService.getTierInfo(user.id);
  }

  @Post('me/upgrade-tier')
  @ApiOperation({ summary: 'Upgrade user account tier' })
  async upgradeTier(@CurrentUser() user: any, @Body() dto: UpgradeTierDto) {
    return this.usersService.upgradeTier(user.id, dto);
  }

  @Post('me/upgrade-tier2')
  @ApiOperation({ summary: 'Request Tier 2 upgrade with identity verification' })
  async upgradeToTier2(@CurrentUser() user: any, @Body() dto: UpgradeToTier2Dto) {
    return this.usersService.upgradeToTier2(user.id, dto);
  }

  @Post('me/upgrade-tier3')
  @ApiOperation({ summary: 'Request Tier 3 upgrade with address verification' })
  async upgradeToTier3(@CurrentUser() user: any, @Body() dto: UpgradeToTier3Dto) {
    return this.usersService.upgradeToTier3(user.id, dto);
  }

  @Get('me/verification-status')
  @ApiOperation({ summary: 'Get current verification status' })
  async getVerificationStatus(@CurrentUser() user: any) {
    return this.usersService.getVerificationStatus(user.id);
  }

  @Get('me/transfer-pin')
  @ApiOperation({ summary: 'Check if user has transfer PIN' })
  async hasTransferPin(@CurrentUser() user: any) {
    return this.usersService.hasTransferPin(user.id);
  }

  @Post('me/transfer-pin')
  @ApiOperation({ summary: 'Create transfer PIN' })
  async createTransferPin(@CurrentUser() user: any, @Body() dto: CreateTransferPinDto) {
    return this.usersService.createTransferPin(user.id, dto);
  }

  @Post('me/transfer-pin/verify')
  @ApiOperation({ summary: 'Verify transfer PIN' })
  async verifyTransferPin(@CurrentUser() user: any, @Body() dto: VerifyTransferPinDto) {
    return this.usersService.verifyTransferPin(user.id, dto);
  }

  @Put('me/transfer-pin')
  @ApiOperation({ summary: 'Update transfer PIN' })
  async updateTransferPin(@CurrentUser() user: any, @Body() dto: UpdateTransferPinDto) {
    return this.usersService.updateTransferPin(user.id, dto);
  }
}

