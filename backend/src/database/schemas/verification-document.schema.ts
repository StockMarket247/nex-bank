import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type VerificationDocumentDocument = HydratedDocument<VerificationDocument>;

export enum DocumentType {
  // Identity documents (for Tier 2)
  NATIONAL_ID = 'NATIONAL_ID',
  DRIVERS_LICENSE = 'DRIVERS_LICENSE',
  PASSPORT = 'PASSPORT',
  
  // Address verification documents (for Tier 3)
  UTILITY_BILL = 'UTILITY_BILL',
  BANK_STATEMENT = 'BANK_STATEMENT',
  GOVERNMENT_LETTER = 'GOVERNMENT_LETTER',
}

export enum VerificationType {
  IDENTITY = 'IDENTITY', // Tier 2
  ADDRESS = 'ADDRESS', // Tier 3
}

export enum VerificationStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

@Schema({ collection: 'verification_documents', timestamps: true })
export class VerificationDocument {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ type: String, enum: VerificationType, required: true })
  verificationType: VerificationType;

  @Prop({ type: String, enum: DocumentType, required: true })
  documentType: DocumentType;

  @Prop({ required: true })
  identityNumber: string; // For Tier 2

  @Prop({ required: false })
  address?: string; // For Tier 3

  @Prop({ required: false })
  city?: string; // For Tier 3

  @Prop({ required: false })
  country?: string; // For Tier 3

  @Prop({ required: false })
  postalCode?: string; // For Tier 3

  @Prop({ required: true })
  frontImageUrl: string; // URL to front of document

  @Prop({ required: false })
  backImageUrl?: string; // URL to back of document (for identity docs)

  @Prop({ type: String, enum: VerificationStatus, default: VerificationStatus.PENDING })
  status: VerificationStatus;

  @Prop()
  rejectionReason?: string;

  @Prop({ type: Types.ObjectId, ref: 'Admin' })
  reviewedBy?: Types.ObjectId;

  @Prop()
  reviewedAt?: Date;

  @Prop()
  notes?: string; // Admin notes
}

export const VerificationDocumentSchema = SchemaFactory.createForClass(VerificationDocument);
VerificationDocumentSchema.index({ userId: 1, verificationType: 1 });
VerificationDocumentSchema.index({ status: 1 });
