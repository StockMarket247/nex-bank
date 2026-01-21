import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { api, ApiError } from '@/lib/api';
import { toast } from 'sonner';
import { Loader2, Edit } from 'lucide-react';
import TransactionSummaryModal from '@/components/transaction/TransactionSummaryModal';

interface Transaction {
  id?: string;
  _id?: string;
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
  userId?: {
    _id?: string;
    id?: string;
    email: string;
    firstName: string;
    lastName: string;
  };
  user?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
  accountId?: {
    accountNumber: string;
    type: string;
  };
  account?: {
    accountNumber: string;
    type: string;
  };
}

export default function TransactionExplorer() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchAccountId, setSearchAccountId] = useState('');
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<string>('');
  const [statusNotes, setStatusNotes] = useState('');
  const [processing, setProcessing] = useState(false);
  const [summaryModalOpen, setSummaryModalOpen] = useState(false);
  const [transactionForSummary, setTransactionForSummary] = useState<Transaction | null>(null);

  useEffect(() => {
    loadTransactions();
  }, [page, searchAccountId]);

  const loadTransactions = async () => {
    try {
      setLoading(true);
      const response = await api.transactions.getAll({
        page,
        limit: 20,
        accountId: searchAccountId || undefined,
      });
      // Transform data to normalize userId/user and accountId/account fields
      const transformedTransactions = response.data.map((txn: any) => ({
        ...txn,
        id: txn.id || txn._id,
        user: txn.user || txn.userId || { firstName: 'N/A', lastName: 'N/A', email: 'N/A' },
        account: txn.account || txn.accountId || { accountNumber: 'N/A', type: 'N/A' },
      }));
      setTransactions(transformedTransactions);
      setTotalPages(response.meta.totalPages);
    } catch (error) {
      if (error instanceof ApiError) {
        toast.error(error.message || 'Failed to load transactions');
      }
    } finally {
      setLoading(false);
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'INTERNAL_TRANSFER':
        return <Badge variant="outline">Internal Transfer</Badge>;
      case 'EXTERNAL_TRANSFER':
        return <Badge variant="outline">External Transfer</Badge>;
      case 'DEPOSIT':
        return <Badge className="bg-green-500">Deposit</Badge>;
      case 'WITHDRAWAL':
        return <Badge className="bg-red-500">Withdrawal</Badge>;
      case 'ADJUSTMENT':
        return <Badge className="bg-blue-500">Adjustment</Badge>;
      default:
        return <Badge>{type}</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <Badge className="bg-green-500">Completed</Badge>;
      case 'PENDING':
        return <Badge className="bg-yellow-500">Pending</Badge>;
      case 'FAILED':
        return <Badge className="bg-red-500">Failed</Badge>;
      case 'CANCELLED':
        return <Badge className="bg-gray-500">Cancelled</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const handleUpdateStatus = async () => {
    if (!selectedTransaction || !newStatus) {
      toast.error('Please select a status');
      return;
    }

    try {
      setProcessing(true);
      await api.admin.updateTransactionStatus(selectedTransaction.id, newStatus, statusNotes);
      toast.success('Transaction status updated successfully');
      setStatusDialogOpen(false);
      setSelectedTransaction(null);
      setNewStatus('');
      setStatusNotes('');
      loadTransactions();
    } catch (error) {
      if (error instanceof ApiError) {
        toast.error(error.message || 'Failed to update transaction status');
      }
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-4xl font-heading font-bold">Transaction Explorer</h1>

      <Card className="p-4">
        <div className="flex gap-4">
          <div className="flex-1">
            <Input
              placeholder="Search by account ID..."
              value={searchAccountId}
              onChange={(e) => {
                setSearchAccountId(e.target.value);
                setPage(1);
              }}
            />
          </div>
        </div>
      </Card>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Transaction ID</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Account</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Recipient</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map((transaction) => (
              <TableRow 
                key={transaction.id || transaction._id}
                className="cursor-pointer hover:bg-secondary/50"
                onClick={() => {
                  setTransactionForSummary(transaction);
                  setSummaryModalOpen(true);
                }}
              >
                <TableCell className="font-mono text-xs">{transaction.transactionId}</TableCell>
                <TableCell>
                  <div>
                    <div className="font-medium">
                      {transaction.user?.firstName || 'N/A'} {transaction.user?.lastName || ''}
                    </div>
                    <div className="text-sm text-muted-foreground">{transaction.user?.email || 'N/A'}</div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="font-mono text-sm">{transaction.account?.accountNumber || 'N/A'}</div>
                  <div className="text-xs text-muted-foreground">{transaction.account?.type || 'N/A'}</div>
                </TableCell>
                <TableCell>{getTypeBadge(transaction.type)}</TableCell>
                <TableCell className="font-semibold">
                  {parseFloat(transaction.amount) >= 0 ? '+' : ''}
                  {transaction.currency} {Math.abs(parseFloat(transaction.amount)).toFixed(2)}
                </TableCell>
                <TableCell>{getStatusBadge(transaction.status)}</TableCell>
                <TableCell>
                  {transaction.recipientAccountNumber ? (
                    <div>
                      <div className="font-mono text-sm">{transaction.recipientAccountNumber}</div>
                      {transaction.recipientName && (
                        <div className="text-xs text-muted-foreground">{transaction.recipientName}</div>
                      )}
                    </div>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell>{new Date(transaction.createdAt).toLocaleString()}</TableCell>
                <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedTransaction(transaction);
                      setNewStatus(transaction.status);
                      setStatusDialogOpen(true);
                    }}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Update Status
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button variant="outline" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
            Previous
          </Button>
          <span className="flex items-center px-4">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            Next
          </Button>
        </div>
      )}

      {/* Update Status Dialog */}
      <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Transaction Status</DialogTitle>
            <DialogDescription>
              Update the status for transaction: {selectedTransaction?.transactionId}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="status">Status *</Label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                  <SelectItem value="FAILED">Failed</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="Enter notes about this status change..."
                value={statusNotes}
                onChange={(e) => setStatusNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStatusDialogOpen(false)} disabled={processing}>
              Cancel
            </Button>
            <Button onClick={handleUpdateStatus} disabled={processing || !newStatus}>
              {processing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Update Status
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <TransactionSummaryModal
        transaction={transactionForSummary}
        open={summaryModalOpen}
        onOpenChange={setSummaryModalOpen}
        isAdmin={true}
      />
    </div>
  );
}

