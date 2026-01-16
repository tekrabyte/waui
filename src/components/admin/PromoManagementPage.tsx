import { useState, useMemo, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { 
  useListProductsByOutlet, 
  useUpdateProduct, 
  useGetCallerUserProfile, 
  useIsCallerAdmin, 
  useListOutlets, 
  useListActivePackages, 
  useUpdatePackage, 
  useListActiveBundles, 
  useUpdateBundle,
  useListStandalonePromos,
  useCreateStandalonePromo,
  useUpdateStandalonePromo,
  useDeleteStandalonePromo
} from '../../hooks/useQueries';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tag, Pencil, Trash2, Plus, TrendingUp, Package, PackagePlus, Layers, Search, X, Store } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import PromoConfigForm from '../PromoConfigForm';
import type { Product, ProductPackage, Bundle, StandalonePromo } from '../../types/types';
import { toast } from 'sonner';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

type PromoItem = (Product | ProductPackage | Bundle) & {
  itemType: 'product' | 'package' | 'bundle';
};

export default function PromoManagementPage() {
  const queryClient = useQueryClient();
  const { data: userProfile } = useGetCallerUserProfile();
  const { data: isAdmin } = useIsCallerAdmin();
  const { data: outlets } = useListOutlets();
  const { data: promos, isLoading: promosLoading } = useListStandalonePromos();

  const isOwner = isAdmin;
  const userOutletId = userProfile?.outletId;
  const targetOutletId = isOwner ? null : userOutletId || null;

  // Fetch all products without outlet filter to get complete data
  const { data: products, isLoading: productsLoading } = useListProductsByOutlet(undefined);
  const { data: packages, isLoading: packagesLoading } = useListActivePackages(null);
  const { data: bundles, isLoading: bundlesLoading } = useListActiveBundles(null);

  const updateProduct = useUpdateProduct();
  const updatePackage = useUpdatePackage();
  const updateBundle = useUpdateBundle();
  const createPromo = useCreateStandalonePromo();
  const updatePromo = useUpdateStandalonePromo();
  const deletePromo = useDeleteStandalonePromo();

  const [isCreateEditDialogOpen, setIsCreateEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isViewProductsDialogOpen, setIsViewProductsDialogOpen] = useState(false);
  const [selectedPromo, setSelectedPromo] = useState<StandalonePromo | null>(null);
  const [promoToDelete, setPromoToDelete] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Form state for create/edit promo
  const [promoForm, setPromoForm] = useState({
    name: '',
    promoType: 'fixed' as 'fixed' | 'percentage',
    promoValue: 0,
    promoDays: [] as string[],
    promoStartTime: '',
    promoEndTime: '',
    promoStartDate: '',
    promoEndDate: '',
    promoMinPurchase: undefined as number | undefined,
    promoDescription: '',
  });

  // Selected products for applying promo
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [selectedPackages, setSelectedPackages] = useState<string[]>([]);
  const [selectedBundles, setSelectedBundles] = useState<string[]>([]);
  
  // Active tab outlet for filtering products (including factory stock tab)
  const [activeOutletTab, setActiveOutletTab] = useState<string>('');

  // Detect factory outlet (outlet with "Pabrik" in name or specific factory outlet)
  const factoryOutlet = useMemo(() => {
    if (!outlets) return null;
    return outlets.find(o => o.name.toLowerCase().includes('pabrik') || o.name.toLowerCase().includes('factory'));
  }, [outlets]);

  // Set default outlet tab when outlets load
  useEffect(() => {
    if (isOwner && outlets && outlets.length > 0 && !activeOutletTab) {
      setActiveOutletTab(outlets[0].id);
    }
  }, [outlets, isOwner, activeOutletTab]);

  // Convert data to PromoItem with itemType
  const productsWithType = useMemo((): PromoItem[] => {
    if (!products) return [];
    // Filter by active outlet tab
    if (isOwner && activeOutletTab) {
      return products
        .filter(p => p.outletId === activeOutletTab)
        .map(p => ({ ...p, itemType: 'product' as const }));
    }
    return products.map(p => ({ ...p, itemType: 'product' as const }));
  }, [products, activeOutletTab, isOwner]);

  const packagesWithType = useMemo((): PromoItem[] => {
    if (!packages) return [];
    // Filter by active outlet tab
    if (isOwner && activeOutletTab) {
      return packages
        .filter(p => p.outletId === activeOutletTab)
        .map(p => ({ ...p, itemType: 'package' as const }));
    }
    return packages.map(p => ({ ...p, itemType: 'package' as const }));
  }, [packages, activeOutletTab, isOwner]);

  const bundlesWithType = useMemo((): PromoItem[] => {
    if (!bundles) return [];
    // Filter by active outlet tab
    if (isOwner && activeOutletTab) {
      return bundles
        .filter(b => b.outletId === activeOutletTab)
        .map(b => ({ ...b, itemType: 'bundle' as const }));
    }
    return bundles.map(b => ({ ...b, itemType: 'bundle' as const }));
  }, [bundles, activeOutletTab, isOwner]);

  const allItems = useMemo(() => {
    return [...productsWithType, ...packagesWithType, ...bundlesWithType];
  }, [productsWithType, packagesWithType, bundlesWithType]);

  // Filter promos by search
  const filteredPromos = useMemo(() => {
    if (!promos) return [];
    if (!searchQuery) return promos;
    return promos.filter(promo => 
      promo.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [promos, searchQuery]);

  const handleCreatePromo = () => {
    setSelectedPromo(null);
    setPromoForm({
      name: '',
      promoType: 'fixed',
      promoValue: 0,
      promoDays: [],
      promoStartTime: '',
      promoEndTime: '',
      promoStartDate: '',
      promoEndDate: '',
      promoMinPurchase: undefined,
      promoDescription: '',
    });
    setSelectedProducts([]);
    setSelectedPackages([]);
    setSelectedBundles([]);
    // Reset to first outlet tab
    if (isOwner && outlets && outlets.length > 0) {
      setActiveOutletTab(outlets[0].id);
    }
    setIsCreateEditDialogOpen(true);
  };

  const handleEditPromo = (promo: StandalonePromo) => {
    console.log('Editing promo:', promo.id, promo.name);
    
    setSelectedPromo(promo);
    setPromoForm({
      name: promo.name,
      promoType: promo.promoType,
      promoValue: promo.promoValue,
      promoDays: promo.promoDays || [],
      promoStartTime: promo.promoStartTime || '',
      promoEndTime: promo.promoEndTime || '',
      promoStartDate: promo.promoStartDate || '',
      promoEndDate: promo.promoEndDate || '',
      promoMinPurchase: promo.promoMinPurchase,
      promoDescription: promo.promoDescription || '',
    });

    // Load products that have this promo applied
    const appliedProducts = products?.filter(p => p.appliedPromoId === promo.id).map(p => p.id) || [];
    const appliedPackages = packages?.filter(p => p.appliedPromoId === promo.id).map(p => p.id) || [];
    const appliedBundles = bundles?.filter(b => b.appliedPromoId === promo.id).map(b => b.id) || [];

    console.log('Applied items found:', {
      products: appliedProducts.length,
      packages: appliedPackages.length,
      bundles: appliedBundles.length
    });

    setSelectedProducts(appliedProducts);
    setSelectedPackages(appliedPackages);
    setSelectedBundles(appliedBundles);
    
    // Get first outlet from applied products, or use first available outlet
    let firstOutletId = '';
    const firstProduct = products?.find(p => p.appliedPromoId === promo.id);
    const firstPackage = packages?.find(p => p.appliedPromoId === promo.id);
    const firstBundle = bundles?.find(b => b.appliedPromoId === promo.id);
    
    if (firstProduct?.outletId) firstOutletId = firstProduct.outletId;
    else if (firstPackage?.outletId) firstOutletId = firstPackage.outletId;
    else if (firstBundle?.outletId) firstOutletId = firstBundle.outletId;
    else if (outlets && outlets.length > 0) firstOutletId = outlets[0].id;
    
    setActiveOutletTab(firstOutletId);
    
    setIsCreateEditDialogOpen(true);
  };

  const handleSubmitPromo = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!promoForm.name.trim()) {
      toast.error('Nama promo harus diisi!');
      return;
    }

    // Validasi: minimal harus ada 1 item yang dipilih
    const totalSelectedItems = selectedProducts.length + selectedPackages.length + selectedBundles.length;
    if (totalSelectedItems === 0) {
      toast.error('Pilih minimal 1 produk, paket, atau bundle untuk diterapkan promo!');
      return;
    }

    try {
      let promoId = selectedPromo?.id;

      // Create or update standalone promo
      if (selectedPromo) {
        await updatePromo.mutateAsync({
          id: selectedPromo.id,
          data: promoForm,
        });
        toast.success('Promo berhasil diperbarui!');
      } else {
        const result = await createPromo.mutateAsync(promoForm);
        promoId = result.id;
        toast.success('Promo berhasil dibuat!');
      }

      // Apply promo to selected products
      if (promoId) {
        await applyPromoToProducts(promoId);
      }

      setIsCreateEditDialogOpen(false);
      setSelectedPromo(null);
    } catch (err) {
      console.error('Error saving promo:', err);
      toast.error('Gagal menyimpan promo. Silakan coba lagi.');
    }
  };

  const applyPromoToProducts = async (promoId: string) => {
    try {
      console.log('Applying promo to products:', {
        promoId,
        selectedProducts,
        selectedPackages,
        selectedBundles,
      });

      // Update products
      for (const productId of selectedProducts) {
        const product = products?.find(p => p.id === productId);
        if (product) {
          console.log('Updating product:', product.id, product.name);
          await updateProduct.mutateAsync({
            id: product.id,
            name: product.name,
            price: product.price,
            stock: product.stock,
            outletId: product.outletId || null,
            categoryId: product.categoryId ? Number(product.categoryId) : null,
            brandId: product.brandId ? Number(product.brandId) : null,
            image_url: product.image || undefined,
            applied_promo_id: promoId,
          });
        }
      }

      // Update packages
      for (const packageId of selectedPackages) {
        const pkg = packages?.find(p => p.id === packageId);
        if (pkg) {
          console.log('Updating package:', pkg.id, pkg.name);
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
            applied_promo_id: promoId,
          });
        }
      }

      // Update bundles
      for (const bundleId of selectedBundles) {
        const bundle = bundles?.find(b => b.id === bundleId);
        if (bundle) {
          console.log('Updating bundle:', bundle.id, bundle.name);
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
            applied_promo_id: promoId,
          });
        }
      }

      // Remove promo from deselected items
      const currentAppliedProducts = products?.filter(p => p.appliedPromoId === promoId) || [];
      const currentAppliedPackages = packages?.filter(p => p.appliedPromoId === promoId) || [];
      const currentAppliedBundles = bundles?.filter(b => b.appliedPromoId === promoId) || [];

      for (const product of currentAppliedProducts) {
        if (!selectedProducts.includes(product.id)) {
          console.log('Removing promo from product:', product.id, product.name);
          await updateProduct.mutateAsync({
            id: product.id,
            name: product.name,
            price: product.price,
            stock: product.stock,
            outletId: product.outletId || null,
            categoryId: product.categoryId ? Number(product.categoryId) : null,
            brandId: product.brandId ? Number(product.brandId) : null,
            image_url: product.image || undefined,
            applied_promo_id: null,
          });
        }
      }

      for (const pkg of currentAppliedPackages) {
        if (!selectedPackages.includes(pkg.id)) {
          console.log('Removing promo from package:', pkg.id, pkg.name);
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
            applied_promo_id: null,
          });
        }
      }

      for (const bundle of currentAppliedBundles) {
        if (!selectedBundles.includes(bundle.id)) {
          console.log('Removing promo from bundle:', bundle.id, bundle.name);
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
            applied_promo_id: null,
          });
        }
      }

      // Invalidate queries to refresh data
      await queryClient.invalidateQueries({ queryKey: ['products'] });
      await queryClient.invalidateQueries({ queryKey: ['packages'] });
      await queryClient.invalidateQueries({ queryKey: ['bundles'] });

      console.log('Promo applied successfully!');
      toast.success('Promo berhasil diterapkan ke produk!');
    } catch (err) {
      console.error('Error applying promo to products:', err);
      toast.error('Gagal menerapkan promo ke produk.');
      throw err; // Re-throw to handle in handleSubmitPromo
    }
  };

  const handleDeletePromo = async () => {
    if (!promoToDelete) return;

    try {
      await deletePromo.mutateAsync(promoToDelete);
      toast.success('Promo berhasil dihapus!');
      setIsDeleteDialogOpen(false);
      setPromoToDelete(null);
    } catch (err) {
      console.error('Error deleting promo:', err);
      toast.error('Gagal menghapus promo. Silakan coba lagi.');
    }
  };

  const handleViewProducts = (promo: StandalonePromo) => {
    setSelectedPromo(promo);
    setIsViewProductsDialogOpen(true);
  };

  const getAppliedItemsForPromo = (promoId: string) => {
    const appliedProducts = products?.filter(p => p.appliedPromoId === promoId) || [];
    const appliedPackages = packages?.filter(p => p.appliedPromoId === promoId) || [];
    const appliedBundles = bundles?.filter(b => b.appliedPromoId === promoId) || [];

    return [
      ...appliedProducts.map(p => ({ ...p, itemType: 'product' as const })),
      ...appliedPackages.map(p => ({ ...p, itemType: 'package' as const })),
      ...appliedBundles.map(b => ({ ...b, itemType: 'bundle' as const })),
    ];
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(Number(amount));
  };

  const toggleProductSelection = (productId: string) => {
    setSelectedProducts(prev =>
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const togglePackageSelection = (packageId: string) => {
    setSelectedPackages(prev =>
      prev.includes(packageId)
        ? prev.filter(id => id !== packageId)
        : [...prev, packageId]
    );
  };

  const toggleBundleSelection = (bundleId: string) => {
    setSelectedBundles(prev =>
      prev.includes(bundleId)
        ? prev.filter(id => id !== bundleId)
        : [...prev, bundleId]
    );
  };

  const toggleOutletTab = (outletId: string) => {
    setActiveOutletTab(outletId);
  };

  const isLoading = promosLoading || productsLoading || packagesLoading || bundlesLoading;

  const totalActivePromos = filteredPromos.filter(p => p.isActive).length;
  const totalAppliedProducts = useMemo(() => {
    const productCount = products?.filter(p => p.appliedPromoId).length || 0;
    const packageCount = packages?.filter(p => p.appliedPromoId).length || 0;
    const bundleCount = bundles?.filter(b => b.appliedPromoId).length || 0;
    return productCount + packageCount + bundleCount;
  }, [products, packages, bundles]);

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
        <div className="flex items-center gap-3">
          <Badge variant="secondary" className="text-lg px-4 py-2">
            <TrendingUp className="h-4 w-4 mr-2" />
            {totalActivePromos} Promo Aktif
          </Badge>
          <Badge variant="outline" className="text-lg px-4 py-2">
            {totalAppliedProducts} Item dengan Promo
          </Badge>
        </div>
      </div>

      {/* Search and Create */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Cari promo..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Button onClick={handleCreatePromo} data-testid="create-promo-btn">
              <Plus className="h-4 w-4 mr-2" />
              Buat Promo Baru
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Promos List */}
      <Card>
        <CardHeader>
          <CardTitle>Daftar Promo</CardTitle>
          <CardDescription>
            Semua promo yang tersedia dalam sistem
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map(i => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : filteredPromos.length === 0 ? (
            <div className="text-center py-12">
              <Tag className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">
                {searchQuery ? 'Promo tidak ditemukan' : 'Belum ada promo'}
              </h3>
              <p className="text-sm text-muted-foreground mt-2">
                {searchQuery
                  ? 'Coba ubah kata kunci pencarian'
                  : 'Klik tombol "Buat Promo Baru" untuk memulai'}
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nama Promo</TableHead>
                    <TableHead>Tipe Diskon</TableHead>
                    <TableHead>Nilai Diskon</TableHead>
                    <TableHead>Hari Berlaku</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Produk Diterapkan</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPromos.map((promo) => {
                    const appliedItems = getAppliedItemsForPromo(promo.id);
                    const daysCount = promo.promoDays?.length || 0;
                    
                    return (
                      <TableRow key={promo.id}>
                        <TableCell className="font-medium">{promo.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {promo.promoType === 'percentage' ? 'Persentase' : 'Nominal'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-orange-600 font-semibold">
                          {promo.promoType === 'percentage' 
                            ? `${promo.promoValue}%` 
                            : formatCurrency(promo.promoValue)}
                        </TableCell>
                        <TableCell>
                          {daysCount > 0 ? (
                            <Badge variant="secondary">
                              {daysCount === 7 ? 'Setiap Hari' : `${daysCount} Hari`}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {promo.isActive ? (
                            <Badge className="bg-green-500 hover:bg-green-600">
                              Aktif
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-muted-foreground">
                              Tidak Aktif
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {appliedItems.length > 0 ? (
                            <Button
                              variant="link"
                              className="p-0 h-auto"
                              onClick={() => handleViewProducts(promo)}
                            >
                              {appliedItems.length} Item
                            </Button>
                          ) : (
                            <span className="text-muted-foreground">0 Item</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditPromo(promo)}
                            >
                              <Pencil className="h-4 w-4 mr-1" />
                              Edit
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setPromoToDelete(promo.id);
                                setIsDeleteDialogOpen(true);
                              }}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              Hapus
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Promo Dialog */}
      <Dialog open={isCreateEditDialogOpen} onOpenChange={setIsCreateEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Tag className="h-5 w-5 text-orange-500" />
              {selectedPromo ? 'Edit Promo' : 'Buat Promo Baru'}
            </DialogTitle>
            <DialogDescription>
              {selectedPromo ? 'Perbarui detail promo dan produk yang diterapkan' : 'Buat promo baru dan pilih produk yang akan diterapkan'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitPromo}>
            <div className="space-y-6 py-4">
              {/* Promo Name */}
              <div className="space-y-2">
                <Label htmlFor="promo-name">Nama Promo *</Label>
                <Input
                  id="promo-name"
                  placeholder="Contoh: Diskon Akhir Tahun"
                  value={promoForm.name}
                  onChange={(e) => setPromoForm({ ...promoForm, name: e.target.value })}
                  required
                />
              </div>

              {/* Promo Configuration */}
              <PromoConfigForm
                value={{
                  promoEnabled: true,
                  promoType: promoForm.promoType,
                  promoValue: promoForm.promoValue,
                  promoDays: promoForm.promoDays,
                  promoStartTime: promoForm.promoStartTime,
                  promoEndTime: promoForm.promoEndTime,
                  promoStartDate: promoForm.promoStartDate,
                  promoEndDate: promoForm.promoEndDate,
                  promoMinPurchase: promoForm.promoMinPurchase,
                  promoDescription: promoForm.promoDescription,
                }}
                onChange={(config) => {
                  setPromoForm({
                    ...promoForm,
                    promoType: config.promoType || 'fixed',
                    promoValue: config.promoValue || 0,
                    promoDays: config.promoDays || [],
                    promoStartTime: config.promoStartTime || '',
                    promoEndTime: config.promoEndTime || '',
                    promoStartDate: config.promoStartDate,
                    promoEndDate: config.promoEndDate,
                    promoMinPurchase: config.promoMinPurchase,
                    promoDescription: config.promoDescription,
                  });
                }}
              />

              {/* Outlet Tabs and Product Selection */}
              {isOwner && outlets && outlets.length > 0 ? (
                <div className="space-y-2">
                  <Label>Pilih Outlet dan Produk *</Label>
                  <p className="text-sm text-muted-foreground">
                    Pilih outlet melalui tab, lalu pilih produk yang akan mendapatkan promo
                  </p>
                  
                  <Tabs value={activeOutletTab} onValueChange={setActiveOutletTab} className="w-full">
                    <TabsList className="w-full grid" style={{ gridTemplateColumns: `repeat(${outlets.length + (factoryOutlet ? 1 : 0)}, 1fr)` }}>
                      {outlets.map((outlet) => (
                        <TabsTrigger 
                          key={outlet.id} 
                          value={outlet.id}
                          className="flex items-center gap-2"
                        >
                          <Store className="h-4 w-4" />
                          {outlet.name}
                        </TabsTrigger>
                      ))}
                      {factoryOutlet && (
                        <TabsTrigger 
                          key="factory-stock" 
                          value="factory-stock"
                          className="flex items-center gap-2"
                        >
                          <Package className="h-4 w-4" />
                          Stok Pabrik
                        </TabsTrigger>
                      )}
                    </TabsList>
                    
                    {outlets.map((outlet) => (
                      <TabsContent key={outlet.id} value={outlet.id} className="mt-4">
                        <div className="border rounded-lg p-4 space-y-4 max-h-96 overflow-y-auto">
                          {/* Products */}
                          {productsWithType.length > 0 && (
                            <div>
                              <h4 className="font-semibold mb-2 flex items-center gap-2">
                                <Package className="h-4 w-4" />
                                Produk Satuan ({selectedProducts.filter(id => productsWithType.some(p => p.id === id)).length}/{productsWithType.length})
                              </h4>
                              <div className="space-y-2 ml-6">
                                {productsWithType.map((product) => (
                                  <div key={product.id} className="flex items-center space-x-2">
                                    <Checkbox
                                      id={`product-${product.id}`}
                                      checked={selectedProducts.includes(product.id)}
                                      onCheckedChange={() => toggleProductSelection(product.id)}
                                    />
                                    <label
                                      htmlFor={`product-${product.id}`}
                                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                                    >
                                      {product.name} - {formatCurrency(product.price)}
                                    </label>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Packages */}
                          {packagesWithType.length > 0 && (
                            <div>
                              <h4 className="font-semibold mb-2 flex items-center gap-2">
                                <PackagePlus className="h-4 w-4" />
                                Paket ({selectedPackages.filter(id => packagesWithType.some(p => p.id === id)).length}/{packagesWithType.length})
                              </h4>
                              <div className="space-y-2 ml-6">
                                {packagesWithType.map((pkg) => (
                                  <div key={pkg.id} className="flex items-center space-x-2">
                                    <Checkbox
                                      id={`package-${pkg.id}`}
                                      checked={selectedPackages.includes(pkg.id)}
                                      onCheckedChange={() => togglePackageSelection(pkg.id)}
                                    />
                                    <label
                                      htmlFor={`package-${pkg.id}`}
                                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                                    >
                                      {pkg.name} - {formatCurrency(pkg.price)}
                                    </label>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Bundles */}
                          {bundlesWithType.length > 0 && (
                            <div>
                              <h4 className="font-semibold mb-2 flex items-center gap-2">
                                <Layers className="h-4 w-4" />
                                Bundle ({selectedBundles.filter(id => bundlesWithType.some(b => b.id === id)).length}/{bundlesWithType.length})
                              </h4>
                              <div className="space-y-2 ml-6">
                                {bundlesWithType.map((bundle) => (
                                  <div key={bundle.id} className="flex items-center space-x-2">
                                    <Checkbox
                                      id={`bundle-${bundle.id}`}
                                      checked={selectedBundles.includes(bundle.id)}
                                      onCheckedChange={() => toggleBundleSelection(bundle.id)}
                                    />
                                    <label
                                      htmlFor={`bundle-${bundle.id}`}
                                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                                    >
                                      {bundle.name} - {formatCurrency(bundle.price)}
                                    </label>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {productsWithType.length === 0 && packagesWithType.length === 0 && bundlesWithType.length === 0 && (
                            <div className="text-center py-8 text-muted-foreground">
                              <Package className="mx-auto h-12 w-12 mb-3 opacity-50" />
                              <p className="text-sm">
                                Tidak ada produk di outlet ini
                              </p>
                            </div>
                          )}
                        </div>
                        
                        <p className="text-sm text-muted-foreground mt-2">
                          Total dipilih dari {outlet.name}: {
                            productsWithType.filter(p => selectedProducts.includes(p.id)).length +
                            packagesWithType.filter(p => selectedPackages.includes(p.id)).length +
                            bundlesWithType.filter(b => selectedBundles.includes(b.id)).length
                          } item
                        </p>
                      </TabsContent>
                    ))}
                    
                    {/* Factory Stock Tab */}
                    {factoryOutlet && (
                      <TabsContent key="factory-stock" value="factory-stock" className="mt-4">
                        <div className="border rounded-lg p-4 space-y-4 max-h-96 overflow-y-auto">
                          {(() => {
                            const factoryProducts = products?.filter(p => p.outletId === factoryOutlet.id).map(p => ({ ...p, itemType: 'product' as const })) || [];
                            const factoryPackages = packages?.filter(p => p.outletId === factoryOutlet.id).map(p => ({ ...p, itemType: 'package' as const })) || [];
                            const factoryBundles = bundles?.filter(b => b.outletId === factoryOutlet.id).map(b => ({ ...b, itemType: 'bundle' as const })) || [];
                            
                            return (
                              <>
                                {/* Factory Products */}
                                {factoryProducts.length > 0 && (
                                  <div>
                                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                                      <Package className="h-4 w-4" />
                                      Produk Satuan Pabrik ({selectedProducts.filter(id => factoryProducts.some(p => p.id === id)).length}/{factoryProducts.length})
                                    </h4>
                                    <div className="space-y-2 ml-6">
                                      {factoryProducts.map((product) => (
                                        <div key={product.id} className="flex items-center space-x-2">
                                          <Checkbox
                                            id={`factory-product-${product.id}`}
                                            checked={selectedProducts.includes(product.id)}
                                            onCheckedChange={() => toggleProductSelection(product.id)}
                                          />
                                          <label
                                            htmlFor={`factory-product-${product.id}`}
                                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                                          >
                                            {product.name} - {formatCurrency(product.price)}
                                          </label>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* Factory Packages */}
                                {factoryPackages.length > 0 && (
                                  <div>
                                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                                      <PackagePlus className="h-4 w-4" />
                                      Paket Pabrik ({selectedPackages.filter(id => factoryPackages.some(p => p.id === id)).length}/{factoryPackages.length})
                                    </h4>
                                    <div className="space-y-2 ml-6">
                                      {factoryPackages.map((pkg) => (
                                        <div key={pkg.id} className="flex items-center space-x-2">
                                          <Checkbox
                                            id={`factory-package-${pkg.id}`}
                                            checked={selectedPackages.includes(pkg.id)}
                                            onCheckedChange={() => togglePackageSelection(pkg.id)}
                                          />
                                          <label
                                            htmlFor={`factory-package-${pkg.id}`}
                                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                                          >
                                            {pkg.name} - {formatCurrency(pkg.price)}
                                          </label>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* Factory Bundles */}
                                {factoryBundles.length > 0 && (
                                  <div>
                                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                                      <Layers className="h-4 w-4" />
                                      Bundle Pabrik ({selectedBundles.filter(id => factoryBundles.some(b => b.id === id)).length}/{factoryBundles.length})
                                    </h4>
                                    <div className="space-y-2 ml-6">
                                      {factoryBundles.map((bundle) => (
                                        <div key={bundle.id} className="flex items-center space-x-2">
                                          <Checkbox
                                            id={`factory-bundle-${bundle.id}`}
                                            checked={selectedBundles.includes(bundle.id)}
                                            onCheckedChange={() => toggleBundleSelection(bundle.id)}
                                          />
                                          <label
                                            htmlFor={`factory-bundle-${bundle.id}`}
                                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                                          >
                                            {bundle.name} - {formatCurrency(bundle.price)}
                                          </label>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                                
                                {factoryProducts.length === 0 && factoryPackages.length === 0 && factoryBundles.length === 0 && (
                                  <div className="text-center py-8 text-muted-foreground">
                                    <Package className="mx-auto h-12 w-12 mb-3 opacity-50" />
                                    <p className="text-sm">
                                      Tidak ada produk di stok pabrik
                                    </p>
                                  </div>
                                )}
                              </>
                            );
                          })()}
                        </div>
                        
                        <p className="text-sm text-muted-foreground mt-2">
                          Total dipilih dari Stok Pabrik: {
                            (products?.filter(p => p.outletId === factoryOutlet.id && selectedProducts.includes(p.id)).length || 0) +
                            (packages?.filter(p => p.outletId === factoryOutlet.id && selectedPackages.includes(p.id)).length || 0) +
                            (bundles?.filter(b => b.outletId === factoryOutlet.id && selectedBundles.includes(b.id)).length || 0)
                          } item
                        </p>
                      </TabsContent>
                    )}
                  </Tabs>

                  <p className="text-sm font-medium text-muted-foreground mt-4 p-3 bg-muted rounded-md">
                    Total dipilih (semua outlet): {selectedProducts.length + selectedPackages.length + selectedBundles.length} item
                  </p>
                </div>
              ) : (
                // Non-owner view (cashier/staff with single outlet)
                <div className="space-y-2">
                  <Label>Pilih Produk yang Diterapkan</Label>
                  <p className="text-sm text-muted-foreground">
                    Pilih produk, paket, atau bundle yang akan mendapatkan promo ini
                  </p>
                  
                  <div className="border rounded-lg p-4 space-y-4 max-h-96 overflow-y-auto">
                    {/* Products */}
                    {productsWithType.length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-2 flex items-center gap-2">
                          <Package className="h-4 w-4" />
                          Produk Satuan ({selectedProducts.length}/{productsWithType.length})
                        </h4>
                        <div className="space-y-2 ml-6">
                          {productsWithType.map((product) => (
                            <div key={product.id} className="flex items-center space-x-2">
                              <Checkbox
                                id={`product-${product.id}`}
                                checked={selectedProducts.includes(product.id)}
                                onCheckedChange={() => toggleProductSelection(product.id)}
                              />
                              <label
                                htmlFor={`product-${product.id}`}
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                              >
                                {product.name} - {formatCurrency(product.price)}
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Packages */}
                    {packagesWithType.length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-2 flex items-center gap-2">
                          <PackagePlus className="h-4 w-4" />
                          Paket ({selectedPackages.length}/{packagesWithType.length})
                        </h4>
                        <div className="space-y-2 ml-6">
                          {packagesWithType.map((pkg) => (
                            <div key={pkg.id} className="flex items-center space-x-2">
                              <Checkbox
                                id={`package-${pkg.id}`}
                                checked={selectedPackages.includes(pkg.id)}
                                onCheckedChange={() => togglePackageSelection(pkg.id)}
                              />
                              <label
                                htmlFor={`package-${pkg.id}`}
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                              >
                                {pkg.name} - {formatCurrency(pkg.price)}
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Bundles */}
                    {bundlesWithType.length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-2 flex items-center gap-2">
                          <Layers className="h-4 w-4" />
                          Bundle ({selectedBundles.length}/{bundlesWithType.length})
                        </h4>
                        <div className="space-y-2 ml-6">
                          {bundlesWithType.map((bundle) => (
                            <div key={bundle.id} className="flex items-center space-x-2">
                              <Checkbox
                                id={`bundle-${bundle.id}`}
                                checked={selectedBundles.includes(bundle.id)}
                                onCheckedChange={() => toggleBundleSelection(bundle.id)}
                              />
                              <label
                                htmlFor={`bundle-${bundle.id}`}
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                              >
                                {bundle.name} - {formatCurrency(bundle.price)}
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <p className="text-sm text-muted-foreground mt-2">
                    Total dipilih: {selectedProducts.length + selectedPackages.length + selectedBundles.length} item
                  </p>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateEditDialogOpen(false)}
              >
                Batal
              </Button>
              <Button 
                type="submit" 
                disabled={createPromo.isPending || updatePromo.isPending}
              >
                {createPromo.isPending || updatePromo.isPending
                  ? 'Menyimpan...'
                  : selectedPromo ? 'Perbarui Promo' : 'Buat Promo'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Promo?</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus promo ini? Tindakan ini tidak dapat dibatalkan.
              Produk yang terhubung dengan promo ini akan kehilangan diskon.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeletePromo}
              className="bg-red-600 hover:bg-red-700"
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* View Applied Products Dialog */}
      <Dialog open={isViewProductsDialogOpen} onOpenChange={setIsViewProductsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Produk dengan Promo: {selectedPromo?.name}</DialogTitle>
            <DialogDescription>
              Daftar semua produk, paket, dan bundle yang menggunakan promo ini
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            <div className="space-y-4 py-4">
              {selectedPromo && (() => {
                const items = getAppliedItemsForPromo(selectedPromo.id);
                
                if (items.length === 0) {
                  return (
                    <div className="text-center py-8 text-muted-foreground">
                      Belum ada produk yang diterapkan promo ini
                    </div>
                  );
                }

                return (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Tipe</TableHead>
                          <TableHead>Nama</TableHead>
                          <TableHead>Harga Normal</TableHead>
                          <TableHead>Diskon</TableHead>
                          <TableHead>Harga Promo</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {items.map((item) => {
                          const discount = selectedPromo.promoType === 'percentage'
                            ? (item.price * selectedPromo.promoValue) / 100
                            : selectedPromo.promoValue;
                          const promoPrice = item.price - discount;

                          return (
                            <TableRow key={`${item.itemType}-${item.id}`}>
                              <TableCell>
                                <Badge variant="outline">
                                  {item.itemType === 'product' && <Package className="h-3 w-3 mr-1" />}
                                  {item.itemType === 'package' && <PackagePlus className="h-3 w-3 mr-1" />}
                                  {item.itemType === 'bundle' && <Layers className="h-3 w-3 mr-1" />}
                                  {item.itemType === 'product' ? 'Produk' : item.itemType === 'package' ? 'Paket' : 'Bundle'}
                                </Badge>
                              </TableCell>
                              <TableCell className="font-medium">{item.name}</TableCell>
                              <TableCell>{formatCurrency(item.price)}</TableCell>
                              <TableCell className="text-orange-600 font-semibold">
                                {formatCurrency(discount)}
                              </TableCell>
                              <TableCell>
                                <div className="flex flex-col">
                                  <span className="font-bold text-green-600">
                                    {formatCurrency(promoPrice)}
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    Hemat {formatCurrency(discount)}
                                  </span>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                );
              })()}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}
