import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface CreateTransferPinModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateTransferPinModal({ open, onClose, onSuccess }: CreateTransferPinModalProps) {
  const { toast } = useToast();
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (pin.length !== 4 || !/^\d+$/.test(pin)) {
      toast({
        title: 'Error',
        description: 'PIN must be exactly 4 digits',
        variant: 'destructive',
      });
      return;
    }

    if (pin !== confirmPin) {
      toast({
        title: 'Error',
        description: 'PINs do not match',
        variant: 'destructive',
      });
      return;
    }

    try {
      setLoading(true);
      await api.users.createTransferPin(pin);
      toast({
        title: 'Success',
        description: 'Transfer PIN created successfully',
      });
      setPin('');
      setConfirmPin('');
      onSuccess();
      onClose();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create transfer PIN',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Transfer PIN</DialogTitle>
          <DialogDescription>
            Create a 4-digit PIN to secure your transfers. This PIN will be required for all future transfers.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="pin">Enter 4-digit PIN</Label>
              <Input
                id="pin"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={4}
                value={pin}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '');
                  setPin(value);
                }}
                placeholder="0000"
                required
                autoFocus
                autoComplete="off"
                data-form-type="other"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPin">Confirm PIN</Label>
              <Input
                id="confirmPin"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={4}
                value={confirmPin}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '');
                  setConfirmPin(value);
                }}
                placeholder="0000"
                required
                autoComplete="off"
                data-form-type="other"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create PIN'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

