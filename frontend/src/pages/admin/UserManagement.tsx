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
import { Loader2, Ban, UserX, CheckCircle2 } from 'lucide-react';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  kycStatus: string;
  status: string;
  createdAt: string;
}

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [suspendDialogOpen, setSuspendDialogOpen] = useState(false);
  const [closeDialogOpen, setCloseDialogOpen] = useState(false);
  const [suspendReason, setSuspendReason] = useState('');
  const [processing, setProcessing] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    loadUsers();
  }, [page]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await api.users.getAll({ page, limit: 10 });
      setUsers(response.data);
      setTotalPages(response.meta.totalPages);
    } catch (error) {
      if (error instanceof ApiError) {
        toast.error(error.message || 'Failed to load users');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSuspend = async (suspended: boolean) => {
    if (!selectedUser) return;

    try {
      setProcessing(true);
      await api.admin.suspendUser(selectedUser.id, suspended, suspendReason);
      toast.success(`User ${suspended ? 'suspended' : 'unsuspended'} successfully`);
      setSuspendDialogOpen(false);
      setSelectedUser(null);
      setSuspendReason('');
      loadUsers();
    } catch (error) {
      if (error instanceof ApiError) {
        toast.error(error.message || 'Failed to update user status');
      }
    } finally {
      setProcessing(false);
    }
  };

  const handleClose = async () => {
    if (!selectedUser) return;

    try {
      setProcessing(true);
      await api.admin.closeUser(selectedUser.id);
      toast.success('User account closed');
      setCloseDialogOpen(false);
      setSelectedUser(null);
      loadUsers();
    } catch (error) {
      if (error instanceof ApiError) {
        toast.error(error.message || 'Failed to close user account');
      }
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <Badge className="bg-green-500">Active</Badge>;
      case 'SUSPENDED':
        return <Badge className="bg-yellow-500">Suspended</Badge>;
      case 'CLOSED':
        return <Badge className="bg-red-500">Closed</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getKycBadge = (kycStatus: string) => {
    switch (kycStatus) {
      case 'VERIFIED':
        return <Badge variant="outline" className="bg-green-500/10">Verified</Badge>;
      case 'PENDING':
        return <Badge variant="outline" className="bg-yellow-500/10">Pending</Badge>;
      case 'REJECTED':
        return <Badge variant="outline" className="bg-red-500/10">Rejected</Badge>;
      default:
        return <Badge variant="outline">{kycStatus}</Badge>;
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
      <h1 className="text-4xl font-heading font-bold">User Management</h1>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>KYC Status</TableHead>
              <TableHead>Account Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">
                  {user.firstName} {user.lastName}
                </TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{getKycBadge(user.kycStatus)}</TableCell>
                <TableCell>{getStatusBadge(user.status)}</TableCell>
                <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    {user.status === 'ACTIVE' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedUser(user);
                          setSuspendDialogOpen(true);
                        }}
                      >
                        <Ban className="h-4 w-4 mr-2" />
                        Suspend
                      </Button>
                    )}
                    {user.status === 'SUSPENDED' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedUser(user);
                          handleSuspend(false);
                        }}
                      >
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Unsuspend
                      </Button>
                    )}
                    {user.status !== 'CLOSED' && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                          setSelectedUser(user);
                          setCloseDialogOpen(true);
                        }}
                      >
                        <UserX className="h-4 w-4 mr-2" />
                        Close
                      </Button>
                    )}
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

      {/* Suspend Dialog */}
      <Dialog open={suspendDialogOpen} onOpenChange={setSuspendDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Suspend User</DialogTitle>
            <DialogDescription>
              Suspend user account: {selectedUser?.firstName} {selectedUser?.lastName} ({selectedUser?.email})
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reason">Reason (Optional)</Label>
              <Textarea
                id="reason"
                placeholder="Enter reason for suspension..."
                value={suspendReason}
                onChange={(e) => setSuspendReason(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSuspendDialogOpen(false)} disabled={processing}>
              Cancel
            </Button>
            <Button onClick={() => handleSuspend(true)} disabled={processing}>
              {processing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Suspend User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Close Dialog */}
      <Dialog open={closeDialogOpen} onOpenChange={setCloseDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Close User Account</DialogTitle>
            <DialogDescription>
              This action cannot be undone. Are you sure you want to close the account for{' '}
              {selectedUser?.firstName} {selectedUser?.lastName} ({selectedUser?.email})?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCloseDialogOpen(false)} disabled={processing}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleClose} disabled={processing}>
              {processing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Close Account
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

