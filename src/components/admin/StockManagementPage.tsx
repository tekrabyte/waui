import { useState, useMemo, useEffect } from 'react';
import { api } from '../../services/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Minus, ArrowRightLeft, PackageOpen, Eye, Package } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';

type StockAction = 'add' | 'reduce' | 'transfer';

export default function StockManagementPage() {
  // Simpan data user lokal
  const [userProfile, setUserProfile] = useState<any>(null);
  
  const [products, setProducts] = useState<any[]>([]);
  const [outlets, setOutlets] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, setIsPending] = useState(false);

  // Dialog State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [stockAction, setStockAction] = useState<StockAction>('add');
  const [quantity, setQuantity] = useState('');
  const [targetOutlet, setTargetOutlet] = useState('');

  useEffect(() => {
    const u = localStorage.getItem('posq_user');
    if (u) setUserProfile(JSON.parse(u));
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      // Asumsi: api.products.getAll() mengembalikan field 'stock' 
      // Jika belum, Anda perlu update backend WP untuk include stok
      const [prodData, outletsData] = await Promise.all([
        api.products.getAll(),
        api.outlets.getAll()
      ]);
      setProducts(prodData);
      setOutlets(outletsData);
    } catch (e) {
      console.error(e);
      toast.error("Gagal memuat data stok");
    } finally {
      setIsLoading(false);
    }
  };

  const isOwner = userProfile?.role === 'owner' || userProfile?.role === 'admin' || userProfile?.role === 'administrator';
  const canManageStock = isOwner || (userProfile?.outletId !== undefined);

  // Filter produk berdasarkan outlet user jika bukan owner
  const displayedProducts = useMemo(() => {
    if (isOwner) return products;
    // Jika user punya outletId, filter produk yang ada di outlet dia
    // Note: Backend WP harus support filter ini atau frontend yang filter
    // Untuk saat ini kita tampilkan semua atau filter client-side
    return products; 
  }, [products, isOwner, userProfile]);

  const resetForm = () => {
    setQuantity('');
    setTargetOutlet('');
  };

  const handleOpenDialog = (product: any, action: StockAction) => {
    setSelectedProduct(product);
    setStockAction(action);
    resetForm();
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct || !quantity) return;

    const qtyNum = parseInt(quantity);
    if (isNaN(qtyNum) || qtyNum <= 0) {
      toast.error("Jumlah tidak valid");
      return;
    }

    setIsPending(true);
    try {
      if (stockAction === 'add') {
         // Panggil API update stock (asumsi ada endpoint ini)
         // await api.inventory.add(selectedProduct.id, qtyNum);
         toast.info("Simulasi: Stok bertambah " + qtyNum);
      } else if (stockAction === 'reduce') {
         // await api.inventory.reduce(selectedProduct.id, qtyNum);
         toast.info("Simulasi: Stok berkurang " + qtyNum);
      } else if (stockAction === 'transfer') {
         // await api.inventory.transfer(selectedProduct.id, fromId, toId, qtyNum);
         toast.info("Simulasi: Transfer stok ke outlet " + targetOutlet);
      }
      
      await loadData(); // Refresh data
      setIsDialogOpen(false);
      resetForm();
    } catch (err) {
      toast.error("Gagal update stok");
    } finally {
      setIsPending(false);
    }
  };

  const getDialogTitle = () => {
    switch (stockAction) {
      case 'add': return 'Tambah Stok';
      case 'reduce': return 'Kurangi Stok';
      case 'transfer': return 'Pindahkan Stok';
    }
  };

  // Helper render
  const getOutletName = (outletId: string) => {
    const outlet = outlets.find(o => String(o.id) === String(outletId));
    return outlet?.name || 'Gudang Pusat';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Manajemen Stok</h1>
          <p className="text-muted-foreground">
            {isOwner ? 'Kelola stok produk di semua outlet' : 'Kelola stok produk di outlet Anda'}
          </p>
        </div>
      </div>

      {!canManageStock && (
        <Alert>
          <Eye className="h-4 w-4" />
          <AlertDescription>
            Anda memiliki akses hanya-baca.
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="products" className="space-y-4">
        <TabsList>
          <TabsTrigger value="products">Produk Satuan</TabsTrigger>
          {/* Tabs Paket disembunyikan sementara jika belum support di WP */}
          <TabsTrigger value="packages" disabled>Paket (Coming Soon)</TabsTrigger> 
        </TabsList>

        <TabsContent value="products">
          <Card>
            <CardHeader>
              <CardTitle>Daftar Produk Satuan</CardTitle>
              <CardDescription>
                {isOwner ? 'Semua produk di semua outlet' : 'Produk di outlet Anda'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}
                </div>
              ) : displayedProducts.length === 0 ? (
                <div className="text-center py-12">
                  <PackageOpen className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-semibold">Belum ada produk</h3>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nama Produk</TableHead>
                        {isOwner && <TableHead>Outlet</TableHead>}
                        <TableHead>Stok Saat Ini</TableHead>
                        {canManageStock && <TableHead className="text-right">Aksi</TableHead>}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {displayedProducts.map((product) => (
                        <TableRow key={product.id}>
                          <TableCell className="font-medium">{product.name}</TableCell>
                          {isOwner && <TableCell>{getOutletName(product.outletId)}</TableCell>}
                          <TableCell>
                            {/* Simulasi stok random jika backend belum kirim */}
                            <span className="inline-flex items-center rounded-full px-3 py-1 text-sm font-medium bg-green-100 text-green-800">
                              {product.stock || 0} unit
                            </span>
                          </TableCell>
                          {canManageStock && (
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button variant="outline" size="sm" onClick={() => handleOpenDialog(product, 'add')} className="gap-1">
                                  <Plus className="h-4 w-4" />
                                </Button>
                                <Button variant="outline" size="sm" onClick={() => handleOpenDialog(product, 'reduce')} className="gap-1">
                                  <Minus className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          )}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog Stok */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{getDialogTitle()}</DialogTitle>
            <DialogDescription>Update stok manual.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              {selectedProduct && (
                <div className="space-y-2">
                  <Label>Produk</Label>
                  <div className="p-3 bg-muted rounded-md">
                    <p className="font-medium">{selectedProduct.name}</p>
                    <p className="text-sm text-muted-foreground">Stok saat ini: {selectedProduct.stock || 0}</p>
                  </div>
                </div>
              )}
              <div className="space-y-2">
                <Label>Jumlah</Label>
                <Input type="number" min="1" value={quantity} onChange={(e) => setQuantity(e.target.value)} required />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Batal</Button>
              <Button type="submit" disabled={isPending}>Konfirmasi</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}