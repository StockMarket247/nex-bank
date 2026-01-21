import { AuditAction } from '../../database/schemas/audit-log.schema';

export class CreateAuditLogDto {
  action: AuditAction;
  entityType: string;
  entityId: string;
  adminId?: string;
  userId?: string;
  details?: string;
  ipAddress?: string;
  userAgent?: string;
}

