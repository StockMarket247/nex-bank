import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, Search, Filter, Eye, EyeOff, Loader2, FileText } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import TransactionSummaryModal from '@/components/transaction/TransactionSummaryModal';
import * as XLSX from 'xlsx';
import { toast } from 'sonner';

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

export default function Accounts() {
  const { t } = useTranslation('dashboard');
  const { toast } = useToast();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null);
  const [balanceVisible, setBalanceVisible] = useState(true);
  const [loading, setLoading] = useState(true);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedAccount) {
      fetchTransactions();
    }
  }, [selectedAccount]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const accountsData = await api.accounts.getMyAccounts();
      setAccounts(accountsData);
      if (accountsData.length > 0 && !selectedAccount) {
        setSelectedAccount(accountsData[0]._id);
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to load accounts',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactions = async () => {
    try {
      const transactionsData = await api.transactions.getMyTransactions({
        accountId: selectedAccount || undefined,
        limit: 50,
      });
      setTransactions(transactionsData.data || transactionsData || []);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to load transactions',
        variant: 'destructive',
      });
    }
  };

  const currentAccount = accounts.find(acc => acc._id === selectedAccount) || accounts[0];

  const handleDownloadStatement = async () => {
    if (!selectedAccount) {
      toast.error('Please select an account');
      return;
    }

    try {
      setExporting(true);

      // Fetch all transactions (paginate through all pages)
      let allTransactions: Transaction[] = [];
      let page = 1;
      let hasMore = true;
      const limit = 100; // Fetch 100 at a time

      while (hasMore) {
        const response = await api.transactions.getMyTransactions({
          accountId: selectedAccount,
          page,
          limit,
        });

        const transactions = response.data || [];
        allTransactions = [...allTransactions, ...transactions];

        if (transactions.length < limit || page >= response.meta.totalPages) {
          hasMore = false;
        } else {
          page++;
        }
      }

      if (allTransactions.length === 0) {
        toast.error('No transactions found to export');
        return;
      }

      // Prepare data for Excel
      const excelData = allTransactions.map((tx) => {
        const amount = parseFloat(tx.amount || '0');
        const accountNumber = typeof tx.accountId === 'object' && tx.accountId
          ? tx.accountId.accountNumber
          : 'N/A';

        return {
          'Transaction ID': tx.transactionId || tx._id || 'N/A',
          'Date': format(new Date(tx.createdAt), 'yyyy-MM-dd HH:mm:ss'),
          'Type': tx.type,
          'Status': tx.status,
          'Amount': amount.toFixed(2),
          'Currency': tx.currency || 'USD',
          'Description': tx.description || '',
          'Reference': tx.reference || '',
          'Account Number': accountNumber,
          'Recipient Account': tx.recipientAccountNumber || '',
          'Recipient Name': tx.recipientName || '',
        };
      });

      // Create workbook and worksheet
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(excelData);

      // Set column widths
      const colWidths = [
        { wch: 25 }, // Transaction ID
        { wch: 20 }, // Date
        { wch: 20 }, // Type
        { wch: 12 }, // Status
        { wch: 15 }, // Amount
        { wch: 10 }, // Currency
        { wch: 30 }, // Description
        { wch: 20 }, // Reference
        { wch: 18 }, // Account Number
        { wch: 20 }, // Recipient Account
        { wch: 25 }, // Recipient Name
      ];
      ws['!cols'] = colWidths;

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(wb, ws, 'Transactions');

      // Generate filename
      const accountNumber = currentAccount?.accountNumber || 'account';
      const fileName = `Statement_${accountNumber}_${format(new Date(), 'yyyy-MM-dd')}.xlsx`;

      // Write and download file
      XLSX.writeFile(wb, fileName);

      toast.success(`Statement exported successfully (${allTransactions.length} transactions)`);
    } catch (error: any) {
      console.error('Error exporting statement:', error);
      toast.error(error.message || 'Failed to export statement');
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (accounts.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-4xl font-heading font-bold">{t('accounts')}</h1>
        </div>
        <Card className="glass-card p-12 text-center">
          <p className="text-muted-foreground">No accounts found</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-4xl font-heading font-bold">{t('accounts')}</h1>
        <Button 
          className="gradient-primary h-10 w-10 p-0 md:w-auto md:px-4"
          onClick={handleDownloadStatement}
          disabled={exporting}
          title={t('downloadStatement')}
        >
          {exporting ? (
            <Loader2 className="h-4 w-4 md:mr-2 animate-spin" />
          ) : (
            <Download className="h-4 w-4 md:mr-2" />
          )}
          <span className="hidden md:inline">{t('downloadStatement')}</span>
        </Button>
      </div>

      {/* Account Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {accounts.map((account) => (
          <Card
            key={account._id}
            className={`glass-card p-6 cursor-pointer transition-all ${
              selectedAccount === account._id
                ? 'ring-2 ring-primary shadow-elevated'
                : 'hover:shadow-glass'
            }`}
            onClick={() => setSelectedAccount(account._id)}
          >
            <div className="flex items-center justify-between mb-4">
              <Badge variant={account.type === 'SAVINGS' ? 'default' : 'secondary'}>
                {account.type}
              </Badge>
              <button onClick={(e) => {
                e.stopPropagation();
                setBalanceVisible(!balanceVisible);
              }}>
                {balanceVisible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
              </button>
            </div>
            <h3 className="font-semibold mb-2 capitalize">{account.type} Account</h3>
            <p className="text-2xl font-bold mb-2">
              {balanceVisible
                ? `${account.currency} ${parseFloat(account.balance || '0').toLocaleString('en-US', { minimumFractionDigits: 2 })}`
                : '••••••'}
            </p>
            <p className="text-sm text-muted-foreground">{account.accountNumber}</p>
          </Card>
        ))}
      </div>

      {/* Account Details */}
      <Card className="glass-card p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <h2 className="text-xl font-heading font-semibold">{t('accountDetails')}</h2>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm"
              className="h-9 w-9 p-0 md:w-auto md:px-3"
              title="Export"
            >
              <Download className="h-4 w-4 md:mr-2" />
              <span className="hidden md:inline">Export</span>
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              className="h-9 w-9 p-0 md:w-auto md:px-3"
              title={t('requestStatement')}
            >
              <FileText className="h-4 w-4 md:mr-2" />
              <span className="hidden md:inline">{t('requestStatement')}</span>
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
            {transactions.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No transactions found</p>
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
                    <div className="flex-1">
                      <p className="font-medium">{transaction.description || transaction.type}</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(transaction.createdAt), 'MMM dd, yyyy • HH:mm')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p
                        className={`font-semibold ${
                          isCredit ? 'text-success' : 'text-foreground'
                        }`}
                      >
                        {sign}${absAmount.toFixed(2)}
                      </p>
                      <Badge
                        variant={transaction.status === 'COMPLETED' ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {transaction.status}
                      </Badge>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </Card>

      <TransactionSummaryModal
        transaction={selectedTransaction}
        open={modalOpen}
        onOpenChange={setModalOpen}
        isAdmin={false}
      />
    </div>
  );
}
