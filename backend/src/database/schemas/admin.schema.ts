import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type AdminDocument = HydratedDocument<Admin>;

export enum AdminRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
  AUDITOR = 'AUDITOR',
}

@Schema({ collection: 'admins', timestamps: true })
export class Admin {
  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({ required: true })
  firstName: string;

  @Prop({ required: true })
  lastName: string;

  @Prop({ type: String, enum: AdminRole, default: AdminRole.ADMIN })
  role: AdminRole;

  @Prop({ default: true })
  isActive: boolean;

  @Prop()
  lastLoginAt?: Date;
}

export const AdminSchema = SchemaFactory.createForClass(Admin);

