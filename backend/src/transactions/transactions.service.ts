import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Transaction, TransactionDocument, TransactionType, TransactionStatus } from '../database/schemas/transaction.schema';
import { BankAccount, BankAccountDocument } from '../database/schemas/bank-account.schema';
import { User, UserDocument } from '../database/schemas/user.schema';
import { AccountsService } from '../accounts/accounts.service';
import { AuditService } from '../audit/audit.service';
import { AuditAction } from '../database/schemas/audit-log.schema';
import { CreateInternalTransferDto } from './dto';
import { DecimalUtil } from '../common/utils/decimal.util';
import { TIER_LIMITS } from '../common/config/tier.config';

@Injectable()
export class TransactionsService {
  private readonly logger = new Logger(TransactionsService.name);

  constructor(
    @InjectModel(Transaction.name) private transactionModel: Model<TransactionDocument>,
    @InjectModel(BankAccount.name) private bankAccountModel: Model<BankAccountDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private accountsService: AccountsService,
    private auditService: AuditService,
  ) {}

  generateTransactionId(): string {
    return `TXN${Date.now()}${Math.floor(Math.random() * 10000)}`;
  }

  async createInternalTransfer(userId: string, dto: CreateInternalTransferDto) {
    const senderAccount = await this.accountsService.getAccountById(dto.fromAccountId, userId);
    if (!senderAccount) {
      throw new NotFoundException('Sender account not found');
    }
    if (senderAccount.isFrozen) {
      throw new BadRequestException('Sender account is frozen');
    }

    const recipientAccount = await this.accountsService.getAccountByNumber(dto.toAccountNumber);
    if (!recipientAccount) {
      throw new NotFoundException('Recipient account not found');
    }
    
    // Compare account IDs properly (handle both ObjectId and string)
    const senderAccountId = typeof senderAccount._id === 'string' ? senderAccount._id : senderAccount._id.toString();
    const recipientAccountId = typeof recipientAccount._id === 'string' ? recipientAccount._id : recipientAccount._id.toString();
    if (senderAccountId === recipientAccountId) {
      throw new BadRequestException('Cannot transfer to the same account');
    }
    if (recipientAccount.isFrozen) {
      throw new BadRequestException('Recipient account is frozen');
    }

    const amount = DecimalUtil.fromNumber(dto.amount);
    if (DecimalUtil.lte(amount, '0')) {
      throw new BadRequestException('Amount must be greater than zero');
    }
    if (DecimalUtil.lt(senderAccount.balance, amount)) {
      throw new BadRequestException('Insufficient balance');
    }

    // Check tier limits
    const user = await this.userModel.findById(userId).select('accountTier').lean();
    if (user) {
      const tierLimits = TIER_LIMITS[user.accountTier];
      const amountNumber = parseFloat(amount);
      if (amountNumber > tierLimits.maxTransferLimit) {
        throw new BadRequestException(
          `Transfer amount exceeds your tier limit of $${tierLimits.maxTransferLimit.toLocaleString()}. Please upgrade your account tier.`
        );
      }
    }

    // Extract user IDs properly (handle populated userId field)
    // When populated, userId is an object with _id, email, firstName, lastName
    // When not populated, userId is an ObjectId or string
    type PopulatedUser = { _id: any; firstName?: string; lastName?: string; email?: string };
    
    let senderUserId: string;
    let senderName = '';
    if (senderAccount.userId && typeof senderAccount.userId === 'object' && '_id' in senderAccount.userId) {
      // Populated user object
      const populatedUser = senderAccount.userId as PopulatedUser;
      senderUserId = populatedUser._id?.toString() || userId;
      senderName = `${populatedUser.firstName || ''} ${populatedUser.lastName || ''}`.trim();
    } else {
      // Not populated - it's an ObjectId or string
      senderUserId = typeof senderAccount.userId === 'string' 
        ? senderAccount.userId 
        : senderAccount.userId?.toString() || userId;
    }
    
    let recipientUserId: string;
    let recipientName = '';
    if (recipientAccount.userId && typeof recipientAccount.userId === 'object' && '_id' in recipientAccount.userId) {
      // Populated user object
      const populatedUser = recipientAccount.userId as PopulatedUser;
      recipientUserId = populatedUser._id?.toString() || '';
      recipientName = `${populatedUser.firstName || ''} ${populatedUser.lastName || ''}`.trim();
    } else {
      // Not populated - it's an ObjectId or string
      recipientUserId = typeof recipientAccount.userId === 'string' 
        ? recipientAccount.userId 
        : recipientAccount.userId?.toString() || '';
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
        description: dto.description || `Transfer to ${recipientAccount.accountNumber}`,
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
        description: dto.description || `Transfer from ${senderAccount.accountNumber}`,
        recipientAccountId: senderAccountId,
        recipientAccountNumber: senderAccount.accountNumber,
        recipientName: senderName,
      });

      // Update balances
      const newSenderBalance = DecimalUtil.subtract(senderAccount.balance, amount);
      await this.bankAccountModel.findByIdAndUpdate(senderAccountId, { balance: newSenderBalance });

      const newRecipientBalance = DecimalUtil.add(recipientAccount.balance, amount);
      await this.bankAccountModel.findByIdAndUpdate(recipientAccountId, { balance: newRecipientBalance });

      // Audit log
      await this.auditService.log({
        action: AuditAction.TRANSFER_APPROVED,
        entityType: 'Transaction',
        entityId: debitTransaction._id.toString(),
        userId: userId,
        details: JSON.stringify({
          transactionId,
          amount: dto.amount,
          fromAccount: senderAccount.accountNumber,
          toAccount: recipientAccount.accountNumber,
        }),
      });

      return {
        transaction: debitTransaction.toObject(),
        recipientTransaction: creditTransaction.toObject(),
      };
    } catch (error) {
      this.logger.error(`Internal transfer failed: ${error.message}`, error.stack);
      // Re-throw BadRequestException and NotFoundException as-is
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }
      // For other errors, throw a generic error
      throw new BadRequestException(`Transfer failed: ${error.message || 'Internal server error'}`);
    }
  }

  async getUserTransactions(userId: string, accountId?: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const query: any = { userId };
    if (accountId) {
      query.accountId = accountId;
    }

    const [transactions, total] = await Promise.all([
      this.transactionModel
        .find(query)
        .populate('accountId', 'accountNumber type')
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 })
        .lean(),
      this.transactionModel.countDocuments(query),
    ]);

    return {
      data: transactions,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getAllTransactions(page = 1, limit = 20, accountId?: string) {
    const skip = (page - 1) * limit;
    const query: any = {};
    if (accountId) {
      query.accountId = accountId;
    }

    const [transactions, total] = await Promise.all([
      this.transactionModel
        .find(query)
        .populate('userId', 'email firstName lastName')
        .populate('accountId', 'accountNumber type')
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 })
        .lean(),
      this.transactionModel.countDocuments(query),
    ]);

    return {
      data: transactions,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getTransactionById(transactionId: string, userId?: string) {
    const query: any = { transactionId };
    if (userId) {
      query.userId = userId;
    }

    const transaction = await this.transactionModel
      .findOne(query)
      .populate('userId', 'email firstName lastName')
      .populate('accountId', 'accountNumber type')
      .lean();

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    return transaction;
  }
}
