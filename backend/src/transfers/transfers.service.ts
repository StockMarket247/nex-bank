import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { TransferRequest, TransferRequestDocument, TransferRequestStatus } from '../database/schemas/transfer-request.schema';
import { Transaction, TransactionDocument, TransactionType, TransactionStatus } from '../database/schemas/transaction.schema';
import { BankAccount, BankAccountDocument } from '../database/schemas/bank-account.schema';
import { User, UserDocument } from '../database/schemas/user.schema';
import { AccountsService } from '../accounts/accounts.service';
import { TransactionsService } from '../transactions/transactions.service';
import { AuditService } from '../audit/audit.service';
import { AuditAction } from '../database/schemas/audit-log.schema';
import { CreateExternalTransferDto, CreateInternationalTransferDto, ApproveTransferDto, RejectTransferDto } from './dto';
import { DecimalUtil } from '../common/utils/decimal.util';
import { TIER_LIMITS } from '../common/config/tier.config';

@Injectable()
export class TransfersService {
  private readonly logger = new Logger(TransfersService.name);

  constructor(
    @InjectModel(TransferRequest.name) private transferRequestModel: Model<TransferRequestDocument>,
    @InjectModel(Transaction.name) private transactionModel: Model<TransactionDocument>,
    @InjectModel(BankAccount.name) private bankAccountModel: Model<BankAccountDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private accountsService: AccountsService,
    private transactionsService: TransactionsService,
    private auditService: AuditService,
  ) {}

  generateRequestId(): string {
    return `EXT${Date.now()}${Math.floor(Math.random() * 10000)}`;
  }

  generateInternationalRequestId(): string {
    return `INT${Date.now()}${Math.floor(Math.random() * 10000)}`;
  }

