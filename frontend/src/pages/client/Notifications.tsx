import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { mockNotifications } from '@/lib/mockData';
import { format } from 'date-fns';
import { CheckCheck } from 'lucide-react';

export default function Notifications() {
  const { t } = useTranslation('dashboard');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-4xl font-heading font-bold">{t('notifications')}</h1>
        <Button variant="outline">
          <CheckCheck className="h-4 w-4 mr-2" />
          {t('markAllRead')}
        </Button>
      </div>

      <div className="space-y-4">
        {mockNotifications.map((notification) => (
          <Card key={notification.id} className={`glass-card p-6 ${!notification.read ? 'border-primary/50' : ''}`}>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-semibold">{notification.title}</h3>
                  {!notification.read && <Badge variant="default" className="text-xs">New</Badge>}
                </div>
                <p className="text-muted-foreground mb-2">{notification.message}</p>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(notification.date), 'MMM dd, yyyy • HH:mm')}
                </p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
