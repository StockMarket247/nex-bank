# Quick Fix Guide for Remaining Services

Due to the large number of files, here's what needs to be updated:

## Files Still Using Prisma:

1. **Transfers Module & Service** - Convert to Mongoose with sessions
2. **Admin Module & Service** - Convert to Mongoose  
3. **Audit Module & Service** - Convert to Mongoose
4. **Remove PrismaService** - Delete `src/prisma/prisma.service.ts` and `src/prisma/prisma.module.ts`

## Pattern to Follow:

All services follow the same pattern as TransactionsService:
- Use `@InjectModel()` for models
- Use `@InjectConnection()` for transactions
- Replace Prisma queries with Mongoose queries
- Use sessions for transactions

## Quick Commands:

After updating all services:
```bash
# Remove Prisma files
rm -rf backend/src/prisma
rm -rf backend/prisma

# Install Mongoose
cd backend
npm install @nestjs/mongoose mongoose

# Build
npm run build
```

