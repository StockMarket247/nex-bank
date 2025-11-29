import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { mockAccounts, mockBeneficiaries } from '@/lib/mockData';
import { UserPlus, Building, Globe } from 'lucide-react';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

export default function Transfers() {
  const { t } = useTranslation('dashboard');
  const { toast } = useToast();
  const [transferData, setTransferData] = useState({
    fromAccount: mockAccounts[0].id,
    toAccount: '',
    amount: '',
    description: '',
  });

  const handleTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: 'Transfer initiated',
      description: `$${transferData.amount} will be transferred shortly`,
    });
    setTransferData({ ...transferData, amount: '', description: '' });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-4xl font-heading font-bold">{t('transfers')}</h1>
        <Button className="gradient-primary">
          <UserPlus className="h-4 w-4 mr-2" />
          {t('addBeneficiary')}
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
            <form onSubmit={handleTransfer} className="space-y-6">
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
                      {mockAccounts.map((account) => (
                        <SelectItem key={account.id} value={account.id}>
                          {account.name} ({account.accountNumber})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="toAccount">To Account</Label>
                  <Select value={transferData.toAccount} onValueChange={(value) => 
                    setTransferData({ ...transferData, toAccount: value })
                  }>
                    <SelectTrigger>
                      <SelectValue placeholder="Select account" />
                    </SelectTrigger>
                    <SelectContent>
                      {mockAccounts
                        .filter(acc => acc.id !== transferData.fromAccount)
                        .map((account) => (
                          <SelectItem key={account.id} value={account.id}>
                            {account.name} ({account.accountNumber})
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
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
            <form className="space-y-6">
              <div className="space-y-2">
                <Label>Beneficiary</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select beneficiary" />
                  </SelectTrigger>
                  <SelectContent>
                    {mockBeneficiaries.map((beneficiary) => (
                      <SelectItem key={beneficiary.id} value={beneficiary.id}>
                        {beneficiary.name} - {beneficiary.bank}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Amount</Label>
                <Input type="number" placeholder="0.00" required />
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Input placeholder="What's this for?" />
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
            <form className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Recipient Country</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select country" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="uk">United Kingdom</SelectItem>
                      <SelectItem value="eu">Europe (SEPA)</SelectItem>
                      <SelectItem value="ca">Canada</SelectItem>
                      <SelectItem value="au">Australia</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Currency</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select currency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gbp">GBP</SelectItem>
                      <SelectItem value="eur">EUR</SelectItem>
                      <SelectItem value="cad">CAD</SelectItem>
                      <SelectItem value="aud">AUD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Amount</Label>
                <Input type="number" placeholder="0.00" required />
              </div>

              <div className="space-y-2">
                <Label>IBAN / Account Number</Label>
                <Input placeholder="Enter IBAN or account number" required />
              </div>

              <div className="space-y-2">
                <Label>SWIFT/BIC Code</Label>
                <Input placeholder="Enter SWIFT/BIC code" />
              </div>

              <Button type="submit" className="w-full gradient-primary">
                {t('transferMoney')}
              </Button>
            </form>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Beneficiaries */}
      <Card className="glass-card p-6">
        <h2 className="text-xl font-heading font-semibold mb-6">{t('beneficiaries')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {mockBeneficiaries.map((beneficiary) => (
            <Card key={beneficiary.id} className="p-4 hover:shadow-glass transition-shadow">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-primary font-semibold text-lg">
                    {beneficiary.name.charAt(0)}
                  </span>
                </div>
                <div className="flex-1">
                  <p className="font-semibold">{beneficiary.name}</p>
                  <p className="text-sm text-muted-foreground">{beneficiary.bank}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </Card>
    </div>
  );
}
