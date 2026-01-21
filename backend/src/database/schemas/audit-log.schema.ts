import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type AuditLogDocument = HydratedDocument<AuditLog>;

export enum AuditAction {
  USER_CREATED = 'USER_CREATED',
  USER_UPDATED = 'USER_UPDATED',
  USER_SUSPENDED = 'USER_SUSPENDED',
  USER_UNSUSPENDED = 'USER_UNSUSPENDED',
  USER_CLOSED = 'USER_CLOSED',
  ACCOUNT_CREATED = 'ACCOUNT_CREATED',
  ACCOUNT_UPDATED = 'ACCOUNT_UPDATED',
  ACCOUNT_FROZEN = 'ACCOUNT_FROZEN',
  ACCOUNT_UNFROZEN = 'ACCOUNT_UNFROZEN',
  TRANSFER_APPROVED = 'TRANSFER_APPROVED',
  TRANSFER_REJECTED = 'TRANSFER_REJECTED',
  BALANCE_ADJUSTED = 'BALANCE_ADJUSTED',
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  PASSWORD_RESET = 'PASSWORD_RESET',
  TRANSACTION_UPDATED = 'TRANSACTION_UPDATED',
  NOTIFICATION_SENT = 'NOTIFICATION_SENT',
}

@Schema({ collection: 'audit_logs', timestamps: { createdAt: true, updatedAt: false } })
export class AuditLog {
  @Prop({ type: String, enum: AuditAction, required: true, index: true })
  action: AuditAction;

  @Prop({ required: true, index: true })
  entityType: string;

  @Prop({ type: Types.ObjectId, required: true, index: true })
  entityId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Admin', index: true })
  adminId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, index: true })
  userId?: Types.ObjectId;

  @Prop()
  details?: string;

  @Prop()
  ipAddress?: string;

  @Prop()
  userAgent?: string;

  @Prop({ default: Date.now })
  createdAt: Date;
}

export const AuditLogSchema = SchemaFactory.createForClass(AuditLog);
AuditLogSchema.index({ action: 1 });
AuditLogSchema.index({ entityType: 1, entityId: 1 });
AuditLogSchema.index({ adminId: 1 });
AuditLogSchema.index({ userId: 1 });
AuditLogSchema.index({ createdAt: -1 });

