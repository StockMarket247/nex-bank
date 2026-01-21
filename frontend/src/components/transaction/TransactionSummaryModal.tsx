import { useRef, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { ArrowUpRight, ArrowDownLeft, Calendar, Hash, DollarSign, FileText, User, Building2, CreditCard, Download, FileDown, Loader2 } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { toast } from 'sonner';

interface TransactionSummaryModalProps {
  transaction: Transaction | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isAdmin?: boolean;
}

interface Transaction {
  _id?: string;
  id?: string;
  transactionId: string;
  type: string;
  status: string;
  amount: string;
  currency: string;
  reference?: string;
  description?: string;
  recipientAccountNumber?: string;
  recipientName?: string;
  createdAt: string;
  accountId?: {
    accountNumber: string;
    type: string;
  } | string;
  userId?: {
    _id?: string;
    id?: string;
    email: string;
    firstName: string;
    lastName: string;
  };
  user?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
  account?: {
    accountNumber: string;
    type: string;
  };
}

export default function TransactionSummaryModal({
  transaction,
  open,
  onOpenChange,
  isAdmin = false,
}: TransactionSummaryModalProps) {
  const exportRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);

  if (!transaction) return null;

  const exportToPNG = async () => {
    if (!exportRef.current) return;

    try {
      setIsExporting(true);
      
      // Wait a bit to ensure rendering is complete
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const canvas = await html2canvas(exportRef.current, {
        backgroundColor: '#ffffff',
        scale: 2,
        logging: false,
        useCORS: true,
        windowWidth: exportRef.current.scrollWidth,
        windowHeight: exportRef.current.scrollHeight,
      });

      const link = document.createElement('a');
      const transactionId = transaction.transactionId || transaction._id || transaction.id || 'receipt';
      link.download = `transaction-${transactionId}-${Date.now()}.png`;
      link.href = canvas.toDataURL('image/png', 1.0);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('Transaction receipt downloaded as PNG');
    } catch (error) {
      console.error('Error exporting to PNG:', error);
      toast.error('Failed to export transaction as PNG');
    } finally {
      setIsExporting(false);
    }
  };

  const exportToPDF = async () => {
    if (!exportRef.current) return;

    try {
      setIsExporting(true);
      
      // Wait a bit to ensure rendering is complete
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const canvas = await html2canvas(exportRef.current, {
        backgroundColor: '#ffffff',
        scale: 2,
        logging: false,
        useCORS: true,
        windowWidth: exportRef.current.scrollWidth,
        windowHeight: exportRef.current.scrollHeight,
      });

      const imgData = canvas.toDataURL('image/png', 1.0);
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      // Add first page
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      // Add additional pages if needed
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      const transactionId = transaction.transactionId || transaction._id || transaction.id || 'receipt';
      pdf.save(`transaction-${transactionId}-${Date.now()}.pdf`);
      toast.success('Transaction receipt downloaded as PDF');
    } catch (error) {
      console.error('Error exporting to PDF:', error);
      toast.error('Failed to export transaction as PDF');
    } finally {
      setIsExporting(false);
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'INTERNAL_TRANSFER':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300">Internal Transfer</Badge>;
      case 'EXTERNAL_TRANSFER':
        return <Badge variant="outline" className="bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300">External Transfer</Badge>;
      case 'INTERNATIONAL_TRANSFER':
        return <Badge variant="outline" className="bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">International Transfer</Badge>;
      case 'DEPOSIT':
        return <Badge className="bg-green-500 text-white">Deposit</Badge>;
      case 'WITHDRAWAL':
        return <Badge className="bg-orange-500 text-white">Withdrawal</Badge>;
      case 'ADJUSTMENT':
        return <Badge className="bg-gray-500 text-white">Adjustment</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <Badge className="bg-green-500 text-white">Completed</Badge>;
      case 'PENDING':
        return <Badge className="bg-yellow-500 text-white">Pending</Badge>;
      case 'FAILED':
        return <Badge className="bg-red-500 text-white">Failed</Badge>;
      case 'CANCELLED':
        return <Badge variant="outline">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const amount = parseFloat(transaction.amount || '0');
  const absAmount = Math.abs(amount);
  const isCredit = amount >= 0;
  const sign = isCredit ? '+' : '-';

  // Get account number from accountId (could be object or string)
  const accountNumber = transaction.account
    ? transaction.account.accountNumber
    : typeof transaction.accountId === 'object'
    ? transaction.accountId.accountNumber
    : 'N/A';

  const accountType = transaction.account
    ? transaction.account.type
    : typeof transaction.accountId === 'object'
    ? transaction.accountId.type
    : 'N/A';

  // Get user info (for admin view)
  const user = transaction.user || transaction.userId;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] p-0 flex flex-col [&>button]:hidden" ref={exportRef}>
        {/* Fixed Header */}
        <DialogHeader className="px-6 pt-6 pb-4 border-b flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Transaction Details
              </DialogTitle>
              <DialogDescription>
                Complete information about this transaction
              </DialogDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={exportToPNG}
                disabled={isExporting}
                title="Export as PNG"
              >
                {isExporting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={exportToPDF}
                disabled={isExporting}
                title="Export as PDF"
              >
                {isExporting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <FileDown className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </DialogHeader>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto scrollbar-hide px-6 py-6">
          <div className="space-y-6">
          {/* Amount & Status */}
          <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/50">
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-full ${
                isCredit
                  ? 'bg-green-100 dark:bg-green-950'
                  : 'bg-red-100 dark:bg-red-950'
              }`}>
                {isCredit ? (
                  <ArrowDownLeft className={`h-6 w-6 ${isCredit ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`} />
                ) : (
                  <ArrowUpRight className={`h-6 w-6 ${isCredit ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`} />
                )}
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Amount</p>
                <p className={`text-2xl font-bold ${
                  isCredit
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-foreground'
                }`}>
                  {sign}{transaction.currency} {absAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground mb-1">Status</p>
              {getStatusBadge(transaction.status)}
            </div>
          </div>

          {/* Transaction Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Hash className="h-4 w-4" />
                Transaction ID
              </div>
              <p className="font-mono text-sm font-medium">{transaction.transactionId || transaction._id || transaction.id || 'N/A'}</p>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <FileText className="h-4 w-4" />
                Type
              </div>
              <div>{getTypeBadge(transaction.type)}</div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                Date & Time
              </div>
              <p className="font-medium">
                {format(new Date(transaction.createdAt), 'MMM dd, yyyy • HH:mm:ss')}
              </p>
            </div>

            {transaction.reference && (
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Hash className="h-4 w-4" />
                  Reference
                </div>
                <p className="font-mono text-sm font-medium">{transaction.reference}</p>
              </div>
            )}
          </div>

          <Separator />

          {/* Account Information */}
          <div className="space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Account Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-lg bg-secondary/30">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Account Number</p>
                <p className="font-mono font-medium">{accountNumber}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Account Type</p>
                <p className="font-medium capitalize">{accountType}</p>
              </div>
            </div>
          </div>

          {/* User Information (Admin only) */}
          {isAdmin && user && (
            <>
              <Separator />
              <div className="space-y-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <User className="h-4 w-4" />
                  User Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-lg bg-secondary/30">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Name</p>
                    <p className="font-medium">
                      {user.firstName} {user.lastName}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">{user.email}</p>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Recipient Information */}
          {(transaction.recipientAccountNumber || transaction.recipientName) && (
            <>
              <Separator />
              <div className="space-y-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Recipient Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-lg bg-secondary/30">
                  {transaction.recipientAccountNumber && (
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Account Number</p>
                      <p className="font-mono font-medium">{transaction.recipientAccountNumber}</p>
                    </div>
                  )}
                  {transaction.recipientName && (
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Recipient Name</p>
                      <p className="font-medium">{transaction.recipientName}</p>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Description */}
          {transaction.description && (
            <>
              <Separator />
              <div className="space-y-2">
                <h3 className="font-semibold flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Description
                </h3>
                <p className="text-sm text-muted-foreground p-4 rounded-lg bg-secondary/30">
                  {transaction.description}
                </p>
              </div>
            </>
          )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
