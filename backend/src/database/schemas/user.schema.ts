import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type UserDocument = HydratedDocument<User>;

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  CLOSED = 'CLOSED',
}

export enum KYCStatus {
  PENDING = 'PENDING',
  VERIFIED = 'VERIFIED',
  REJECTED = 'REJECTED',
}

export enum AccountTier {
  TIER_1 = 'TIER_1',
  TIER_2 = 'TIER_2',
  TIER_3 = 'TIER_3',
}

@Schema({ collection: 'users', timestamps: true })
export class User {
  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({ required: true })
  firstName: string;

  @Prop({ required: true })
  lastName: string;

  @Prop()
  phone?: string;

  @Prop()
  dateOfBirth?: Date;

  @Prop()
  address?: string;

  @Prop()
  city?: string;

  @Prop()
  country?: string;

  @Prop()
  postalCode?: string;

  @Prop({ type: String, enum: KYCStatus, default: KYCStatus.PENDING })
  kycStatus: KYCStatus;

  @Prop({ type: String, enum: UserStatus, default: UserStatus.ACTIVE })
  status: UserStatus;

  @Prop({ type: String, enum: AccountTier, default: AccountTier.TIER_1 })
  accountTier: AccountTier;

  @Prop()
  transferPin?: string;
}

export const UserSchema = SchemaFactory.createForClass(User);

