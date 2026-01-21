# GBH (Global Bank Hub) Banking Platform

A secure, scalable banking platform built with NestJS backend and React frontend.

## 🏗️ Architecture

- **Backend**: NestJS + TypeScript + MongoDB + Prisma
- **Frontend**: React + TypeScript + Vite + shadcn-ui
- **Authentication**: JWT with Refresh Tokens
- **Database**: MongoDB
- **ORM**: Prisma

## 📁 Project Structure

```
global-bank-hub/
├── backend/          # NestJS backend API
│   ├── src/
│   │   ├── auth/     # Authentication module
│   │   ├── users/    # User management
│   │   ├── accounts/ # Bank account management
│   │   ├── transactions/ # Transaction operations
│   │   ├── transfers/ # External transfer requests
│   │   ├── admin/    # Admin operations
│   │   └── audit/    # Audit logging
│   └── prisma/       # Database schema & migrations
│
└── frontend/         # React frontend
    ├── src/
    │   ├── pages/
    │   │   ├── admin/ # Admin dashboard pages
    │   │   └── client/ # User dashboard pages
    │   ├── lib/
    │   │   └── api.ts # API service layer
    │   └── contexts/  # React contexts
```

## 🚀 Quick Start

### Prerequisites

- Node.js 20+
- MongoDB (local or remote)
- npm or yarn

### Backend Setup

1. Navigate to backend directory:
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
PORT=3000
```

4. Generate Prisma Client:
```bash
npm run prisma:generate
```

5. Run database migrations:
```bash
npm run prisma:migrate
```

6. Seed the database:
```bash
npm run prisma:seed
```

7. Start the backend:
```bash
npm run start:dev
```

Backend will be available at `http://localhost:3000`
API Documentation: `http://localhost:3000/api/docs`

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file:
```env
VITE_API_URL=http://localhost:3000/api/v1
```

4. Start the frontend:
```bash
npm run dev
```

Frontend will be available at `http://localhost:8080`

## 🐳 Docker Setup

### Using Docker Compose

1. Navigate to backend directory:
```bash
cd backend
```

2. Start all services:
```bash
docker-compose up -d
```

3. Run migrations and seed:
```bash
docker-compose exec backend npm run prisma:migrate
docker-compose exec backend npm run prisma:seed
```

## 🔐 Default Admin Credentials

After seeding, you can login with:

- **Super Admin**: admin@gbh.com / Admin@123
- **Admin**: admin2@gbh.com / Admin@123
- **Auditor**: auditor@gbh.com / Admin@123

⚠️ **Change these passwords in production!**

## ✨ Features

### User Features
- User registration & KYC status
- Login / logout with JWT
- Profile management
- Multiple bank accounts (SAVINGS, CURRENT)
- Internal transfers (GBH → GBH)
- External transfer requests
- Transaction history

### Admin Features
- Dashboard with KPIs
- Approve/reject external transfers
- User management (suspend, close accounts)
- Account management (freeze, adjust balance)
- Transaction explorer
- Audit logs
- Role-based access control (SUPER_ADMIN, ADMIN, AUDITOR)

## 🔒 Security Features

- Password hashing with bcrypt
- JWT authentication with refresh tokens
- Role-based access control
- Rate limiting on auth endpoints
- Input validation
- CORS configuration
- Audit logging for all admin actions
- Ledger-based balance tracking (no floating math errors)

## 📚 API Documentation

Once the backend is running, visit:
- Swagger UI: `http://localhost:3000/api/docs`

## 🧪 Testing

### Backend Tests
```bash
cd backend
npm run test
npm run test:e2e
```

## 📝 Key Endpoints

### Authentication
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/admin/login` - Admin login
- `POST /api/v1/auth/refresh` - Refresh access token

### Accounts
- `POST /api/v1/accounts` - Create bank account
- `GET /api/v1/accounts/me` - Get user accounts
- `PUT /api/v1/accounts/:id/freeze` - Freeze/unfreeze (Admin)

### Transactions
- `POST /api/v1/transactions/internal-transfer` - Internal transfer
- `GET /api/v1/transactions/me` - Get user transactions

### Transfers
- `POST /api/v1/transfers/external` - Create external transfer request
- `GET /api/v1/transfers/pending` - Get pending transfers (Admin)
- `PUT /api/v1/transfers/:requestId/approve` - Approve transfer (Admin)
- `PUT /api/v1/transfers/:requestId/reject` - Reject transfer (Admin)

### Admin
- `GET /api/v1/admin/dashboard` - Dashboard stats
- `PUT /api/v1/admin/users/:userId/suspend` - Suspend user
- `PUT /api/v1/admin/accounts/:accountId/adjust-balance` - Adjust balance

## 🛠️ Development

### Backend Development
```bash
cd backend
npm run start:dev  # Watch mode
npm run build      # Build for production
```

### Frontend Development
```bash
cd frontend
npm run dev        # Development server
npm run build      # Build for production
```

## 📄 License

Proprietary - GBH Banking Platform

## 🤝 Contributing

This is a private banking platform. For questions or issues, please contact the development team.
