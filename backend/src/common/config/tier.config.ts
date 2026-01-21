import { AccountTier } from '../../database/schemas/user.schema';

export interface TierLimits {
  maxLodgeAmount: number; // Maximum deposit amount per transaction
  maxTransferLimit: number; // Maximum transfer amount per transaction
  dailyTransferLimit?: number; // Optional daily transfer limit
  maxAccountBalance?: number | null; // Maximum account balance (null = unlimited)
}

export const TIER_LIMITS: Record<AccountTier, TierLimits> = {
  [AccountTier.TIER_1]: {
    maxLodgeAmount: 1000, // $1,000
    maxTransferLimit: 500, // $500
    dailyTransferLimit: 2000, // $2,000 per day
    maxAccountBalance: 5000, // $5,000
  },
  [AccountTier.TIER_2]: {
    maxLodgeAmount: 10000, // $10,000
    maxTransferLimit: 5000, // $5,000
    dailyTransferLimit: 20000, // $20,000 per day
    maxAccountBalance: 50000, // $50,000
  },
  [AccountTier.TIER_3]: {
    maxLodgeAmount: 100000, // $100,000
    maxTransferLimit: 50000, // $50,000
    dailyTransferLimit: 200000, // $200,000 per day
    maxAccountBalance: null, // Unlimited
  },
};

export const TIER_REQUIREMENTS = {
  [AccountTier.TIER_1]: {
    kycRequired: false,
    addressVerificationRequired: false,
    description: 'Basic tier - No additional verification required',
  },
  [AccountTier.TIER_2]: {
    kycRequired: true,
    addressVerificationRequired: false,
    description: 'Enhanced tier - KYC verification required',
  },
  [AccountTier.TIER_3]: {
    kycRequired: true,
    addressVerificationRequired: true,
    description: 'Premium tier - KYC and address verification required',
  },
};

