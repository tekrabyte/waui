import { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, DollarSign, ShoppingCart, Package, Store } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function DashboardPage() {
  const [userProfile, setUserProfile] = useState<any>(null);
  const [stats, setStats] = useState({
    sales: 0,
    orders: 0,
    products: 0,
    outlets: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const u = localStorage.getItem('posq_user');
    if (u) setUserProfile(JSON.parse(u));
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setIsLoading(true);
      // Fetch parallel
      const [products, outlets] = await Promise.all([
        api.products.getAll(),
        api.outlets.getAll()
      ]);
      
      // Simulasi hitung data karena belum ada endpoint /stats
      setStats({
        sales: 15000000, // Dummy sementara sampai ada endpoint transactions
        orders: 45,
        products: products.length,
        outlets: outlets.length
      });
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(val);
  };

  if (isLoading) {
    return <div className="p-8"><Skeleton className="h-48 w-full" /></div>;
  }

  const isOwner = userProfile?.role === 'owner' || userProfile?.role === 'admin';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Selamat datang kembali, {userProfile?.name}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pendapatan</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.sales)}</div>
            <p className="text-xs text-muted-foreground">+20.1% dari bulan lalu</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Order Aktif</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.orders}</div>
            <p className="text-xs text-muted-foreground">+12 sejak jam terakhir</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Produk</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.products}</div>
            <p className="text-xs text-muted-foreground">Item terdaftar di sistem</p>
          </CardContent>
        </Card>

        {isOwner && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Outlet Aktif</CardTitle>
              <Store className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.outlets}</div>
              <p className="text-xs text-muted-foreground">Cabang beroperasi</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Area Grafik atau Tabel Ringkasan bisa ditambahkan di sini */}
    </div>
  );
}