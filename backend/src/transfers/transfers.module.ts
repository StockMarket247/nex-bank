import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TransfersService } from './transfers.service';
import { TransfersController } from './transfers.controller';
import { TransferRequest, TransferRequestSchema } from '../database/schemas/transfer-request.schema';
import { Transaction, TransactionSchema } from '../database/schemas/transaction.schema';
import { BankAccount, BankAccountSchema } from '../database/schemas/bank-account.schema';
import { User, UserSchema } from '../database/schemas/user.schema';
import { AccountsModule } from '../accounts/accounts.module';
import { TransactionsModule } from '../transactions/transactions.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: TransferRequest.name, schema: TransferRequestSchema },
      { name: Transaction.name, schema: TransactionSchema },
      { name: BankAccount.name, schema: BankAccountSchema },
      { name: User.name, schema: UserSchema },
    ]),
    AccountsModule,
    TransactionsModule,
    AuditModule,
  ],
  controllers: [TransfersController],
  providers: [TransfersService],
  exports: [TransfersService],
})
export class TransfersModule {}

