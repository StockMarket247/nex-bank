import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type TransferRequestDocument = HydratedDocument<TransferRequest>;

export enum TransferRequestStatus {
  PENDING_ADMIN_APPROVAL = 'PENDING_ADMIN_APPROVAL',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  COMPLETED = 'COMPLETED',
}

@Schema({ collection: 'transfer_requests', timestamps: true })
export class TransferRequest {
  @Prop({ required: true, unique: true })
  requestId: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'BankAccount', required: true, index: true })
  accountId: Types.ObjectId;

  @Prop({ type: String, enum: TransferRequestStatus, default: TransferRequestStatus.PENDING_ADMIN_APPROVAL, index: true })
  status: TransferRequestStatus;

  @Prop({ required: true })
  amount: string;

  @Prop({ default: 'USD' })
  currency: string;

  @Prop({ required: true })
  recipientBankName: string;

  @Prop()
  recipientBankCode?: string;

  @Prop({ required: true })
  recipientAccountNumber: string;

  @Prop({ required: true })
  recipientName: string;

  @Prop()
  recipientEmail?: string;

  @Prop()
  recipientPhone?: string;

  @Prop()
  reference?: string;

  @Prop()
  description?: string;

  @Prop({ type: Types.ObjectId, ref: 'Admin' })
  approvedBy?: Types.ObjectId;

  @Prop()
  approvedAt?: Date;

  @Prop()
  rejectionReason?: string;
}

export const TransferRequestSchema = SchemaFactory.createForClass(TransferRequest);
TransferRequestSchema.index({ userId: 1 });
TransferRequestSchema.index({ accountId: 1 });
TransferRequestSchema.index({ status: 1 });
TransferRequestSchema.index({ createdAt: -1 });

