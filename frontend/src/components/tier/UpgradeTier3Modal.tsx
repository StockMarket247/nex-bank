import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, X, Loader2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { api, ApiError } from '@/lib/api';
import { toast } from 'sonner';

interface UpgradeTier3ModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export default function UpgradeTier3Modal({
  open,
  onOpenChange,
  onSuccess,
}: UpgradeTier3ModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    address: '',
    city: '',
    country: '',
    postalCode: '',
    documentType: '',
  });
  const [documentImage, setDocumentImage] = useState<string | null>(null);
  const [documentImageFile, setDocumentImageFile] = useState<File | null>(null);
  const documentInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
      toast.error('Please upload an image (JPEG, PNG) or PDF file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      toast.error('File size must be less than 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setDocumentImage(base64String);
      setDocumentImageFile(file);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.address.trim()) {
      toast.error('Please enter your residential address');
      return;
    }

    if (!formData.city.trim()) {
      toast.error('Please enter your city');
      return;
    }

    if (!formData.country.trim()) {
      toast.error('Please enter your country');
      return;
    }

    if (!formData.postalCode.trim()) {
      toast.error('Please enter your postal/ZIP code');
      return;
    }

    if (!formData.documentType) {
      toast.error('Please select a document type');
      return;
    }

    if (!documentImage) {
      toast.error('Please upload an address verification document');
      return;
    }

    try {
      setLoading(true);

      await api.users.upgradeToTier3({
        address: formData.address.trim(),
        city: formData.city.trim(),
        country: formData.country.trim(),
        postalCode: formData.postalCode.trim(),
        documentType: formData.documentType,
        documentImage,
      });

      toast.success('Tier 3 upgrade request submitted successfully! Please wait for admin verification.');
      handleClose();
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      if (error instanceof ApiError) {
        toast.error(error.message || 'Failed to submit upgrade request');
      } else {
        toast.error('Failed to submit upgrade request. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setFormData({
        address: '',
        city: '',
        country: '',
        postalCode: '',
        documentType: '',
      });
      setDocumentImage(null);
      setDocumentImageFile(null);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Upgrade to Tier 3 - Full Verification</DialogTitle>
          <DialogDescription>
            Submit your address verification document to upgrade to Tier 3
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Please ensure your address document is recent (within 3 months), clear, and matches the address you provide below.
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="address">Street Address *</Label>
              <Input
                id="address"
                placeholder="Enter street address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="city">City *</Label>
              <Input
                id="city"
                placeholder="Enter city"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="country">Country *</Label>
              <Input
                id="country"
                placeholder="Enter country"
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="postalCode">Postal/ZIP Code *</Label>
              <Input
                id="postalCode"
                placeholder="Enter postal/ZIP code"
                value={formData.postalCode}
                onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                required
                disabled={loading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="documentType">Address Verification Document Type *</Label>
            <Select
              value={formData.documentType}
              onValueChange={(value) => setFormData({ ...formData, documentType: value })}
              disabled={loading}
            >
              <SelectTrigger id="documentType">
                <SelectValue placeholder="Select document type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="UTILITY_BILL">Utility Bill</SelectItem>
                <SelectItem value="BANK_STATEMENT">Bank Statement</SelectItem>
                <SelectItem value="GOVERNMENT_LETTER">Government Letter</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Document must be recent (within 3 months) and show your name and address
            </p>
          </div>

          <div className="space-y-2">
            <Label>Address Verification Document *</Label>
            <div className="border-2 border-dashed border-border rounded-lg p-6">
              {documentImage ? (
                <div className="space-y-2">
                  <div className="relative">
                    {documentImageFile?.type.startsWith('image/') ? (
                      <img src={documentImage} alt="Address document" className="max-h-64 mx-auto rounded" />
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-sm text-muted-foreground">PDF Document</p>
                        <p className="text-xs text-muted-foreground mt-2">{documentImageFile?.name}</p>
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setDocumentImage(null);
                        setDocumentImageFile(null);
                      }}
                      className="absolute top-2 right-2 p-1 bg-destructive text-white rounded-full"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center">
                  <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => documentInputRef.current?.click()}
                    disabled={loading}
                  >
                    Upload Document
                  </Button>
                  <p className="text-xs text-muted-foreground mt-2">
                    JPEG, PNG, or PDF (Max 5MB) - Must be recent and clearly legible
                  </p>
                </div>
              )}
              <input
                ref={documentInputRef}
                type="file"
                accept="image/*,.pdf"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileSelect(file);
                }}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3">
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
                  Submitting...
                </>
              ) : (
                'Submit for Verification'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
