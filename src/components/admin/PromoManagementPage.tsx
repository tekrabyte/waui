import { useState, useMemo } from 'react';
import { useListProductsByOutlet, useUpdateProduct, useGetCallerUserProfile, useIsCallerAdmin, useListOutlets, useListActivePackages, useUpdatePackage, useListActiveBundles, useUpdateBundle } from '../../hooks/useQueries';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tag, Pencil, TrendingUp, Package, PackagePlus, Layers, Filter, Search } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import PromoConfigForm from '../PromoConfigForm';
import type { Product, ProductPackage, Bundle, PromoConfig } from '../../types/types';
import { toast } from 'sonner';

type PromoItem = (Product | ProductPackage | Bundle) & {
  itemType: 'product' | 'package' | 'bundle';
};

export default function PromoManagementPage() {
  const { data: userProfile } = useGetCallerUserProfile();
  const { data: isAdmin } = useIsCallerAdmin();
  const { data: outlets } = useListOutlets();

  const isOwner = isAdmin;
  const userOutletId = userProfile?.outletId;
  const targetOutletId = isOwner ? null : userOutletId || null;

  const { data: products, isLoading: productsLoading } = useListProductsByOutlet(targetOutletId);
  const { data: packages, isLoading: packagesLoading } = useListActivePackages(targetOutletId);
  const { data: bundles, isLoading: bundlesLoading } = useListActiveBundles(targetOutletId);

  const updateProduct = useUpdateProduct();
  const updatePackage = useUpdatePackage();
  const updateBundle = useUpdateBundle();

  const [activeTab, setActiveTab] = useState('products');
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<PromoItem | null>(null);
  const [promoConfig, setPromoConfig] = useState<Partial<PromoConfig>>({
    promoEnabled: false,
    promoType: 'fixed',
    promoValue: 0,
    promoDays: [],
    promoStartTime: '',
    promoEndTime: '',
  });

  // Filters
  const [selectedOutletFilter, setSelectedOutletFilter] = useState<string>('all');
  const [promoStatusFilter, setPromoStatusFilter] = useState<string>('all'); // all, active, inactive
  const [searchQuery, setSearchQuery] = useState('');

  // Convert data to PromoItem with itemType
  const productsWithType = useMemo((): PromoItem[] => {
    if (!products) return [];
    return products.map(p => ({ ...p, itemType: 'product' as const }));
  }, [products]);

  const packagesWithType = useMemo((): PromoItem[] => {
    if (!packages) return [];
    return packages.map(p => ({ ...p, itemType: 'package' as const }));
  }, [packages]);

  const bundlesWithType = useMemo((): PromoItem[] => {
    if (!bundles) return [];
    return bundles.map(b => ({ ...b, itemType: 'bundle' as const }));
  }, [bundles]);

  // Apply filters
  const filterItems = (items: PromoItem[]) => {
    return items.filter(item => {
      // Outlet filter
      if (selectedOutletFilter !== 'all') {
        if (selectedOutletFilter === 'factory') {
          const outletId = item.outletId;
          if (outletId && outletId !== '' && outletId !== 'null' && outletId !== '0') {
            return false;
          }
        } else {
          if (String(item.outletId) !== selectedOutletFilter) {
            return false;
          }
        }
      }

      // Promo status filter
      if (promoStatusFilter === 'active' && !item.promoEnabled) return false;
      if (promoStatusFilter === 'inactive' && item.promoEnabled) return false;

      // Search filter
      if (searchQuery && !item.name.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }

      return true;
    });
  };

  const filteredProducts = useMemo(() => filterItems(productsWithType), [productsWithType, selectedOutletFilter, promoStatusFilter, searchQuery]);
  const filteredPackages = useMemo(() => filterItems(packagesWithType), [packagesWithType, selectedOutletFilter, promoStatusFilter, searchQuery]);
  const filteredBundles = useMemo(() => filterItems(bundlesWithType), [bundlesWithType, selectedOutletFilter, promoStatusFilter, searchQuery]);

  const handleEditPromo = (item: PromoItem) => {
    setSelectedItem(item);
    setPromoConfig({
      promoEnabled: item.promoEnabled || false,
      promoType: item.promoType || 'fixed',
      promoValue: item.promoValue || 0,
      promoDays: item.promoDays || [],
      promoStartTime: item.promoStartTime || '',
      promoEndTime: item.promoEndTime || '',
      promoStartDate: item.promoStartDate,
      promoEndDate: item.promoEndDate,
      promoMinPurchase: item.promoMinPurchase,
      promoDescription: item.promoDescription,
    });
    setIsEditDialogOpen(true);
  };

  const handleSubmitPromo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;

    try {
      const promoData = {
        promo_enabled: promoConfig.promoEnabled ? 1 : 0,
        promo_type: promoConfig.promoType || 'fixed',
        promo_value: promoConfig.promoValue || 0,
        promo_days: JSON.stringify(promoConfig.promoDays || []),
        promo_start_time: promoConfig.promoStartTime || null,
        promo_end_time: promoConfig.promoEndTime || null,
        promo_start_date: promoConfig.promoStartDate || null,
        promo_end_date: promoConfig.promoEndDate || null,
        promo_min_purchase: promoConfig.promoMinPurchase || null,
        promo_description: promoConfig.promoDescription || null,
      };

      if (selectedItem.itemType === 'product') {
        await updateProduct.mutateAsync({
          id: selectedItem.id,
          name: selectedItem.name,
          price: selectedItem.price,
          stock: (selectedItem as Product).stock,
          outletId: selectedItem.outletId || null,
          categoryId: selectedItem.categoryId ? Number(selectedItem.categoryId) : null,
          brandId: (selectedItem as Product).brandId ? Number((selectedItem as Product).brandId) : null,
          image_url: selectedItem.image || undefined,
          ...promoData,
        });
      } else if (selectedItem.itemType === 'package') {
        const pkg = selectedItem as ProductPackage;
        await updatePackage.mutateAsync({
          id: pkg.id,
          name: pkg.name,
          price: pkg.price,
          components: (pkg.components || []).map(c => ({
            productId: Number(c.productId),
            quantity: c.quantity,
          })),
          categoryId: pkg.categoryId ? Number(pkg.categoryId) : null,
          image_url: pkg.image || undefined,
          ...promoData,
        });
      } else if (selectedItem.itemType === 'bundle') {
        const bundle = selectedItem as Bundle;
        await updateBundle.mutateAsync({
          id: bundle.id,
          name: bundle.name,
          price: bundle.price,
          outletId: bundle.outletId ? Number(bundle.outletId) : 0,
          items: (bundle.items || []).map(i => ({
            productId: i.isPackage ? 0 : Number(i.productId),
            packageId: i.isPackage ? Number(i.packageId) : null,
            quantity: i.quantity,
            isPackage: i.isPackage || false,
          })),
          categoryId: bundle.categoryId ? Number(bundle.categoryId) : null,
          image_url: bundle.image || undefined,
          manualStockEnabled: bundle.manualStockEnabled,
          manualStock: bundle.manualStock ? Number(bundle.manualStock) : null,
          ...promoData,
        });
      }

      toast.success('Promo berhasil diperbarui!');
      setIsEditDialogOpen(false);
      setSelectedItem(null);
    } catch (err) {
      console.error('Error updating promo:', err);
      toast.error('Gagal memperbarui promo. Silakan coba lagi.');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(Number(amount));
  };

  const calculatePromoPrice = (item: PromoItem) => {
    if (!item.promoEnabled || !item.promoValue) return null;
    
    if (item.promoType === 'percentage') {
      const discount = (item.price * item.promoValue) / 100;
      return item.price - discount;
    } else {
      return item.price - item.promoValue;
    }
  };

  const getOutletName = (outletId?: string | null) => {
    if (!outletId || outletId === '' || outletId === 'null' || outletId === '0') {
      return 'Stok Pabrik';
    }
    const outlet = outlets?.find(o => o.id === outletId.toString());
    return outlet?.name || `Outlet #${outletId}`;
  };

  const isLoading = productsLoading || packagesLoading || bundlesLoading;

  const renderPromoTable = (items: PromoItem[], emptyIcon: React.ReactNode, emptyMessage: string) => {
    if (isLoading) {
      return (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map(i => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      );
    }

    if (items.length === 0) {
      return (
        <div className="text-center py-12">
          {emptyIcon}
          <h3 className="mt-4 text-lg font-semibold">{emptyMessage}</h3>
          <p className="text-sm text-muted-foreground mt-2">
            {searchQuery || promoStatusFilter !== 'all' || selectedOutletFilter !== 'all'
              ? 'Coba ubah filter pencarian'
              : 'Belum ada item untuk dikonfigurasi promo'}
          </p>
        </div>
      );
    }

    return (
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nama Item</TableHead>
              {isOwner && <TableHead>Outlet</TableHead>}
              <TableHead>Harga Normal</TableHead>
              <TableHead>Status Promo</TableHead>
              <TableHead>Diskon</TableHead>
              <TableHead>Harga Promo</TableHead>
              <TableHead>Hari Berlaku</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => {
              const promoPrice = calculatePromoPrice(item);
              const promoDaysCount = item.promoDays?.length || 0;
              
              return (
                <TableRow key={`${item.itemType}-${item.id}`}>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  {isOwner && <TableCell>{getOutletName(item.outletId)}</TableCell>}
                  <TableCell>{formatCurrency(item.price)}</TableCell>
                  <TableCell>
                    {item.promoEnabled ? (
                      <Badge className="bg-green-500 hover:bg-green-600">
                        <Tag className="h-3 w-3 mr-1" />
                        Aktif
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-muted-foreground">
                        Tidak Aktif
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {item.promoEnabled && item.promoValue ? (
                      <span className="text-orange-600 font-semibold">
                        {item.promoType === 'percentage' 
                          ? `${item.promoValue}%` 
                          : formatCurrency(item.promoValue)}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {promoPrice !== null && promoPrice >= 0 ? (
                      <div className="flex flex-col">
                        <span className="font-bold text-green-600">
                          {formatCurrency(promoPrice)}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          Hemat {formatCurrency(item.price - promoPrice)}
                        </span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {item.promoEnabled && promoDaysCount > 0 ? (
                      <Badge variant="secondary">
                        {promoDaysCount === 7 ? 'Setiap Hari' : `${promoDaysCount} Hari`}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditPromo(item)}
                    >
                      <Pencil className="h-4 w-4 mr-1" />
                      {item.promoEnabled ? 'Edit Promo' : 'Aktifkan Promo'}
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Tag className="h-8 w-8 text-orange-500" />
            Manajemen Promo
          </h1>
          <p className="text-muted-foreground mt-1">
            Kelola promo untuk produk satuan, paket, dan bundle
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-lg px-4 py-2">
            <TrendingUp className="h-4 w-4 mr-2" />
            {filteredProducts.filter(p => p.promoEnabled).length + 
             filteredPackages.filter(p => p.promoEnabled).length + 
             filteredBundles.filter(b => b.promoEnabled).length} Promo Aktif
          </Badge>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="space-y-2">
              <Label htmlFor="search" className="flex items-center gap-2">
                <Search className="h-4 w-4" />
                Cari Item
              </Label>
              <Input
                id="search"
                placeholder="Nama produk, paket, atau bundle..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Outlet Filter */}
            {isOwner && outlets && outlets.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="outlet-filter" className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  Filter Outlet
                </Label>
                <Select value={selectedOutletFilter} onValueChange={setSelectedOutletFilter}>
                  <SelectTrigger id="outlet-filter">
                    <SelectValue placeholder="Pilih outlet" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Outlet</SelectItem>
                    <SelectItem value="factory">Stok Pabrik</SelectItem>
                    {outlets.map((outlet) => (
                      <SelectItem key={outlet.id} value={outlet.id}>
                        {outlet.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Promo Status Filter */}
            <div className="space-y-2">
              <Label htmlFor="promo-filter" className="flex items-center gap-2">
                <Tag className="h-4 w-4" />
                Status Promo
              </Label>
              <Select value={promoStatusFilter} onValueChange={setPromoStatusFilter}>
                <SelectTrigger id="promo-filter">
                  <SelectValue placeholder="Pilih status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Status</SelectItem>
                  <SelectItem value="active">Promo Aktif</SelectItem>
                  <SelectItem value="inactive">Promo Tidak Aktif</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Active Filters Display */}
          {(searchQuery || selectedOutletFilter !== 'all' || promoStatusFilter !== 'all') && (
            <div className="flex items-center gap-2 mt-4">
              <span className="text-sm text-muted-foreground">Filter aktif:</span>
              {searchQuery && (
                <Badge variant="secondary">
                  Pencarian: {searchQuery}
                </Badge>
              )}
              {selectedOutletFilter !== 'all' && (
                <Badge variant="secondary">
                  Outlet: {selectedOutletFilter === 'factory' ? 'Stok Pabrik' : getOutletName(selectedOutletFilter)}
                </Badge>
              )}
              {promoStatusFilter !== 'all' && (
                <Badge variant="secondary">
                  Status: {promoStatusFilter === 'active' ? 'Aktif' : 'Tidak Aktif'}
                </Badge>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedOutletFilter('all');
                  setPromoStatusFilter('all');
                }}
              >
                Reset Filter
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="products">
            <Package className="mr-2 h-4 w-4" />
            Produk Satuan ({filteredProducts.length})
          </TabsTrigger>
          <TabsTrigger value="packages">
            <PackagePlus className="mr-2 h-4 w-4" />
            Paket ({filteredPackages.length})
          </TabsTrigger>
          <TabsTrigger value="bundles">
            <Layers className="mr-2 h-4 w-4" />
            Bundle ({filteredBundles.length})
          </TabsTrigger>
        </TabsList>

        {/* Products Tab */}
        <TabsContent value="products">
          <Card>
            <CardHeader>
              <CardTitle>Promo Produk Satuan</CardTitle>
              <CardDescription>
                Konfigurasi promo untuk produk individual
              </CardDescription>
            </CardHeader>
            <CardContent>
              {renderPromoTable(
                filteredProducts,
                <Package className="mx-auto h-12 w-12 text-muted-foreground" />,
                'Tidak ada produk'
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Packages Tab */}
        <TabsContent value="packages">
          <Card>
            <CardHeader>
              <CardTitle>Promo Paket</CardTitle>
              <CardDescription>
                Konfigurasi promo untuk paket bundling
              </CardDescription>
            </CardHeader>
            <CardContent>
              {renderPromoTable(
                filteredPackages,
                <PackagePlus className="mx-auto h-12 w-12 text-muted-foreground" />,
                'Tidak ada paket'
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Bundles Tab */}
        <TabsContent value="bundles">
          <Card>
            <CardHeader>
              <CardTitle>Promo Bundle</CardTitle>
              <CardDescription>
                Konfigurasi promo untuk bundle kombinasi
              </CardDescription>
            </CardHeader>
            <CardContent>
              {renderPromoTable(
                filteredBundles,
                <Layers className="mx-auto h-12 w-12 text-muted-foreground" />,
                'Tidak ada bundle'
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Promo Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Tag className="h-5 w-5 text-orange-500" />
              {selectedItem?.promoEnabled ? 'Edit Promo' : 'Aktifkan Promo'}: {selectedItem?.name}
            </DialogTitle>
            <DialogDescription>
              Konfigurasi promo untuk {selectedItem?.itemType === 'product' ? 'produk' : selectedItem?.itemType === 'package' ? 'paket' : 'bundle'} ini
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitPromo}>
            <div className="space-y-4 py-4">
              <PromoConfigForm
                value={promoConfig}
                onChange={setPromoConfig}
                originalPrice={selectedItem?.price}
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
              >
                Batal
              </Button>
              <Button type="submit" disabled={updateProduct.isPending || updatePackage.isPending || updateBundle.isPending}>
                {updateProduct.isPending || updatePackage.isPending || updateBundle.isPending
                  ? 'Menyimpan...'
                  : 'Simpan Promo'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
