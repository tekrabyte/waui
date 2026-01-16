import { useState, useMemo } from 'react';
import { useListAllTransactions, useListMyTransactions, useGetCallerUserProfile, useIsCallerAdmin, useListOutlets, useListProductsByOutlet } from '../../hooks/useQueries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FileText, Download, Filter, ChevronDown, ChevronUp, Search, Calendar } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import type { Transaction } from '../../types/types';

export default function ReportsPage() {
  const { data: userProfile } = useGetCallerUserProfile();
  const { data: isAdmin } = useIsCallerAdmin();
  const { data: allTransactions, isLoading: allLoading } = useListAllTransactions();
  const { data: myTransactions, isLoading: myLoading } = useListMyTransactions();
  const { data: outlets } = useListOutlets();
  const { data: products } = useListProductsByOutlet();

  const isOwner = isAdmin;
  const transactions: Transaction[] | undefined = isOwner ? allTransactions : myTransactions;
  const isLoading = isOwner ? allLoading : myLoading;

  // Filter states
  const [searchId, setSearchId] = useState('');
  const [selectedOutlet, setSelectedOutlet] = useState<string>('all');
  const [selectedProduct, setSelectedProduct] = useState<string>('all');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (timestamp?: number | string) => {
    if (!timestamp) return '-';
    const date = typeof timestamp === 'string' ? new Date(timestamp) : new Date(timestamp);
    return date.toLocaleString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getPaymentMethodsDisplay = (transaction: Transaction) => {
    if (!transaction.paymentMethods || transaction.paymentMethods.length === 0) {
      return '-';
    }
    return transaction.paymentMethods.map(pm => pm.methodName).join(', ');
  };

  // Get unique payment methods
  const paymentMethods = useMemo(() => {
    const methods = new Set<string>();
    transactions?.forEach(t => {
      t.paymentMethods?.forEach(pm => methods.add(pm.methodName));
    });
    return Array.from(methods);
  }, [transactions]);

  // Filtered transactions
  const filteredTransactions = useMemo(() => {
    if (!transactions) return [];

    return transactions.filter(transaction => {
      // Search by ID
      if (searchId && !transaction.id.toLowerCase().includes(searchId.toLowerCase())) {
        return false;
      }

      // Filter by outlet
      if (selectedOutlet !== 'all' && transaction.outletId !== selectedOutlet) {
        return false;
      }

      // Filter by product
      if (selectedProduct !== 'all') {
        const hasProduct = transaction.items?.some(item => 
          item.productId === selectedProduct || item.name?.toLowerCase().includes(selectedProduct.toLowerCase())
        );
        if (!hasProduct) return false;
      }

      // Filter by payment method
      if (selectedPaymentMethod !== 'all') {
        const hasPaymentMethod = transaction.paymentMethods?.some(pm => 
          pm.methodName === selectedPaymentMethod
        );
        if (!hasPaymentMethod) return false;
      }

      // Filter by date range
      if (dateFrom || dateTo) {
        const transactionDate = transaction.timestamp 
          ? new Date(typeof transaction.timestamp === 'string' ? transaction.timestamp : transaction.timestamp)
          : transaction.createdAt 
            ? new Date(transaction.createdAt)
            : null;

        if (transactionDate) {
          if (dateFrom) {
            const fromDate = new Date(dateFrom);
            fromDate.setHours(0, 0, 0, 0);
            if (transactionDate < fromDate) return false;
          }
          if (dateTo) {
            const toDate = new Date(dateTo);
            toDate.setHours(23, 59, 59, 999);
            if (transactionDate > toDate) return false;
          }
        }
      }

      return true;
    });
  }, [transactions, searchId, selectedOutlet, selectedProduct, selectedPaymentMethod, dateFrom, dateTo]);

  // Calculate statistics
  const statistics = useMemo(() => {
    const total = filteredTransactions.reduce((sum, t) => sum + (t.total || 0), 0);
    const count = filteredTransactions.length;
    const average = count > 0 ? total / count : 0;

    return { total, count, average };
  }, [filteredTransactions]);

  // Export to CSV
  const exportToCSV = () => {
    if (!filteredTransactions || filteredTransactions.length === 0) {
      alert('Tidak ada data untuk diekspor');
      return;
    }

    const headers = ['ID Transaksi', 'Tanggal', 'Outlet', 'Produk', 'Jumlah Item', 'Metode Pembayaran', 'Total'];
    const rows = filteredTransactions.map(transaction => {
      const productNames = transaction.items?.map(item => item.name || item.productId).join('; ') || '-';
      return [
        transaction.id,
        formatDate(transaction.timestamp || transaction.createdAt),
        transaction.outletId || '-',
        productNames,
        transaction.items?.length || 0,
        getPaymentMethodsDisplay(transaction),
        transaction.total || 0
      ];
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `laporan-penjualan-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const clearFilters = () => {
    setSearchId('');
    setSelectedOutlet('all');
    setSelectedProduct('all');
    setSelectedPaymentMethod('all');
    setDateFrom('');
    setDateTo('');
  };

  const toggleRow = (id: string) => {
    setExpandedRow(expandedRow === id ? null : id);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {isOwner ? 'Laporan Penjualan' : 'Transaksi Saya'}
          </h1>
          <p className="text-muted-foreground">
            {isOwner ? 'Lihat semua transaksi penjualan' : 'Riwayat transaksi Anda'}
          </p>
        </div>
        <Button onClick={exportToCSV} className="gap-2" data-testid="export-csv-button">
          <Download className="h-4 w-4" />
          Ekspor CSV
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card data-testid="total-revenue-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Penjualan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(statistics.total)}</div>
            <p className="text-xs text-muted-foreground">
              Dari {statistics.count} transaksi
            </p>
          </CardContent>
        </Card>

        <Card data-testid="transaction-count-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Jumlah Transaksi</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.count}</div>
            <p className="text-xs text-muted-foreground">
              Total transaksi yang ditampilkan
            </p>
          </CardContent>
        </Card>

        <Card data-testid="average-transaction-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rata-rata Transaksi</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(statistics.average)}</div>
            <p className="text-xs text-muted-foreground">
              Per transaksi
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filter Laporan
              </CardTitle>
              <CardDescription>Saring data berdasarkan kriteria tertentu</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={clearFilters} data-testid="clear-filters-button">
              Reset Filter
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {/* Search by ID */}
            <div className="space-y-2">
              <Label htmlFor="search-id">Cari ID Transaksi</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search-id"
                  placeholder="Cari ID..."
                  value={searchId}
                  onChange={(e) => setSearchId(e.target.value)}
                  className="pl-8"
                  data-testid="search-transaction-input"
                />
              </div>
            </div>

            {/* Filter by Outlet */}
            {isOwner && (
              <div className="space-y-2">
                <Label htmlFor="outlet-filter">Outlet</Label>
                <Select value={selectedOutlet} onValueChange={setSelectedOutlet}>
                  <SelectTrigger id="outlet-filter" data-testid="outlet-filter">
                    <SelectValue placeholder="Semua Outlet" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Outlet</SelectItem>
                    {outlets?.map((outlet) => (
                      <SelectItem key={outlet.id} value={outlet.id}>
                        {outlet.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Filter by Product */}
            <div className="space-y-2">
              <Label htmlFor="product-filter">Produk</Label>
              <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                <SelectTrigger id="product-filter" data-testid="product-filter">
                  <SelectValue placeholder="Semua Produk" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Produk</SelectItem>
                  {products?.map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Filter by Payment Method */}
            <div className="space-y-2">
              <Label htmlFor="payment-filter">Metode Pembayaran</Label>
              <Select value={selectedPaymentMethod} onValueChange={setSelectedPaymentMethod}>
                <SelectTrigger id="payment-filter" data-testid="payment-filter">
                  <SelectValue placeholder="Semua Metode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Metode</SelectItem>
                  {paymentMethods.map((method) => (
                    <SelectItem key={method} value={method}>
                      {method}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date From */}
            <div className="space-y-2">
              <Label htmlFor="date-from">Dari Tanggal</Label>
              <div className="relative">
                <Calendar className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="date-from"
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="pl-8"
                  data-testid="date-from-input"
                />
              </div>
            </div>

            {/* Date To */}
            <div className="space-y-2">
              <Label htmlFor="date-to">Sampai Tanggal</Label>
              <div className="relative">
                <Calendar className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="date-to"
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="pl-8"
                  data-testid="date-to-input"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Daftar Transaksi</CardTitle>
          <CardDescription>
            Menampilkan {filteredTransactions.length} dari {transactions?.length || 0} transaksi
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map(i => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : !filteredTransactions || filteredTransactions.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">
                {transactions && transactions.length > 0 ? 'Tidak ada hasil' : 'Belum ada transaksi'}
              </h3>
              <p className="text-sm text-muted-foreground mt-2">
                {transactions && transactions.length > 0
                  ? 'Coba ubah filter untuk melihat lebih banyak data'
                  : 'Transaksi akan muncul di sini setelah dibuat'}
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]"></TableHead>
                    <TableHead>ID</TableHead>
                    <TableHead>Tanggal</TableHead>
                    {isOwner && <TableHead>Outlet</TableHead>}
                    <TableHead>Jumlah Item</TableHead>
                    <TableHead>Metode Pembayaran</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransactions.map((transaction) => (
                    <>
                      <TableRow 
                        key={transaction.id} 
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => toggleRow(transaction.id)}
                        data-testid={`transaction-row-${transaction.id}`}
                      >
                        <TableCell>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            {expandedRow === transaction.id ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </Button>
                        </TableCell>
                        <TableCell className="font-medium">#{transaction.id}</TableCell>
                        <TableCell>{formatDate(transaction.timestamp || transaction.createdAt)}</TableCell>
                        {isOwner && (
                          <TableCell>
                            <Badge variant="outline">
                              {outlets?.find(o => o.id === transaction.outletId)?.name || `Outlet #${transaction.outletId}`}
                            </Badge>
                          </TableCell>
                        )}
                        <TableCell>{transaction.items?.length || 0} item</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {transaction.paymentMethods?.map((pm, idx) => (
                              <Badge key={idx} variant="secondary" className="text-xs">
                                {pm.methodName}
                              </Badge>
                            ))}
                            {(!transaction.paymentMethods || transaction.paymentMethods.length === 0) && '-'}
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(transaction.total || 0)}
                        </TableCell>
                      </TableRow>
                      {expandedRow === transaction.id && transaction.items && transaction.items.length > 0 && (
                        <TableRow>
                          <TableCell colSpan={isOwner ? 7 : 6} className="bg-muted/30 p-4">
                            <div className="space-y-2">
                              <h4 className="font-semibold text-sm">Detail Item:</h4>
                              <div className="space-y-1">
                                {transaction.items.map((item, idx) => (
                                  <div key={idx} className="flex justify-between text-sm">
                                    <span>
                                      {item.name || item.productId} x {item.quantity}
                                      {item.note && <span className="text-muted-foreground ml-2">({item.note})</span>}
                                    </span>
                                    <span className="font-medium">
                                      {formatCurrency((item.subtotal || (item.price * item.quantity)) || 0)}
                                    </span>
                                  </div>
                                ))}
                              </div>
                              {transaction.paymentMethods && transaction.paymentMethods.length > 0 && (
                                <div className="mt-3 pt-3 border-t">
                                  <h4 className="font-semibold text-sm mb-2">Metode Pembayaran:</h4>
                                  <div className="space-y-1">
                                    {transaction.paymentMethods.map((pm, idx) => (
                                      <div key={idx} className="flex justify-between text-sm">
                                        <span>{pm.methodName}</span>
                                        <span className="font-medium">{formatCurrency(pm.amount)}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
