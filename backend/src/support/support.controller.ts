import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AdminRole } from '../database/schemas/admin.schema';
import { SupportService } from './support.service';
import { SendMessageDto } from './dto';

@ApiTags('support')
@Controller('support')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SupportController {
  constructor(private readonly supportService: SupportService) {}

  // ---------- User (me) routes ----------
  @Get('me')
  @ApiOperation({ summary: 'Get my support chat if any (user only)' })
  async getMyChat(@CurrentUser() user: any) {
    if (user.type === 'admin') {
      throw new ForbiddenException('Use admin support to view chats');
    }
    return this.supportService.getMyChat(user.id);
  }

  @Post('me/start')
  @ApiOperation({ summary: 'Start a new support chat (user only). Creates if none exists.' })
  async startMyChat(@CurrentUser() user: any) {
    if (user.type === 'admin') {
      throw new ForbiddenException('Only users can start a support chat');
    }
    return this.supportService.getOrCreateMyChat(user.id, user.email);
  }

  @Post('me/messages')
  @ApiOperation({ summary: 'Send a message in my support chat (user only)' })
  async addMyMessage(@CurrentUser() user: any, @Body() dto: SendMessageDto) {
    if (user.type === 'admin') {
      throw new ForbiddenException('Admins use the chat thread to reply');
    }
    return this.supportService.addUserMessage(user.id, user.email, dto);
  }

  @Post('me/end')
  @ApiOperation({ summary: 'End my support chat (user only). Deletes the chat and messages.' })
  async endMyChat(@CurrentUser() user: any) {
    if (user.type === 'admin') {
      throw new ForbiddenException('Only users can end their own chat from here');
    }
    return this.supportService.endMyChat(user.id);
  }

  // ---------- Admin routes ----------
  @Get('chats')
  @UseGuards(RolesGuard)
  @Roles(AdminRole.SUPER_ADMIN, AdminRole.ADMIN)
  @ApiOperation({ summary: 'List all support chats (admin only)' })
  async listChats(@CurrentUser() _admin: any) {
    return this.supportService.listChats();
  }

  @Get('chats/:id')
  @UseGuards(RolesGuard)
  @Roles(AdminRole.SUPER_ADMIN, AdminRole.ADMIN)
  @ApiOperation({ summary: 'Get a support chat by id (admin only)' })
  async getChat(@CurrentUser() admin: any, @Param('id') id: string) {
    return this.supportService.getChatById(id, { type: 'admin', id: admin.id });
  }

  @Post('chats/:id/messages')
  @UseGuards(RolesGuard)
  @Roles(AdminRole.SUPER_ADMIN, AdminRole.ADMIN)
  @ApiOperation({ summary: 'Send admin reply in a support chat (admin only)' })
  async addAdminMessage(
    @CurrentUser() admin: any,
    @Param('id') id: string,
    @Body() dto: SendMessageDto,
  ) {
    return this.supportService.addAdminMessage(id, admin.id, dto);
  }

  @Post('chats/:id/end')
  @UseGuards(RolesGuard)
  @Roles(AdminRole.SUPER_ADMIN, AdminRole.ADMIN)
  @ApiOperation({ summary: 'End a support chat (admin only). Deletes the chat and messages.' })
  async endChat(@CurrentUser() _admin: any, @Param('id') id: string) {
    return this.supportService.endChatByAdmin(id);
  }
}
