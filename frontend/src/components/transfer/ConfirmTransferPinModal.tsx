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

interface ConfirmTransferPinModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function ConfirmTransferPinModal({ open, onClose, onSuccess }: ConfirmTransferPinModalProps) {
  const { toast } = useToast();
  const [pin, setPin] = useState('');
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

    try {
      setLoading(true);
      await api.users.verifyTransferPin(pin);
      setPin('');
      onSuccess();
      onClose();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Invalid transfer PIN',
        variant: 'destructive',
      });
      setPin('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirm Transfer PIN</DialogTitle>
          <DialogDescription>
            Please enter your 4-digit transfer PIN to confirm this transaction.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="pin">Enter Transfer PIN</Label>
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
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Verifying...' : 'Confirm'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

