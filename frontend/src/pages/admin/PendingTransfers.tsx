import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api, ApiError } from '@/lib/api';
import { toast } from 'sonner';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';

interface TransferRequest {
  id: string;
  requestId: string;
  amount: string;
  currency: string;
  recipientBankName: string;
  recipientAccountNumber: string;
  recipientName: string;
  reference?: string;
  description?: string;
  createdAt: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
  account: {
    accountNumber: string;
  };
}

export default function PendingTransfers() {
  const [transfers, setTransfers] = useState<TransferRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTransfer, setSelectedTransfer] = useState<TransferRequest | null>(null);
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadTransfers();
  }, []);

  const loadTransfers = async () => {
    try {
      setLoading(true);
      const response = await api.transfers.getPending();
      setTransfers(response.data);
    } catch (error) {
      if (error instanceof ApiError) {
        toast.error(error.message || 'Failed to load transfers');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedTransfer) return;

    try {
      setProcessing(true);
      await api.transfers.approve(selectedTransfer.requestId);
      toast.success('Transfer approved successfully');
      setApproveDialogOpen(false);
      setSelectedTransfer(null);
      loadTransfers();
    } catch (error) {
      if (error instanceof ApiError) {
        toast.error(error.message || 'Failed to approve transfer');
      }
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedTransfer || !rejectReason.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }

    try {
      setProcessing(true);
      await api.transfers.reject(selectedTransfer.requestId, rejectReason);
      toast.success('Transfer rejected');
      setRejectDialogOpen(false);
      setSelectedTransfer(null);
      setRejectReason('');
      loadTransfers();
    } catch (error) {
      if (error instanceof ApiError) {
        toast.error(error.message || 'Failed to reject transfer');
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
      <div className="flex items-center justify-between">
        <h1 className="text-4xl font-heading font-bold">Pending Transfer Approvals</h1>
        <Badge variant="outline">{transfers.length} Pending</Badge>
      </div>

      {transfers.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">No pending transfer requests</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {transfers.map((transfer) => (
            <Card key={transfer.id} className="p-6">
              <div className="flex items-start justify-between">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-4">
                    <h3 className="text-lg font-semibold">
                      {transfer.user.firstName} {transfer.user.lastName}
                    </h3>
                    <Badge variant="outline">{transfer.user.email}</Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Amount:</span>
                      <span className="ml-2 font-semibold">
                        {transfer.currency} {parseFloat(transfer.amount).toFixed(2)}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">From Account:</span>
                      <span className="ml-2 font-mono">{transfer.account.accountNumber}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">To Bank:</span>
                      <span className="ml-2">{transfer.recipientBankName}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">To Account:</span>
                      <span className="ml-2 font-mono">{transfer.recipientAccountNumber}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Recipient:</span>
                      <span className="ml-2">{transfer.recipientName}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Date:</span>
                      <span className="ml-2">{new Date(transfer.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  {transfer.reference && (
                    <div className="text-sm">
                      <span className="text-muted-foreground">Reference:</span>
                      <span className="ml-2">{transfer.reference}</span>
                    </div>
                  )}
                  {transfer.description && (
                    <div className="text-sm">
                      <span className="text-muted-foreground">Description:</span>
                      <span className="ml-2">{transfer.description}</span>
                    </div>
                  )}
                </div>
                <div className="flex gap-2 ml-4">
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => {
                      setSelectedTransfer(transfer);
                      setApproveDialogOpen(true);
                    }}
                  >
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Approve
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      setSelectedTransfer(transfer);
                      setRejectDialogOpen(true);
                    }}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Reject
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Approve Dialog */}
      <Dialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Transfer</DialogTitle>
            <DialogDescription>
              Are you sure you want to approve this transfer? The funds will be processed immediately.
            </DialogDescription>
          </DialogHeader>
          {selectedTransfer && (
            <div className="space-y-2 text-sm">
              <div>
                <span className="font-semibold">Amount:</span> {selectedTransfer.currency}{' '}
                {parseFloat(selectedTransfer.amount).toFixed(2)}
              </div>
              <div>
                <span className="font-semibold">To:</span> {selectedTransfer.recipientBankName} -{' '}
                {selectedTransfer.recipientAccountNumber}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setApproveDialogOpen(false)} disabled={processing}>
              Cancel
            </Button>
            <Button onClick={handleApprove} disabled={processing}>
              {processing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Approve Transfer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Transfer</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this transfer. Funds will be returned to the account.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reason">Rejection Reason *</Label>
              <Textarea
                id="reason"
                placeholder="Enter reason for rejection..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)} disabled={processing}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleReject} disabled={processing || !rejectReason.trim()}>
              {processing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Reject Transfer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

