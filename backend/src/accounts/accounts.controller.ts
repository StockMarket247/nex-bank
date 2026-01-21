import { Controller, Get, Post, Put, Body, Param, Query, UseGuards, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AccountsService } from './accounts.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CreateAccountDto, FreezeAccountDto } from './dto';
import { AdminRole } from '../database/schemas/admin.schema';

@ApiTags('accounts')
@Controller('accounts')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AccountsController {
  constructor(private accountsService: AccountsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new bank account' })
  async createAccount(@CurrentUser() user: any, @Body() dto: CreateAccountDto) {
    return this.accountsService.createAccount(user.id, dto);
  }

  @Get('me')
  @ApiOperation({ summary: 'Get current user accounts' })
  async getMyAccounts(@CurrentUser() user: any) {
    return this.accountsService.getUserAccounts(user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get account by ID' })
  async getAccount(@CurrentUser() user: any, @Param('id') id: string) {
    return this.accountsService.getAccountById(id, user.type === 'user' ? user.id : undefined);
  }

  @Put(':id/freeze')
  @UseGuards(RolesGuard)
  @Roles(AdminRole.SUPER_ADMIN, AdminRole.ADMIN)
  @ApiOperation({ summary: 'Freeze or unfreeze account (Admin only)' })
  async freezeAccount(@Param('id') id: string, @Body() dto: FreezeAccountDto) {
    return this.accountsService.freezeAccount(id, dto);
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles(AdminRole.SUPER_ADMIN, AdminRole.ADMIN, AdminRole.AUDITOR)
  @ApiOperation({ summary: 'Get all accounts (Admin only)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getAllAccounts(
    @Query('page', new ParseIntPipe({ optional: true })) page?: number,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
  ) {
    return this.accountsService.getAllAccounts(page || 1, limit || 10);
  }
}

