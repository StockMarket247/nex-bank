import { Controller, Get, Post, Body, Param, Query, UseGuards, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { TransactionsService } from './transactions.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CreateInternalTransferDto } from './dto';
import { AdminRole } from '../database/schemas/admin.schema';

@ApiTags('transactions')
@Controller('transactions')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class TransactionsController {
  constructor(private transactionsService: TransactionsService) {}

  @Post('internal-transfer')
  @ApiOperation({ summary: 'Create internal transfer between GBH accounts' })
  async createInternalTransfer(@CurrentUser() user: any, @Body() dto: CreateInternalTransferDto) {
    return this.transactionsService.createInternalTransfer(user.id, dto);
  }

  @Get('me')
  @ApiOperation({ summary: 'Get current user transactions' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'accountId', required: false, type: String })
  async getMyTransactions(
    @CurrentUser() user: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('accountId') accountId?: string,
  ) {
    const pageNum = page && !isNaN(parseInt(page, 10)) ? parseInt(page, 10) : 1;
    const limitNum = limit && !isNaN(parseInt(limit, 10)) ? parseInt(limit, 10) : 20;
    return this.transactionsService.getUserTransactions(user.id, accountId, pageNum, limitNum);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get transaction by ID' })
  async getTransaction(@CurrentUser() user: any, @Param('id') id: string) {
    return this.transactionsService.getTransactionById(id, user.type === 'user' ? user.id : undefined);
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles(AdminRole.SUPER_ADMIN, AdminRole.ADMIN, AdminRole.AUDITOR)
  @ApiOperation({ summary: 'Get all transactions (Admin only)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'accountId', required: false, type: String })
  async getAllTransactions(
    @Query('page', new ParseIntPipe({ optional: true })) page?: number,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
    @Query('accountId') accountId?: string,
  ) {
    return this.transactionsService.getAllTransactions(page || 1, limit || 20, accountId);
  }
}

