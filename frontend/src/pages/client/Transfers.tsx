import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UserPlus, Building, Globe, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { CreateTransferPinModal } from '@/components/transfer/CreateTransferPinModal';
import { ConfirmTransferPinModal } from '@/components/transfer/ConfirmTransferPinModal';
import AddBeneficiaryModal from '@/components/beneficiary/AddBeneficiaryModal';
import BeneficiaryAutocomplete from '@/components/beneficiary/BeneficiaryAutocomplete';
import { Beneficiary } from '@/components/beneficiary/AddBeneficiaryModal';

interface Account {
  _id: string;
  accountNumber: string;
  type: string;
  balance: string;
  currency: string;
}

export default function Transfers() {
  const { t } = useTranslation('dashboard');
  const { toast } = useToast();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasTransferPin, setHasTransferPin] = useState<boolean | null>(null);
  const [showCreatePinModal, setShowCreatePinModal] = useState(false);
  const [showConfirmPinModal, setShowConfirmPinModal] = useState(false);
  const [pendingTransfer, setPendingTransfer] = useState<(() => Promise<void>) | null>(null);
  const [beneficiaryModalOpen, setBeneficiaryModalOpen] = useState(false);
  const [transferData, setTransferData] = useState({
    fromAccount: '',
    toAccount: '',
    amount: '',
    description: '',
  });
  const [externalTransferData, setExternalTransferData] = useState({
    accountId: '',
    amount: '',
    recipientBankName: '',
    recipientAccountNumber: '',
    recipientName: '',
    description: '',
  });
  const [internationalTransferData, setInternationalTransferData] = useState({
    accountId: '',
    amount: '',
    currency: 'GBP',
    recipientCountry: '',
    recipientAccountNumber: '',
    swiftBicCode: '',
    recipientName: '',
    description: '',
  });

  useEffect(() => {
    fetchAccounts();
    checkTransferPin();
  }, []);

  const checkTransferPin = async () => {
    try {
      const response = await api.users.hasTransferPin();
      setHasTransferPin(response.hasTransferPin);
    } catch (error: any) {
      console.error('Failed to check transfer PIN:', error);
    }
  };

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const accountsData = await api.accounts.getMyAccounts();
      setAccounts(accountsData);
      if (accountsData.length > 0) {
        setTransferData(prev => ({ ...prev, fromAccount: accountsData[0]._id }));
        setExternalTransferData(prev => ({ ...prev, accountId: accountsData[0]._id }));
        setInternationalTransferData(prev => ({ ...prev, accountId: accountsData[0]._id }));
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

  const executeInternalTransfer = async () => {
    try {
      await api.transactions.createInternalTransfer({
        fromAccountId: transferData.fromAccount,
        toAccountNumber: transferData.toAccount,
        amount: parseFloat(transferData.amount),
        description: transferData.description || undefined,
      });
      toast({
        title: 'Success',
        description: `Transfer of $${transferData.amount} initiated successfully`,
      });
      setTransferData({ ...transferData, toAccount: '', amount: '', description: '' });
      await fetchAccounts(); // Refresh accounts to update balances
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to initiate transfer',
        variant: 'destructive',
      });
    }
  };

  const handleInternalTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (hasTransferPin === false) {
      setShowCreatePinModal(true);
      setPendingTransfer(() => executeInternalTransfer);
      return;
    }
    
    if (hasTransferPin === true) {
      setShowConfirmPinModal(true);
      setPendingTransfer(() => executeInternalTransfer);
      return;
    }
    
    // If hasTransferPin is null, wait for it to load
    if (hasTransferPin === null) {
      await checkTransferPin();
      return;
    }
  };

  const executeExternalTransfer = async () => {
    try {
      await api.transfers.createExternal({
        accountId: externalTransferData.accountId,
        amount: parseFloat(externalTransferData.amount),
        recipientBankName: externalTransferData.recipientBankName,
        recipientAccountNumber: externalTransferData.recipientAccountNumber,
        recipientName: externalTransferData.recipientName,
        description: externalTransferData.description || undefined,
      });
      toast({
        title: 'Success',
        description: `External transfer of $${externalTransferData.amount} initiated successfully. Pending admin approval.`,
      });
      setExternalTransferData({
        ...externalTransferData,
        amount: '',
        recipientBankName: '',
        recipientAccountNumber: '',
        recipientName: '',
        description: '',
      });
      await fetchAccounts(); // Refresh accounts to update balances
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to initiate transfer',
        variant: 'destructive',
      });
    }
  };

  const handleExternalTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (hasTransferPin === false) {
      setShowCreatePinModal(true);
      setPendingTransfer(() => executeExternalTransfer);
      return;
    }
    
    if (hasTransferPin === true) {
      setShowConfirmPinModal(true);
      setPendingTransfer(() => executeExternalTransfer);
      return;
    }
    
    // If hasTransferPin is null, wait for it to load
    if (hasTransferPin === null) {
      await checkTransferPin();
      return;
    }
  };

  const executeInternationalTransfer = async () => {
    try {
      await api.transfers.createInternational({
        accountId: internationalTransferData.accountId,
        amount: parseFloat(internationalTransferData.amount),
        currency: internationalTransferData.currency,
        recipientCountry: internationalTransferData.recipientCountry,
        recipientAccountNumber: internationalTransferData.recipientAccountNumber,
        swiftBicCode: internationalTransferData.swiftBicCode || undefined,
        recipientName: internationalTransferData.recipientName,
        description: internationalTransferData.description || undefined,
      });
      toast({
        title: 'Success',
        description: `International transfer of ${internationalTransferData.currency} ${internationalTransferData.amount} initiated successfully. Pending admin approval.`,
      });
      setInternationalTransferData({
        ...internationalTransferData,
        amount: '',
        recipientCountry: '',
        recipientAccountNumber: '',
        swiftBicCode: '',
        recipientName: '',
        description: '',
      });
      await fetchAccounts(); // Refresh accounts to update balances
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to initiate transfer',
        variant: 'destructive',
      });
    }
  };

  const handleInternationalTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (hasTransferPin === false) {
      setShowCreatePinModal(true);
      setPendingTransfer(() => executeInternationalTransfer);
      return;
    }
    
    if (hasTransferPin === true) {
      setShowConfirmPinModal(true);
      setPendingTransfer(() => executeInternationalTransfer);
      return;
    }
    
    // If hasTransferPin is null, wait for it to load
    if (hasTransferPin === null) {
      await checkTransferPin();
      return;
    }
  };

  const handlePinCreated = async () => {
    await checkTransferPin();
    if (pendingTransfer) {
      setShowConfirmPinModal(true);
    }
  };

  const handlePinConfirmed = async () => {
    if (pendingTransfer) {
      await pendingTransfer();
      setPendingTransfer(null);
    }
  };

  const handleBeneficiarySelectInternal = (beneficiary: Beneficiary) => {
    // Internal transfers only need account number
    // Name will be fetched from the backend when transferring
  };

  const handleBeneficiarySelectExternal = (beneficiary: Beneficiary) => {
    setExternalTransferData({
      ...externalTransferData,
      recipientAccountNumber: beneficiary.accountNumber,
      recipientName: beneficiary.name,
      recipientBankName: beneficiary.bankName || '',
    });
  };

  const handleBeneficiarySelectInternational = (beneficiary: Beneficiary) => {
    setInternationalTransferData({
      ...internationalTransferData,
      recipientAccountNumber: beneficiary.accountNumber,
      recipientName: beneficiary.name,
      swiftBicCode: beneficiary.bankCode || '',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-4xl font-heading font-bold">{t('transfers')}</h1>
        <Button 
          className="gradient-primary h-10 w-10 p-0 md:w-auto md:px-4"
          onClick={() => setBeneficiaryModalOpen(true)}
          title={t('addBeneficiary')}
        >
          <UserPlus className="h-4 w-4 md:mr-2" />
          <span className="hidden md:inline">{t('addBeneficiary')}</span>
        </Button>
      </div>

      <Tabs defaultValue="internal" className="w-full">
        <TabsList className="grid w-full md:w-[400px] grid-cols-3">
          <TabsTrigger value="internal">
            <Building className="h-4 w-4 mr-2" />
            Internal
          </TabsTrigger>
          <TabsTrigger value="external">
            <Building className="h-4 w-4 mr-2" />
            External
          </TabsTrigger>
          <TabsTrigger value="international">
            <Globe className="h-4 w-4 mr-2" />
            International
          </TabsTrigger>
        </TabsList>

        <TabsContent value="internal" className="mt-6">
          <Card className="glass-card p-6">
            <h2 className="text-xl font-heading font-semibold mb-6">Internal Transfer</h2>
            <form onSubmit={handleInternalTransfer} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="fromAccount">From Account</Label>
                  <Select value={transferData.fromAccount} onValueChange={(value) => 
                    setTransferData({ ...transferData, fromAccount: value })
                  }>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {accounts.map((account) => (
                        <SelectItem key={account._id} value={account._id}>
                          {account.type} ({account.accountNumber})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="toAccount">To Account Number</Label>
                  <BeneficiaryAutocomplete
                    value={transferData.toAccount}
                    onChange={(value) => setTransferData({ ...transferData, toAccount: value })}
                    onSelectBeneficiary={handleBeneficiarySelectInternal}
                    placeholder="Enter account number"
                    required
                    filterType="internal"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount">Amount</Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="0.00"
                  value={transferData.amount}
                  onChange={(e) => setTransferData({ ...transferData, amount: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Input
                  id="description"
                  placeholder="What's this for?"
                  value={transferData.description}
                  onChange={(e) => setTransferData({ ...transferData, description: e.target.value })}
                />
              </div>

              <Button type="submit" className="w-full gradient-primary">
                {t('transferMoney')}
              </Button>
            </form>
          </Card>
        </TabsContent>

        <TabsContent value="external" className="mt-6">
          <Card className="glass-card p-6">
            <h2 className="text-xl font-heading font-semibold mb-6">External Bank Transfer</h2>
            <form onSubmit={handleExternalTransfer} className="space-y-6">
              <div className="space-y-2">
                <Label>From Account</Label>
                <Select value={externalTransferData.accountId} onValueChange={(value) => 
                  setExternalTransferData({ ...externalTransferData, accountId: value })
                }>
                  <SelectTrigger>
                    <SelectValue placeholder="Select account" />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts.map((account) => (
                      <SelectItem key={account._id} value={account._id}>
                        {account.type} ({account.accountNumber})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Recipient Bank Name</Label>
                <Input
                  value={externalTransferData.recipientBankName}
                  onChange={(e) => setExternalTransferData({ ...externalTransferData, recipientBankName: e.target.value })}
                  placeholder="Bank name"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Recipient Account Number</Label>
                  <BeneficiaryAutocomplete
                    value={externalTransferData.recipientAccountNumber}
                    onChange={(value) => setExternalTransferData({ ...externalTransferData, recipientAccountNumber: value })}
                    onSelectBeneficiary={handleBeneficiarySelectExternal}
                    placeholder="Account number"
                    required
                    filterType="external"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Recipient Name</Label>
                  <Input
                    value={externalTransferData.recipientName}
                    onChange={(e) => setExternalTransferData({ ...externalTransferData, recipientName: e.target.value })}
                    placeholder="Recipient full name"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Amount</Label>
                <Input
                  type="number"
                  value={externalTransferData.amount}
                  onChange={(e) => setExternalTransferData({ ...externalTransferData, amount: e.target.value })}
                  placeholder="0.00"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Input
                  value={externalTransferData.description}
                  onChange={(e) => setExternalTransferData({ ...externalTransferData, description: e.target.value })}
                  placeholder="What's this for?"
                />
              </div>

              <Button type="submit" className="w-full gradient-primary">
                {t('transferMoney')}
              </Button>
            </form>
          </Card>
        </TabsContent>

        <TabsContent value="international" className="mt-6">
          <Card className="glass-card p-6">
            <h2 className="text-xl font-heading font-semibold mb-6">International Transfer</h2>
            <form onSubmit={handleInternationalTransfer} className="space-y-6">
              <div className="space-y-2">
                <Label>From Account</Label>
                <Select value={internationalTransferData.accountId} onValueChange={(value) => 
                  setInternationalTransferData({ ...internationalTransferData, accountId: value })
                }>
                  <SelectTrigger>
                    <SelectValue placeholder="Select account" />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts.map((account) => (
                      <SelectItem key={account._id} value={account._id}>
                        {account.type} ({account.accountNumber})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Recipient Country</Label>
                  <Input
                    value={internationalTransferData.recipientCountry}
                    onChange={(e) => setInternationalTransferData({ ...internationalTransferData, recipientCountry: e.target.value })}
                    placeholder="e.g., United Kingdom"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Currency</Label>
                  <Select value={internationalTransferData.currency} onValueChange={(value) => 
                    setInternationalTransferData({ ...internationalTransferData, currency: value })
                  }>
                    <SelectTrigger>
                      <SelectValue placeholder="Select currency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="GBP">GBP</SelectItem>
                      <SelectItem value="EUR">EUR</SelectItem>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="CAD">CAD</SelectItem>
                      <SelectItem value="AUD">AUD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Amount</Label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={internationalTransferData.amount}
                  onChange={(e) => setInternationalTransferData({ ...internationalTransferData, amount: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>IBAN / Account Number</Label>
                <BeneficiaryAutocomplete
                  value={internationalTransferData.recipientAccountNumber}
                  onChange={(value) => setInternationalTransferData({ ...internationalTransferData, recipientAccountNumber: value })}
                  onSelectBeneficiary={handleBeneficiarySelectInternational}
                  placeholder="Enter IBAN or account number"
                  required
                  filterType="all"
                />
              </div>

              <div className="space-y-2">
                <Label>SWIFT/BIC Code</Label>
                <Input
                  placeholder="Enter SWIFT/BIC code"
                  value={internationalTransferData.swiftBicCode}
                  onChange={(e) => setInternationalTransferData({ ...internationalTransferData, swiftBicCode: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Recipient Name</Label>
                <Input
                  placeholder="Recipient full name"
                  value={internationalTransferData.recipientName}
                  onChange={(e) => setInternationalTransferData({ ...internationalTransferData, recipientName: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Description (Optional)</Label>
                <Input
                  placeholder="What's this for?"
                  value={internationalTransferData.description}
                  onChange={(e) => setInternationalTransferData({ ...internationalTransferData, description: e.target.value })}
                />
              </div>

              <Button type="submit" className="w-full gradient-primary">
                {t('transferMoney')}
              </Button>
            </form>
          </Card>
        </TabsContent>
      </Tabs>

      <CreateTransferPinModal
        open={showCreatePinModal}
        onClose={() => {
          setShowCreatePinModal(false);
          setPendingTransfer(null);
        }}
        onSuccess={handlePinCreated}
      />

      <ConfirmTransferPinModal
        open={showConfirmPinModal}
        onClose={() => {
          setShowConfirmPinModal(false);
          setPendingTransfer(null);
        }}
        onSuccess={handlePinConfirmed}
      />

      <AddBeneficiaryModal
        open={beneficiaryModalOpen}
        onOpenChange={setBeneficiaryModalOpen}
        onSuccess={() => {
          // Beneficiary added successfully, suggestions will update automatically
        }}
      />
    </div>
  );
}
