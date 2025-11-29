import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Card } from '@/components/ui/card';
import { Users, Target, Award, Heart } from 'lucide-react';

export default function About() {
  const values = [
    {
      icon: Users,
      title: 'Customer First',
      description: 'Every decision we make is centered around delivering the best experience',
    },
    {
      icon: Target,
      title: 'Innovation',
      description: 'We constantly push boundaries to bring you cutting-edge banking solutions',
    },
    {
      icon: Award,
      title: 'Excellence',
      description: 'We hold ourselves to the highest standards in everything we do',
    },
    {
      icon: Heart,
      title: 'Trust',
      description: 'Your financial security and privacy are our top priorities',
    },
  ];

  return (
    <div className="min-h-screen">
      <Navbar />
      
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          {/* Hero */}
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h1 className="text-5xl font-heading font-bold mb-6">About NexBank</h1>
            <p className="text-xl text-muted-foreground">
              We're reimagining banking for the modern world, making it simple, transparent, and accessible to everyone.
            </p>
          </div>

          {/* Story */}
          <div className="max-w-4xl mx-auto mb-20">
            <Card className="glass-card p-8 md:p-12">
              <h2 className="text-3xl font-heading font-bold mb-6">Our Story</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  Founded in 2023, NexBank was born from a simple idea: banking should be as intuitive as using your favorite app. We saw an industry burdened by legacy systems and outdated processes, and we knew there had to be a better way.
                </p>
                <p>
                  Today, we serve thousands of customers across multiple countries, helping them manage their finances with confidence. Our platform combines cutting-edge technology with thoughtful design to create an experience that's both powerful and delightfully simple.
                </p>
                <p>
                  We're more than just a bank—we're your financial partner for the digital age. Whether you're sending money to friends, managing multiple currencies, or tracking your spending, we're here to make it effortless.
                </p>
              </div>
            </Card>
          </div>

          {/* Values */}
          <div>
            <h2 className="text-3xl font-heading font-bold text-center mb-12">Our Values</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {values.map((value, index) => (
                <Card key={index} className="glass-card p-6 text-center">
                  <value.icon className="h-12 w-12 text-primary mx-auto mb-4" />
                  <h3 className="text-xl font-heading font-semibold mb-2">{value.title}</h3>
                  <p className="text-sm text-muted-foreground">{value.description}</p>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
