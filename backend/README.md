# GBH Banking Platform - Backend

Global Bank Hub (GBH) Banking Platform Backend API built with NestJS, TypeScript, MongoDB, and Prisma.

## Features

- 🔐 JWT Authentication with Refresh Tokens
- 👥 User Management & KYC Status
- 🏦 Bank Account Management (Multiple accounts per user)
- 💸 Internal Transfers (GBH → GBH)
- 🌐 External Transfers (GBH → Other Banks) with Admin Approval
- 👨‍💼 Admin System with Role-Based Access Control
- 📊 Audit Logging
- 🔒 Security Features (Rate Limiting, Input Validation)
- 📚 Swagger API Documentation

## Tech Stack

- **Framework**: NestJS
- **Language**: TypeScript
- **Database**: MongoDB
- **ORM**: Mongoose
- **Authentication**: JWT + Passport
- **Documentation**: Swagger/OpenAPI

## Prerequisites

- Node.js 20+
- MongoDB (local or remote)
- npm or yarn

## Installation

1. Clone the repository and navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env` with your configuration:
```env
DATABASE_URL="mongodb://localhost:27017/gbh_banking?retryWrites=true&w=majority"
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-in-production
FRONTEND_URL=http://localhost:8080
```

4. Seed the database (creates default admin users):
```bash
npm run seed
```

Note: MongoDB doesn't require migrations like SQL databases. Collections are created automatically when you insert data.

## Running the Application

### Development Mode
```bash
npm run start:dev
```

The API will be available at `http://localhost:3000`
API Documentation: `http://localhost:3000/api/docs`

### Production Mode
```bash
npm run build
npm run start:prod
```

## Docker Setup

### Using Docker Compose (Recommended)

1. Make sure you have Docker and Docker Compose installed

2. Start all services:
```bash
docker-compose up -d
```

3. Seed the database:
```bash
docker-compose exec backend npm run seed
```

4. Access the API at `http://localhost:3000`

### Using Docker Only

```bash
docker build -t gbh-backend .
docker run -p 3000:3000 --env-file .env gbh-backend
```

## Default Admin Credentials

After seeding, you can login with:

- **Super Admin**: admin@gbh.com / Admin@123
- **Admin**: admin2@gbh.com / Admin@123
- **Auditor**: auditor@gbh.com / Admin@123

⚠️ **Change these passwords in production!**

## API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/admin/login` - Admin login
- `POST /api/v1/auth/refresh` - Refresh access token

### Users
- `GET /api/v1/users/me` - Get current user profile
- `PUT /api/v1/users/me` - Update profile
- `GET /api/v1/users` - Get all users (Admin)
- `GET /api/v1/users/:id` - Get user by ID (Admin)

### Accounts
- `POST /api/v1/accounts` - Create bank account
- `GET /api/v1/accounts/me` - Get user accounts
- `GET /api/v1/accounts/:id` - Get account by ID
- `PUT /api/v1/accounts/:id/freeze` - Freeze/unfreeze account (Admin)

### Transactions
- `POST /api/v1/transactions/internal-transfer` - Create internal transfer
- `GET /api/v1/transactions/me` - Get user transactions
- `GET /api/v1/transactions/:id` - Get transaction by ID

### Transfers
- `POST /api/v1/transfers/external` - Create external transfer request
- `GET /api/v1/transfers/me` - Get user transfer requests
- `GET /api/v1/transfers/pending` - Get pending transfers (Admin)
- `PUT /api/v1/transfers/:requestId/approve` - Approve transfer (Admin)
- `PUT /api/v1/transfers/:requestId/reject` - Reject transfer (Admin)

### Admin
- `GET /api/v1/admin/dashboard` - Get dashboard stats
- `PUT /api/v1/admin/users/:userId/suspend` - Suspend/unsuspend user
- `PUT /api/v1/admin/users/:userId/close` - Close user account
- `PUT /api/v1/admin/accounts/:accountId/adjust-balance` - Adjust balance

### Audit
- `GET /api/v1/audit` - Get audit logs (Admin/Auditor)
- `GET /api/v1/audit/entity/:entityType/:entityId` - Get entity audit logs

## Database Schema

The application uses MongoDB with Mongoose ODM. Key models:

- **User**: User accounts with KYC status
- **BankAccount**: Bank accounts with balance tracking
- **Transaction**: Transaction records (ledger-based)
- **TransferRequest**: External transfer requests
- **Admin**: Admin users with roles
- **AuditLog**: Immutable audit trail

Schemas are defined in `src/database/schemas/` directory.

## Security Features

- Password hashing with bcrypt
- JWT authentication with refresh tokens
- Role-based access control (RBAC)
- Rate limiting on auth endpoints
- Input validation with class-validator
- CORS configuration
- Audit logging for admin actions

## Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

## Project Structure

```
backend/
├── src/
│   ├── auth/          # Authentication module
│   ├── users/         # User management
│   ├── accounts/      # Bank account management
│   ├── transactions/  # Transaction operations
│   ├── transfers/     # External transfer requests
│   ├── admin/         # Admin operations
│   ├── audit/         # Audit logging
│   ├── database/     # Database module & schemas
│   │   ├── schemas/   # Mongoose schemas
│   │   └── seed.ts    # Seed script
│   ├── common/        # Common utilities
│   ├── app.module.ts  # Root module
│   └── main.ts        # Application entry point
├── .env.example       # Environment variables template
├── Dockerfile         # Docker configuration
└── docker-compose.yml # Docker Compose configuration
```

## License

Proprietary - GBH Banking Platform

