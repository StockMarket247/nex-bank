import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { api, ApiError } from '@/lib/api';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface AuditLog {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  details?: string;
  createdAt: string;
  admin?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
}

export default function AuditLogs() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    loadLogs();
  }, [page]);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const response = await api.audit.getLogs({ page, limit: 50 });
      setLogs(response.data);
      setTotalPages(response.meta.totalPages);
    } catch (error) {
      if (error instanceof ApiError) {
        toast.error(error.message || 'Failed to load audit logs');
      }
    } finally {
      setLoading(false);
    }
  };

  const getActionBadge = (action: string) => {
    const colorMap: Record<string, string> = {
      USER_CREATED: 'bg-green-500',
      USER_UPDATED: 'bg-blue-500',
      USER_SUSPENDED: 'bg-yellow-500',
      USER_UNSUSPENDED: 'bg-green-500',
      USER_CLOSED: 'bg-red-500',
      ACCOUNT_CREATED: 'bg-green-500',
      ACCOUNT_FROZEN: 'bg-yellow-500',
      ACCOUNT_UNFROZEN: 'bg-green-500',
      TRANSFER_APPROVED: 'bg-green-500',
      TRANSFER_REJECTED: 'bg-red-500',
      BALANCE_ADJUSTED: 'bg-blue-500',
    };

    return <Badge className={colorMap[action] || 'bg-gray-500'}>{action.replace(/_/g, ' ')}</Badge>;
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
      <h1 className="text-4xl font-heading font-bold">Audit Logs</h1>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Action</TableHead>
              <TableHead>Entity Type</TableHead>
              <TableHead>Entity ID</TableHead>
              <TableHead>Admin</TableHead>
              <TableHead>Details</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.map((log) => (
              <TableRow key={log.id}>
                <TableCell>{getActionBadge(log.action)}</TableCell>
                <TableCell>{log.entityType}</TableCell>
                <TableCell className="font-mono text-xs">{log.entityId}</TableCell>
                <TableCell>
                  {log.admin ? (
                    <div>
                      <div className="font-medium">
                        {log.admin.firstName} {log.admin.lastName}
                      </div>
                      <div className="text-sm text-muted-foreground">{log.admin.email}</div>
                    </div>
                  ) : (
                    <span className="text-muted-foreground">System</span>
                  )}
                </TableCell>
                <TableCell className="max-w-md">
                  {log.details ? (
                    <pre className="text-xs overflow-auto whitespace-pre-wrap">
                      {JSON.stringify(JSON.parse(log.details), null, 2)}
                    </pre>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell>{new Date(log.createdAt).toLocaleString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button variant="outline" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
            Previous
          </Button>
          <span className="flex items-center px-4">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}

