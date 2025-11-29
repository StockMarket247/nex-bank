import { Card } from '@/components/ui/card';
import { mockUsers, mockTransactions, mockCardRequests } from '@/lib/mockData';
import { Users, CreditCard, ArrowLeftRight, AlertTriangle } from 'lucide-react';

export default function AdminDashboard() {
  return (
    <div className="space-y-6">
      <h1 className="text-4xl font-heading font-bold">Admin Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <Users className="h-8 w-8 text-primary" />
          </div>
          <div className="text-2xl font-bold mb-1">{mockUsers.length}</div>
          <p className="text-sm text-muted-foreground">Total Users</p>
        </Card>

        <Card className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <ArrowLeftRight className="h-8 w-8 text-success" />
          </div>
          <div className="text-2xl font-bold mb-1">{mockTransactions.length}</div>
          <p className="text-sm text-muted-foreground">Transactions</p>
        </Card>

        <Card className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <CreditCard className="h-8 w-8 text-warning" />
          </div>
          <div className="text-2xl font-bold mb-1">{mockCardRequests.length}</div>
          <p className="text-sm text-muted-foreground">Card Requests</p>
        </Card>

        <Card className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <AlertTriangle className="h-8 w-8 text-destructive" />
          </div>
          <div className="text-2xl font-bold mb-1">2</div>
          <p className="text-sm text-muted-foreground">Alerts</p>
        </Card>
      </div>
    </div>
  );
}
