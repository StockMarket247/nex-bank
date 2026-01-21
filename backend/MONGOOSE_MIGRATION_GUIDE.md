# Complete Migration Guide: Prisma → Mongoose

## Overview
This guide helps complete the migration from Prisma to Mongoose for all services.

## Pattern for Service Migration

### 1. Update Module (e.g., `accounts.module.ts`)
```typescript
// BEFORE (Prisma)
import { PrismaModule } from '../prisma/prisma.module';
@Module({
  imports: [PrismaModule],
  ...
})

// AFTER (Mongoose)
import { MongooseModule } from '@nestjs/mongoose';
import { BankAccount, BankAccountSchema } from '../database/schemas/bank-account.schema';
@Module({
  imports: [MongooseModule.forFeature([{ name: BankAccount.name, schema: BankAccountSchema }])],
  ...
})
```

### 2. Update Service (e.g., `accounts.service.ts`)
```typescript
// BEFORE (Prisma)
import { PrismaService } from '../prisma/prisma.service';
constructor(private prisma: PrismaService) {}
const account = await this.prisma.bankAccount.findUnique({ where: { id } });

// AFTER (Mongoose)
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BankAccount, BankAccountDocument } from '../database/schemas/bank-account.schema';
constructor(@InjectModel(BankAccount.name) private bankAccountModel: Model<BankAccountDocument>) {}
const account = await this.bankAccountModel.findById(id).lean();
```

### 3. Common Query Conversions

| Prisma | Mongoose |
|--------|----------|
| `findUnique({ where: { id } })` | `findById(id)` |
| `findUnique({ where: { email } })` | `findOne({ email })` |
| `findMany({ where, skip, take, orderBy })` | `find(query).skip(skip).limit(limit).sort({ field: -1 })` |
| `create({ data })` | `create(data)` or `new Model(data).save()` |
| `update({ where: { id }, data })` | `findByIdAndUpdate(id, data, { new: true })` |
| `delete({ where: { id } })` | `findByIdAndDelete(id)` |
| `count({ where })` | `countDocuments(query)` |
| `$transaction([...])` | Use Mongoose sessions |

### 4. Type Imports
```typescript
// BEFORE
import { AccountType, UserStatus } from '@prisma/client';

// AFTER
import { AccountType } from '../database/schemas/bank-account.schema';
import { UserStatus } from '../database/schemas/user.schema';
```

## Files That Need Migration

### ✅ Completed:
- UsersModule & UsersService
- DatabaseModule created
- All schemas created

### ⏳ Remaining:
1. **AuthService** - Update all Prisma queries to Mongoose
2. **AccountsModule & AccountsService** - Convert all queries
3. **TransactionsModule & TransactionsService** - Convert queries, handle transactions
4. **TransfersModule & TransfersService** - Convert queries, handle transactions
5. **AdminModule & AdminService** - Convert queries
6. **AuditModule & AuditService** - Convert queries
7. **JwtStrategy** - Update validate methods
8. **DTOs** - Remove `@prisma/client` imports
9. **Seed script** - Convert to Mongoose

## Transaction Handling

Mongoose uses sessions for transactions:
```typescript
const session = await this.connection.startSession();
session.startTransaction();
try {
  await model1.create([data1], { session });
  await model2.create([data2], { session });
  await session.commitTransaction();
} catch (error) {
  await session.abortTransaction();
  throw error;
} finally {
  session.endSession();
}
```

## Next Steps

1. Install dependencies: `npm install @nestjs/mongoose mongoose`
2. Remove Prisma: `npm uninstall @prisma/client prisma`
3. Complete remaining service migrations following the pattern above
4. Update seed script
5. Test all endpoints
6. Remove `backend/prisma/` directory
7. Remove `backend/src/prisma/` directory

