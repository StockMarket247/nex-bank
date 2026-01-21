import { Controller, Get, Param, Query, UseGuards, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AuditService } from './audit.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { AdminRole } from '../database/schemas/admin.schema';
import { AuditAction } from '../database/schemas/audit-log.schema';

@ApiTags('audit')
@Controller('audit')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(AdminRole.SUPER_ADMIN, AdminRole.ADMIN, AdminRole.AUDITOR)
@ApiBearerAuth()
export class AuditController {
  constructor(private auditService: AuditService) {}

  @Get()
  @ApiOperation({ summary: 'Get audit logs' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'action', required: false, enum: AuditAction })
  @ApiQuery({ name: 'entityType', required: false, type: String })
  async getAuditLogs(
    @Query('page', new ParseIntPipe({ optional: true })) page?: number,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
    @Query('action') action?: AuditAction,
    @Query('entityType') entityType?: string,
  ) {
    return this.auditService.getAuditLogs(page || 1, limit || 50, action, entityType);
  }

  @Get('entity/:entityType/:entityId')
  @ApiOperation({ summary: 'Get audit logs for a specific entity' })
  async getEntityAuditLogs(@Param('entityType') entityType: string, @Param('entityId') entityId: string) {
    return this.auditService.getEntityAuditLogs(entityType, entityId);
  }
}

