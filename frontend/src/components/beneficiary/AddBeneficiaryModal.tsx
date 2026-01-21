import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UserPlus, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export interface Beneficiary {
  id: string;
  name: string;
  accountNumber: string;
  bankName: string;
  bankCode?: string;
  type: 'internal' | 'external';
  email?: string;
  createdAt: string;
}

interface AddBeneficiaryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const STORAGE_KEY = 'beneficiaries';

export const getBeneficiaries = (): Beneficiary[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error loading beneficiaries:', error);
    return [];
  }
};

export const saveBeneficiary = (beneficiary: Omit<Beneficiary, 'id' | 'createdAt'>): Beneficiary => {
  const beneficiaries = getBeneficiaries();
  const newBeneficiary: Beneficiary = {
    ...beneficiary,
    id: `beneficiary-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    createdAt: new Date().toISOString(),
  };
  beneficiaries.push(newBeneficiary);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(beneficiaries));
  return newBeneficiary;
};

export const deleteBeneficiary = (id: string): void => {
  const beneficiaries = getBeneficiaries();
  const filtered = beneficiaries.filter(b => b.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
};

export default function AddBeneficiaryModal({
  open,
  onOpenChange,
  onSuccess,
}: AddBeneficiaryModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    accountNumber: '',
    bankName: '',
    bankCode: '',
    type: 'external' as 'internal' | 'external',
    email: '',
  });

  const resetForm = () => {
    setFormData({
      name: '',
      accountNumber: '',
      bankName: '',
      bankCode: '',
      type: 'external',
      email: '',
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.name.trim()) {
      toast.error('Please enter beneficiary name');
      return;
    }
    
    if (!formData.accountNumber.trim()) {
      toast.error('Please enter account number');
      return;
    }

    if (formData.type === 'external' && !formData.bankName.trim()) {
      toast.error('Please enter bank name for external beneficiary');
      return;
    }

    try {
      setLoading(true);

      // Check for duplicates
      const beneficiaries = getBeneficiaries();
      const isDuplicate = beneficiaries.some(
        b => b.accountNumber === formData.accountNumber && b.type === formData.type
      );

      if (isDuplicate) {
        toast.error('A beneficiary with this account number already exists');
        return;
      }

      // Save to localStorage
      const beneficiary: Omit<Beneficiary, 'id' | 'createdAt'> = {
        name: formData.name.trim(),
        accountNumber: formData.accountNumber.trim(),
        bankName: formData.bankName.trim() || '',
        bankCode: formData.bankCode.trim() || undefined,
        type: formData.type,
        email: formData.email.trim() || undefined,
      };

      saveBeneficiary(beneficiary);

      toast.success('Beneficiary added successfully!');
      resetForm();
      onOpenChange(false);
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error saving beneficiary:', error);
      toast.error('Failed to add beneficiary. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      resetForm();
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Add Beneficiary
          </DialogTitle>
          <DialogDescription>
            Add a new beneficiary to make future transfers easier
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="type">Beneficiary Type *</Label>
            <Select
              value={formData.type}
              onValueChange={(value: 'internal' | 'external') => {
                setFormData({ ...formData, type: value });
              }}
            >
              <SelectTrigger id="type">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="internal">Internal (Same Bank)</SelectItem>
                <SelectItem value="external">External (Other Bank)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Beneficiary Name *</Label>
            <Input
              id="name"
              placeholder="Enter full name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="accountNumber">Account Number *</Label>
            <Input
              id="accountNumber"
              placeholder="Enter account number"
              value={formData.accountNumber}
              onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
              required
              disabled={loading}
            />
          </div>

          {formData.type === 'external' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="bankName">Bank Name *</Label>
                <Input
                  id="bankName"
                  placeholder="Enter bank name"
                  value={formData.bankName}
                  onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                  required={formData.type === 'external'}
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bankCode">Bank Code (Optional)</Label>
                <Input
                  id="bankCode"
                  placeholder="Enter bank code (e.g., SWIFT, IFSC)"
                  value={formData.bankCode}
                  onChange={(e) => setFormData({ ...formData, bankCode: e.target.value })}
                  disabled={loading}
                />
              </div>
            </>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email (Optional)</Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter email address"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              disabled={loading}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add Beneficiary
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
