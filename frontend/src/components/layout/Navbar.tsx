import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Moon, Sun, Menu, X } from 'lucide-react';
import { useState } from 'react';

export const Navbar = () => {
  const { t } = useTranslation('common');
  const { isAuthenticated, user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navigation = [
    { name: t('home'), href: '/' },
    { name: t('features'), href: '/#features' },
    { name: t('about'), href: '/about' },
    { name: t('faq'), href: '/faq' },
    { name: t('contact'), href: '/contact' },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-card border-b">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 gradient-primary rounded-lg" />
            <span className="text-xl font-heading font-bold">{t('appName')}</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className="text-sm font-medium hover:text-primary transition-colors"
              >
                {item.name}
              </Link>
            ))}
          </div>

          {/* Actions */}
          <div className="hidden md:flex items-center space-x-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>

            {isAuthenticated ? (
              <Button asChild className="gradient-primary">
                <Link to={user?.type === 'admin' ? '/admin' : '/dashboard'}>
                  {t('dashboard')}
                </Link>
              </Button>
            ) : (
              <>
                <Button variant="ghost" asChild>
                  <Link to="/auth/signin">{t('signIn')}</Link>
                </Button>
                <Button asChild className="gradient-primary">
                  <Link to="/auth/signup">{t('signUp')}</Link>
                </Button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border glass-card">
          <div className="container mx-auto px-4 py-4 space-y-4">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className="block py-2 text-sm font-medium"
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.name}
              </Link>
            ))}
            <div className="flex items-center space-x-2 pt-4 border-t border-border">
              {isAuthenticated ? (
                <Button asChild className="w-full gradient-primary">
                  <Link to={user?.type === 'admin' ? '/admin' : '/dashboard'}>
                    {t('dashboard')}
                  </Link>
                </Button>
              ) : (
                <>
                  <Button variant="ghost" asChild className="flex-1">
                    <Link to="/auth/signin">{t('signIn')}</Link>
                  </Button>
                  <Button asChild className="flex-1 gradient-primary">
                    <Link to="/auth/signup">{t('signUp')}</Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};
