import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowUpRight, ArrowDownRight, Eye, Download, TrendingUp, CreditCard, UserPlus, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import TransactionSummaryModal from '@/components/transaction/TransactionSummaryModal';
import AddBeneficiaryModal from '@/components/beneficiary/AddBeneficiaryModal';

interface Account {
  _id: string;
  accountNumber: string;
  type: string;
  balance: string;
  currency: string;
  isFrozen: boolean;
}

interface Transaction {
  _id: string;
  transactionId?: string;
  type: string;
  amount: string;
  currency?: string;
  status: string;
  description?: string;
  reference?: string;
  recipientAccountNumber?: string;
  recipientName?: string;
  createdAt: string;
  accountId?: {
    accountNumber: string;
    type: string;
  } | string;
}

export default function Dashboard() {
  const { t } = useTranslation('dashboard');
  const { toast } = useToast();
  const navigate = useNavigate();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [beneficiaryModalOpen, setBeneficiaryModalOpen] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [accountsData, transactionsData, allTransactionsData] = await Promise.all([
        api.accounts.getMyAccounts(),
        api.transactions.getMyTransactions({ limit: 5 }),
        api.transactions.getMyTransactions({ limit: 1000 }), // Fetch more for monthly calculation
      ]);
      setAccounts(accountsData);
      setTransactions(transactionsData.data || transactionsData || []);
      setAllTransactions(allTransactionsData.data || allTransactionsData || []);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to load dashboard data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const totalBalance = accounts.reduce((sum, acc) => sum + parseFloat(acc.balance || '0'), 0);
  const pendingCount = transactions.filter(t => t.status === 'PENDING').length;

  // Calculate monthly spending
  const calculateMonthlySpending = () => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

    // Filter transactions for current month (only debits/negative amounts)
    const currentMonthTransactions = allTransactions.filter((t) => {
      const transactionDate = new Date(t.createdAt);
      const amount = parseFloat(t.amount || '0');
      return (
        transactionDate.getMonth() === currentMonth &&
        transactionDate.getFullYear() === currentYear &&
        amount < 0 &&
        t.status === 'COMPLETED'
      );
    });

    // Filter transactions for last month (only debits/negative amounts)
    const lastMonthTransactions = allTransactions.filter((t) => {
      const transactionDate = new Date(t.createdAt);
      const amount = parseFloat(t.amount || '0');
      return (
        transactionDate.getMonth() === lastMonth &&
        transactionDate.getFullYear() === lastMonthYear &&
        amount < 0 &&
        t.status === 'COMPLETED'
      );
    });

    // Calculate totals
    const currentMonthTotal = currentMonthTransactions.reduce(
      (sum, t) => sum + Math.abs(parseFloat(t.amount || '0')),
      0
    );
    const lastMonthTotal = lastMonthTransactions.reduce(
      (sum, t) => sum + Math.abs(parseFloat(t.amount || '0')),
      0
    );

    // Calculate percentage change
    let percentageChange = 0;
    let isIncrease = false;
    if (lastMonthTotal > 0) {
      percentageChange = ((currentMonthTotal - lastMonthTotal) / lastMonthTotal) * 100;
      isIncrease = percentageChange > 0;
    } else if (currentMonthTotal > 0) {
      percentageChange = 100; // 100% increase from 0
      isIncrease = true;
    }

    return {
      currentMonth: currentMonthTotal,
      lastMonth: lastMonthTotal,
      percentageChange: Math.abs(percentageChange),
      isIncrease,
    };
  };

  const monthlySpending = calculateMonthlySpending();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-heading font-bold mb-2">{t('overview')}</h1>
        <p className="text-muted-foreground">Welcome back! Here's your financial overview</p>
      </div>

      {/* Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="glass-card p-6 gradient-primary text-white">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm opacity-90">{t('totalBalance')}</span>
            <Eye className="h-5 w-5 opacity-75" />
          </div>
          <div className="text-3xl font-bold mb-1">
            ${totalBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <p className="text-xs opacity-75">Across all accounts</p>
        </Card>

        <Card className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-muted-foreground">{t('pendingTransactions')}</span>
            <div className="w-8 h-8 rounded-full bg-warning/10 flex items-center justify-center">
              <span className="text-warning font-semibold text-sm">{pendingCount}</span>
            </div>
          </div>
          <div className="text-2xl font-bold mb-1">{pendingCount} Transactions</div>
          <p className="text-xs text-muted-foreground">Awaiting processing</p>
        </Card>

        <Card className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-muted-foreground">Monthly Spending</span>
            <TrendingUp className={`h-5 w-5 ${monthlySpending.isIncrease ? 'text-warning' : 'text-success'}`} />
          </div>
          <div className="text-2xl font-bold mb-1">
            ${monthlySpending.currentMonth.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <p className={`text-xs ${monthlySpending.isIncrease ? 'text-warning' : 'text-success'}`}>
            {monthlySpending.isIncrease ? '↑' : '↓'} {monthlySpending.percentageChange.toFixed(1)}% from last month
          </p>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="glass-card p-6">
        <h2 className="text-xl font-heading font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Button 
            variant="outline" 
            className="h-auto py-4 flex-col"
            onClick={() => navigate('/dashboard/transfers')}
          >
            <ArrowUpRight className="h-5 w-5 mb-2" />
            <span className="text-sm">Send Money</span>
          </Button>
          <Button 
            variant="outline" 
            className="h-auto py-4 flex-col"
            onClick={() => navigate('/dashboard/transactions')}
          >
            <Download className="h-5 w-5 mb-2" />
            <span className="text-sm">Statement</span>
          </Button>
          <Button 
            variant="outline" 
            className="h-auto py-4 flex-col"
            disabled
            // onClick={() => navigate('/dashboard/cards')}
          >
            <CreditCard className="h-5 w-5 mb-2" />
            <span className="text-sm">Request Card</span>
          </Button>
          <Button 
            variant="outline" 
            className="h-auto py-4 flex-col"
            onClick={() => setBeneficiaryModalOpen(true)}
          >
            <UserPlus className="h-5 w-5 mb-2" />
            <span className="text-sm">Add Beneficiary</span>
          </Button>
        </div>
      </Card>

      {/* Recent Activity */}
      <Card className="glass-card p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-heading font-semibold">{t('recentActivity')}</h2>
          <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard/transactions')}>
            {t('viewAll')}
          </Button>
        </div>
        <div className="space-y-4">
          {transactions.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No transactions yet</p>
          ) : (
            transactions.map((transaction) => {
              const isCredit = transaction.type === 'DEPOSIT' || transaction.type === 'INTERNAL_TRANSFER_CREDIT';
              const amount = parseFloat(transaction.amount || '0');
              const absAmount = Math.abs(amount);
              const sign = amount >= 0 ? '+' : '-';
              return (
                <div
                  key={transaction._id}
                  className="flex items-center justify-between p-4 rounded-lg hover:bg-secondary/50 transition-colors cursor-pointer"
                  onClick={() => {
                    setSelectedTransaction(transaction);
                    setModalOpen(true);
                  }}
                >
                  <div className="flex items-center space-x-4">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        isCredit
                          ? 'bg-success/10 text-success'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {isCredit ? (
                        <ArrowDownRight className="h-5 w-5" />
                      ) : (
                        <ArrowUpRight className="h-5 w-5" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium">{transaction.description || transaction.type}</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(transaction.createdAt), 'MMM dd, yyyy')}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p
                      className={`font-semibold ${
                        isCredit ? 'text-success' : 'text-foreground'
                      }`}
                    >
                      {sign}${absAmount.toFixed(2)}
                    </p>
                    <p className="text-xs text-muted-foreground capitalize">{transaction.status}</p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </Card>

      <TransactionSummaryModal
        transaction={selectedTransaction}
        open={modalOpen}
        onOpenChange={setModalOpen}
        isAdmin={false}
      />

      <AddBeneficiaryModal
        open={beneficiaryModalOpen}
        onOpenChange={setBeneficiaryModalOpen}
      />
    </div>
  );
}
