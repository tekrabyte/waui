import React, { useState, useEffect, useMemo } from 'react';
import { InventoryItem, Outlet, Product, StockLog } from '../../types/types';
import { api } from '../../services/api';
import { AlertTriangle, RefreshCw, X, Plus, Minus, ArrowRightLeft, Package2, History } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';

type StockActionType = 'add' | 'reduce' | 'transfer';

type ViewMode = 'inventory' | 'history';

export function InventoryManagement() {
  const [inventory, setInventory] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Product | null>(null);
  const [actionType, setActionType] = useState<StockActionType>('add');
  const [quantity, setQuantity] = useState('');
  const [targetOutletId, setTargetOutletId] = useState('');
  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [selectedOutletFilter, setSelectedOutletFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('inventory');
  const [stockLogs, setStockLogs] = useState<any[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);

  useEffect(() => {
    loadInventory();
    loadOutlets();
    loadStockLogs();
  }, []);

  const loadInventory = async () => {
    try {
      setIsLoading(true);
      const data = await api.products.getAll();
      setInventory(data);
    } catch (err) {
      console.error('Failed to load inventory', err);
      setError('Gagal memuat data inventory');
    } finally {
      setIsLoading(false);
    }
  };

  const loadOutlets = async () => {
    try {
      const data = await api.outlets.getAll();
      setOutlets(data);
    } catch (err) {
      console.error('Failed to load outlets', err);
    }
  };

  const loadStockLogs = async () => {
    try {
      setIsLoadingLogs(true);
      const data = await api.stock.getLogs();
      setStockLogs(data);
    } catch (err) {
      console.error('Failed to load stock logs', err);
    } finally {
      setIsLoadingLogs(false);
    }
  };

  // Filter inventory by selected outlet
  const filteredInventory = useMemo(() => {
    if (selectedOutletFilter === 'all') {
      return inventory;
    }
    return inventory.filter(item => item.outletId === selectedOutletFilter);
  }, [inventory, selectedOutletFilter]);

  const openModal = (item: Product, action: StockActionType) => {
    setSelectedItem(item);
    setActionType(action);
    setQuantity('');
    setTargetOutletId('');
    setError('');
    setSuccessMessage('');
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedItem(null);
    setQuantity('');
    setTargetOutletId('');
    setError('');
    setSuccessMessage('');
  };

  const handleStockAction = async () => {
    if (!selectedItem) return;
    
    const qty = parseInt(quantity);
    if (isNaN(qty) || qty <= 0) {
      setError('Jumlah harus berupa angka positif');
      return;
    }

    if (actionType === 'transfer' && !targetOutletId) {
      setError('Pilih outlet tujuan terlebih dahulu');
      return;
    }

    try {
      setIsProcessing(true);
      setError('');
      
      switch (actionType) {
        case 'add':
          await api.stock.add(selectedItem.id, qty);
          setSuccessMessage(`Berhasil menambah ${qty} unit stok`);
          break;
        case 'reduce':
          await api.stock.reduce(selectedItem.id, qty);
          setSuccessMessage(`Berhasil mengurangi ${qty} unit stok`);
          break;
        case 'transfer':
          await api.stock.transfer(selectedItem.id, targetOutletId, qty);
          setSuccessMessage(`Berhasil transfer ${qty} unit ke outlet tujuan`);
          break;
      }

      // Reload inventory setelah update
      await loadInventory();
      await loadStockLogs();
      
      // Tutup modal setelah 1.5 detik
      setTimeout(() => {
        closeModal();
      }, 1500);
      
    } catch (err: any) {
      console.error('Stock action failed', err);
      setError(err.message || 'Gagal memproses permintaan');
    } finally {
      setIsProcessing(false);
    }
  };

  const getStockStatus = (stock: number) => {
    if (stock === 0) return { label: 'Habis', color: 'bg-red-100 text-red-800', icon: <AlertTriangle size={12} /> };
    if (stock <= 10) return { label: 'Stok Rendah', color: 'bg-orange-100 text-orange-800', icon: <AlertTriangle size={12} /> };
    if (stock <= 50) return { label: 'Stok Sedang', color: 'bg-yellow-100 text-yellow-800', icon: null };
    return { label: 'Stok Cukup', color: 'bg-green-100 text-green-800', icon: null };
  };

  const getOperationLabel = (operation: string) => {
    switch (operation) {
      case 'add': return 'Tambah Stok';
      case 'reduce': return 'Kurangi Stok';
      case 'transfer_out': return 'Transfer Keluar';
      case 'transfer_in': return 'Transfer Masuk';
      case 'sale': return 'Penjualan';
      default: return operation;
    }
  };

  const getOperationColor = (operation: string) => {
    switch (operation) {
      case 'add': return 'bg-green-100 text-green-800';
      case 'transfer_in': return 'bg-blue-100 text-blue-800';
      case 'reduce': return 'bg-orange-100 text-orange-800';
      case 'transfer_out': return 'bg-purple-100 text-purple-800';
      case 'sale': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-96 mt-2" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
       <div>
          <h1 className="text-3xl font-bold tracking-tight">Manajemen Inventori</h1>
          <p className="text-muted-foreground">Lacak tingkat stok dan kelola persediaan per outlet</p>
        </div>

      {/* View Mode Toggle */}
      <div className="flex gap-2">
        <Button
          onClick={() => setViewMode('inventory')}
          variant={viewMode === 'inventory' ? 'default' : 'outline'}
          data-testid="view-inventory-btn"
        >
          <Package2 className="h-4 w-4 mr-2" />
          Daftar Stok
        </Button>
        <Button
          onClick={() => setViewMode('history')}
          variant={viewMode === 'history' ? 'default' : 'outline'}
          data-testid="view-history-btn"
        >
          <History className="h-4 w-4 mr-2" />
          Riwayat Stok
        </Button>
      </div>

      {viewMode === 'inventory' ? (
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Package2 className="h-6 w-6" />
              Daftar Stok
              </CardTitle>
              <CardDescription>Semua Stok di semua outlet</CardDescription>
            </div>
            <Button 
              onClick={loadInventory}
              variant="outline"
              size="sm"
              data-testid="refresh-inventory-btn"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>

          {/* Outlet Filter */}
          <div className="flex gap-4 items-center pt-4">
            <Label htmlFor="outlet-filter" className="whitespace-nowrap">Filter Outlet:</Label>
            <Select 
              value={selectedOutletFilter} 
              onValueChange={setSelectedOutletFilter}
            >
              <SelectTrigger id="outlet-filter" className="w-[250px]" data-testid="outlet-filter">
                <SelectValue placeholder="Semua Outlet" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Outlet</SelectItem>
                {outlets.map(outlet => (
                  <SelectItem key={outlet.id} value={outlet.id}>
                    {outlet.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Badge variant="secondary" className="ml-auto">
              Total: {filteredInventory.length} item
            </Badge>
          </div>
        </CardHeader>

        <CardContent>
          {error && !showModal && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama Produk</TableHead>
                  <TableHead>Kategori</TableHead>
                  <TableHead>Outlet</TableHead>
                  <TableHead className="text-center">Stok Tersedia</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInventory.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      {selectedOutletFilter === 'all' 
                        ? 'Tidak ada data inventory.' 
                        : 'Tidak ada produk di outlet ini.'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredInventory.map(item => {
                    const status = getStockStatus(item.stock);
                    return (
                      <TableRow key={item.id} data-testid={`inventory-row-${item.id}`}>
                        <TableCell className="font-medium">{item.name}</TableCell>
                        <TableCell>{item.category || 'Uncategorized'}</TableCell>
                        <TableCell>
                          {item.outletId 
                            ? outlets.find(o => o.id === item.outletId)?.name || 'Unknown' 
                            : 'All Outlets'}
                        </TableCell>
                        <TableCell className="text-center font-semibold">{item.stock}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant="secondary" className={status.color}>
                            {status.icon && <span className="mr-1">{status.icon}</span>}
                            {status.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-2 justify-end">
                            <Button 
                              onClick={() => openModal(item, 'add')}
                              variant="ghost"
                              size="sm"
                              className="text-green-600 hover:text-green-700 hover:bg-green-50"
                              data-testid={`add-stock-btn-${item.id}`}
                            >
                              <Plus className="h-4 w-4 mr-1" />
                              Tambah
                            </Button>
                            <Button 
                              onClick={() => openModal(item, 'reduce')}
                              variant="ghost"
                              size="sm"
                              className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                              data-testid={`reduce-stock-btn-${item.id}`}
                            >
                              <Minus className="h-4 w-4 mr-1" />
                              Kurang
                            </Button>
                            <Button 
                              onClick={() => openModal(item, 'transfer')}
                              variant="ghost"
                              size="sm"
                              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                              data-testid={`transfer-stock-btn-${item.id}`}
                            >
                              <ArrowRightLeft className="h-4 w-4 mr-1" />
                              Transfer
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      ) : (
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="flex items-center gap-2">
                <History className="h-6 w-6" />
                Riwayat Perubahan Stok
              </CardTitle>
              <CardDescription>Log semua perubahan stok di sistem</CardDescription>
            </div>
            <Button 
              onClick={loadStockLogs}
              variant="outline"
              size="sm"
              data-testid="refresh-logs-btn"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          {isLoadingLogs ? (
            <div className="text-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
              <p className="mt-2 text-sm text-muted-foreground">Memuat riwayat...</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Waktu</TableHead>
                    <TableHead>Produk</TableHead>
                    <TableHead>Outlet</TableHead>
                    <TableHead>Operasi</TableHead>
                    <TableHead className="text-center">Jumlah</TableHead>
                    <TableHead>Detail Transfer</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stockLogs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        Belum ada riwayat perubahan stok
                      </TableCell>
                    </TableRow>
                  ) : (
                    stockLogs.map((log) => (
                      <TableRow key={log.id} data-testid={`log-row-${log.id}`}>
                        <TableCell className="text-sm">
                          {new Date(log.timestamp).toLocaleString('id-ID', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </TableCell>
                        <TableCell className="font-medium">{log.product_name || 'N/A'}</TableCell>
                        <TableCell>{log.outlet_name || 'N/A'}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className={getOperationColor(log.operation)}>
                            {getOperationLabel(log.operation)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center font-semibold">
                          {log.operation === 'reduce' || log.operation === 'transfer_out' || log.operation === 'sale' ? '-' : '+'}
                          {log.quantity}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {(log.operation === 'transfer_out' || log.operation === 'transfer_in') && (
                            <div>
                              {log.from_outlet_id && (
                                <div>Dari: {outlets.find(o => o.id === String(log.from_outlet_id))?.name || `Outlet #${log.from_outlet_id}`}</div>
                              )}
                              {log.to_outlet_id && (
                                <div>Ke: {outlets.find(o => o.id === String(log.to_outlet_id))?.name || `Outlet #${log.to_outlet_id}`}</div>
                              )}
                            </div>
                          )}
                          {!log.from_outlet_id && !log.to_outlet_id && '-'}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
      )}

      {/* Modal untuk Stock Management */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="sm:max-w-[500px]" data-testid="stock-modal">
          <DialogHeader>
            <DialogTitle>
              {actionType === 'add' && 'Tambah Stok'}
              {actionType === 'reduce' && 'Kurangi Stok'}
              {actionType === 'transfer' && 'Transfer Stok'}
            </DialogTitle>
            <DialogDescription>
              {selectedItem?.name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Tab Selection */}
            <div className="flex gap-2 bg-muted p-1 rounded-lg">
              <Button
                type="button"
                onClick={() => { setActionType('add'); setError(''); setSuccessMessage(''); }}
                variant={actionType === 'add' ? 'default' : 'ghost'}
                size="sm"
                className={`flex-1 ${actionType === 'add' ? 'bg-green-600 hover:bg-green-700' : ''}`}
                data-testid="tab-add"
              >
                <Plus className="h-4 w-4 mr-2" />
                Tambah
              </Button>
              <Button
                type="button"
                onClick={() => { setActionType('reduce'); setError(''); setSuccessMessage(''); }}
                variant={actionType === 'reduce' ? 'default' : 'ghost'}
                size="sm"
                className={`flex-1 ${actionType === 'reduce' ? 'bg-orange-600 hover:bg-orange-700' : ''}`}
                data-testid="tab-reduce"
              >
                <Minus className="h-4 w-4 mr-2" />
                Kurang
              </Button>
              <Button
                type="button"
                onClick={() => { setActionType('transfer'); setError(''); setSuccessMessage(''); }}
                variant={actionType === 'transfer' ? 'default' : 'ghost'}
                size="sm"
                className={`flex-1 ${actionType === 'transfer' ? 'bg-blue-600 hover:bg-blue-700' : ''}`}
                data-testid="tab-transfer"
              >
                <ArrowRightLeft className="h-4 w-4 mr-2" />
                Transfer
              </Button>
            </div>

            {/* Current Stock Info */}
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Stok Saat Ini</p>
                  <p className="text-3xl font-bold mt-1">{selectedItem?.stock || 0}</p>
                  <p className="text-xs text-muted-foreground mt-1">unit</p>
                </div>
              </CardContent>
            </Card>

            {/* Quantity Input */}
            <div className="space-y-2">
              <Label htmlFor="quantity">Jumlah</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="Masukkan jumlah"
                data-testid="quantity-input"
              />
            </div>

            {/* Outlet Selection for Transfer */}
            {actionType === 'transfer' && (
              <div className="space-y-2">
                <Label htmlFor="target-outlet">Outlet Tujuan</Label>
                <Select value={targetOutletId} onValueChange={setTargetOutletId}>
                  <SelectTrigger id="target-outlet" data-testid="outlet-select">
                    <SelectValue placeholder="Pilih outlet tujuan..." />
                  </SelectTrigger>
                  <SelectContent>
                    {outlets
                      .filter(outlet => outlet.id !== selectedItem?.outletId)
                      .map(outlet => (
                        <SelectItem key={outlet.id} value={outlet.id}>
                          {outlet.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <Alert variant="destructive" data-testid="error-message">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Success Message */}
            {successMessage && (
              <Alert className="bg-green-50 text-green-900 border-green-200" data-testid="success-message">
                <AlertDescription>{successMessage}</AlertDescription>
              </Alert>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={closeModal}
              disabled={isProcessing}
              data-testid="cancel-btn"
            >
              Batal
            </Button>
            <Button
              type="button"
              onClick={handleStockAction}
              disabled={isProcessing}
              className={
                actionType === 'add' 
                  ? 'bg-green-600 hover:bg-green-700'
                  : actionType === 'reduce'
                    ? 'bg-orange-600 hover:bg-orange-700'
                    : 'bg-blue-600 hover:bg-blue-700'
              }
              data-testid="submit-btn"
            >
              {isProcessing ? 'Memproses...' : 'Konfirmasi'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}