import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type BankAccountDocument = HydratedDocument<BankAccount>;

export enum AccountType {
  SAVINGS = 'SAVINGS',
  CURRENT = 'CURRENT',
}

@Schema({ collection: 'bank_accounts', timestamps: true })
export class BankAccount {
  @Prop({ required: true, unique: true })
  accountNumber: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ type: String, enum: AccountType, required: true })
  type: AccountType;

  @Prop({ required: true, default: '0.00' })
  balance: string;

  @Prop({ default: 'USD' })
  currency: string;

  @Prop({ default: false })
  isFrozen: boolean;
}

export const BankAccountSchema = SchemaFactory.createForClass(BankAccount);
BankAccountSchema.index({ userId: 1 });
BankAccountSchema.index({ accountNumber: 1 });

