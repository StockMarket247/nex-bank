import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { api, ApiError } from '@/lib/api';
import { toast } from 'sonner';
import { Loader2, Lock, Unlock, DollarSign } from 'lucide-react';

interface Account {
  id?: string;
  _id?: string;
  accountNumber: string;
  type: string;
  balance: string;
  currency: string;
  isFrozen: boolean;
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
}

export default function AccountManagement() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [freezeDialogOpen, setFreezeDialogOpen] = useState(false);
  const [adjustDialogOpen, setAdjustDialogOpen] = useState(false);
  const [adjustAmount, setAdjustAmount] = useState('');
  const [adjustReason, setAdjustReason] = useState('');
  const [processing, setProcessing] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    loadAccounts();
  }, [page]);

  const loadAccounts = async () => {
    try {
      setLoading(true);
      const response = await api.accounts.getAll({ page, limit: 10 });
      // Transform data to normalize userId/user field
      const transformedAccounts = response.data.map((acc: any) => ({
        ...acc,
        id: acc.id || acc._id,
        user: acc.user || acc.userId || { firstName: 'N/A', lastName: 'N/A', email: 'N/A' },
      }));
      setAccounts(transformedAccounts);
      setTotalPages(response.meta.totalPages);
    } catch (error) {
      if (error instanceof ApiError) {
        toast.error(error.message || 'Failed to load accounts');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFreeze = async (isFrozen: boolean) => {
    if (!selectedAccount) return;

    try {
      setProcessing(true);
      await api.accounts.freeze(selectedAccount.id, isFrozen);
      toast.success(`Account ${isFrozen ? 'frozen' : 'unfrozen'} successfully`);
      setFreezeDialogOpen(false);
      setSelectedAccount(null);
      loadAccounts();
    } catch (error) {
      if (error instanceof ApiError) {
        toast.error(error.message || 'Failed to update account status');
      }
    } finally {
      setProcessing(false);
    }
  };

  const handleAdjustBalance = async () => {
    if (!selectedAccount || !adjustAmount) {
      toast.error('Please enter an amount');
      return;
    }

    const amount = parseFloat(adjustAmount);
    if (isNaN(amount)) {
      toast.error('Invalid amount');
      return;
    }

    try {
      setProcessing(true);
      await api.admin.adjustBalance(selectedAccount.id, amount, adjustReason);
      toast.success('Balance adjusted successfully');
      setAdjustDialogOpen(false);
      setSelectedAccount(null);
      setAdjustAmount('');
      setAdjustReason('');
      loadAccounts();
    } catch (error) {
      if (error instanceof ApiError) {
        toast.error(error.message || 'Failed to adjust balance');
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
      <h1 className="text-4xl font-heading font-bold">Account Management</h1>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Account Number</TableHead>
              <TableHead>Owner</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Balance</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {accounts.map((account) => (
              <TableRow key={account.id || account._id}>
                <TableCell className="font-mono">{account.accountNumber}</TableCell>
                <TableCell>
                  <div>
                    <div className="font-medium">
                      {account.user?.firstName || 'N/A'} {account.user?.lastName || ''}
                    </div>
                    <div className="text-sm text-muted-foreground">{account.user?.email || 'N/A'}</div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{account.type}</Badge>
                </TableCell>
                <TableCell className="font-semibold">
                  {account.currency} {parseFloat(account.balance).toFixed(2)}
                </TableCell>
                <TableCell>
                  {account.isFrozen ? (
                    <Badge className="bg-red-500">Frozen</Badge>
                  ) : (
                    <Badge className="bg-green-500">Active</Badge>
                  )}
                </TableCell>
                <TableCell>{new Date(account.createdAt).toLocaleDateString()}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedAccount(account);
                        handleFreeze(!account.isFrozen);
                      }}
                    >
                      {account.isFrozen ? (
                        <>
                          <Unlock className="h-4 w-4 mr-2" />
                          Unfreeze
                        </>
                      ) : (
                        <>
                          <Lock className="h-4 w-4 mr-2" />
                          Freeze
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedAccount(account);
                        setAdjustDialogOpen(true);
                      }}
                    >
                      <DollarSign className="h-4 w-4 mr-2" />
                      Adjust
                    </Button>
                  </div>
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

      {/* Adjust Balance Dialog */}
      <Dialog open={adjustDialogOpen} onOpenChange={setAdjustDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adjust Account Balance</DialogTitle>
            <DialogDescription>
              Adjust balance for account: {selectedAccount?.accountNumber}
              <br />
              Current balance: {selectedAccount?.currency} {selectedAccount && parseFloat(selectedAccount.balance).toFixed(2)}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Adjustment Amount *</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                placeholder="Enter amount (positive to add, negative to subtract)"
                value={adjustAmount}
                onChange={(e) => setAdjustAmount(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Use positive values to add funds, negative values to subtract
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="reason">Reason (Optional)</Label>
              <Textarea
                id="reason"
                placeholder="Enter reason for adjustment..."
                value={adjustReason}
                onChange={(e) => setAdjustReason(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAdjustDialogOpen(false)} disabled={processing}>
              Cancel
            </Button>
            <Button onClick={handleAdjustBalance} disabled={processing || !adjustAmount}>
              {processing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Adjust Balance
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

