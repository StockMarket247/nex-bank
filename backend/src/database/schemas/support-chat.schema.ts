import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type SupportChatDocument = HydratedDocument<SupportChat>;

@Schema({ _id: false })
export class ChatMessage {
  @Prop({ required: true })
  content: string;

  @Prop({ default: () => new Date() })
  createdAt: Date;

  @Prop({ type: Types.ObjectId, ref: 'Admin' })
  adminId?: Types.ObjectId;
}

export const ChatMessageSchema = SchemaFactory.createForClass(ChatMessage);

@Schema({ collection: 'support_chats', timestamps: true })
export class SupportChat {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ required: true })
  userEmail: string;

  @Prop({ type: [ChatMessageSchema], default: [] })
  userMessages: ChatMessage[];

  @Prop({ type: [ChatMessageSchema], default: [] })
  adminMessages: ChatMessage[];

  @Prop({ default: () => new Date() })
  createdAt: Date;

  @Prop({ default: () => new Date() })
  updatedAt: Date;
}

export const SupportChatSchema = SchemaFactory.createForClass(SupportChat);

// Index for finding active chat by user (we use existence of document as "active")
SupportChatSchema.index({ userId: 1 });
