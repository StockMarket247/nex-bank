import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { mockAccounts, mockTransactions } from '@/lib/mockData';
import { Download, Search, Filter, Eye, EyeOff } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';
import { useState } from 'react';

export default function Accounts() {
  const { t } = useTranslation('dashboard');
  const [selectedAccount, setSelectedAccount] = useState(mockAccounts[0].id);
  const [balanceVisible, setBalanceVisible] = useState(true);

  const currentAccount = mockAccounts.find(acc => acc.id === selectedAccount) || mockAccounts[0];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-4xl font-heading font-bold">{t('accounts')}</h1>
        <Button className="gradient-primary">
          <Download className="h-4 w-4 mr-2" />
          {t('downloadStatement')}
        </Button>
      </div>

      {/* Account Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {mockAccounts.map((account) => (
          <Card
            key={account.id}
            className={`glass-card p-6 cursor-pointer transition-all ${
              selectedAccount === account.id
                ? 'ring-2 ring-primary shadow-elevated'
                : 'hover:shadow-glass'
            }`}
            onClick={() => setSelectedAccount(account.id)}
          >
            <div className="flex items-center justify-between mb-4">
              <Badge variant={account.type === 'savings' ? 'default' : 'secondary'}>
                {account.type}
              </Badge>
              <button onClick={(e) => {
                e.stopPropagation();
                setBalanceVisible(!balanceVisible);
              }}>
                {balanceVisible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
              </button>
            </div>
            <h3 className="font-semibold mb-2">{account.name}</h3>
            <p className="text-2xl font-bold mb-2">
              {balanceVisible
                ? `$${account.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}`
                : '••••••'}
            </p>
            <p className="text-sm text-muted-foreground">{account.accountNumber}</p>
          </Card>
        ))}
      </div>

      {/* Account Details */}
      <Card className="glass-card p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-heading font-semibold">{t('accountDetails')}</h2>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button variant="outline" size="sm">
              {t('requestStatement')}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div>
            <p className="text-sm text-muted-foreground mb-1">{t('accountNumber')}</p>
            <p className="font-semibold">{currentAccount.accountNumber}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">{t('accountType')}</p>
            <p className="font-semibold capitalize">{currentAccount.type}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">Currency</p>
            <p className="font-semibold">{currentAccount.currency}</p>
          </div>
        </div>

        {/* Transaction History */}
        <div>
          <div className="flex items-center gap-4 mb-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search transactions..." className="pl-10" />
              </div>
            </div>
            <Button variant="outline" size="icon">
              <Filter className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-2">
            {mockTransactions.map((transaction) => (
              <div
                key={transaction.id}
                className="flex items-center justify-between p-4 rounded-lg hover:bg-secondary/50 transition-colors"
              >
                <div className="flex-1">
                  <p className="font-medium">{transaction.description}</p>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(transaction.date), 'MMM dd, yyyy • HH:mm')}
                  </p>
                </div>
                <div className="text-right">
                  <p
                    className={`font-semibold ${
                      transaction.type === 'credit' ? 'text-success' : 'text-foreground'
                    }`}
                  >
                    {transaction.type === 'credit' ? '+' : '-'}$
                    {transaction.amount.toFixed(2)}
                  </p>
                  <Badge
                    variant={transaction.status === 'completed' ? 'default' : 'secondary'}
                    className="text-xs"
                  >
                    {transaction.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}
