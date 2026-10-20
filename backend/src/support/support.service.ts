import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { SupportChat, SupportChatDocument, ChatMessage } from '../database/schemas/support-chat.schema';
import { SendMessageDto } from './dto';

@Injectable()
export class SupportService {
  constructor(
    @InjectModel(SupportChat.name)
    private supportChatModel: Model<SupportChatDocument>,
  ) {}

  /** Get or create active chat for the current user (user only). */
  async getOrCreateMyChat(userId: string, userEmail: string): Promise<SupportChatDocument | null> {
    const existing = await this.supportChatModel
      .findOne({ userId: new Types.ObjectId(userId) })
      .lean()
      .exec();
    if (existing) {
      return this.supportChatModel.findById(existing._id).exec();
    }
    const created = await this.supportChatModel.create({
      userId: new Types.ObjectId(userId),
      userEmail,
      userMessages: [],
      adminMessages: [],
    });
    return this.supportChatModel.findById(created._id).exec();
  }

  /** Get my active chat without creating (user only). */
  async getMyChat(userId: string): Promise<SupportChatDocument | null> {
    return this.supportChatModel
      .findOne({ userId: new Types.ObjectId(userId) })
      .exec();
  }

  /** Add a user message to my chat. Creates chat if not exists. */
  async addUserMessage(userId: string, userEmail: string, dto: SendMessageDto): Promise<SupportChatDocument> {
    let chat = await this.supportChatModel.findOne({ userId: new Types.ObjectId(userId) }).exec();
    if (!chat) {
      chat = await this.supportChatModel.create({
        userId: new Types.ObjectId(userId),
        userEmail,
        userMessages: [],
        adminMessages: [],
      });
    }
    const msg: ChatMessage = { content: dto.content, createdAt: new Date() };
    chat.userMessages.push(msg);
    await chat.save();
    return this.supportChatModel.findById(chat._id).exec() as Promise<SupportChatDocument>;
  }

  /** End my chat (user). Deletes the chat document. */
  async endMyChat(userId: string): Promise<{ deleted: boolean }> {
    const result = await this.supportChatModel
      .deleteOne({ userId: new Types.ObjectId(userId) })
      .exec();
    return { deleted: result.deletedCount > 0 };
  }

  /** List all active support chats (admin only). */
  async listChats(): Promise<SupportChatDocument[]> {
    return this.supportChatModel
      .find()
      .sort({ updatedAt: -1 })
      .lean()
      .exec() as Promise<SupportChatDocument[]>;
  }

  /** Get a single chat by id. Admin can get any; user can get only own. */
  async getChatById(chatId: string, actor: { type: string; id?: string; email?: string }): Promise<SupportChatDocument> {
    const chat = await this.supportChatModel.findById(chatId).exec();
    if (!chat) {
      throw new NotFoundException('Chat not found');
    }
    if (actor.type === 'user') {
      if (chat.userId.toString() !== actor.id) {
        throw new ForbiddenException('You can only view your own chat');
      }
    }
    return chat;
  }

  /** Add an admin message to a chat. */
  async addAdminMessage(chatId: string, adminId: string, dto: SendMessageDto): Promise<SupportChatDocument> {
    const chat = await this.supportChatModel.findById(chatId).exec();
    if (!chat) {
      throw new NotFoundException('Chat not found');
    }
    const msg: ChatMessage = {
      content: dto.content,
      createdAt: new Date(),
      adminId: new Types.ObjectId(adminId),
    };
    chat.adminMessages.push(msg);
    await chat.save();
    return this.supportChatModel.findById(chat._id).exec() as Promise<SupportChatDocument>;
  }

  /** End a chat (admin). Deletes the chat document. */
  async endChatByAdmin(chatId: string): Promise<{ deleted: boolean }> {
    const result = await this.supportChatModel.deleteOne({ _id: new Types.ObjectId(chatId) }).exec();
    return { deleted: result.deletedCount > 0 };
  }
}
