import { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import {
  LayoutDashboard,
  CreditCard,
  ArrowLeftRight,
  Wallet,
  Bell,
  User,
  Settings,
  LogOut,
  Moon,
  Sun,
  Users,
  FileText,
  Shield,
  TrendingUp,
  Menu,
  MessageCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export const DashboardLayout = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { t } = useTranslation(['common', 'dashboard']);
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
    setMobileMenuOpen(false);
  };

  const clientNavigation = [
    { name: t('dashboard:overview'), href: '/dashboard', icon: LayoutDashboard },
    { name: t('dashboard:accounts'), href: '/dashboard/accounts', icon: Wallet },
    { name: 'Account & Limits', href: '/dashboard/account-limits', icon: TrendingUp },
    { name: t('dashboard:transfers'), href: '/dashboard/transfers', icon: ArrowLeftRight },
    { name: 'Transactions', href: '/dashboard/transactions', icon: FileText },
    { name: 'Cards (Coming Soon)', href: '#', icon: CreditCard, disabled: true },
    { name: t('dashboard:notifications'), href: '/dashboard/notifications', icon: Bell },
    { name: t('dashboard:profile'), href: '/dashboard/profile', icon: User },
    { name: 'Security', href: '/dashboard/security', icon: Shield },
    { name: 'Support', href: '/dashboard/support', icon: MessageCircle },
  ];

  const adminNavigation = [
    { name: t('dashboard:overview'), href: '/admin', icon: LayoutDashboard },
    { name: 'Transfers', href: '/admin/transfers', icon: ArrowLeftRight },
    { name: 'Pending Transfers', href: '/admin/pending-transfers', icon: ArrowLeftRight },
    { name: 'Users', href: '/admin/users', icon: Users },
    { name: 'Accounts', href: '/admin/accounts', icon: Wallet },
    { name: 'Transactions', href: '/admin/transactions', icon: FileText },
    { name: 'Verifications', href: '/admin/verifications', icon: Shield },
    { name: 'Notifications', href: '/admin/notifications', icon: Bell },
    { name: 'Audit Logs', href: '/admin/audit', icon: Shield },
    { name: 'Support', href: '/admin/support', icon: MessageCircle },
  ];

  const navigation = user?.type === 'admin' ? adminNavigation : clientNavigation;

  const SidebarContent = ({ onNavigate }: { onNavigate?: () => void }) => (
    <>
      {/* Logo */}
      <div className="p-6 border-b border-border">
        <Link 
          to="/" 
          className="flex items-center space-x-2"
          onClick={onNavigate}
        >
          <div className="w-8 h-8 gradient-primary rounded-lg" />
          <span className="text-xl font-heading font-bold">{t('common:appName')}</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href;
          const isDisabled = (item as any).disabled;
          
          if (isDisabled) {
            return (
              <div
                key={item.name}
                className={cn(
                  'flex items-center space-x-3 px-4 py-3 rounded-lg transition-all',
                  'text-muted-foreground cursor-not-allowed opacity-60'
                )}
              >
                <item.icon className="h-5 w-5" />
                <span className="font-medium">{item.name}</span>
              </div>
            );
          }
          
          return (
            <Link
              key={item.name}
              to={item.href}
              onClick={onNavigate}
              className={cn(
                'flex items-center space-x-3 px-4 py-3 rounded-lg transition-all',
                isActive
                  ? 'gradient-primary text-white shadow-md'
                  : 'text-foreground hover:bg-secondary'
              )}
            >
              <item.icon className="h-5 w-5" />
              <span className="font-medium">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* User Menu */}
      <div className="p-4 border-t border-border space-y-2">
        <Button
          variant="ghost"
          className="w-full justify-start"
          onClick={toggleTheme}
        >
          {theme === 'dark' ? <Sun className="h-5 w-5 mr-3" /> : <Moon className="h-5 w-5 mr-3" />}
          {theme === 'dark' ? t('common:lightMode') : t('common:darkMode')}
        </Button>
        <Button
          variant="ghost"
          className="w-full justify-start text-destructive"
          onClick={handleLogout}
        >
          <LogOut className="h-5 w-5 mr-3" />
          {t('common:signOut')}
        </Button>
      </div>
    </>
  );

  return (
    <div className="flex h-screen bg-background">
      {/* Mobile Menu Button */}
      <div className="md:hidden fixed top-4 left-4 z-40">
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="glass-card">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0">
            <aside className="w-full h-full glass-card flex flex-col">
              <SidebarContent onNavigate={() => setMobileMenuOpen(false)} />
            </aside>
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 border-r border-border glass-card flex flex-col">
        <SidebarContent />
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto w-full md:w-auto">
        <div className="container mx-auto p-4 md:p-6 pt-16 md:pt-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
