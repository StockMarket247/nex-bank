import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
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
} from 'lucide-react';
import { cn } from '@/lib/utils';

export const DashboardLayout = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { t } = useTranslation(['common', 'dashboard']);
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const clientNavigation = [
    { name: t('dashboard:overview'), href: '/dashboard', icon: LayoutDashboard },
    { name: t('dashboard:accounts'), href: '/dashboard/accounts', icon: Wallet },
    { name: t('dashboard:transfers'), href: '/dashboard/transfers', icon: ArrowLeftRight },
    { name: t('dashboard:cards'), href: '/dashboard/cards', icon: CreditCard },
    { name: t('dashboard:notifications'), href: '/dashboard/notifications', icon: Bell },
    { name: t('dashboard:profile'), href: '/dashboard/profile', icon: User },
  ];

  const adminNavigation = [
    { name: t('dashboard:overview'), href: '/admin', icon: LayoutDashboard },
    { name: 'Users', href: '/admin/users', icon: Users },
    { name: 'Cards', href: '/admin/cards', icon: CreditCard },
    { name: 'Transactions', href: '/admin/transactions', icon: FileText },
    { name: t('dashboard:settings'), href: '/admin/settings', icon: Settings },
  ];

  const navigation = user?.role === 'admin' ? adminNavigation : clientNavigation;

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border glass-card flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-border">
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 gradient-primary rounded-lg" />
            <span className="text-xl font-heading font-bold">{t('common:appName')}</span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
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
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="container mx-auto p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
