import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { mockTransactions, mockAccounts } from '@/lib/mockData';
import { ArrowUpRight, ArrowDownRight, Eye, Download } from 'lucide-react';
import { format } from 'date-fns';

export default function Dashboard() {
  const { t } = useTranslation('dashboard');

  const totalBalance = mockAccounts.reduce((sum, acc) => sum + acc.balance, 0);
  const pendingCount = mockTransactions.filter(t => t.status === 'pending').length;

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
            <TrendingUp className="h-5 w-5 text-success" />
          </div>
          <div className="text-2xl font-bold mb-1">$2,450.23</div>
          <p className="text-xs text-success">↓ 12% from last month</p>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="glass-card p-6">
        <h2 className="text-xl font-heading font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Button variant="outline" className="h-auto py-4 flex-col">
            <ArrowUpRight className="h-5 w-5 mb-2" />
            <span className="text-sm">Send Money</span>
          </Button>
          <Button variant="outline" className="h-auto py-4 flex-col">
            <Download className="h-5 w-5 mb-2" />
            <span className="text-sm">Statement</span>
          </Button>
          <Button variant="outline" className="h-auto py-4 flex-col">
            <CreditCard className="h-5 w-5 mb-2" />
            <span className="text-sm">Request Card</span>
          </Button>
          <Button variant="outline" className="h-auto py-4 flex-col">
            <UserPlus className="h-5 w-5 mb-2" />
            <span className="text-sm">Add Beneficiary</span>
          </Button>
        </div>
      </Card>

      {/* Recent Activity */}
      <Card className="glass-card p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-heading font-semibold">{t('recentActivity')}</h2>
          <Button variant="ghost" size="sm">{t('viewAll')}</Button>
        </div>
        <div className="space-y-4">
          {mockTransactions.slice(0, 5).map((transaction) => (
            <div
              key={transaction.id}
              className="flex items-center justify-between p-4 rounded-lg hover:bg-secondary/50 transition-colors"
            >
              <div className="flex items-center space-x-4">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    transaction.type === 'credit'
                      ? 'bg-success/10 text-success'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {transaction.type === 'credit' ? (
                    <ArrowDownRight className="h-5 w-5" />
                  ) : (
                    <ArrowUpRight className="h-5 w-5" />
                  )}
                </div>
                <div>
                  <p className="font-medium">{transaction.description}</p>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(transaction.date), 'MMM dd, yyyy')}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p
                  className={`font-semibold ${
                    transaction.type === 'credit' ? 'text-success' : 'text-foreground'
                  }`}
                >
                  {transaction.type === 'credit' ? '+' : '-'}${transaction.amount.toFixed(2)}
                </p>
                <p className="text-xs text-muted-foreground capitalize">{transaction.status}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

import { TrendingUp, CreditCard, UserPlus } from 'lucide-react';
