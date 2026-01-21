import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AuditLog, AuditLogDocument, AuditAction } from '../database/schemas/audit-log.schema';
import { CreateAuditLogDto } from './dto';

@Injectable()
export class AuditService {
  constructor(@InjectModel(AuditLog.name) private auditLogModel: Model<AuditLogDocument>) {}

  async log(dto: CreateAuditLogDto) {
    return this.auditLogModel.create({
      action: dto.action,
      entityType: dto.entityType,
      entityId: dto.entityId,
      adminId: dto.adminId,
      userId: dto.userId,
      details: dto.details,
      ipAddress: dto.ipAddress,
      userAgent: dto.userAgent,
    });
  }

  async getAuditLogs(page = 1, limit = 50, action?: AuditAction, entityType?: string) {
    const skip = (page - 1) * limit;
    const query: any = {};
    if (action) {
      query.action = action;
    }
    if (entityType) {
      query.entityType = entityType;
    }

    const [logs, total] = await Promise.all([
      this.auditLogModel
        .find(query)
        .populate('adminId', 'email firstName lastName')
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 })
        .lean(),
      this.auditLogModel.countDocuments(query),
    ]);

    return {
      data: logs,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getEntityAuditLogs(entityType: string, entityId: string) {
    return this.auditLogModel
      .find({
        entityType,
        entityId,
      })
      .populate('adminId', 'email firstName lastName')
      .sort({ createdAt: -1 })
      .lean();
  }
}
