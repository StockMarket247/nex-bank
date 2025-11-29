import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

export default function FAQ() {
  const faqs = [
    {
      question: 'How do I open an account?',
      answer: 'Opening an account is simple! Click on "Sign Up" and follow the quick registration process. You\'ll need a valid ID and proof of address for KYC verification. Most accounts are approved within 24 hours.',
    },
    {
      question: 'Are my funds secure?',
      answer: 'Absolutely. Your funds are protected by 256-bit encryption and stored in segregated accounts. We\'re also regulated by financial authorities and comply with all banking security standards.',
    },
    {
      question: 'Can I use NexBank internationally?',
      answer: 'Yes! NexBank supports multi-currency accounts and international transfers. You can hold and transact in multiple currencies with competitive exchange rates.',
    },
    {
      question: 'What are the fees?',
      answer: 'We believe in transparent pricing. Standard accounts have no monthly fees. International transfers have a small flat fee, and currency conversions use the mid-market rate. Check our pricing page for full details.',
    },
    {
      question: 'How do virtual cards work?',
      answer: 'Virtual cards are digital-only cards perfect for online shopping. You can create them instantly from your account, set spending limits, and freeze them anytime. They work just like physical cards but provide extra security.',
    },
    {
      question: 'What if I need to dispute a transaction?',
      answer: 'Contact our support team immediately through the app or email. We\'ll investigate and resolve disputes typically within 5-10 business days. Your money is protected during the investigation.',
    },
    {
      question: 'Can I have multiple accounts?',
      answer: 'Yes, you can create multiple sub-accounts for different purposes—savings, bills, vacation fund, etc. All managed from one dashboard.',
    },
    {
      question: 'How long do transfers take?',
      answer: 'Internal transfers are instant. External transfers to other banks typically take 1-3 business days. International transfers can take 2-5 business days depending on the destination country.',
    },
  ];

  return (
    <div className="min-h-screen">
      <Navbar />
      
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-5xl font-heading font-bold mb-6 text-center">
              Frequently Asked Questions
            </h1>
            <p className="text-xl text-muted-foreground text-center mb-12">
              Find answers to common questions about NexBank
            </p>

            <Accordion type="single" collapsible className="w-full space-y-4">
              {faqs.map((faq, index) => (
                <AccordionItem
                  key={index}
                  value={`item-${index}`}
                  className="glass-card px-6 border border-border rounded-lg"
                >
                  <AccordionTrigger className="text-left font-semibold hover:no-underline">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
