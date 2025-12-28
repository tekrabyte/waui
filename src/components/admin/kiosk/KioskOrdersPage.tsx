import { useNavigate } from '@tanstack/react-router';
import { useGetUserTransactionHistory } from '../../hooks/useQueries';
import { useInternetIdentity } from '../../hooks/useInternetIdentity';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Receipt, Clock, CheckCircle2, XCircle, AlertCircle, LogIn } from 'lucide-react';
import { OrderStatus } from '../../backend';

export default function KioskOrdersPage() {
  const navigate = useNavigate();
  const { identity, login } = useInternetIdentity();
  const { data: transactionHistory } = useGetUserTransactionHistory();

  const isAuthenticated = !!identity;

  const formatCurrency = (amount: bigint) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(Number(amount));
  };

  const formatDate = (timestamp: bigint) => {
    return new Date(Number(timestamp) / 1000000).toLocaleString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status: OrderStatus) => {
    const statusConfig = {
      pending: { label: 'Menunggu', variant: 'secondary' as const, icon: Clock, color: 'text-yellow-600' },
      processing: { label: 'Diproses', variant: 'default' as const, icon: AlertCircle, color: 'text-blue-600' },
      ready: { label: 'Siap', variant: 'default' as const, icon: CheckCircle2, color: 'text-green-600' },
      completed: { label: 'Selesai', variant: 'outline' as const, icon: CheckCircle2, color: 'text-gray-600' },
      canceled: { label: 'Dibatalkan', variant: 'destructive' as const, icon: XCircle, color: 'text-red-600' },
    };

    const config = statusConfig[status];
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className={`h-3 w-3 ${config.color}`} />
        {config.label}
      </Badge>
    );
  };

  const handleLogin = async () => {
    try {
      await login();
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  return (
    <div className="min-h-screen bg-white pb-20">
      {/* Header */}
      <div className="border-b bg-white sticky top-0 z-40">
        <div className="px-4 py-4">
          <div className="flex items-center gap-3">
            <Receipt className="h-6 w-6 text-[#1D6FFF]" />
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Pesanan</h1>
              <p className="text-sm text-gray-600">
                {isAuthenticated ? 'Riwayat pesanan Anda' : 'Login untuk melihat pesanan'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-6">
        {!isAuthenticated ? (
          <div className="text-center py-12">
            <Receipt className="h-16 w-16 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600 mb-4">Login untuk melihat riwayat pesanan Anda</p>
            <Button 
              onClick={handleLogin}
              className="bg-[#1D6FFF] hover:bg-[#1557CC] text-white"
              style={{ borderRadius: 0 }}
            >
              <LogIn className="mr-2 h-4 w-4" />
              Login Customer
            </Button>
          </div>
        ) : !transactionHistory || transactionHistory.length === 0 ? (
          <div className="text-center py-12">
            <Receipt className="h-16 w-16 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600">Belum ada riwayat pesanan</p>
          </div>
        ) : (
          <div className="space-y-4">
            {transactionHistory.map(([transaction, history]) => (
              <Card key={transaction.id.toString()} style={{ borderRadius: 0 }}>
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm text-gray-600">{formatDate(transaction.timestamp)}</p>
                        <p className="text-lg font-bold text-[#1D6FFF] mt-1">{formatCurrency(transaction.total)}</p>
                      </div>
                      {getStatusBadge(transaction.status)}
                    </div>
                    <div className="text-sm text-gray-600">
                      Terakhir diperbarui: {formatDate(transaction.statusUpdatedAt)}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
