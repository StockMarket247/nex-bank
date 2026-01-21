import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { api, ApiError } from '@/lib/api';
import { toast } from 'sonner';
import { Users, ArrowLeftRight, AlertTriangle, Wallet, Loader2 } from 'lucide-react';

interface DashboardStats {
  users: {
    total: number;
    active: number;
    suspended: number;
  };
  accounts: {
    total: number;
  };
  transactions: {
    total: number;
  };
  transfers: {
    pending: number;
  };
  balance: {
    total: string;
  };
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const data = await api.admin.getDashboard();
      setStats(data);
    } catch (error) {
      if (error instanceof ApiError) {
        toast.error(error.message || 'Failed to load dashboard stats');
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-4xl font-heading font-bold">Admin Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <Users className="h-8 w-8 text-primary" />
          </div>
          <div className="text-2xl font-bold mb-1">{stats?.users.total || 0}</div>
          <p className="text-sm text-muted-foreground">Total Users</p>
          <div className="mt-2 text-xs text-muted-foreground">
            {stats?.users.active || 0} active, {stats?.users.suspended || 0} suspended
          </div>
        </Card>

        <Card className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <Wallet className="h-8 w-8 text-success" />
          </div>
          <div className="text-2xl font-bold mb-1">{stats?.accounts.total || 0}</div>
          <p className="text-sm text-muted-foreground">Total Accounts</p>
        </Card>

        <Card className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <ArrowLeftRight className="h-8 w-8 text-warning" />
          </div>
          <div className="text-2xl font-bold mb-1">{stats?.transfers.pending || 0}</div>
          <p className="text-sm text-muted-foreground">Pending Transfers</p>
        </Card>

        <Card className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <AlertTriangle className="h-8 w-8 text-destructive" />
          </div>
          <div className="text-2xl font-bold mb-1">{stats?.transactions.total || 0}</div>
          <p className="text-sm text-muted-foreground">Total Transactions</p>
        </Card>
      </div>

      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">System Overview</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Total Balance</p>
            <p className="text-2xl font-bold">USD {stats?.balance.total || '0.00'}</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
