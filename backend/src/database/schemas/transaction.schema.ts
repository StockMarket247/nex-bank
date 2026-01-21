import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type TransactionDocument = HydratedDocument<Transaction>;

export enum TransactionType {
  INTERNAL_TRANSFER = 'INTERNAL_TRANSFER',
  EXTERNAL_TRANSFER = 'EXTERNAL_TRANSFER',
  INTERNATIONAL_TRANSFER = 'INTERNATIONAL_TRANSFER',
  DEPOSIT = 'DEPOSIT',
  WITHDRAWAL = 'WITHDRAWAL',
  ADJUSTMENT = 'ADJUSTMENT',
}

export enum TransactionStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}

@Schema({ collection: 'transactions', timestamps: true })
export class Transaction {
  @Prop({ required: true, unique: true, index: true })
  transactionId: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'BankAccount', required: true, index: true })
  accountId: Types.ObjectId;

  @Prop({ type: String, enum: TransactionType, required: true })
  type: TransactionType;

  @Prop({ type: String, enum: TransactionStatus, default: TransactionStatus.PENDING })
  status: TransactionStatus;

  @Prop({ required: true })
  amount: string;

  @Prop({ default: 'USD' })
  currency: string;

  @Prop()
  reference?: string;

  @Prop()
  description?: string;

  @Prop({ type: Types.ObjectId })
  recipientAccountId?: Types.ObjectId;

  @Prop()
  recipientAccountNumber?: string;

  @Prop()
  recipientName?: string;

  @Prop({ type: Types.ObjectId, ref: 'TransferRequest' })
  transferRequestId?: Types.ObjectId;
}

export const TransactionSchema = SchemaFactory.createForClass(Transaction);
TransactionSchema.index({ userId: 1 });
TransactionSchema.index({ accountId: 1 });
TransactionSchema.index({ transactionId: 1 });
TransactionSchema.index({ createdAt: -1 });

