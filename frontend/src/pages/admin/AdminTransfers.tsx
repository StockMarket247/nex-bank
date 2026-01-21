import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { api, ApiError } from '@/lib/api';
import { toast } from 'sonner';
import { ArrowLeftRight, Loader2, User, Building } from 'lucide-react';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
}

interface Account {
  _id: string;
  accountNumber: string;
  type: string;
  balance: string;
  currency: string;
  userId?: any;
}

export default function AdminTransfers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [internalTransferData, setInternalTransferData] = useState({
    fromUserId: '',
    toUserId: '',
    fromAccountId: '',
    toAccountId: '',
    amount: '',
    description: '',
  });
  const [externalTransferData, setExternalTransferData] = useState({
    fromUserId: '',
    fromAccountId: '',
    amount: '',
    recipientBankName: '',
    recipientAccountNumber: '',
    recipientName: '',
    recipientEmail: '',
    recipientPhone: '',
    recipientBankCode: '',
    status: 'COMPLETED',
    description: '',
  });
  const [fromUserAccounts, setFromUserAccounts] = useState<Account[]>([]);
  const [toUserAccounts, setToUserAccounts] = useState<Account[]>([]);
  const [fromUserDetails, setFromUserDetails] = useState<User | null>(null);
  const [toUserDetails, setToUserDetails] = useState<User | null>(null);
  const [loadingFromAccounts, setLoadingFromAccounts] = useState(false);
  const [loadingToAccounts, setLoadingToAccounts] = useState(false);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoadingUsers(true);
      const response = await api.users.getAll({ limit: 1000 });
      setUsers(response.data);
    } catch (error) {
      if (error instanceof ApiError) {
        toast.error(error.message || 'Failed to load users');
      }
    } finally {
      setLoadingUsers(false);
    }
  };

  const loadUserAccounts = async (userId: string, type: 'from' | 'to') => {
    if (!userId) {
      if (type === 'from') {
        setFromUserAccounts([]);
        setFromUserDetails(null);
      } else {
        setToUserAccounts([]);
        setToUserDetails(null);
      }
      return;
    }

    try {
      if (type === 'from') {
        setLoadingFromAccounts(true);
      } else {
        setLoadingToAccounts(true);
      }

      // Get user details
      const user = users.find(u => u.id === userId);
      if (user) {
        if (type === 'from') {
          setFromUserDetails(user);
        } else {
          setToUserDetails(user);
        }
      }

      // Get user accounts - fetch via accounts API
      const accountsResponse = await api.accounts.getAll({ limit: 1000 });
      const userAccounts = accountsResponse.data.filter((acc: any) => {
        // Handle populated userId (object) or unpopulated (string)
        const accUserId = typeof acc.userId === 'object' && acc.userId !== null
          ? (acc.userId._id || acc.userId.id || acc.userId).toString()
          : (acc.userId || '').toString();
        return accUserId === userId;
      });

      if (type === 'from') {
        setFromUserAccounts(userAccounts);
        if (userAccounts.length > 0) {
          setInternalTransferData(prev => ({ ...prev, fromAccountId: userAccounts[0]._id }));
          setExternalTransferData(prev => ({ ...prev, fromAccountId: userAccounts[0]._id }));
        }
      } else {
        setToUserAccounts(userAccounts);
        if (userAccounts.length > 0) {
          setInternalTransferData(prev => ({ ...prev, toAccountId: userAccounts[0]._id }));
        }
      }
    } catch (error) {
      if (error instanceof ApiError) {
        toast.error(error.message || 'Failed to load user accounts');
      }
    } finally {
      if (type === 'from') {
        setLoadingFromAccounts(false);
      } else {
        setLoadingToAccounts(false);
      }
    }
  };

  const handleInternalTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!internalTransferData.fromUserId || !internalTransferData.toUserId || !internalTransferData.amount) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (internalTransferData.fromUserId === internalTransferData.toUserId) {
      toast.error('Cannot transfer to the same user');
      return;
    }

    try {
      setProcessing(true);
      const result = await api.admin.createInternalTransfer({
        fromUserId: internalTransferData.fromUserId,
        toUserId: internalTransferData.toUserId,
        amount: parseFloat(internalTransferData.amount),
        fromAccountId: internalTransferData.fromAccountId || undefined,
        toAccountId: internalTransferData.toAccountId || undefined,
        description: internalTransferData.description || undefined,
      });
      
      toast.success(`Transfer completed successfully. ${fromUserDetails?.firstName} ${fromUserDetails?.lastName} → ${toUserDetails?.firstName} ${toUserDetails?.lastName}`);
      
      // Reset form
      setInternalTransferData({
        fromUserId: '',
        toUserId: '',
        fromAccountId: '',
        toAccountId: '',
        amount: '',
        description: '',
      });
      setFromUserAccounts([]);
      setToUserAccounts([]);
      setFromUserDetails(null);
      setToUserDetails(null);
    } catch (error) {
      if (error instanceof ApiError) {
        toast.error(error.message || 'Failed to create transfer');
      }
    } finally {
      setProcessing(false);
    }
  };

  const handleExternalTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!externalTransferData.fromUserId || !externalTransferData.amount || !externalTransferData.recipientBankName || !externalTransferData.recipientAccountNumber || !externalTransferData.recipientName) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setProcessing(true);
      await api.admin.createExternalTransfer({
        fromUserId: externalTransferData.fromUserId,
        fromAccountId: externalTransferData.fromAccountId || undefined,
        amount: parseFloat(externalTransferData.amount),
        recipientBankName: externalTransferData.recipientBankName,
        recipientAccountNumber: externalTransferData.recipientAccountNumber,
        recipientName: externalTransferData.recipientName,
        recipientEmail: externalTransferData.recipientEmail || undefined,
        recipientPhone: externalTransferData.recipientPhone || undefined,
        recipientBankCode: externalTransferData.recipientBankCode || undefined,
        status: externalTransferData.status as any,
        description: externalTransferData.description || undefined,
      });
      
      toast.success('External transfer created successfully');
      
      // Reset form
      setExternalTransferData({
        fromUserId: '',
        fromAccountId: '',
        amount: '',
        recipientBankName: '',
        recipientAccountNumber: '',
        recipientName: '',
        recipientEmail: '',
        recipientPhone: '',
        recipientBankCode: '',
        status: 'COMPLETED',
        description: '',
      });
      setFromUserAccounts([]);
      setFromUserDetails(null);
    } catch (error) {
      if (error instanceof ApiError) {
        toast.error(error.message || 'Failed to create transfer');
      }
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-4xl font-heading font-bold">Create Transfers</h1>

      <Tabs defaultValue="internal" className="space-y-6">
        <TabsList>
          <TabsTrigger value="internal">Internal Transfer</TabsTrigger>
          <TabsTrigger value="external">External Transfer</TabsTrigger>
        </TabsList>

        <TabsContent value="internal">
          <Card className="glass-card p-6">
            <h2 className="text-2xl font-heading font-semibold mb-6">Internal Transfer</h2>
            <form onSubmit={handleInternalTransfer} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">From</h3>
                  
                  <div className="space-y-2">
                    <Label htmlFor="fromUserId">User ID *</Label>
                    <Select
                      value={internalTransferData.fromUserId}
                      onValueChange={(value) => {
                        setInternalTransferData(prev => ({ ...prev, fromUserId: value, fromAccountId: '' }));
                        loadUserAccounts(value, 'from');
                      }}
                    >
                      <SelectTrigger id="fromUserId">
                        <SelectValue placeholder="Select sender user" />
                      </SelectTrigger>
                      <SelectContent>
                        {users.map((user) => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.firstName} {user.lastName} ({user.email})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {fromUserDetails && (
                      <p className="text-sm text-muted-foreground">
                        {fromUserDetails.firstName} {fromUserDetails.lastName} - {fromUserDetails.email}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="fromAccountId">Account (optional)</Label>
                    {loadingFromAccounts ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Select
                        value={internalTransferData.fromAccountId}
                        onValueChange={(value) => setInternalTransferData(prev => ({ ...prev, fromAccountId: value }))}
                        disabled={!internalTransferData.fromUserId || fromUserAccounts.length === 0}
                      >
                        <SelectTrigger id="fromAccountId">
                          <SelectValue placeholder="Auto-select first account" />
                        </SelectTrigger>
                        <SelectContent>
                          {fromUserAccounts.map((account) => (
                            <SelectItem key={account._id} value={account._id}>
                              {account.accountNumber} ({account.type}) - {account.currency} {parseFloat(account.balance).toFixed(2)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">To</h3>
                  
                  <div className="space-y-2">
                    <Label htmlFor="toUserId">User ID *</Label>
                    <Select
                      value={internalTransferData.toUserId}
                      onValueChange={(value) => {
                        setInternalTransferData(prev => ({ ...prev, toUserId: value, toAccountId: '' }));
                        loadUserAccounts(value, 'to');
                      }}
                    >
                      <SelectTrigger id="toUserId">
                        <SelectValue placeholder="Select recipient user" />
                      </SelectTrigger>
                      <SelectContent>
                        {users.map((user) => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.firstName} {user.lastName} ({user.email})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {toUserDetails && (
                      <p className="text-sm text-muted-foreground">
                        {toUserDetails.firstName} {toUserDetails.lastName} - {toUserDetails.email}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="toAccountId">Account (optional)</Label>
                    {loadingToAccounts ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Select
                        value={internalTransferData.toAccountId}
                        onValueChange={(value) => setInternalTransferData(prev => ({ ...prev, toAccountId: value }))}
                        disabled={!internalTransferData.toUserId || toUserAccounts.length === 0}
                      >
                        <SelectTrigger id="toAccountId">
                          <SelectValue placeholder="Auto-select first account" />
                        </SelectTrigger>
                        <SelectContent>
                          {toUserAccounts.map((account) => (
                            <SelectItem key={account._id} value={account._id}>
                              {account.accountNumber} ({account.type}) - {account.currency} {parseFloat(account.balance).toFixed(2)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount">Amount *</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={internalTransferData.amount}
                  onChange={(e) => setInternalTransferData(prev => ({ ...prev, amount: e.target.value }))}
                  placeholder="0.00"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description (optional)</Label>
                <Textarea
                  id="description"
                  value={internalTransferData.description}
                  onChange={(e) => setInternalTransferData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Transfer description"
                  rows={3}
                />
              </div>

              <Button type="submit" className="gradient-primary w-full" disabled={processing}>
                {processing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <ArrowLeftRight className="h-4 w-4 mr-2" />
                    Create Internal Transfer
                  </>
                )}
              </Button>
            </form>
          </Card>
        </TabsContent>

        <TabsContent value="external">
          <Card className="glass-card p-6">
            <h2 className="text-2xl font-heading font-semibold mb-6">External Transfer</h2>
            <form onSubmit={handleExternalTransfer} className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">From</h3>
                
                <div className="space-y-2">
                  <Label htmlFor="extFromUserId">User ID *</Label>
                  <Select
                    value={externalTransferData.fromUserId}
                    onValueChange={(value) => {
                      setExternalTransferData(prev => ({ ...prev, fromUserId: value, fromAccountId: '' }));
                      loadUserAccounts(value, 'from');
                    }}
                  >
                    <SelectTrigger id="extFromUserId">
                      <SelectValue placeholder="Select sender user" />
                    </SelectTrigger>
                    <SelectContent>
                      {users.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.firstName} {user.lastName} ({user.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {fromUserDetails && (
                    <p className="text-sm text-muted-foreground">
                      {fromUserDetails.firstName} {fromUserDetails.lastName} - {fromUserDetails.email}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="extFromAccountId">Account (optional)</Label>
                  {loadingFromAccounts ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Select
                      value={externalTransferData.fromAccountId}
                      onValueChange={(value) => setExternalTransferData(prev => ({ ...prev, fromAccountId: value }))}
                      disabled={!externalTransferData.fromUserId || fromUserAccounts.length === 0}
                    >
                      <SelectTrigger id="extFromAccountId">
                        <SelectValue placeholder="Auto-select first account" />
                      </SelectTrigger>
                      <SelectContent>
                        {fromUserAccounts.map((account) => (
                          <SelectItem key={account._id} value={account._id}>
                            {account.accountNumber} ({account.type}) - {account.currency} {parseFloat(account.balance).toFixed(2)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">To (External Bank)</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="recipientBankName">Bank Name *</Label>
                    <Input
                      id="recipientBankName"
                      value={externalTransferData.recipientBankName}
                      onChange={(e) => setExternalTransferData(prev => ({ ...prev, recipientBankName: e.target.value }))}
                      placeholder="Chase Bank"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="recipientBankCode">Bank Code (optional)</Label>
                    <Input
                      id="recipientBankCode"
                      value={externalTransferData.recipientBankCode}
                      onChange={(e) => setExternalTransferData(prev => ({ ...prev, recipientBankCode: e.target.value }))}
                      placeholder="CHASE"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="recipientAccountNumber">Account Number *</Label>
                    <Input
                      id="recipientAccountNumber"
                      value={externalTransferData.recipientAccountNumber}
                      onChange={(e) => setExternalTransferData(prev => ({ ...prev, recipientAccountNumber: e.target.value }))}
                      placeholder="1234567890"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="recipientName">Recipient Name *</Label>
                    <Input
                      id="recipientName"
                      value={externalTransferData.recipientName}
                      onChange={(e) => setExternalTransferData(prev => ({ ...prev, recipientName: e.target.value }))}
                      placeholder="John Doe"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="recipientEmail">Email (optional)</Label>
                    <Input
                      id="recipientEmail"
                      type="email"
                      value={externalTransferData.recipientEmail}
                      onChange={(e) => setExternalTransferData(prev => ({ ...prev, recipientEmail: e.target.value }))}
                      placeholder="john@example.com"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="recipientPhone">Phone (optional)</Label>
                    <Input
                      id="recipientPhone"
                      value={externalTransferData.recipientPhone}
                      onChange={(e) => setExternalTransferData(prev => ({ ...prev, recipientPhone: e.target.value }))}
                      placeholder="+1234567890"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="extAmount">Amount *</Label>
                  <Input
                    id="extAmount"
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={externalTransferData.amount}
                    onChange={(e) => setExternalTransferData(prev => ({ ...prev, amount: e.target.value }))}
                    placeholder="0.00"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={externalTransferData.status}
                    onValueChange={(value) => setExternalTransferData(prev => ({ ...prev, status: value }))}
                  >
                    <SelectTrigger id="status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="COMPLETED">Completed</SelectItem>
                      <SelectItem value="PENDING">Pending</SelectItem>
                      <SelectItem value="PROCESSING">Processing</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="extDescription">Description (optional)</Label>
                <Textarea
                  id="extDescription"
                  value={externalTransferData.description}
                  onChange={(e) => setExternalTransferData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Transfer description"
                  rows={3}
                />
              </div>

              <Button type="submit" className="gradient-primary w-full" disabled={processing}>
                {processing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Building className="h-4 w-4 mr-2" />
                    Create External Transfer
                  </>
                )}
              </Button>
            </form>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
