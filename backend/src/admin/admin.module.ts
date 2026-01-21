import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { User, UserSchema } from '../database/schemas/user.schema';
import { BankAccount, BankAccountSchema } from '../database/schemas/bank-account.schema';
import { Transaction, TransactionSchema } from '../database/schemas/transaction.schema';
import { TransferRequest, TransferRequestSchema } from '../database/schemas/transfer-request.schema';
import { Admin, AdminSchema } from '../database/schemas/admin.schema';
import { VerificationDocument, VerificationDocumentSchema } from '../database/schemas/verification-document.schema';
import { AccountsModule } from '../accounts/accounts.module';
import { AuditModule } from '../audit/audit.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: BankAccount.name, schema: BankAccountSchema },
      { name: Transaction.name, schema: TransactionSchema },
      { name: TransferRequest.name, schema: TransferRequestSchema },
      { name: Admin.name, schema: AdminSchema },
      { name: VerificationDocument.name, schema: VerificationDocumentSchema },
    ]),
    AccountsModule,
    AuditModule,
    UsersModule,
  ],
  controllers: [AdminController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}

