import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { mockCards } from '@/lib/mockData';
import { Plus, Lock, Unlock, Settings, Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

export default function Cards() {
  const { t } = useTranslation('dashboard');
  const { toast } = useToast();
  const [selectedCard, setSelectedCard] = useState(mockCards[0].id);
  const [cardDetailsVisible, setCardDetailsVisible] = useState(false);

  const currentCard = mockCards.find(card => card.id === selectedCard) || mockCards[0];
  const usagePercentage = (currentCard.spent / currentCard.limit) * 100;

  const handleFreezeCard = () => {
    toast({
      title: currentCard.status === 'active' ? 'Card Frozen' : 'Card Unfrozen',
      description: `Your card ending in ${currentCard.cardNumber.slice(-4)} has been ${currentCard.status === 'active' ? 'frozen' : 'unfrozen'}`,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-4xl font-heading font-bold">{t('cards')}</h1>
        <Button className="gradient-primary">
          <Plus className="h-4 w-4 mr-2" />
          {t('requestCard')}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Card List */}
        <div className="space-y-4">
          {mockCards.map((card) => (
            <Card
              key={card.id}
              className={`glass-card p-6 cursor-pointer transition-all ${
                selectedCard === card.id
                  ? 'ring-2 ring-primary shadow-elevated'
                  : 'hover:shadow-glass'
              }`}
              onClick={() => setSelectedCard(card.id)}
            >
              <div className="flex items-center justify-between mb-4">
                <Badge variant={card.type === 'physical' ? 'default' : 'secondary'}>
                  {card.type}
                </Badge>
                <Badge variant={card.status === 'active' ? 'default' : 'secondary'}>
                  {card.status}
                </Badge>
              </div>
              <div className="space-y-2">
                <p className="text-xl font-mono font-semibold">{card.cardNumber}</p>
                <p className="text-sm text-muted-foreground">{card.cardHolder}</p>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Expires</span>
                  <span className="font-semibold">{card.expiryDate}</span>
                </div>
              </div>
            </Card>
          ))}

          <Button variant="outline" className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            Request New Card
          </Button>
        </div>

        {/* Card Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Card Visual */}
          <Card className="glass-card gradient-primary text-white p-8 aspect-video relative overflow-hidden">
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-8">
                <div className="text-sm opacity-75">NexBank</div>
                <div className="w-12 h-8 bg-white/20 rounded"></div>
              </div>
              <div className="mb-6">
                <p className="text-2xl font-mono font-semibold tracking-wider mb-2">
                  {cardDetailsVisible ? currentCard.cardNumber.replace(/\*/g, '') : currentCard.cardNumber}
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-white hover:bg-white/10"
                  onClick={() => setCardDetailsVisible(!cardDetailsVisible)}
                >
                  {cardDetailsVisible ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
                  {cardDetailsVisible ? 'Hide' : 'Show'} Details
                </Button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs opacity-75 mb-1">Cardholder</p>
                  <p className="font-semibold">{currentCard.cardHolder}</p>
                </div>
                <div>
                  <p className="text-xs opacity-75 mb-1">Expires</p>
                  <p className="font-semibold">{currentCard.expiryDate}</p>
                </div>
                {cardDetailsVisible && (
                  <div>
                    <p className="text-xs opacity-75 mb-1">CVV</p>
                    <p className="font-semibold">123</p>
                  </div>
                )}
              </div>
            </div>
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
          </Card>

          {/* Card Actions */}
          <Card className="glass-card p-6">
            <h3 className="text-lg font-heading font-semibold mb-4">Card Actions</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button
                variant="outline"
                className="h-auto py-4 flex-col"
                onClick={handleFreezeCard}
              >
                {currentCard.status === 'active' ? (
                  <>
                    <Lock className="h-5 w-5 mb-2" />
                    <span className="text-sm">{t('freezeCard')}</span>
                  </>
                ) : (
                  <>
                    <Unlock className="h-5 w-5 mb-2" />
                    <span className="text-sm">{t('unfreezeCard')}</span>
                  </>
                )}
              </Button>
              <Button variant="outline" className="h-auto py-4 flex-col">
                <Settings className="h-5 w-5 mb-2" />
                <span className="text-sm">{t('changePIN')}</span>
              </Button>
              <Button variant="outline" className="h-auto py-4 flex-col">
                <Settings className="h-5 w-5 mb-2" />
                <span className="text-sm">{t('cardLimits')}</span>
              </Button>
              <Button variant="outline" className="h-auto py-4 flex-col">
                <Settings className="h-5 w-5 mb-2" />
                <span className="text-sm">Settings</span>
              </Button>
            </div>
          </Card>

          {/* Card Usage */}
          <Card className="glass-card p-6">
            <h3 className="text-lg font-heading font-semibold mb-4">Card Usage</h3>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Spent this month</span>
                  <span className="font-semibold">
                    ${currentCard.spent.toLocaleString()} / ${currentCard.limit.toLocaleString()}
                  </span>
                </div>
                <Progress value={usagePercentage} className="h-2" />
              </div>
              <div className="grid grid-cols-3 gap-4 pt-4 border-t border-border">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Card Limit</p>
                  <p className="text-xl font-bold">${currentCard.limit.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Spent</p>
                  <p className="text-xl font-bold text-warning">${currentCard.spent.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Available</p>
                  <p className="text-xl font-bold text-success">
                    ${(currentCard.limit - currentCard.spent).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
