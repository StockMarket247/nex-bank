# Migration from Prisma to Mongoose

This document outlines the migration from Prisma to Mongoose for the GBH Banking Platform backend.

## Status: In Progress

### Completed:
- ✅ Created Mongoose schemas for all models
- ✅ Updated package.json dependencies
- ✅ Created DatabaseModule
- ✅ Updated UsersModule and UsersService

### Remaining Tasks:
- [ ] Update AuthService
- [ ] Update AccountsModule and AccountsService
- [ ] Update TransactionsModule and TransactionsService
- [ ] Update TransfersModule and TransfersService
- [ ] Update AdminModule and AdminService
- [ ] Update AuditModule and AuditService
- [ ] Update seed script
- [ ] Remove Prisma files

## Key Changes:

1. **Prisma → Mongoose Models**: All `@prisma/client` imports replaced with Mongoose schemas
2. **PrismaService → InjectModel**: Services now use `@InjectModel()` decorator
3. **Query Syntax**: Prisma queries converted to Mongoose queries
4. **Type Imports**: Enums now imported from schema files instead of `@prisma/client`

## Installation:

```bash
npm install @nestjs/mongoose mongoose
npm uninstall @prisma/client prisma
```

## Next Steps:

1. Complete service migrations
2. Update all DTOs to remove Prisma type imports
3. Test all endpoints
4. Update seed script
5. Remove Prisma directory

