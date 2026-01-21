import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Card } from '@/components/ui/card';

export default function Terms() {
  return (
    <div className="min-h-screen">
      <Navbar />
      
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-5xl font-heading font-bold mb-6">Terms & Conditions</h1>
            <p className="text-muted-foreground mb-12">Last updated: November 29, 2025</p>

            <Card className="glass-card p-8 md:p-12 space-y-8">
              <section>
                <h2 className="text-2xl font-heading font-bold mb-4">1. Acceptance of Terms</h2>
                <p className="text-muted-foreground">
                  By accessing and using NexBank services, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-heading font-bold mb-4">2. Account Registration</h2>
                <p className="text-muted-foreground mb-4">
                  To use our services, you must:
                </p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                  <li>Be at least 18 years of age</li>
                  <li>Provide accurate and complete registration information</li>
                  <li>Complete identity verification (KYC) procedures</li>
                  <li>Maintain the security of your account credentials</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-heading font-bold mb-4">3. Use of Services</h2>
                <p className="text-muted-foreground">
                  You agree to use NexBank services only for lawful purposes and in accordance with these Terms. You agree not to use the services:
                </p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4 mt-4">
                  <li>In any way that violates applicable laws or regulations</li>
                  <li>For fraudulent or illegal transactions</li>
                  <li>To transmit malicious code or interfere with service operation</li>
                  <li>To impersonate any person or entity</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-heading font-bold mb-4">4. Fees and Charges</h2>
                <p className="text-muted-foreground">
                  NexBank may charge fees for certain services. All applicable fees are disclosed on our pricing page and within the application. We reserve the right to modify fees with 30 days notice.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-heading font-bold mb-4">5. Termination</h2>
                <p className="text-muted-foreground">
                  We may terminate or suspend your account and access to services immediately, without prior notice, for conduct that we believe violates these Terms or is harmful to other users, us, or third parties, or for any other reason.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-heading font-bold mb-4">6. Limitation of Liability</h2>
                <p className="text-muted-foreground">
                  NexBank shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of or inability to use the service.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-heading font-bold mb-4">7. Contact Information</h2>
                <p className="text-muted-foreground">
                  For questions about these Terms, please contact us at legal@nexbank.com
                </p>
              </section>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
