import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import UpgradeTier2Modal from '@/components/tier/UpgradeTier2Modal';
import UpgradeTier3Modal from '@/components/tier/UpgradeTier3Modal';
import {
  Wallet,
  Copy,
  CheckCircle,
  XCircle,
  ArrowUp,
  AlertCircle,
  Loader2,
  ChevronRight,
} from 'lucide-react';

interface TierInfo {
  currentTier: string;
  nextTier: string | null;
  canUpgrade: boolean;
  missingRequirements: string[];
  requirements: {
    kycRequired: boolean;
    addressVerificationRequired: boolean;
    description: string;
  } | null;
}

interface Account {
  _id: string;
  accountNumber: string;
  type: string;
  balance: string;
  currency: string;
  isFrozen: boolean;
}

const TIER_LIMITS = {
  TIER_1: {
    name: 'Tier 1',
    maxLodgeAmount: 1000,
    maxTransferLimit: 500,
    dailyTransferLimit: 2000,
    maxAccountBalance: 5000,
    description: 'Basic tier - No additional verification required',
  },
  TIER_2: {
    name: 'Tier 2',
    maxLodgeAmount: 10000,
    maxTransferLimit: 5000,
    dailyTransferLimit: 20000,
    maxAccountBalance: 50000,
    description: 'Enhanced tier - KYC verification required',
  },
  TIER_3: {
    name: 'Tier 3',
    maxLodgeAmount: 100000,
    maxTransferLimit: 50000,
    dailyTransferLimit: 200000,
    maxAccountBalance: null, // Unlimited
    description: 'Premium tier - KYC and address verification required',
  },
};

