import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AccountsService } from './accounts.service';
import { AccountsController } from './accounts.controller';
import { BankAccount, BankAccountSchema } from '../database/schemas/bank-account.schema';
import { User, UserSchema } from '../database/schemas/user.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: BankAccount.name, schema: BankAccountSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [AccountsController],
  providers: [AccountsService],
  exports: [AccountsService],
})
export class AccountsModule {}

