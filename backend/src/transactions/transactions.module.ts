import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TransactionsService } from './transactions.service';
import { TransactionsController } from './transactions.controller';
import { Transaction, TransactionSchema } from '../database/schemas/transaction.schema';
import { BankAccount, BankAccountSchema } from '../database/schemas/bank-account.schema';
import { User, UserSchema } from '../database/schemas/user.schema';
import { AccountsModule } from '../accounts/accounts.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Transaction.name, schema: TransactionSchema },
      { name: BankAccount.name, schema: BankAccountSchema },
      { name: User.name, schema: UserSchema },
    ]),
    AccountsModule,
    AuditModule,
  ],
  controllers: [TransactionsController],
  providers: [TransactionsService],
  exports: [TransactionsService],
})
export class TransactionsModule {}

