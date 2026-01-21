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

interface UpgradeTier2ModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export default function UpgradeTier2Modal({
  open,
  onOpenChange,
  onSuccess,
}: UpgradeTier2ModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    identityNumber: '',
    documentType: '',
  });
  const [frontImage, setFrontImage] = useState<string | null>(null);
  const [backImage, setBackImage] = useState<string | null>(null);
  const [frontImageFile, setFrontImageFile] = useState<File | null>(null);
  const [backImageFile, setBackImageFile] = useState<File | null>(null);
  const frontInputRef = useRef<HTMLInputElement>(null);
  const backInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (file: File, type: 'front' | 'back') => {
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
      if (type === 'front') {
        setFrontImage(base64String);
        setFrontImageFile(file);
      } else {
        setBackImage(base64String);
        setBackImageFile(file);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.identityNumber.trim()) {
      toast.error('Please enter your identity number');
      return;
    }

    if (!formData.documentType) {
      toast.error('Please select a document type');
      return;
    }

    if (!frontImage) {
      toast.error('Please upload the front of your identity document');
      return;
    }

    // Check if document requires back image
    const requiresBackImage = formData.documentType !== 'PASSPORT';
    if (requiresBackImage && !backImage) {
      toast.error('Please upload the back of your identity document');
      return;
    }

    try {
      setLoading(true);

      await api.users.upgradeToTier2({
        identityNumber: formData.identityNumber.trim(),
        documentType: formData.documentType,
        frontImage,
        backImage: requiresBackImage ? backImage! : undefined,
      });

      toast.success('Tier 2 upgrade request submitted successfully! Please wait for admin verification.');
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
      setFormData({ identityNumber: '', documentType: '' });
      setFrontImage(null);
      setBackImage(null);
      setFrontImageFile(null);
      setBackImageFile(null);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Upgrade to Tier 2 - Enhanced Verification</DialogTitle>
          <DialogDescription>
            Submit your identity verification documents to upgrade to Tier 2
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Please ensure your documents are clear, legible, and valid. Documents will be reviewed by our admin team.
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label htmlFor="identityNumber">Identity Number *</Label>
            <Input
              id="identityNumber"
              placeholder="Enter your National ID, Driver's License, or Passport number"
              value={formData.identityNumber}
              onChange={(e) => setFormData({ ...formData, identityNumber: e.target.value })}
              required
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="documentType">Document Type *</Label>
            <Select
              value={formData.documentType}
              onValueChange={(value) => setFormData({ ...formData, documentType: value })}
              disabled={loading}
            >
              <SelectTrigger id="documentType">
                <SelectValue placeholder="Select document type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="NATIONAL_ID">National ID</SelectItem>
                <SelectItem value="DRIVERS_LICENSE">Driver's License</SelectItem>
                <SelectItem value="PASSPORT">Passport</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Front of Document *</Label>
              <div className="border-2 border-dashed border-border rounded-lg p-6">
                {frontImage ? (
                  <div className="space-y-2">
                    <div className="relative">
                      {frontImageFile?.type.startsWith('image/') ? (
                        <img src={frontImage} alt="Front document" className="max-h-64 mx-auto rounded" />
                      ) : (
                        <div className="text-center py-8">
                          <p className="text-sm text-muted-foreground">PDF Document</p>
                          <p className="text-xs text-muted-foreground mt-2">{frontImageFile?.name}</p>
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          setFrontImage(null);
                          setFrontImageFile(null);
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
                      onClick={() => frontInputRef.current?.click()}
                      disabled={loading}
                    >
                      Upload Front Image
                    </Button>
                    <p className="text-xs text-muted-foreground mt-2">
                      JPEG, PNG, or PDF (Max 5MB)
                    </p>
                  </div>
                )}
                <input
                  ref={frontInputRef}
                  type="file"
                  accept="image/*,.pdf"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileSelect(file, 'front');
                  }}
                />
              </div>
            </div>

            {formData.documentType && formData.documentType !== 'PASSPORT' && (
              <div className="space-y-2">
                <Label>Back of Document *</Label>
                <div className="border-2 border-dashed border-border rounded-lg p-6">
                  {backImage ? (
                    <div className="space-y-2">
                      <div className="relative">
                        {backImageFile?.type.startsWith('image/') ? (
                          <img src={backImage} alt="Back document" className="max-h-64 mx-auto rounded" />
                        ) : (
                          <div className="text-center py-8">
                            <p className="text-sm text-muted-foreground">PDF Document</p>
                            <p className="text-xs text-muted-foreground mt-2">{backImageFile?.name}</p>
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            setBackImage(null);
                            setBackImageFile(null);
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
                        onClick={() => backInputRef.current?.click()}
                        disabled={loading}
                      >
                        Upload Back Image
                      </Button>
                      <p className="text-xs text-muted-foreground mt-2">
                        JPEG, PNG, or PDF (Max 5MB)
                      </p>
                    </div>
                  )}
                  <input
                    ref={backInputRef}
                    type="file"
                    accept="image/*,.pdf"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileSelect(file, 'back');
                    }}
                  />
                </div>
              </div>
            )}
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
