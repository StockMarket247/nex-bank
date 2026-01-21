import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument, UserStatus } from '../database/schemas/user.schema';
import { BankAccount, BankAccountDocument } from '../database/schemas/bank-account.schema';
import { Transaction, TransactionDocument, TransactionType, TransactionStatus } from '../database/schemas/transaction.schema';
import { TransferRequest, TransferRequestDocument, TransferRequestStatus } from '../database/schemas/transfer-request.schema';
import { Admin, AdminDocument } from '../database/schemas/admin.schema';
import { AccountsService } from '../accounts/accounts.service';
import { AuditService } from '../audit/audit.service';
import { AuditAction } from '../database/schemas/audit-log.schema';
import { SuspendUserDto, AdjustBalanceDto, UpdateTransactionStatusDto, SendNotificationDto, CreateAdminInternalTransferDto, CreateAdminExternalTransferDto } from './dto';
import { DecimalUtil } from '../common/utils/decimal.util';

@Injectable()
export class AdminService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(BankAccount.name) private bankAccountModel: Model<BankAccountDocument>,
    @InjectModel(Transaction.name) private transactionModel: Model<TransactionDocument>,
    @InjectModel(TransferRequest.name) private transferRequestModel: Model<TransferRequestDocument>,
    @InjectModel(Admin.name) private adminModel: Model<AdminDocument>,
    private accountsService: AccountsService,
    private auditService: AuditService,
  ) {}

  async suspendUser(adminId: string, userId: string, dto: SuspendUserDto) {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const newStatus = dto.suspended ? UserStatus.SUSPENDED : UserStatus.ACTIVE;
    if (user.status === newStatus) {
      throw new BadRequestException(`User is already ${newStatus}`);
    }

    user.status = newStatus;
    const updatedUser = await user.save();

    await this.auditService.log({
      action: dto.suspended ? AuditAction.USER_SUSPENDED : AuditAction.USER_UNSUSPENDED,
      entityType: 'User',
      entityId: userId,
      adminId: adminId,
      details: JSON.stringify({
        reason: dto.reason,
        previousStatus: user.status,
        newStatus: newStatus,
      }),
    });

    return updatedUser.toObject();
  }

  async closeUserAccount(adminId: string, userId: string) {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.status === UserStatus.CLOSED) {
      throw new BadRequestException('User account is already closed');
    }

    user.status = UserStatus.CLOSED;
    const updatedUser = await user.save();

    await this.auditService.log({
      action: AuditAction.USER_CLOSED,
      entityType: 'User',
      entityId: userId,
      adminId: adminId,
      details: JSON.stringify({
        previousStatus: user.status,
      }),
    });

    return updatedUser.toObject();
  }

  async adjustBalance(adminId: string, accountId: string, dto: AdjustBalanceDto) {
    const account = await this.accountsService.getAccountById(accountId);
    const adjustmentAmount = DecimalUtil.fromNumber(dto.amount);
    const newBalance = DecimalUtil.add(account.balance, adjustmentAmount);

    if (DecimalUtil.lt(newBalance, '0')) {
      throw new BadRequestException('Balance cannot be negative after adjustment');
    }

    try {
      const updatedAccount = await this.bankAccountModel.findByIdAndUpdate(accountId, { balance: newBalance }, { new: true });

      const transactionId = `ADJ${Date.now()}${Math.floor(Math.random() * 10000)}`;
      await this.transactionModel.create({
        transactionId,
        userId: (account as any).userId || account.userId,
        accountId: (account as any)._id || accountId,
        type: TransactionType.ADJUSTMENT,
        status: TransactionStatus.COMPLETED,
        amount: adjustmentAmount,
        currency: account.currency,
        description: dto.reason || 'Balance adjustment by admin',
        reference: `ADMIN_ADJUSTMENT_${adminId}`,
      });

      await this.auditService.log({
        action: AuditAction.BALANCE_ADJUSTED,
        entityType: 'BankAccount',
        entityId: accountId,
        adminId: adminId,
        details: JSON.stringify({
          accountNumber: account.accountNumber,
          previousBalance: account.balance,
          adjustmentAmount: dto.amount,
          newBalance: newBalance,
          reason: dto.reason,
        }),
      });

      return updatedAccount.toObject();
    } catch (error) {
      throw error;
    }
  }

  async getAdminProfile(adminId: string) {
    const admin = await this.adminModel.findById(adminId).select('-password').lean();
    if (!admin) {
      throw new NotFoundException('Admin not found');
    }
    return {
      ...admin,
      id: (admin as any)._id.toString(),
    };
  }

  async getDashboardStats() {
    const [totalUsers, activeUsers, suspendedUsers, totalAccounts, totalTransactions, pendingTransfers] = await Promise.all([
      this.userModel.countDocuments(),
      this.userModel.countDocuments({ status: UserStatus.ACTIVE }),
      this.userModel.countDocuments({ status: UserStatus.SUSPENDED }),
      this.bankAccountModel.countDocuments(),
      this.transactionModel.countDocuments(),
      this.transferRequestModel.countDocuments({ status: TransferRequestStatus.PENDING_ADMIN_APPROVAL }),
    ]);

    const accounts = await this.bankAccountModel.find().select('balance').lean();
    const totalBalance = accounts.reduce((sum, acc) => DecimalUtil.add(sum, acc.balance), '0.00');

    return {
      users: {
        total: totalUsers,
        active: activeUsers,
        suspended: suspendedUsers,
      },
      accounts: {
        total: totalAccounts,
      },
      transactions: {
        total: totalTransactions,
      },
      transfers: {
        pending: pendingTransfers,
      },
      balance: {
        total: totalBalance,
      },
    };
  }

  async updateTransactionStatus(adminId: string, transactionId: string, dto: UpdateTransactionStatusDto) {
    const transaction = await this.transactionModel.findById(transactionId);
    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    const previousStatus = transaction.status;
    transaction.status = dto.status;
    await transaction.save();

    await this.auditService.log({
      action: AuditAction.TRANSACTION_UPDATED,
      entityType: 'Transaction',
      entityId: transactionId,
      adminId: adminId,
      details: JSON.stringify({
        transactionId: transaction.transactionId,
        previousStatus,
        newStatus: dto.status,
        notes: dto.notes,
      }),
    });

    return transaction.toObject();
  }

  async sendNotification(adminId: string, dto: SendNotificationDto) {
    // For now, we'll just log the notification
    // In a real system, you'd store this in a notifications collection
    // and send via email/push notifications
    
    await this.auditService.log({
      action: AuditAction.NOTIFICATION_SENT,
      entityType: 'Notification',
      entityId: 'system',
      adminId: adminId,
      details: JSON.stringify({
        title: dto.title,
        message: dto.message,
        userIds: dto.userIds || 'all',
        type: dto.type || 'info',
      }),
    });

    return {
      message: 'Notification sent successfully',
      sentTo: dto.userIds ? `${dto.userIds.length} users` : 'all users',
    };
  }

  generateTransactionId(): string {
    return `TXN${Date.now()}${Math.floor(Math.random() * 10000)}`;
  }

  async createAdminInternalTransfer(adminId: string, dto: CreateAdminInternalTransferDto) {
    // Get sender user and account
    const fromUser = await this.userModel.findById(dto.fromUserId);
    if (!fromUser) {
      throw new NotFoundException('Sender user not found');
    }
    
    let senderAccount: any;
    if (dto.fromAccountId) {
      senderAccount = await this.accountsService.getAccountById(dto.fromAccountId);
    } else {
      // Get first account of sender
      const accounts = await this.bankAccountModel.find({ userId: dto.fromUserId }).limit(1).lean();
      if (!accounts || accounts.length === 0) {
        throw new NotFoundException('Sender user has no accounts');
      }
      senderAccount = accounts[0];
      // Populate userId
      senderAccount.userId = await this.userModel.findById(senderAccount.userId).select('firstName lastName email').lean();
    }

    // Get recipient user and account
    const toUser = await this.userModel.findById(dto.toUserId);
    if (!toUser) {
      throw new NotFoundException('Recipient user not found');
    }

    let recipientAccount: any;
    if (dto.toAccountId) {
      recipientAccount = await this.accountsService.getAccountById(dto.toAccountId);
    } else {
      // Get first account of recipient
      const accounts = await this.bankAccountModel.find({ userId: dto.toUserId }).limit(1).lean();
      if (!accounts || accounts.length === 0) {
        throw new NotFoundException('Recipient user has no accounts');
      }
      recipientAccount = accounts[0];
      // Populate userId
      recipientAccount.userId = await this.userModel.findById(recipientAccount.userId).select('firstName lastName email').lean();
    }

    // Validate accounts
    const senderAccountId = typeof senderAccount._id === 'string' ? senderAccount._id : senderAccount._id.toString();
    const recipientAccountId = typeof recipientAccount._id === 'string' ? recipientAccount._id : recipientAccount._id.toString();
    
    if (senderAccountId === recipientAccountId) {
      throw new BadRequestException('Cannot transfer to the same account');
    }
    
    if (senderAccount.isFrozen) {
      throw new BadRequestException('Sender account is frozen');
    }
    
    if (recipientAccount.isFrozen) {
      throw new BadRequestException('Recipient account is frozen');
    }

    // Validate amount
    const amount = DecimalUtil.fromNumber(dto.amount);
    if (DecimalUtil.lte(amount, '0')) {
      throw new BadRequestException('Amount must be greater than zero');
    }
    
    if (DecimalUtil.lt(senderAccount.balance, amount)) {
      throw new BadRequestException('Insufficient balance');
    }

    // Get user names
    type PopulatedUser = { _id: any; firstName?: string; lastName?: string; email?: string };
    
    let senderUserId: string;
    let senderName = '';
    if (senderAccount.userId && typeof senderAccount.userId === 'object' && '_id' in senderAccount.userId) {
      const populatedUser = senderAccount.userId as PopulatedUser;
      senderUserId = populatedUser._id?.toString() || dto.fromUserId;
      senderName = `${populatedUser.firstName || ''} ${populatedUser.lastName || ''}`.trim();
    } else {
      senderUserId = typeof senderAccount.userId === 'string' ? senderAccount.userId : senderAccount.userId?.toString() || dto.fromUserId;
      senderName = `${fromUser.firstName || ''} ${fromUser.lastName || ''}`.trim();
    }
    
    let recipientUserId: string;
    let recipientName = '';
    if (recipientAccount.userId && typeof recipientAccount.userId === 'object' && '_id' in recipientAccount.userId) {
      const populatedUser = recipientAccount.userId as PopulatedUser;
      recipientUserId = populatedUser._id?.toString() || dto.toUserId;
      recipientName = `${populatedUser.firstName || ''} ${populatedUser.lastName || ''}`.trim();
    } else {
      recipientUserId = typeof recipientAccount.userId === 'string' ? recipientAccount.userId : recipientAccount.userId?.toString() || dto.toUserId;
      recipientName = `${toUser.firstName || ''} ${toUser.lastName || ''}`.trim();
    }

    const transactionId = this.generateTransactionId();

    try {
      // Create debit transaction
      const debitTransaction = await this.transactionModel.create({
        transactionId,
        userId: senderUserId,
        accountId: senderAccountId,
        type: TransactionType.INTERNAL_TRANSFER,
        status: TransactionStatus.COMPLETED,
        amount: DecimalUtil.negate(amount),
        currency: senderAccount.currency,
        reference: dto.reference,
        description: dto.description || `Admin transfer to ${recipientAccount.accountNumber}`,
        recipientAccountId: recipientAccountId,
        recipientAccountNumber: recipientAccount.accountNumber,
        recipientName: recipientName,
      });

      // Create credit transaction
      const creditTransaction = await this.transactionModel.create({
        transactionId: `${transactionId}-CR`,
        userId: recipientUserId,
        accountId: recipientAccountId,
        type: TransactionType.INTERNAL_TRANSFER,
        status: TransactionStatus.COMPLETED,
        amount: amount,
        currency: recipientAccount.currency,
        reference: dto.reference,
        description: dto.description || `Admin transfer from ${senderAccount.accountNumber}`,
        recipientAccountId: senderAccountId,
        recipientAccountNumber: senderAccount.accountNumber,
        recipientName: senderName,
      });

      // Update balances immediately
      const newSenderBalance = DecimalUtil.subtract(senderAccount.balance, amount);
      await this.bankAccountModel.findByIdAndUpdate(senderAccountId, { balance: newSenderBalance });

      const newRecipientBalance = DecimalUtil.add(recipientAccount.balance, amount);
      await this.bankAccountModel.findByIdAndUpdate(recipientAccountId, { balance: newRecipientBalance });

      // Audit log
      await this.auditService.log({
        action: AuditAction.TRANSFER_APPROVED,
        entityType: 'Transaction',
        entityId: debitTransaction._id.toString(),
        adminId: adminId,
        details: JSON.stringify({
          transactionId,
          type: 'ADMIN_INTERNAL_TRANSFER',
          amount: dto.amount,
          fromUserId: dto.fromUserId,
          toUserId: dto.toUserId,
          fromAccount: senderAccount.accountNumber,
          toAccount: recipientAccount.accountNumber,
        }),
      });

      return {
        transaction: debitTransaction.toObject(),
        recipientTransaction: creditTransaction.toObject(),
        fromUser: {
          id: senderUserId,
          name: senderName,
          accountNumber: senderAccount.accountNumber,
          newBalance: newSenderBalance,
        },
        toUser: {
          id: recipientUserId,
          name: recipientName,
          accountNumber: recipientAccount.accountNumber,
          newBalance: newRecipientBalance,
        },
      };
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(`Transfer failed: ${error.message || 'Internal server error'}`);
    }
  }

  async createAdminExternalTransfer(adminId: string, dto: CreateAdminExternalTransferDto) {
    // Get sender user and account
    const fromUser = await this.userModel.findById(dto.fromUserId);
    if (!fromUser) {
      throw new NotFoundException('Sender user not found');
    }
    
    let senderAccount: any;
    if (dto.fromAccountId) {
      senderAccount = await this.accountsService.getAccountById(dto.fromAccountId);
    } else {
      // Get first account of sender
      const accounts = await this.bankAccountModel.find({ userId: dto.fromUserId }).limit(1).lean();
      if (!accounts || accounts.length === 0) {
        throw new NotFoundException('Sender user has no accounts');
      }
      senderAccount = accounts[0];
    }

    if (senderAccount.isFrozen) {
      throw new BadRequestException('Sender account is frozen');
    }

    // Validate amount
    const amount = DecimalUtil.fromNumber(dto.amount);
    if (DecimalUtil.lte(amount, '0')) {
      throw new BadRequestException('Amount must be greater than zero');
    }
    
    const status = dto.status || TransactionStatus.COMPLETED;
    
    // Only check balance if status is COMPLETED
    if (status === TransactionStatus.COMPLETED && DecimalUtil.lt(senderAccount.balance, amount)) {
      throw new BadRequestException('Insufficient balance');
    }

    const transactionId = this.generateTransactionId();
    const senderAccountId = typeof senderAccount._id === 'string' ? senderAccount._id : senderAccount._id.toString();

    try {
      // Create transaction
      const transaction = await this.transactionModel.create({
        transactionId,
        userId: dto.fromUserId,
        accountId: senderAccountId,
        type: TransactionType.EXTERNAL_TRANSFER,
        status: status,
        amount: DecimalUtil.negate(amount),
        currency: senderAccount.currency,
        reference: dto.reference,
        description: dto.description || `Admin external transfer to ${dto.recipientBankName}`,
        recipientAccountNumber: dto.recipientAccountNumber,
        recipientName: dto.recipientName,
      });

      // Update balance if status is COMPLETED
      if (status === TransactionStatus.COMPLETED) {
        const newBalance = DecimalUtil.subtract(senderAccount.balance, amount);
        await this.bankAccountModel.findByIdAndUpdate(senderAccountId, { balance: newBalance });
      }

      // Audit log
      await this.auditService.log({
        action: AuditAction.TRANSFER_APPROVED,
        entityType: 'Transaction',
        entityId: transaction._id.toString(),
        adminId: adminId,
        details: JSON.stringify({
          transactionId,
          type: 'ADMIN_EXTERNAL_TRANSFER',
          amount: dto.amount,
          fromUserId: dto.fromUserId,
          recipientBank: dto.recipientBankName,
          recipientAccount: dto.recipientAccountNumber,
          status: status,
        }),
      });

      return {
        transaction: transaction.toObject(),
        fromUser: {
          id: dto.fromUserId,
          name: `${fromUser.firstName} ${fromUser.lastName}`.trim(),
          accountNumber: senderAccount.accountNumber,
        },
      };
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(`Transfer failed: ${error.message || 'Internal server error'}`);
    }
  }
}