  async createExternalTransfer(userId: string, dto: CreateExternalTransferDto) {
    const account = await this.accountsService.getAccountById(dto.accountId, userId);
    if (!account) {
      throw new NotFoundException('Account not found');
    }
    if (account.isFrozen) {
      throw new BadRequestException('Account is frozen');
    }

    const amount = DecimalUtil.fromNumber(dto.amount);
    if (DecimalUtil.lte(amount, '0')) {
      throw new BadRequestException('Amount must be greater than zero');
    }
    if (DecimalUtil.lt(account.balance, amount)) {
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

    const requestId = this.generateRequestId();
    const transactionId = `TXN${Date.now()}${Math.floor(Math.random() * 10000)}`;
    const accountId = typeof account._id === 'string' ? account._id : account._id.toString();

    try {
      const transferRequest = await this.transferRequestModel.create({
        requestId,
        userId,
        accountId,
        amount,
        currency: account.currency,
        recipientBankName: dto.recipientBankName,
        recipientBankCode: dto.recipientBankCode || '',
        recipientAccountNumber: dto.recipientAccountNumber,
        recipientName: dto.recipientName,
        recipientEmail: dto.recipientEmail,
        recipientPhone: dto.recipientPhone,
        reference: dto.reference,
        description: dto.description,
        status: TransferRequestStatus.PENDING_ADMIN_APPROVAL,
      });

      const transaction = await this.transactionModel.create({
        transactionId,
        userId,
        accountId,
        type: TransactionType.EXTERNAL_TRANSFER,
        status: TransactionStatus.PENDING,
        amount: DecimalUtil.negate(amount),
        currency: account.currency,
        reference: dto.reference,
        description: dto.description || `External transfer to ${dto.recipientBankName}`,
        recipientAccountNumber: dto.recipientAccountNumber,
        recipientName: dto.recipientName,
        transferRequestId: transferRequest._id,
      });

      const newBalance = DecimalUtil.subtract(account.balance, amount);
      await this.bankAccountModel.findByIdAndUpdate(accountId, { balance: newBalance });

      await this.auditService.log({
        action: AuditAction.TRANSFER_APPROVED,
        entityType: 'TransferRequest',
        entityId: transferRequest._id.toString(),
        userId: userId,
        details: JSON.stringify({
          requestId,
          amount: dto.amount,
          recipientBank: dto.recipientBankName,
        }),
      });

      return transferRequest.toObject();
    } catch (error) {
      this.logger.error(`External transfer failed: ${error.message}`, error.stack);
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(`Transfer failed: ${error.message || 'Internal server error'}`);
    }
  }

  async createInternationalTransfer(userId: string, dto: CreateInternationalTransferDto) {
    const account = await this.accountsService.getAccountById(dto.accountId, userId);
    if (!account) {
      throw new NotFoundException('Account not found');
    }
    if (account.isFrozen) {
      throw new BadRequestException('Account is frozen');
    }

    const amount = DecimalUtil.fromNumber(dto.amount);
    if (DecimalUtil.lte(amount, '0')) {
      throw new BadRequestException('Amount must be greater than zero');
    }
    if (DecimalUtil.lt(account.balance, amount)) {
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

    const requestId = this.generateInternationalRequestId();
    const transactionId = `TXN${Date.now()}${Math.floor(Math.random() * 10000)}`;
    const accountId = typeof account._id === 'string' ? account._id : account._id.toString();

    try {
      const transferRequest = await this.transferRequestModel.create({
        requestId,
        userId,
        accountId,
        amount,
        currency: dto.currency,
        recipientBankName: dto.recipientCountry, // Using country as bank name for international
        recipientBankCode: dto.swiftBicCode || '', // Using SWIFT/BIC as bank code
        recipientAccountNumber: dto.recipientAccountNumber,
        recipientName: dto.recipientName,
        recipientEmail: dto.recipientEmail,
        recipientPhone: dto.recipientPhone,
        reference: dto.reference,
        description: dto.description,
        status: TransferRequestStatus.PENDING_ADMIN_APPROVAL,
      });

      const transaction = await this.transactionModel.create({
        transactionId,
        userId,
        accountId,
        type: TransactionType.INTERNATIONAL_TRANSFER,
        status: TransactionStatus.PENDING,
        amount: DecimalUtil.negate(amount),
        currency: dto.currency,
        reference: dto.reference,
        description: dto.description || `International transfer to ${dto.recipientCountry}`,
        recipientAccountNumber: dto.recipientAccountNumber,
        recipientName: dto.recipientName,
        transferRequestId: transferRequest._id,
      });

      const newBalance = DecimalUtil.subtract(account.balance, amount);
      await this.bankAccountModel.findByIdAndUpdate(accountId, { balance: newBalance });

      await this.auditService.log({
        action: AuditAction.TRANSFER_APPROVED,
        entityType: 'TransferRequest',
        entityId: transferRequest._id.toString(),
        userId: userId,
        details: JSON.stringify({
          requestId,
          amount: dto.amount,
          recipientCountry: dto.recipientCountry,
          currency: dto.currency,
        }),
      });

      return transferRequest.toObject();
    } catch (error) {
      this.logger.error(`International transfer failed: ${error.message}`, error.stack);
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(`Transfer failed: ${error.message || 'Internal server error'}`);
    }
  }

  async approveTransfer(adminId: string, requestId: string, dto: ApproveTransferDto) {
    const transferRequest = await this.transferRequestModel.findOne({ requestId }).populate('accountId userId').lean();
    if (!transferRequest) {
      throw new NotFoundException('Transfer request not found');
    }
    if (transferRequest.status !== TransferRequestStatus.PENDING_ADMIN_APPROVAL) {
      throw new BadRequestException(`Transfer request is already ${transferRequest.status}`);
    }

    try {
      const updatedRequest = await this.transferRequestModel.findByIdAndUpdate(
        transferRequest._id,
        {
          status: TransferRequestStatus.APPROVED,
          approvedBy: adminId,
          approvedAt: new Date(),
        },
        { new: true },
      );

      await this.transactionModel.updateMany({ transferRequestId: transferRequest._id }, { status: TransactionStatus.COMPLETED });

      await this.transferRequestModel.findByIdAndUpdate(transferRequest._id, { status: TransferRequestStatus.COMPLETED });

      await this.auditService.log({
        action: AuditAction.TRANSFER_APPROVED,
        entityType: 'TransferRequest',
        entityId: transferRequest._id.toString(),
        adminId: adminId,
        details: JSON.stringify({
          requestId,
          amount: transferRequest.amount,
          recipientBank: transferRequest.recipientBankName,
        }),
      });

      return updatedRequest.toObject();
    } catch (error) {
      this.logger.error(`Approve transfer failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  async rejectTransfer(adminId: string, requestId: string, dto: RejectTransferDto) {
    const transferRequest = await this.transferRequestModel.findOne({ requestId }).populate('accountId').lean();
    if (!transferRequest) {
      throw new NotFoundException('Transfer request not found');
    }
    if (transferRequest.status !== TransferRequestStatus.PENDING_ADMIN_APPROVAL) {
      throw new BadRequestException(`Transfer request is already ${transferRequest.status}`);
    }

    try {
      const updatedRequest = await this.transferRequestModel.findByIdAndUpdate(
        transferRequest._id,
        {
          status: TransferRequestStatus.REJECTED,
          approvedBy: adminId,
          approvedAt: new Date(),
          rejectionReason: dto.reason,
        },
        { new: true },
      );

      await this.transactionModel.updateMany({ transferRequestId: transferRequest._id }, { status: TransactionStatus.CANCELLED });

      const account = await this.bankAccountModel.findById(transferRequest.accountId).lean();
      if (account) {
        const newBalance = DecimalUtil.add(account.balance, transferRequest.amount);
        await this.bankAccountModel.findByIdAndUpdate(transferRequest.accountId, { balance: newBalance });
      }

      await this.auditService.log({
        action: AuditAction.TRANSFER_REJECTED,
        entityType: 'TransferRequest',
        entityId: transferRequest._id.toString(),
        adminId: adminId,
        details: JSON.stringify({
          requestId,
          reason: dto.reason,
          amount: transferRequest.amount,
        }),
      });

      return updatedRequest.toObject();
    } catch (error) {
      this.logger.error(`Reject transfer failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getUserTransferRequests(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [requests, total] = await Promise.all([
      this.transferRequestModel
        .find({ userId })
        .populate('accountId', 'accountNumber type')
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 })
        .lean(),
      this.transferRequestModel.countDocuments({ userId }),
    ]);

    return {
      data: requests,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getPendingTransferRequests(page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [requests, total] = await Promise.all([
      this.transferRequestModel
        .find({ status: TransferRequestStatus.PENDING_ADMIN_APPROVAL })
        .populate('userId', 'email firstName lastName')
        .populate('accountId', 'accountNumber type')
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: 1 })
        .lean(),
      this.transferRequestModel.countDocuments({ status: TransferRequestStatus.PENDING_ADMIN_APPROVAL }),
    ]);

    return {
      data: requests,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getAllTransferRequests(page = 1, limit = 20, status?: TransferRequestStatus) {
    const skip = (page - 1) * limit;
    const query: any = {};
    if (status) {
      query.status = status;
    }

    const [requests, total] = await Promise.all([
      this.transferRequestModel
        .find(query)
        .populate('userId', 'email firstName lastName')
        .populate('accountId', 'accountNumber type')
        .populate('approvedBy', 'email firstName lastName')
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 })
        .lean(),
      this.transferRequestModel.countDocuments(query),
    ]);

    return {
      data: requests,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getTransferRequestById(requestId: string): Promise<any> {
    const transferRequest = await this.transferRequestModel
      .findOne({ requestId })
      .populate('userId', 'email firstName lastName')
      .populate('accountId', 'accountNumber type')
      .populate('approvedBy', 'email firstName lastName')
      .lean();

    if (!transferRequest) {
      throw new NotFoundException('Transfer request not found');
    }

    const transactions = await this.transactionModel.find({ transferRequestId: transferRequest._id }).lean();
    return { ...transferRequest, transactions };
  }
}
