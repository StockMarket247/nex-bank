import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  CreditCard,
  Shield,
  Zap,
  Globe,
  Lock,
  TrendingUp,
  ArrowRight,
  Check,
} from 'lucide-react';

export default function Landing() {
  const { t } = useTranslation('common');

  const features = [
    {
      icon: CreditCard,
      title: 'Smart Cards',
      description: 'Physical and virtual cards with instant issuance and full control',
    },
    {
      icon: Shield,
      title: 'Bank-Grade Security',
      description: '256-bit encryption and multi-factor authentication',
    },
    {
      icon: Zap,
      title: 'Instant Transfers',
      description: 'Send money anywhere in seconds, not days',
    },
    {
      icon: Globe,
      title: 'Multi-Currency',
      description: 'Hold and transact in multiple currencies seamlessly',
    },
    {
      icon: Lock,
      title: 'Privacy First',
      description: 'Your data is encrypted and never shared',
    },
    {
      icon: TrendingUp,
      title: 'Financial Insights',
      description: 'Track spending with intelligent analytics',
    },
  ];

  const pricing = [
    {
      name: 'Standard',
      price: 0,
      features: [
        'Free physical card',
        'Unlimited virtual cards',
        'Instant transfers',
        'Multi-currency support',
        'Mobile app',
      ],
    },
    {
      name: 'Premium',
      price: 9.99,
      features: [
        'Everything in Standard',
        'Priority support',
        'Higher limits',
        'Exclusive rewards',
        'Dedicated account manager',
      ],
      popular: true,
    },
    {
      name: 'Business',
      price: 29.99,
      features: [
        'Everything in Premium',
        'Team accounts',
        'Expense management',
        'API access',
        'Custom integrations',
      ],
    },
  ];

  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="container mx-auto text-center">
          <h1 className="text-5xl md:text-7xl font-heading font-bold mb-6 animate-fade-in">
            Banking for the
            <span className="block gradient-primary bg-clip-text text-transparent">
              Digital Age
            </span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Experience seamless online banking with instant transfers, multi-currency accounts,
            and smart cards—all in one beautiful platform.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="gradient-primary text-lg">
              <Link to="/auth/signup">
                {t('getStarted')} <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="text-lg">
              <Link to="/about">{t('learnMore')}</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 bg-secondary/30">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-heading font-bold mb-4">{t('features')}</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Everything you need to manage your finances with confidence
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card
                key={index}
                className="glass-card p-6 hover:shadow-elevated transition-all duration-300"
              >
                <feature.icon className="h-12 w-12 text-primary mb-4" />
                <h3 className="text-xl font-heading font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-heading font-bold mb-4">{t('pricing')}</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Choose the perfect plan for your needs
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {pricing.map((plan, index) => (
              <Card
                key={index}
                className={`glass-card p-8 relative ${
                  plan.popular ? 'border-primary border-2 shadow-elevated' : ''
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 gradient-primary text-white px-4 py-1 rounded-full text-sm font-semibold">
                    Most Popular
                  </div>
                )}
                <h3 className="text-2xl font-heading font-bold mb-2">{plan.name}</h3>
                <div className="mb-6">
                  <span className="text-4xl font-bold">${plan.price}</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start">
                      <Check className="h-5 w-5 text-primary mr-2 flex-shrink-0 mt-0.5" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  asChild
                  className={`w-full ${plan.popular ? 'gradient-primary' : ''}`}
                  variant={plan.popular ? 'default' : 'outline'}
                >
                  <Link to="/auth/signup">{t('getStarted')}</Link>
                </Button>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 gradient-dark text-white">
        <div className="container mx-auto text-center">
          <h2 className="text-4xl font-heading font-bold mb-6">Ready to Get Started?</h2>
          <p className="text-lg mb-8 opacity-90 max-w-2xl mx-auto">
            Join thousands of users who trust NexBank for their financial needs
          </p>
          <Button asChild size="lg" className="bg-white text-foreground hover:bg-white/90">
            <Link to="/auth/signup">
              Create Your Account <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  );
}
