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
import { Loader2, CheckCircle, XCircle, Eye, FileText } from 'lucide-react';
import { format } from 'date-fns';

interface VerificationDocument {
  _id: string;
  userId: {
    _id: string;
    email: string;
    firstName: string;
    lastName: string;
    accountTier: string;
  };
  verificationType: 'IDENTITY' | 'ADDRESS';
  documentType: string;
  identityNumber?: string;
  address?: string;
  city?: string;
  country?: string;
  postalCode?: string;
  frontImageUrl: string;
  backImageUrl?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  rejectionReason?: string;
  reviewedBy?: {
    _id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
  reviewedAt?: string;
  notes?: string;
  createdAt: string;
}

export default function VerificationManagement() {
  const [verifications, setVerifications] = useState<VerificationDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedVerification, setSelectedVerification] = useState<VerificationDocument | null>(null);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [reviewStatus, setReviewStatus] = useState<string>('APPROVED');
  const [rejectionReason, setRejectionReason] = useState('');
  const [notes, setNotes] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadVerifications();
  }, [page, statusFilter]);

  const loadVerifications = async () => {
    try {
      setLoading(true);
      const response = await api.admin.getVerifications({
        page,
        limit: 20,
        status: statusFilter !== 'all' ? statusFilter : undefined,
      });
      setVerifications(response.data);
      setTotalPages(response.meta.totalPages);
    } catch (error) {
      if (error instanceof ApiError) {
        toast.error(error.message || 'Failed to load verification requests');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleReview = (verification: VerificationDocument) => {
    setSelectedVerification(verification);
    setReviewStatus(verification.status === 'PENDING' ? 'APPROVED' : verification.status);
    setRejectionReason(verification.rejectionReason || '');
    setNotes(verification.notes || '');
    setReviewDialogOpen(true);
  };

  const handleUpdateStatus = async () => {
    if (!selectedVerification) return;

    if (reviewStatus === 'REJECTED' && !rejectionReason.trim()) {
      toast.error('Please provide a reason for rejection');
      return;
    }

    try {
      setProcessing(true);
      await api.admin.updateVerificationStatus(selectedVerification._id, {
        status: reviewStatus,
        rejectionReason: reviewStatus === 'REJECTED' ? rejectionReason : undefined,
        notes: notes.trim() || undefined,
      });
      toast.success(`Verification ${reviewStatus.toLowerCase()} successfully`);
      setReviewDialogOpen(false);
      setSelectedVerification(null);
      setRejectionReason('');
      setNotes('');
      loadVerifications();
    } catch (error) {
      if (error instanceof ApiError) {
        toast.error(error.message || 'Failed to update verification status');
      }
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <Badge className="bg-green-500 text-white">Approved</Badge>;
      case 'PENDING':
        return <Badge className="bg-yellow-500 text-white">Pending</Badge>;
      case 'REJECTED':
        return <Badge className="bg-red-500 text-white">Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'IDENTITY':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300">Identity</Badge>;
      case 'ADDRESS':
        return <Badge variant="outline" className="bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300">Address</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  if (loading && verifications.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-4xl font-heading font-bold">Verification Management</h1>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex gap-4">
          <Select value={statusFilter} onValueChange={(value) => {
            setStatusFilter(value);
            setPage(1);
          }}>
            <SelectTrigger className="w-full md:w-[200px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="APPROVED">Approved</SelectItem>
              <SelectItem value="REJECTED">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Document Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Submitted</TableHead>
              <TableHead>Reviewed By</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {verifications.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No verification requests found
                </TableCell>
              </TableRow>
            ) : (
              verifications.map((verification) => (
                <TableRow key={verification._id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">
                        {verification.userId.firstName} {verification.userId.lastName}
                      </div>
                      <div className="text-sm text-muted-foreground">{verification.userId.email}</div>
                      <div className="text-xs text-muted-foreground">Tier: {verification.userId.accountTier}</div>
                    </div>
                  </TableCell>
                  <TableCell>{getTypeBadge(verification.verificationType)}</TableCell>
                  <TableCell>
                    <span className="text-sm">{verification.documentType.replace(/_/g, ' ')}</span>
                  </TableCell>
                  <TableCell>{getStatusBadge(verification.status)}</TableCell>
                  <TableCell>
                    {format(new Date(verification.createdAt), 'MMM dd, yyyy')}
                  </TableCell>
                  <TableCell>
                    {verification.reviewedBy ? (
                      <div>
                        <div className="text-sm">
                          {verification.reviewedBy.firstName} {verification.reviewedBy.lastName}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {verification.reviewedAt && format(new Date(verification.reviewedAt), 'MMM dd, yyyy')}
                        </div>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleReview(verification)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Review
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t">
            <div className="text-sm text-muted-foreground">
              Page {page} of {totalPages}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Review Dialog */}
      <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Review Verification Request</DialogTitle>
            <DialogDescription>
              Review and approve or reject the verification request
            </DialogDescription>
          </DialogHeader>

          {selectedVerification && (
            <div className="space-y-6">
              {/* User Information */}
              <div className="grid grid-cols-2 gap-4 p-4 rounded-lg bg-secondary/30">
                <div>
                  <Label className="text-sm text-muted-foreground">User</Label>
                  <p className="font-medium">
                    {selectedVerification.userId.firstName} {selectedVerification.userId.lastName}
                  </p>
                  <p className="text-sm text-muted-foreground">{selectedVerification.userId.email}</p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Current Tier</Label>
                  <p className="font-medium">{selectedVerification.userId.accountTier}</p>
                </div>
              </div>

              {/* Document Information */}
              <div className="space-y-4">
                <div>
                  <Label className="text-sm text-muted-foreground">Verification Type</Label>
                  <p className="font-medium">{selectedVerification.verificationType}</p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Document Type</Label>
                  <p className="font-medium">{selectedVerification.documentType.replace(/_/g, ' ')}</p>
                </div>
                {selectedVerification.identityNumber && (
                  <div>
                    <Label className="text-sm text-muted-foreground">Identity Number</Label>
                    <p className="font-medium font-mono">{selectedVerification.identityNumber}</p>
                  </div>
                )}
                {selectedVerification.address && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm text-muted-foreground">Address</Label>
                      <p className="font-medium">{selectedVerification.address}</p>
                    </div>
                    <div>
                      <Label className="text-sm text-muted-foreground">City</Label>
                      <p className="font-medium">{selectedVerification.city}</p>
                    </div>
                    <div>
                      <Label className="text-sm text-muted-foreground">Country</Label>
                      <p className="font-medium">{selectedVerification.country}</p>
                    </div>
                    <div>
                      <Label className="text-sm text-muted-foreground">Postal Code</Label>
                      <p className="font-medium">{selectedVerification.postalCode}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Document Images */}
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-semibold mb-2 block">Front of Document</Label>
                  <div className="border rounded-lg p-4">
                    <img
                      src={`${import.meta.env.VITE_API_URL?.replace('/api/v1', '') || 'http://localhost:3000'}${selectedVerification.frontImageUrl}`}
                      alt="Front document"
                      className="max-h-64 mx-auto rounded"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = selectedVerification.frontImageUrl;
                      }}
                    />
                  </div>
                </div>
                {selectedVerification.backImageUrl && (
                  <div>
                    <Label className="text-sm font-semibold mb-2 block">Back of Document</Label>
                    <div className="border rounded-lg p-4">
                      <img
                        src={`${import.meta.env.VITE_API_URL?.replace('/api/v1', '') || 'http://localhost:3000'}${selectedVerification.backImageUrl}`}
                        alt="Back document"
                        className="max-h-64 mx-auto rounded"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = selectedVerification.backImageUrl!;
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Review Form */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="status">Status *</Label>
                  <Select value={reviewStatus} onValueChange={setReviewStatus} disabled={selectedVerification.status !== 'PENDING'}>
                    <SelectTrigger id="status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="APPROVED">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          Approve
                        </div>
                      </SelectItem>
                      <SelectItem value="REJECTED">
                        <div className="flex items-center gap-2">
                          <XCircle className="h-4 w-4 text-red-500" />
                          Reject
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {reviewStatus === 'REJECTED' && (
                  <div className="space-y-2">
                    <Label htmlFor="rejectionReason">Rejection Reason *</Label>
                    <Textarea
                      id="rejectionReason"
                      placeholder="Enter reason for rejection..."
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      rows={3}
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes (Optional)</Label>
                  <Textarea
                    id="notes"
                    placeholder="Enter any additional notes..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                  />
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setReviewDialogOpen(false)} disabled={processing}>
              Cancel
            </Button>
            <Button
              onClick={handleUpdateStatus}
              disabled={processing || (reviewStatus === 'REJECTED' && !rejectionReason.trim()) || selectedVerification?.status !== 'PENDING'}
              className={reviewStatus === 'APPROVED' ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'}
            >
              {processing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  {reviewStatus === 'APPROVED' ? (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Approve
                    </>
                  ) : (
                    <>
                      <XCircle className="h-4 w-4 mr-2" />
                      Reject
                    </>
                  )}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
