import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';

export default function SignIn() {
  const { t } = useTranslation(['common', 'auth']);
  const { login } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // Check if it's an admin login
      const isAdmin = formData.email.includes('admin');
      await login(formData.email, formData.password, isAdmin ? 'admin' : 'client');
      
      toast({
        title: t('auth:signInTitle'),
        description: 'Welcome back!',
      });
      
      navigate(isAdmin ? '/admin' : '/dashboard');
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Invalid credentials',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-secondary/30 px-4">
      <Card className="glass-card w-full max-w-md p-8">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center space-x-2 mb-6">
            <div className="w-10 h-10 gradient-primary rounded-lg" />
            <span className="text-2xl font-heading font-bold">{t('common:appName')}</span>
          </Link>
          <h1 className="text-3xl font-heading font-bold mb-2">{t('auth:signInTitle')}</h1>
          <p className="text-muted-foreground">{t('auth:signInSubtitle')}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email">{t('auth:email')}</Label>
            <Input
              id="email"
              type="email"
              placeholder="john@example.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">{t('auth:password')}</Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="remember"
                checked={formData.rememberMe}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, rememberMe: checked as boolean })
                }
              />
              <label
                htmlFor="remember"
                className="text-sm cursor-pointer"
              >
                {t('auth:rememberMe')}
              </label>
            </div>
            <Link to="/auth/forgot-password" className="text-sm text-primary hover:underline">
              {t('auth:forgotPassword')}
            </Link>
          </div>

          <Button
            type="submit"
            className="w-full gradient-primary"
            disabled={isLoading}
          >
            {isLoading ? t('common:loading') : t('common:signIn')}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm">
          <span className="text-muted-foreground">{t('auth:dontHaveAccount')} </span>
          <Link to="/auth/signup" className="text-primary font-semibold hover:underline">
            {t('common:signUp')}
          </Link>
        </div>

        {/* Demo Credentials */}
        <div className="mt-6 p-4 bg-secondary/50 rounded-lg">
          <p className="text-xs font-semibold mb-2">Demo Credentials:</p>
          <p className="text-xs text-muted-foreground">Client: any email</p>
          <p className="text-xs text-muted-foreground">Admin: admin@nexbank.com</p>
          <p className="text-xs text-muted-foreground">Password: any password</p>
        </div>
      </Card>
    </div>
  );
}
