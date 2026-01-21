import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { api, ApiError } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Search, Download, Filter, ChevronLeft, ChevronRight, Loader2, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { format } from 'date-fns';
import TransactionSummaryModal from '@/components/transaction/TransactionSummaryModal';

interface Transaction {
  _id: string;
  transactionId: string;
  type: string;
  status: string;
  amount: string;
  currency: string;
  reference?: string;
  description?: string;
  recipientAccountNumber?: string;
  recipientName?: string;
  createdAt: string;
  accountId?: {
    accountNumber: string;
    type: string;
  } | string;
}

interface Account {
  _id: string;
  accountNumber: string;
  type: string;
  balance: string;
}

export default function Transactions() {
  const { t } = useTranslation('dashboard');
  const { toast } = useToast();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedAccountId, setSelectedAccountId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    loadAccounts();
  }, []);

  useEffect(() => {
    loadTransactions();
  }, [page, selectedAccountId]);

  const loadAccounts = async () => {
    try {
      const accountsData = await api.accounts.getMyAccounts();
      setAccounts(accountsData);
    } catch (error) {
      if (error instanceof ApiError) {
        toast({
          title: 'Error',
          description: 'Failed to load accounts',
          variant: 'destructive',
        });
      }
    }
  };

  const loadTransactions = async () => {
    try {
      setLoading(true);
      const response = await api.transactions.getMyTransactions({
        page,
        limit: 20,
        accountId: selectedAccountId !== 'all' ? selectedAccountId : undefined,
      });
      setTransactions(response.data);
      setTotalPages(response.meta.totalPages);
      setTotal(response.meta.total);
    } catch (error) {
      if (error instanceof ApiError) {
        toast({
          title: 'Error',
          description: error.message || 'Failed to load transactions',
          variant: 'destructive',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'INTERNAL_TRANSFER':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300">Internal Transfer</Badge>;
      case 'EXTERNAL_TRANSFER':
        return <Badge variant="outline" className="bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300">External Transfer</Badge>;
      case 'DEPOSIT':
        return <Badge className="bg-green-500 text-white">Deposit</Badge>;
      case 'WITHDRAWAL':
        return <Badge className="bg-orange-500 text-white">Withdrawal</Badge>;
      case 'ADJUSTMENT':
        return <Badge className="bg-gray-500 text-white">Adjustment</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <Badge className="bg-green-500 text-white">Completed</Badge>;
      case 'PENDING':
        return <Badge className="bg-yellow-500 text-white">Pending</Badge>;
      case 'FAILED':
        return <Badge className="bg-red-500 text-white">Failed</Badge>;
      case 'CANCELLED':
        return <Badge variant="outline">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatAmount = (amount: string, currency: string = 'USD') => {
    const numAmount = parseFloat(amount);
    const isPositive = numAmount >= 0;
    return {
      formatted: `${currency} ${Math.abs(numAmount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      isPositive,
      numAmount: Math.abs(numAmount),
    };
  };

  const filteredTransactions = transactions.filter((transaction) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      transaction.transactionId.toLowerCase().includes(query) ||
      transaction.description?.toLowerCase().includes(query) ||
      transaction.reference?.toLowerCase().includes(query) ||
      transaction.recipientAccountNumber?.toLowerCase().includes(query) ||
      transaction.recipientName?.toLowerCase().includes(query)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-4xl font-heading font-bold">Transactions</h1>
        <Button className="gradient-primary">
          <Download className="h-4 w-4 mr-2" />
          Export Statement
        </Button>
      </div>

      {/* Filters */}
      <Card className="glass-card p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by transaction ID, description, reference..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <Select value={selectedAccountId} onValueChange={(value) => {
            setSelectedAccountId(value);
            setPage(1);
          }}>
            <SelectTrigger className="w-full md:w-[250px]">
              <SelectValue placeholder="Filter by account" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Accounts</SelectItem>
              {accounts.map((account) => (
                <SelectItem key={account._id} value={account._id}>
                  {account.accountNumber} ({account.type})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Transactions List */}
      <Card className="glass-card p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-heading font-semibold">Transaction History</h2>
          <div className="text-sm text-muted-foreground">
            {total} {total === 1 ? 'transaction' : 'transactions'}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No transactions found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredTransactions.map((transaction) => {
              const amountInfo = formatAmount(transaction.amount, transaction.currency);
              return (
                <div
                  key={transaction._id}
                  className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-secondary/50 transition-colors cursor-pointer"
                  onClick={() => {
                    setSelectedTransaction(transaction);
                    setModalOpen(true);
                  }}
                >
                  <div className="flex items-start gap-4 flex-1">
                    <div className={`p-2 rounded-lg ${
                      amountInfo.isPositive 
                        ? 'bg-green-100 dark:bg-green-950' 
                        : 'bg-red-100 dark:bg-red-950'
                    }`}>
                      {amountInfo.isPositive ? (
                        <ArrowDownLeft className={`h-5 w-5 ${amountInfo.isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`} />
                      ) : (
                        <ArrowUpRight className={`h-5 w-5 ${amountInfo.isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium truncate">
                          {transaction.description || transaction.type.replace('_', ' ')}
                        </p>
                        {getTypeBadge(transaction.type)}
                        {getStatusBadge(transaction.status)}
                      </div>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                        <span className="font-mono text-xs">{transaction.transactionId}</span>
                        {transaction.accountId && typeof transaction.accountId === 'object' && (
                          <span>Account: {transaction.accountId.accountNumber}</span>
                        )}
                        {transaction.recipientAccountNumber && (
                          <span>To: {transaction.recipientAccountNumber}</span>
                        )}
                        {transaction.recipientName && (
                          <span>{transaction.recipientName}</span>
                        )}
                        <span>{format(new Date(transaction.createdAt), 'MMM dd, yyyy • HH:mm')}</span>
                      </div>
                      {transaction.reference && (
                        <p className="text-xs text-muted-foreground mt-1">Ref: {transaction.reference}</p>
                      )}
                    </div>
                  </div>
                  <div className="text-right ml-4">
                    <p
                      className={`text-lg font-bold ${
                        amountInfo.isPositive
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-foreground'
                      }`}
                    >
                      {amountInfo.isPositive ? '+' : '-'}{amountInfo.formatted}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-6 pt-6 border-t border-border">
            <div className="text-sm text-muted-foreground">
              Showing page {page} of {totalPages}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        )}
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