export default function AccountLimits() {
  const { t } = useTranslation('dashboard');
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();
  const [tierInfo, setTierInfo] = useState<TierInfo | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null);
  const [tier2ModalOpen, setTier2ModalOpen] = useState(false);
  const [tier3ModalOpen, setTier3ModalOpen] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<any>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setFetching(true);
      const [tierData, accountsData, verificationData] = await Promise.all([
        api.users.getTierInfo(),
        api.accounts.getMyAccounts(),
        api.users.getVerificationStatus().catch(() => null), // Ignore errors if endpoint doesn't exist yet
      ]);
      setTierInfo(tierData);
      setAccounts(accountsData);
      setVerificationStatus(verificationData);
      if (accountsData.length > 0 && !selectedAccount) {
        setSelectedAccount(accountsData[0]._id);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load account information',
        variant: 'destructive',
      });
    } finally {
      setFetching(false);
    }
  };

  const handleCopyAccountNumber = (accountNumber: string) => {
    navigator.clipboard.writeText(accountNumber);
    toast({
      title: 'Copied',
      description: 'Account number copied to clipboard',
    });
  };

  const handleUpgrade = () => {
    if (!tierInfo?.nextTier) return;

    if (tierInfo.nextTier === 'TIER_2') {
      setTier2ModalOpen(true);
    } else if (tierInfo.nextTier === 'TIER_3') {
      setTier3ModalOpen(true);
    }
  };

  const handleUpgradeSuccess = async () => {
    await refreshUser();
    await fetchData();
  };

  const currentTier = tierInfo?.currentTier || user?.accountTier || 'TIER_1';
  const currentTierData = TIER_LIMITS[currentTier as keyof typeof TIER_LIMITS];
  const nextTierData = tierInfo?.nextTier
    ? TIER_LIMITS[tierInfo.nextTier as keyof typeof TIER_LIMITS]
    : null;

  const primaryAccount = accounts.find((acc) => acc._id === selectedAccount) || accounts[0];
  const accountHolderName = user
    ? `${user.firstName} ${user.lastName}`.toUpperCase()
    : 'Loading...';

  return (
    <div className="space-y-6">
      <h1 className="text-4xl font-heading font-bold">Account & Limits</h1>

      {fetching ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
          {/* Account Info */}
          <Card className="glass-card p-6 bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-950/20 dark:to-yellow-900/20">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h2 className="text-sm font-semibold text-muted-foreground mb-4">Account Info</h2>
                {primaryAccount ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <p className="text-3xl font-bold font-mono">{primaryAccount.accountNumber}</p>
                      <button
                        onClick={() => handleCopyAccountNumber(primaryAccount.accountNumber)}
                        className="p-2 hover:bg-white/50 dark:hover:bg-black/20 rounded-lg transition-colors"
                        title="Copy account number"
                      >
                        <Copy className="h-4 w-4 text-muted-foreground" />
                      </button>
                    </div>
                    <p className="text-lg font-medium text-muted-foreground">{accountHolderName}</p>
                  </div>
                ) : (
                  <p className="text-muted-foreground">No account found</p>
                )}
              </div>
              <div className="flex flex-col items-center justify-center bg-gradient-to-br from-yellow-400 to-yellow-500 dark:from-yellow-600 dark:to-yellow-700 rounded-full w-20 h-20 shadow-lg">
                <span className="text-3xl font-bold text-white">
                  {currentTier === 'TIER_1' ? '1' : currentTier === 'TIER_2' ? '2' : '3'}
                </span>
                <span className="text-xs font-semibold text-white">Tier</span>
              </div>
            </div>
          </Card>

          {/* Linked ID */}
          <Card className="glass-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-heading font-semibold mb-1">Linked ID</h2>
                <p className="text-sm text-muted-foreground">BVN & NIN</p>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </div>
          </Card>

          {/* Limit Info */}
          <Card className="glass-card p-6">
            <h2 className="text-lg font-heading font-semibold mb-2">Limit Info</h2>
            <p className="text-muted-foreground">
              The higher your account tier, the higher your transaction limit.
            </p>
          </Card>

          {/* Level Benefit - All Tiers Table */}
          <Card className="glass-card p-6">
            <h2 className="text-lg font-heading font-semibold mb-6">Level Benefit</h2>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tier</TableHead>
                    <TableHead>Daily Transaction Limit</TableHead>
                    <TableHead>Maximum Account Balance</TableHead>
                    <TableHead>Max Transfer Limit</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Object.entries(TIER_LIMITS).map(([tierKey, tierData]) => {
                    const isCurrentTier = tierKey === currentTier;
                    return (
                      <TableRow
                        key={tierKey}
                        className={isCurrentTier ? 'bg-primary/10 dark:bg-primary/20' : ''}
                      >
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">{tierData.name}</span>
                            {isCurrentTier && (
                              <Badge className="bg-green-500 text-white text-xs">Current</Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">
                          ${tierData.dailyTransferLimit.toLocaleString()}
                        </TableCell>
                        <TableCell className="font-medium">
                          {tierData.maxAccountBalance
                            ? `$${tierData.maxAccountBalance.toLocaleString()}`
                            : 'Unlimited'}
                        </TableCell>
                        <TableCell className="font-medium">
                          ${tierData.maxTransferLimit.toLocaleString()}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </Card>

          {/* Tier Upgrade Section */}
          {tierInfo?.nextTier && (
            <Card className="glass-card p-6">
              <div className="flex items-center space-x-3 mb-6">
                <ArrowUp className="h-6 w-6 text-primary" />
                <h2 className="text-2xl font-heading font-semibold">Upgrade to {nextTierData?.name}</h2>
              </div>

              {nextTierData && (
                <div className="space-y-4">
                  <p className="text-muted-foreground">{nextTierData.description}</p>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">Max Deposit Amount</p>
                      <p className="text-2xl font-bold text-primary">
                        ${nextTierData.maxLodgeAmount.toLocaleString()}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">Max Transfer Limit</p>
                      <p className="text-2xl font-bold text-primary">
                        ${nextTierData.maxTransferLimit.toLocaleString()}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">Daily Transfer Limit</p>
                      <p className="text-2xl font-bold text-primary">
                        ${nextTierData.dailyTransferLimit.toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {tierInfo.requirements && (
                    <div className="space-y-2 mb-4">
                      <h4 className="font-semibold">Requirements:</h4>
                      <div className="space-y-2">
                        {tierInfo.requirements.kycRequired && (
                          <div className="flex items-center space-x-2">
                            {user?.kycStatus === 'VERIFIED' ? (
                              <CheckCircle className="h-5 w-5 text-green-500" />
                            ) : (
                              <XCircle className="h-5 w-5 text-red-500" />
                            )}
                            <span>KYC Verification</span>
                            {user?.kycStatus === 'VERIFIED' && (
                              <span className="text-sm text-green-500">✓ Completed</span>
                            )}
                          </div>
                        )}
                        {tierInfo.requirements.addressVerificationRequired && (
                          <div className="flex items-center space-x-2">
                            {user?.address && user?.city && user?.country && user?.postalCode ? (
                              <CheckCircle className="h-5 w-5 text-green-500" />
                            ) : (
                              <XCircle className="h-5 w-5 text-red-500" />
                            )}
                            <span>Residential Address Confirmation</span>
                            {user?.address && user?.city && user?.country && user?.postalCode && (
                              <span className="text-sm text-green-500">✓ Completed</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {tierInfo.missingRequirements.length > 0 && (
                    <Alert variant="destructive" className="mb-4">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        <p className="font-semibold mb-1">Missing Requirements:</p>
                        <ul className="list-disc list-inside space-y-1">
                          {tierInfo.missingRequirements.map((req, index) => (
                            <li key={index}>{req}</li>
                          ))}
                        </ul>
                      </AlertDescription>
                    </Alert>
                  )}

                  <Button
                    onClick={handleUpgrade}
                    disabled={loading}
                    className="gradient-primary w-full md:w-auto"
                  >
                    {loading ? 'Upgrading...' : `Upgrade to ${nextTierData.name}`}
                  </Button>

                  {tierInfo.nextTier === 'TIER_2' && (
                    <p className="text-sm text-muted-foreground">
                      You'll need to submit identity verification documents to upgrade.
                    </p>
                  )}

                  {tierInfo.nextTier === 'TIER_3' && (
                    <p className="text-sm text-muted-foreground">
                      You'll need to submit address verification documents to upgrade.
                    </p>
                  )}
                </div>
              )}
            </Card>
          )}

          {/* No more tiers */}
          {!tierInfo?.nextTier && (
            <Card className="glass-card p-6">
              <div className="text-center py-8">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Maximum Tier Reached</h3>
                <p className="text-muted-foreground">
                  You are already on the highest tier available. Enjoy all the benefits!
                </p>
              </div>
            </Card>
          )}

          <UpgradeTier2Modal
            open={tier2ModalOpen}
            onOpenChange={setTier2ModalOpen}
            onSuccess={handleUpgradeSuccess}
          />

          <UpgradeTier3Modal
            open={tier3ModalOpen}
            onOpenChange={setTier3ModalOpen}
            onSuccess={handleUpgradeSuccess}
          />
        </>
      )}
    </div>
  );
}


