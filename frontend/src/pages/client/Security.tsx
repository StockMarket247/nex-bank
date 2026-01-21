import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Shield, Lock, Key, Eye, EyeOff, AlertCircle, CreditCard } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { api } from '@/lib/api';

export default function Security() {
  const { t } = useTranslation('dashboard');
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [pinLoading, setPinLoading] = useState(false);
  const [hasTransferPin, setHasTransferPin] = useState<boolean | null>(null);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [pinData, setPinData] = useState({
    currentPin: '',
    newPin: '',
    confirmPin: '',
  });

  useEffect(() => {
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

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: 'Error',
        description: 'New passwords do not match',
        variant: 'destructive',
      });
      return;
    }

    if (passwordData.newPassword.length < 8) {
      toast({
        title: 'Error',
        description: 'Password must be at least 8 characters long',
        variant: 'destructive',
      });
      return;
    }

    try {
      setLoading(true);
      // TODO: Implement password change API endpoint
      // await api.users.changePassword({
      //   currentPassword: passwordData.currentPassword,
      //   newPassword: passwordData.newPassword,
      // });
      
      toast({
        title: 'Success',
        description: 'Password changed successfully',
      });
      
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to change password',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePinUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (pinData.newPin.length !== 4 || !/^\d+$/.test(pinData.newPin)) {
      toast({
        title: 'Error',
        description: 'New PIN must be exactly 4 digits',
        variant: 'destructive',
      });
      return;
    }

    if (pinData.newPin !== pinData.confirmPin) {
      toast({
        title: 'Error',
        description: 'New PINs do not match',
        variant: 'destructive',
      });
      return;
    }

    if (pinData.currentPin === pinData.newPin) {
      toast({
        title: 'Error',
        description: 'New PIN must be different from current PIN',
        variant: 'destructive',
      });
      return;
    }

    try {
      setPinLoading(true);
      await api.users.updateTransferPin(pinData.currentPin, pinData.newPin);
      toast({
        title: 'Success',
        description: 'Transfer PIN updated successfully',
      });
      setPinData({
        currentPin: '',
        newPin: '',
        confirmPin: '',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update transfer PIN',
        variant: 'destructive',
      });
    } finally {
      setPinLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-4xl font-heading font-bold">Security Settings</h1>

      {/* Password Change */}
      <Card className="glass-card p-6">
        <div className="flex items-center space-x-3 mb-6">
          <Lock className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-heading font-semibold">Change Password</h2>
        </div>

        <form onSubmit={handlePasswordChange} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="currentPassword">Current Password</Label>
            <div className="relative">
              <Input
                id="currentPassword"
                type={showCurrentPassword ? 'text' : 'password'}
                value={passwordData.currentPassword}
                onChange={(e) =>
                  setPasswordData({ ...passwordData, currentPassword: e.target.value })
                }
                required
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showCurrentPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="newPassword">New Password</Label>
            <div className="relative">
              <Input
                id="newPassword"
                type={showNewPassword ? 'text' : 'password'}
                value={passwordData.newPassword}
                onChange={(e) =>
                  setPasswordData({ ...passwordData, newPassword: e.target.value })
                }
                required
                minLength={8}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showNewPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            <p className="text-xs text-muted-foreground">
              Password must be at least 8 characters long
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm New Password</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                value={passwordData.confirmPassword}
                onChange={(e) =>
                  setPasswordData({ ...passwordData, confirmPassword: e.target.value })
                }
                required
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          <Button type="submit" className="gradient-primary" disabled={loading}>
            {loading ? 'Changing Password...' : 'Change Password'}
          </Button>
        </form>
      </Card>

      {/* Security Information */}
      <Card className="glass-card p-6">
        <div className="flex items-center space-x-3 mb-6">
          <Shield className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-heading font-semibold">Security Information</h2>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b border-border">
            <div>
              <p className="font-medium">Account Status</p>
              <p className="text-sm text-muted-foreground">
                {user?.status === 'ACTIVE' ? 'Active' : user?.status || 'Unknown'}
              </p>
            </div>
            <div className="px-3 py-1 rounded-full bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 text-sm font-medium">
              {user?.status === 'ACTIVE' ? 'Active' : user?.status || 'Unknown'}
            </div>
          </div>

          <div className="flex items-center justify-between py-3 border-b border-border">
            <div>
              <p className="font-medium">KYC Status</p>
              <p className="text-sm text-muted-foreground">
                {user?.kycStatus === 'VERIFIED'
                  ? 'Verified'
                  : user?.kycStatus === 'PENDING'
                  ? 'Pending Verification'
                  : user?.kycStatus === 'REJECTED'
                  ? 'Rejected'
                  : 'Not Verified'}
              </p>
            </div>
            <div
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                user?.kycStatus === 'VERIFIED'
                  ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300'
                  : user?.kycStatus === 'PENDING'
                  ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300'
                  : user?.kycStatus === 'REJECTED'
                  ? 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300'
                  : 'bg-gray-100 dark:bg-gray-900 text-gray-700 dark:text-gray-300'
              }`}
            >
              {user?.kycStatus === 'VERIFIED'
                ? 'Verified'
                : user?.kycStatus === 'PENDING'
                ? 'Pending'
                : user?.kycStatus === 'REJECTED'
                ? 'Rejected'
                : 'Not Verified'}
            </div>
          </div>

          <div className="flex items-center justify-between py-3">
            <div>
              <p className="font-medium">Last Login</p>
              <p className="text-sm text-muted-foreground">Not available</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Transfer PIN Update */}
      <Card className="glass-card p-6">
        <div className="flex items-center space-x-3 mb-6">
          <CreditCard className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-heading font-semibold">Transfer PIN</h2>
        </div>

        {hasTransferPin === false ? (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              You don't have a transfer PIN set. Create one when making your first transfer.
            </AlertDescription>
          </Alert>
        ) : (
          <form onSubmit={handlePinUpdate} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="currentPin">Current Transfer PIN</Label>
              <Input
                id="currentPin"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={4}
                value={pinData.currentPin}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '');
                  setPinData({ ...pinData, currentPin: value });
                }}
                placeholder="0000"
                required
                autoComplete="off"
                data-form-type="other"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPin">New Transfer PIN</Label>
              <Input
                id="newPin"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={4}
                value={pinData.newPin}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '');
                  setPinData({ ...pinData, newPin: value });
                }}
                placeholder="0000"
                required
                autoComplete="off"
                data-form-type="other"
              />
              <p className="text-xs text-muted-foreground">
                PIN must be exactly 4 digits
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPin">Confirm New PIN</Label>
              <Input
                id="confirmPin"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={4}
                value={pinData.confirmPin}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '');
                  setPinData({ ...pinData, confirmPin: value });
                }}
                placeholder="0000"
                required
                autoComplete="off"
                data-form-type="other"
              />
            </div>

            <Button type="submit" className="gradient-primary" disabled={pinLoading}>
              {pinLoading ? 'Updating PIN...' : 'Update Transfer PIN'}
            </Button>
          </form>
        )}
      </Card>

      {/* Two-Factor Authentication (Placeholder) */}
      <Card className="glass-card p-6">
        <div className="flex items-center space-x-3 mb-6">
          <Key className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-heading font-semibold">Two-Factor Authentication</h2>
        </div>

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Two-factor authentication is coming soon. This feature will add an extra layer of
            security to your account.
          </AlertDescription>
        </Alert>
      </Card>
    </div>
  );
}
