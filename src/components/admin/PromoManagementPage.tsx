import { useState, useMemo } from 'react';
import { 
  useListStandalonePromos, 
  useCreateStandalonePromo, 
  useUpdateStandalonePromo, 
  useDeleteStandalonePromo,
  useListProductsByOutlet,
  useListActivePackages,
  useListActiveBundles,
  useUpdateProduct,
  useUpdatePackage,
  useUpdateBundle,
  useListOutlets,
  useGetAllCategories,
  useGetCallerUserProfile,
  useIsCallerAdmin
} from '../../hooks/useQueries';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Pencil, Trash2, Tag, Filter, X, Package, Layers, Box } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import type { StandalonePromo, Product, ProductPackage, Bundle } from '../../types/types';
import { toast } from 'sonner';

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

type ProductItem = (Product | ProductPackage | Bundle) & {
  itemType: 'product' | 'package' | 'bundle';
};

export default function PromoManagementPage() {
  const { data: userProfile } = useGetCallerUserProfile();
  const { data: isAdmin } = useIsCallerAdmin();
  const { data: outlets } = useListOutlets();
  const { data: categories } = useGetAllCategories();

  const isOwner = isAdmin;
  const userOutletId = userProfile?.outletId;
  const targetOutletId = isOwner ? null : userOutletId || null;

  // Data queries
  const { data: standalonePromos, isLoading: promosLoading } = useListStandalonePromos();
  const { data: allProducts, isLoading: productsLoading } = useListProductsByOutlet(targetOutletId);
  const { data: allPackages, isLoading: packagesLoading } = useListActivePackages(targetOutletId);
  const { data: allBundles, isLoading: bundlesLoading } = useListActiveBundles(targetOutletId);

  // Mutations
  const createPromo = useCreateStandalonePromo();
  const updatePromo = useUpdateStandalonePromo();
  const deletePromo = useDeleteStandalonePromo();
  const updateProduct = useUpdateProduct();
  const updatePackage = useUpdatePackage();
  const updateBundle = useUpdateBundle();

  // Dialog states
  const [isPromoDialogOpen, setIsPromoDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedPromo, setSelectedPromo] = useState<StandalonePromo | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);

  // Filter states
  const [selectedOutletFilter, setSelectedOutletFilter] = useState<string>('all');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('all');

  // Promo form
  const [promoForm, setPromoForm] = useState({
    name: '',
    promoType: 'fixed' as 'fixed' | 'percentage',
    promoValue: '',
    promoDays: [] as string[],
    promoStartTime: '',
    promoEndTime: '',
    promoStartDate: '',
    promoEndDate: '',
    promoMinPurchase: '',
    promoDescription: '',
  });

  // Selected products for bulk assignment
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [selectedOutletForProducts, setSelectedOutletForProducts] = useState<string>('all');

  // Combine all items into a unified list
  const allItems: ProductItem[] = useMemo(() => {
    const items: ProductItem[] = [];
    
    if (allProducts) {
      allProducts.forEach(p => items.push({ ...p, itemType: 'product' as const }));
    }
    if (allPackages) {
      allPackages.forEach(p => items.push({ ...p, itemType: 'package' as const }));
    }
    if (allBundles) {
      allBundles.forEach(b => items.push({ ...b, itemType: 'bundle' as const }));
    }
    
    return items;
  }, [allProducts, allPackages, allBundles]);

  // Filter items for product selection (in promo dialog)
  const availableItemsForPromo = useMemo(() => {
    return allItems.filter(item => {
      if (selectedOutletForProducts !== 'all' && item.outletId !== selectedOutletForProducts) {
        return false;
      }
      return true;
    });
  }, [allItems, selectedOutletForProducts]);

  // Filter items with promos (for Tab 2)
  const itemsWithPromos = useMemo(() => {
    return allItems.filter(item => {
      // Filter by outlet
      if (selectedOutletFilter !== 'all' && item.outletId !== selectedOutletFilter) {
        return false;
      }

      // Filter by category
      if (selectedCategoryFilter !== 'all' && item.categoryId !== selectedCategoryFilter) {
        return false;
      }

      // Filter by type
      if (selectedTypeFilter !== 'all' && item.itemType !== selectedTypeFilter) {
        return false;
      }

      // Only show items with promos (built-in OR standalone)
      const hasBuiltInPromo = 'promoEnabled' in item && item.promoEnabled;
      const hasStandalonePromo = 'appliedPromoId' in item && item.appliedPromoId;
      
      return hasBuiltInPromo || hasStandalonePromo;
    });
  }, [allItems, selectedOutletFilter, selectedCategoryFilter, selectedTypeFilter]);

  // Get promo name by ID
  const getPromoNameById = (promoId: string | undefined) => {
    if (!promoId || !standalonePromos) return '-';
    const promo = standalonePromos.find(p => p.id === promoId);
    return promo ? promo.name : '-';
  };

  // Handle open add dialog
  const handleOpenAddDialog = () => {
    setIsEditMode(false);
    setSelectedPromo(null);
    setPromoForm({
      name: '',
      promoType: 'fixed',
      promoValue: '',
      promoDays: [],
      promoStartTime: '',
      promoEndTime: '',
      promoStartDate: '',
      promoEndDate: '',
      promoMinPurchase: '',
      promoDescription: '',
    });
    setSelectedProductIds([]);
    setSelectedOutletForProducts('all');
    setIsPromoDialogOpen(true);
  };

  // Handle open edit dialog
  const handleOpenEditDialog = (promo: StandalonePromo) => {
    setIsEditMode(true);
    setSelectedPromo(promo);
    setPromoForm({
      name: promo.name,
      promoType: promo.promoType,
      promoValue: String(promo.promoValue),
      promoDays: promo.promoDays || [],
      promoStartTime: promo.promoStartTime || '',
      promoEndTime: promo.promoEndTime || '',
      promoStartDate: promo.promoStartDate || '',
      promoEndDate: promo.promoEndDate || '',
      promoMinPurchase: promo.promoMinPurchase ? String(promo.promoMinPurchase) : '',
      promoDescription: promo.promoDescription || '',
    });
    
    // Find products that use this promo
    const productsUsingPromo = allItems
      .filter(item => item.appliedPromoId === promo.id)
      .map(item => `${item.itemType}-${item.id}`);
    setSelectedProductIds(productsUsingPromo);
    setSelectedOutletForProducts('all');
    setIsPromoDialogOpen(true);
  };

  // Handle save promo
  const handleSavePromo = async () => {
    if (!promoForm.name.trim()) {
      toast.error('Nama promo harus diisi');
      return;
    }

    if (!promoForm.promoValue || Number(promoForm.promoValue) <= 0) {
      toast.error('Nilai promo harus lebih dari 0');
      return;
    }

    try {
      const promoData = {
        name: promoForm.name,
        promo_type: promoForm.promoType,
        promo_value: Number(promoForm.promoValue),
        promo_days: JSON.stringify(promoForm.promoDays),
        promo_start_time: promoForm.promoStartTime || null,
        promo_end_time: promoForm.promoEndTime || null,
        promo_start_date: promoForm.promoStartDate || null,
        promo_end_date: promoForm.promoEndDate || null,
        promo_min_purchase: promoForm.promoMinPurchase ? Number(promoForm.promoMinPurchase) : null,
        promo_description: promoForm.promoDescription || null,
        is_active: true,
      };

      let savedPromo;
      if (isEditMode && selectedPromo) {
        savedPromo = await updatePromo.mutateAsync({ id: selectedPromo.id, ...promoData });
      } else {
        savedPromo = await createPromo.mutateAsync(promoData);
      }

      // Apply promo to selected products
      const promoId = savedPromo?.id || selectedPromo?.id;
      if (promoId && selectedProductIds.length > 0) {
        await applyPromoToProducts(promoId);
      }

      toast.success(isEditMode ? 'Promo berhasil diupdate' : 'Promo berhasil dibuat');
      setIsPromoDialogOpen(false);
    } catch (error: any) {
      toast.error(error.message || 'Gagal menyimpan promo');
    }
  };

  // Apply promo to multiple products
  const applyPromoToProducts = async (promoId: string) => {
    const promises = selectedProductIds.map(async (itemId) => {
      const [type, id] = itemId.split('-');
      
      try {
        if (type === 'product') {
          await updateProduct.mutateAsync({ id, appliedPromoId: promoId });
        } else if (type === 'package') {
          await updatePackage.mutateAsync({ id, appliedPromoId: promoId });
        } else if (type === 'bundle') {
          await updateBundle.mutateAsync({ id, appliedPromoId: promoId });
        }
      } catch (error) {
        console.error(`Failed to apply promo to ${type} ${id}:`, error);
      }
    });

    await Promise.all(promises);
  };

  // Handle delete promo
  const handleDeletePromo = async () => {
    if (!selectedPromo) return;

    try {
      // First, remove promo from all products using it
      const itemsUsingPromo = allItems.filter(item => item.appliedPromoId === selectedPromo.id);
      
      for (const item of itemsUsingPromo) {
        try {
          if (item.itemType === 'product') {
            await updateProduct.mutateAsync({ id: item.id, appliedPromoId: null });
          } else if (item.itemType === 'package') {
            await updatePackage.mutateAsync({ id: item.id, appliedPromoId: null });
          } else if (item.itemType === 'bundle') {
            await updateBundle.mutateAsync({ id: item.id, appliedPromoId: null });
          }
        } catch (error) {
          console.error(`Failed to remove promo from ${item.itemType} ${item.id}:`, error);
        }
      }

      // Then delete the promo
      await deletePromo.mutateAsync(selectedPromo.id);
      toast.success('Promo berhasil dihapus');
      setIsDeleteDialogOpen(false);
    } catch (error: any) {
      toast.error(error.message || 'Gagal menghapus promo');
    }
  };

  // Handle remove promo from item
  const handleRemovePromoFromItem = async (item: ProductItem) => {
    try {
      if (item.itemType === 'product') {
        await updateProduct.mutateAsync({ id: item.id, appliedPromoId: null });
      } else if (item.itemType === 'package') {
        await updatePackage.mutateAsync({ id: item.id, appliedPromoId: null });
      } else if (item.itemType === 'bundle') {
        await updateBundle.mutateAsync({ id: item.id, appliedPromoId: null });
      }
      toast.success('Promo berhasil dihapus dari produk');
    } catch (error: any) {
      toast.error(error.message || 'Gagal menghapus promo');
    }
  };

  // Toggle product selection
  const toggleProductSelection = (itemId: string) => {
    setSelectedProductIds(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  // Toggle day selection
  const toggleDaySelection = (day: string) => {
    setPromoForm(prev => ({
      ...prev,
      promoDays: prev.promoDays.includes(day)
        ? prev.promoDays.filter(d => d !== day)
        : [...prev.promoDays, day]
    }));
  };

  // Format price
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  // Get outlet name
  const getOutletName = (outletId: string | undefined) => {
    if (!outletId || !outlets) return 'Semua Outlet';
    const outlet = outlets.find(o => o.id === outletId);
    return outlet ? outlet.name : 'Unknown';
  };

  // Get item type badge
  const getItemTypeBadge = (type: string) => {
    const config = {
      product: { label: 'Satuan', icon: Box, color: 'bg-blue-500' },
      package: { label: 'Paket', icon: Package, color: 'bg-green-500' },
      bundle: { label: 'Bundle', icon: Layers, color: 'bg-purple-500' },
    };
    const { label, icon: Icon, color } = config[type as keyof typeof config] || config.product;
    
    return (
      <Badge variant="outline" className="gap-1">
        <Icon className="h-3 w-3" />
        {label}
      </Badge>
    );
  };

  const isLoading = promosLoading || productsLoading || packagesLoading || bundlesLoading;

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6" data-testid="promo-management-page">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold" data-testid="promo-management-title">Manajemen Promo</h1>
          <p className="text-muted-foreground">Kelola promo dan terapkan ke produk</p>
        </div>
      </div>

      <Tabs defaultValue="promos" className="space-y-4">
        <TabsList>
          <TabsTrigger value="promos" data-testid="tab-promos">
            <Tag className="h-4 w-4 mr-2" />
            Kelola Promo
          </TabsTrigger>
          <TabsTrigger value="products" data-testid="tab-products">
            <Filter className="h-4 w-4 mr-2" />
            Produk Dengan Promo
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Kelola Promo */}
        <TabsContent value="promos" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Daftar Promo</CardTitle>
                  <CardDescription>Buat dan kelola promo standalone</CardDescription>
                </div>
                <Button onClick={handleOpenAddDialog} data-testid="add-promo-btn">
                  <Plus className="h-4 w-4 mr-2" />
                  Buat Promo
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {!standalonePromos || standalonePromos.length === 0 ? (
                <Alert>
                  <AlertDescription>
                    Belum ada promo. Klik "Buat Promo" untuk membuat promo baru.
                  </AlertDescription>
                </Alert>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nama Promo</TableHead>
                      <TableHead>Tipe</TableHead>
                      <TableHead>Nilai</TableHead>
                      <TableHead>Hari Aktif</TableHead>
                      <TableHead>Jam Aktif</TableHead>
                      <TableHead>Produk Terapkan</TableHead>
                      <TableHead className="text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {standalonePromos.map((promo) => {
                      const itemsUsingPromo = allItems.filter(item => item.appliedPromoId === promo.id);
                      
                      return (
                        <TableRow key={promo.id} data-testid={`promo-row-${promo.id}`}>
                          <TableCell className="font-medium">{promo.name}</TableCell>
                          <TableCell>
                            <Badge variant={promo.promoType === 'fixed' ? 'default' : 'secondary'}>
                              {promo.promoType === 'fixed' ? 'Fixed' : 'Percentage'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {promo.promoType === 'fixed' 
                              ? formatPrice(promo.promoValue)
                              : `${promo.promoValue}%`
                            }
                          </TableCell>
                          <TableCell>
                            {promo.promoDays && promo.promoDays.length > 0 
                              ? promo.promoDays.join(', ')
                              : 'Semua Hari'
                            }
                          </TableCell>
                          <TableCell>
                            {promo.promoStartTime && promo.promoEndTime
                              ? `${promo.promoStartTime} - ${promo.promoEndTime}`
                              : 'Sepanjang Hari'
                            }
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{itemsUsingPromo.length} produk</Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleOpenEditDialog(promo)}
                                data-testid={`edit-promo-${promo.id}`}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedPromo(promo);
                                  setIsDeleteDialogOpen(true);
                                }}
                                data-testid={`delete-promo-${promo.id}`}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: Produk Dengan Promo */}
        <TabsContent value="products" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Produk Dengan Promo</CardTitle>
              <CardDescription>Lihat dan kelola produk yang sudah menerapkan promo</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Filters */}
              <div className="flex gap-4 mb-4">
                <div className="flex-1">
                  <Label>Filter Outlet</Label>
                  <Select value={selectedOutletFilter} onValueChange={setSelectedOutletFilter}>
                    <SelectTrigger data-testid="filter-outlet">
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

                <div className="flex-1">
                  <Label>Filter Kategori</Label>
                  <Select value={selectedCategoryFilter} onValueChange={setSelectedCategoryFilter}>
                    <SelectTrigger data-testid="filter-category">
                      <SelectValue placeholder="Semua Kategori" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Kategori</SelectItem>
                      {categories?.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex-1">
                  <Label>Filter Tipe</Label>
                  <Select value={selectedTypeFilter} onValueChange={setSelectedTypeFilter}>
                    <SelectTrigger data-testid="filter-type">
                      <SelectValue placeholder="Semua Tipe" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Tipe</SelectItem>
                      <SelectItem value="product">Satuan</SelectItem>
                      <SelectItem value="package">Paket</SelectItem>
                      <SelectItem value="bundle">Bundle</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Products Table */}
              {itemsWithPromos.length === 0 ? (
                <Alert>
                  <AlertDescription>
                    Tidak ada produk dengan promo. Terapkan promo ke produk melalui tab "Kelola Promo".
                  </AlertDescription>
                </Alert>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nama Produk</TableHead>
                      <TableHead>Tipe</TableHead>
                      <TableHead>Outlet</TableHead>
                      <TableHead>Harga</TableHead>
                      <TableHead>Promo Built-in</TableHead>
                      <TableHead>Standalone Promo</TableHead>
                      <TableHead className="text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {itemsWithPromos.map((item) => {
                      const hasBuiltInPromo = 'promoEnabled' in item && item.promoEnabled;
                      const standalonePromoName = getPromoNameById(item.appliedPromoId);
                      
                      return (
                        <TableRow key={`${item.itemType}-${item.id}`} data-testid={`product-row-${item.id}`}>
                          <TableCell className="font-medium">{item.name}</TableCell>
                          <TableCell>{getItemTypeBadge(item.itemType)}</TableCell>
                          <TableCell>{getOutletName(item.outletId)}</TableCell>
                          <TableCell>{formatPrice(item.price)}</TableCell>
                          <TableCell>
                            {hasBuiltInPromo ? (
                              <Badge variant="secondary">
                                {item.promoType === 'fixed' 
                                  ? formatPrice(item.promoValue || 0)
                                  : `${item.promoValue}%`
                                }
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {item.appliedPromoId ? (
                              <Badge>{standalonePromoName}</Badge>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {item.appliedPromoId && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemovePromoFromItem(item)}
                                data-testid={`remove-promo-${item.id}`}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Promo Dialog */}
      <Dialog open={isPromoDialogOpen} onOpenChange={setIsPromoDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" data-testid="promo-dialog">
          <DialogHeader>
            <DialogTitle>{isEditMode ? 'Edit Promo' : 'Buat Promo Baru'}</DialogTitle>
            <DialogDescription>
              Isi detail promo dan pilih produk yang akan menerapkan promo ini
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Promo Details */}
            <div className="space-y-4">
              <h3 className="font-semibold">Detail Promo</h3>
              
              <div>
                <Label htmlFor="promo-name">Nama Promo *</Label>
                <Input
                  id="promo-name"
                  value={promoForm.name}
                  onChange={(e) => setPromoForm({ ...promoForm, name: e.target.value })}
                  placeholder="Contoh: Diskon Akhir Tahun"
                  data-testid="promo-name-input"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="promo-type">Tipe Promo *</Label>
                  <Select 
                    value={promoForm.promoType} 
                    onValueChange={(value: 'fixed' | 'percentage') => 
                      setPromoForm({ ...promoForm, promoType: value })
                    }
                  >
                    <SelectTrigger id="promo-type" data-testid="promo-type-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fixed">Fixed (Potongan Harga)</SelectItem>
                      <SelectItem value="percentage">Percentage (Persentase)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="promo-value">
                    Nilai Promo * {promoForm.promoType === 'percentage' ? '(%)' : '(Rp)'}
                  </Label>
                  <Input
                    id="promo-value"
                    type="number"
                    value={promoForm.promoValue}
                    onChange={(e) => setPromoForm({ ...promoForm, promoValue: e.target.value })}
                    placeholder="Contoh: 10000 atau 10"
                    data-testid="promo-value-input"
                  />
                </div>
              </div>

              <div>
                <Label>Hari Aktif</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {DAYS_OF_WEEK.map((day) => (
                    <Button
                      key={day}
                      type="button"
                      variant={promoForm.promoDays.includes(day) ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => toggleDaySelection(day)}
                      data-testid={`day-${day}`}
                    >
                      {day.substring(0, 3)}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="start-time">Jam Mulai</Label>
                  <Input
                    id="start-time"
                    type="time"
                    value={promoForm.promoStartTime}
                    onChange={(e) => setPromoForm({ ...promoForm, promoStartTime: e.target.value })}
                    data-testid="promo-start-time"
                  />
                </div>

                <div>
                  <Label htmlFor="end-time">Jam Selesai</Label>
                  <Input
                    id="end-time"
                    type="time"
                    value={promoForm.promoEndTime}
                    onChange={(e) => setPromoForm({ ...promoForm, promoEndTime: e.target.value })}
                    data-testid="promo-end-time"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="start-date">Tanggal Mulai</Label>
                  <Input
                    id="start-date"
                    type="date"
                    value={promoForm.promoStartDate}
                    onChange={(e) => setPromoForm({ ...promoForm, promoStartDate: e.target.value })}
                    data-testid="promo-start-date"
                  />
                </div>

                <div>
                  <Label htmlFor="end-date">Tanggal Selesai</Label>
                  <Input
                    id="end-date"
                    type="date"
                    value={promoForm.promoEndDate}
                    onChange={(e) => setPromoForm({ ...promoForm, promoEndDate: e.target.value })}
                    data-testid="promo-end-date"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="min-purchase">Minimal Pembelian (Opsional)</Label>
                <Input
                  id="min-purchase"
                  type="number"
                  value={promoForm.promoMinPurchase}
                  onChange={(e) => setPromoForm({ ...promoForm, promoMinPurchase: e.target.value })}
                  placeholder="Contoh: 50000"
                  data-testid="promo-min-purchase"
                />
              </div>

              <div>
                <Label htmlFor="description">Deskripsi (Opsional)</Label>
                <Input
                  id="description"
                  value={promoForm.promoDescription}
                  onChange={(e) => setPromoForm({ ...promoForm, promoDescription: e.target.value })}
                  placeholder="Deskripsi promo"
                  data-testid="promo-description"
                />
              </div>
            </div>

            {/* Product Selection */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-semibold">Pilih Produk (Bulk)</h3>
                <div className="flex items-center gap-2">
                  <Label className="text-sm">Filter Outlet:</Label>
                  <Select 
                    value={selectedOutletForProducts} 
                    onValueChange={setSelectedOutletForProducts}
                  >
                    <SelectTrigger className="w-48" data-testid="product-outlet-filter">
                      <SelectValue />
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
              </div>

              <div className="border rounded-lg max-h-64 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox
                          checked={selectedProductIds.length === availableItemsForPromo.length && availableItemsForPromo.length > 0}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedProductIds(
                                availableItemsForPromo.map(item => `${item.itemType}-${item.id}`)
                              );
                            } else {
                              setSelectedProductIds([]);
                            }
                          }}
                          data-testid="select-all-products"
                        />
                      </TableHead>
                      <TableHead>Nama</TableHead>
                      <TableHead>Tipe</TableHead>
                      <TableHead>Outlet</TableHead>
                      <TableHead>Harga</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {availableItemsForPromo.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground">
                          Tidak ada produk tersedia
                        </TableCell>
                      </TableRow>
                    ) : (
                      availableItemsForPromo.map((item) => {
                        const itemId = `${item.itemType}-${item.id}`;
                        return (
                          <TableRow key={itemId}>
                            <TableCell>
                              <Checkbox
                                checked={selectedProductIds.includes(itemId)}
                                onCheckedChange={() => toggleProductSelection(itemId)}
                                data-testid={`select-product-${item.id}`}
                              />
                            </TableCell>
                            <TableCell>{item.name}</TableCell>
                            <TableCell>{getItemTypeBadge(item.itemType)}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {getOutletName(item.outletId)}
                            </TableCell>
                            <TableCell>{formatPrice(item.price)}</TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>

              <p className="text-sm text-muted-foreground">
                {selectedProductIds.length} produk dipilih
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPromoDialogOpen(false)}>
              Batal
            </Button>
            <Button 
              onClick={handleSavePromo}
              disabled={createPromo.isPending || updatePromo.isPending}
              data-testid="save-promo-btn"
            >
              {isEditMode ? 'Update Promo' : 'Buat Promo'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent data-testid="delete-promo-dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Promo?</AlertDialogTitle>
            <AlertDialogDescription>
              Promo akan dihapus dan semua produk yang menggunakan promo ini akan kehilangan promo tersebut.
              Aksi ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeletePromo}
              disabled={deletePromo.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="confirm-delete-promo"
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
