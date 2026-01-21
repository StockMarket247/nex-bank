import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BankAccount, BankAccountDocument, AccountType } from '../database/schemas/bank-account.schema';
import { User, UserDocument } from '../database/schemas/user.schema';
import { CreateAccountDto, FreezeAccountDto } from './dto';
import { DecimalUtil } from '../common/utils/decimal.util';

@Injectable()
export class AccountsService {
  constructor(
    @InjectModel(BankAccount.name) private bankAccountModel: Model<BankAccountDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  generateAccountNumber(): string {
    return Math.floor(1000000000 + Math.random() * 9000000000).toString();
  }

  async createAccount(userId: string, dto: CreateAccountDto) {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.status === 'CLOSED' || user.status === 'SUSPENDED') {
      throw new BadRequestException('Cannot create account for closed or suspended user');
    }

    // Generate unique account number
    let accountNumber: string;
    let exists = true;
    while (exists) {
      accountNumber = this.generateAccountNumber();
      const existing = await this.bankAccountModel.findOne({ accountNumber });
      if (!existing) {
        exists = false;
      }
    }

    const account = await this.bankAccountModel.create({
      accountNumber,
      userId,
      type: dto.type,
      currency: dto.currency || 'USD',
      balance: dto.initialBalance ? DecimalUtil.fromNumber(dto.initialBalance) : '0.00',
    });

    await account.populate('userId', 'email firstName lastName');
    return account.toObject();
  }

  async getUserAccounts(userId: string) {
    return this.bankAccountModel.find({ userId }).sort({ createdAt: -1 }).lean();
  }

  async getAccountById(accountId: string, userId?: string) {
    const query: any = { _id: accountId };
    if (userId) {
      query.userId = userId;
    }

    const account = await this.bankAccountModel.findOne(query).populate('userId', 'email firstName lastName').lean();
    if (!account) {
      throw new NotFoundException('Account not found');
    }
    return account;
  }

  async getAccountByNumber(accountNumber: string) {
    const account = await this.bankAccountModel
      .findOne({ accountNumber })
      .populate('userId', 'email firstName lastName')
      .lean();
    if (!account) {
      throw new NotFoundException('Account not found');
    }
    return account;
  }

  async freezeAccount(accountId: string, dto: FreezeAccountDto) {
    const account = await this.bankAccountModel.findById(accountId);
    if (!account) {
      throw new NotFoundException('Account not found');
    }

    if (account.isFrozen === dto.isFrozen) {
      throw new BadRequestException(`Account is already ${dto.isFrozen ? 'frozen' : 'unfrozen'}`);
    }

    account.isFrozen = dto.isFrozen;
    return account.save();
  }

  async getAllAccounts(page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const [accounts, total] = await Promise.all([
      this.bankAccountModel
        .find()
        .populate('userId', 'email firstName lastName')
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 })
        .lean(),
      this.bankAccountModel.countDocuments(),
    ]);

    return {
      data: accounts,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
