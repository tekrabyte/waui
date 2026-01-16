import { useState, useMemo } from 'react';
import { useListProductsByOutlet, useAddProduct, useUpdateProduct, useDeleteProduct, useGetCallerUserProfile, useIsCallerAdmin, useListOutlets, useGetAllCategories, useGetAllBrands, useListActivePackages, useCreatePackage, useUpdatePackage, useMarkPackageInactive, useListActiveBundles, useCreateBundle, useUpdateBundle, useMarkBundleInactive } from '../../hooks/useQueries';
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
import { Plus, Pencil, Trash2, Package, Eye, PackagePlus, Layers, Minus } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ImageUpload } from '../ImageUpload';
import PromoConfigForm from '../PromoConfigForm';
import type { Product, ProductPackage, Bundle, PromoConfig } from '../../types/types';
import { calculatePackageStock, calculateBundleStock } from '../../lib/packageStockCalculator';
import { getInitials, getColorFromString } from '../../lib/utils';

interface ComponentInput {
  productId: string;
  quantity: string;
}

interface BundleItemInput {
  productId: string;
  packageId: string;
  quantity: string;
  isPackage: boolean;
}

export default function ProductManagementPage() {
  const { data: userProfile } = useGetCallerUserProfile();
  const { data: isAdmin } = useIsCallerAdmin();
  const { data: outlets } = useListOutlets();
  const { data: categories } = useGetAllCategories();
  const { data: brands } = useGetAllBrands();

  const isOwner = isAdmin;
  const userOutletId = userProfile?.outletId;
  const targetOutletId = isOwner ? null : userOutletId || null;

  const { data: products, isLoading: productsLoading } = useListProductsByOutlet(targetOutletId);
  const { data: packages, isLoading: packagesLoading } = useListActivePackages(targetOutletId);
  const { data: bundles, isLoading: bundlesLoading } = useListActiveBundles(targetOutletId);

  const addProduct = useAddProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();
  const createPackage = useCreatePackage();
  const updatePackage = useUpdatePackage();
  const markPackageInactive = useMarkPackageInactive();
  const createBundle = useCreateBundle();
  const updateBundle = useUpdateBundle();
  const markBundleInactive = useMarkBundleInactive();

  const [activeTab, setActiveTab] = useState('products');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Product | ProductPackage | Bundle | null>(null);
  
  // Filter state
  const [selectedOutletFilter, setSelectedOutletFilter] = useState<string>('all');

  // Product form
  const [productForm, setProductForm] = useState({
    name: '',
    price: '',
    stock: '',
    outletId: '',
    categoryId: 'none',
    brandId: 'none',
    imageUrl: '',
  });

  // Promo config for product
  const [productPromoConfig, setProductPromoConfig] = useState<Partial<PromoConfig>>({
    promoEnabled: false,
    promoType: 'fixed',
    promoValue: 0,
    promoDays: [],
    promoStartTime: '',
    promoEndTime: '',
  });

  // Package form
  const [packageForm, setPackageForm] = useState({
    name: '',
    price: '',
    outletId: '',
    categoryId: 'none',
    imageUrl: '',
  });
  const [packageComponents, setPackageComponents] = useState<ComponentInput[]>([{ productId: '', quantity: '1' }]);

  // Promo config for package
  const [packagePromoConfig, setPackagePromoConfig] = useState<Partial<PromoConfig>>({
    promoEnabled: false,
    promoType: 'fixed',
    promoValue: 0,
    promoDays: [],
    promoStartTime: '',
    promoEndTime: '',
  });

  // Bundle form
  const [bundleForm, setBundleForm] = useState({
    name: '',
    price: '',
    outletId: '',
    categoryId: 'none',
    manualStockEnabled: false,
    manualStock: '',
    imageUrl: '',
  });
  const [bundleItems, setBundleItems] = useState<BundleItemInput[]>([{ productId: '', packageId: '', quantity: '1', isPackage: false }]);

  // Promo config for bundle
  const [bundlePromoConfig, setBundlePromoConfig] = useState<Partial<PromoConfig>>({
    promoEnabled: false,
    promoType: 'fixed',
    promoValue: 0,
    promoDays: [],
    promoStartTime: '',
    promoEndTime: '',
  });

  // Calculate stocks dynamically
  const packagesWithStock = useMemo(() => {
    if (!packages || !products) return [];
    return packages.map(pkg => ({
      ...pkg,
      stock: calculatePackageStock(pkg, products),
    }));
  }, [packages, products]);

  const bundlesWithStock = useMemo(() => {
    if (!bundles || !products || !packages) return [];
    return bundles.map(bundle => {
      // PERBAIKAN BUG: Cek manualStockEnabled SEBELUM calculate
      // Jika manual stock enabled, gunakan nilai manual tanpa perhitungan otomatis
      if (bundle.manualStockEnabled && bundle.manualStock !== undefined && bundle.manualStock !== null) {
        return {
          ...bundle,
          stock: bundle.manualStock,
          calculatedStock: bundle.manualStock,
        };
      }
      
      // Jika tidak manual, hitung otomatis dari komponen
      const calculatedStock = calculateBundleStock(bundle, products, packages);
      return {
        ...bundle,
        stock: calculatedStock,
        calculatedStock: calculatedStock,
      };
    });
  }, [bundles, products, packages]);

  // PERBAIKAN: Filter produk, paket, dan bundle berdasarkan outlet yang dipilih
  const filteredProducts = useMemo(() => {
    if (!products) return [];
    if (selectedOutletFilter === 'all') return products;
    if (selectedOutletFilter === 'factory') return products.filter(p => !p.outletId || p.outletId === '' || p.outletId === 'null');
    return products.filter(p => String(p.outletId) === selectedOutletFilter);
  }, [products, selectedOutletFilter]);

  const filteredPackages = useMemo(() => {
    if (!packagesWithStock) return [];
    if (selectedOutletFilter === 'all') return packagesWithStock;
    if (selectedOutletFilter === 'factory') return packagesWithStock.filter(p => !p.outletId || p.outletId === '' || p.outletId === 'null');
    return packagesWithStock.filter(p => String(p.outletId) === selectedOutletFilter);
  }, [packagesWithStock, selectedOutletFilter]);

  const filteredBundles = useMemo(() => {
    if (!bundlesWithStock) return [];
    if (selectedOutletFilter === 'all') return bundlesWithStock;
    if (selectedOutletFilter === 'factory') {
      return bundlesWithStock.filter(b => {
        const rawOutletId = (b as any).outlet_id || b.outletId;
        return !rawOutletId || rawOutletId === '' || rawOutletId === 'null' || rawOutletId === null || rawOutletId === '0' || rawOutletId === 0;
      });
    }
    return bundlesWithStock.filter(b => {
      const rawOutletId = (b as any).outlet_id || b.outletId;
      return String(rawOutletId) === selectedOutletFilter;
    });
  }, [bundlesWithStock, selectedOutletFilter]);

  const resetForms = () => {
    setProductForm({ 
      name: '', 
      price: '', 
      stock: '', 
      outletId: userOutletId?.toString() || '',
      categoryId: 'none',
      brandId: 'none',
      imageUrl: '',
    });
    setProductPromoConfig({
      promoEnabled: false,
      promoType: 'fixed',
      promoValue: 0,
      promoDays: [],
      promoStartTime: '',
      promoEndTime: '',
    });
    setPackageForm({ 
      name: '', 
      price: '', 
      outletId: userOutletId?.toString() || '',
      categoryId: 'none',
      imageUrl: '',
    });
    setPackageComponents([{ productId: '', quantity: '1' }]);
    setPackagePromoConfig({
      promoEnabled: false,
      promoType: 'fixed',
      promoValue: 0,
      promoDays: [],
      promoStartTime: '',
      promoEndTime: '',
    });
    setBundleForm({ 
      name: '', 
      price: '', 
      outletId: userOutletId?.toString() || '0',
      categoryId: 'none',
      manualStockEnabled: false,
      manualStock: '',
      imageUrl: '',
    });
    setBundleItems([{ productId: '', packageId: '', quantity: '1', isPackage: false }]);
    setBundlePromoConfig({
      promoEnabled: false,
      promoType: 'fixed',
      promoValue: 0,
      promoDays: [],
      promoStartTime: '',
      promoEndTime: '',
    });
  };

  const handleAdd = () => {
    setIsAddDialogOpen(true);
    resetForms();
  };

  const handleEdit = (item: Product | ProductPackage | Bundle) => {
    setSelectedItem(item);
    
    // --- PERBAIKAN UTAMA DI SINI ---
    // Menggunakan safe access dengan (item as any) dan pengecekan null/undefined
    
    if ('components' in item) {
      // It's a package
      setPackageForm({
        name: item.name,
        price: String(item.price || 0),
        outletId: String(item.outletId || ''),
        categoryId: (item as any).categoryId ? String((item as any).categoryId) : ((item as any).category_id ? String((item as any).category_id) : 'none'),
        imageUrl: item.image || '',
      });

      // Populate promo config for package
      setPackagePromoConfig({
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

      // Safe mapping for components
      const rawComponents = item.components || (item as any).items || [];
      const mappedComponents = Array.isArray(rawComponents) ? rawComponents.map((c: any) => ({
        // Cek productId, jika tidak ada cek product_id, jika tidak ada default ke string kosong
        productId: c.productId ? String(c.productId) : (c.product_id ? String(c.product_id) : ''),
        quantity: c.quantity ? String(c.quantity) : '1',
      })) : [];

      setPackageComponents(mappedComponents.length > 0 ? mappedComponents : [{ productId: '', quantity: '1' }]);
      
    } else if ('items' in item && 'active' in item) { 
      // It's a bundle
      // PERBAIKAN BUG: Cek dengan lebih teliti apakah bundle ini factory bundle
      // Dari API, outlet_id bisa 0, null, undefined, '', atau 'null' untuk factory bundle
      const rawOutletId = (item as any).outlet_id || (item as any).outletId;
      const isFactory = !rawOutletId || rawOutletId === '' || rawOutletId === 'null' || rawOutletId === null || rawOutletId === undefined || rawOutletId === '0' || rawOutletId === 0;
      
      setBundleForm({
        name: item.name,
        price: String(item.price || 0),
        outletId: isFactory ? '0' : String(rawOutletId),
        categoryId: (item as any).categoryId ? String((item as any).categoryId) : ((item as any).category_id ? String((item as any).category_id) : 'none'),
        manualStockEnabled: item.manualStockEnabled || false,
        manualStock: item.manualStock ? String(item.manualStock) : '',
        imageUrl: item.image || '',
      });

      // Populate promo config for bundle
      setBundlePromoConfig({
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

      const rawItems = item.items || [];
      const mappedItems = Array.isArray(rawItems) ? rawItems.map((i: any) => ({
        productId: i.isPackage ? '' : (i.productId ? String(i.productId) : (i.product_id ? String(i.product_id) : '')),
        packageId: i.isPackage ? (i.packageId ? String(i.packageId) : (i.package_id ? String(i.package_id) : '')) : '',
        quantity: i.quantity ? String(i.quantity) : '1',
        isPackage: !!(i.isPackage || i.is_package),
      })) : [];

      setBundleItems(mappedItems.length > 0 ? mappedItems : [{ productId: '', packageId: '', quantity: '1', isPackage: false }]);
      
    } else {
      // It's a product
      const p = item as any; // Cast to any to access potentially unmapped fields safely
      setProductForm({
        name: p.name,
        price: String(p.price || 0),
        stock: String(p.stock || 0),
        outletId: String(p.outletId || p.outlet_id || ''),
        categoryId: p.categoryId ? String(p.categoryId) : (p.category_id ? String(p.category_id) : 'none'),
        brandId: p.brandId ? String(p.brandId) : (p.brand_id ? String(p.brand_id) : 'none'),
        imageUrl: p.image || '',
      });

      // Populate promo config for product
      setProductPromoConfig({
        promoEnabled: p.promoEnabled || false,
        promoType: p.promoType || 'fixed',
        promoValue: p.promoValue || 0,
        promoDays: p.promoDays || [],
        promoStartTime: p.promoStartTime || '',
        promoEndTime: p.promoEndTime || '',
        promoStartDate: p.promoStartDate,
        promoEndDate: p.promoEndDate,
        promoMinPurchase: p.promoMinPurchase,
        promoDescription: p.promoDescription,
      });
    }
    setIsEditDialogOpen(true);
  };
   

  const handleDelete = (item: Product | ProductPackage | Bundle) => {
    setSelectedItem(item);
    setIsDeleteDialogOpen(true);
  };

  const handleSubmitAdd = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (activeTab === 'products') {
      if (!productForm.name || !productForm.price || !productForm.stock) {
        alert('Mohon lengkapi nama, harga, dan stok produk.');
        return;
      }

      // Prepare promo data
      const promoData = productPromoConfig.promoEnabled ? {
        promo_enabled: 1,
        promo_type: productPromoConfig.promoType || 'fixed',
        promo_value: productPromoConfig.promoValue || 0,
        promo_days: JSON.stringify(productPromoConfig.promoDays || []),
        promo_start_time: productPromoConfig.promoStartTime || null,
        promo_end_time: productPromoConfig.promoEndTime || null,
        promo_start_date: productPromoConfig.promoStartDate || null,
        promo_end_date: productPromoConfig.promoEndDate || null,
        promo_min_purchase: productPromoConfig.promoMinPurchase || null,
        promo_description: productPromoConfig.promoDescription || null,
      } : {
        promo_enabled: 0,
      };

      addProduct.mutate(
        {
          name: productForm.name,
          price: Number(productForm.price),
          stock: Number(productForm.stock),
          outletId: productForm.outletId ? String(productForm.outletId) : null,
          categoryId: productForm.categoryId !== 'none' ? Number(productForm.categoryId) : null,
          brandId: productForm.brandId !== 'none' ? Number(productForm.brandId) : null,
          image_url: productForm.imageUrl || undefined,
          ...promoData,
        },
        {
          onSuccess: () => {
            setIsAddDialogOpen(false);
            resetForms();
          },
          onError: (err) => {
            console.error(err);
            alert("Gagal menambah produk. Pastikan koneksi aman.");
          }
        }
      );
    } else if (activeTab === 'packages') {
      const validComponents = packageComponents.filter(c => c.productId && c.quantity);
      if (validComponents.length === 0) return;

      const components = validComponents.map(c => ({
        productId: Number(c.productId), 
        quantity: Number(c.quantity),
      }));

      // Prepare promo data
      const promoData = packagePromoConfig.promoEnabled ? {
        promo_enabled: 1,
        promo_type: packagePromoConfig.promoType || 'fixed',
        promo_value: packagePromoConfig.promoValue || 0,
        promo_days: JSON.stringify(packagePromoConfig.promoDays || []),
        promo_start_time: packagePromoConfig.promoStartTime || null,
        promo_end_time: packagePromoConfig.promoEndTime || null,
        promo_start_date: packagePromoConfig.promoStartDate || null,
        promo_end_date: packagePromoConfig.promoEndDate || null,
        promo_min_purchase: packagePromoConfig.promoMinPurchase || null,
        promo_description: packagePromoConfig.promoDescription || null,
      } : {
        promo_enabled: 0,
      };

      createPackage.mutate(
        {
          name: packageForm.name,
          price: Number(packageForm.price),
          outletId: Number(packageForm.outletId),
          components,
          categoryId: packageForm.categoryId !== 'none' ? Number(packageForm.categoryId) : null,
          image_url: packageForm.imageUrl || undefined,
          ...promoData,
        },
        {
          onSuccess: () => {
            setIsAddDialogOpen(false);
            resetForms();
          },
          onError: (err) => {
            console.error(err);
            alert("Gagal menambah paket. Periksa koneksi atau data yang diinput.");
          }
        }
      );
    } else if (activeTab === 'bundles') {
      // PERBAIKAN: Validasi khusus - bundle pabrik memiliki outletId "0"
      const isFactoryBundle = !bundleForm.outletId || bundleForm.outletId === '' || bundleForm.outletId === '0';
      
      if (!isFactoryBundle && !bundleForm.outletId) {
        alert('Mohon pilih outlet untuk bundle non-pabrik.');
        return;
      }

      const validItems = bundleItems.filter(i => (i.isPackage ? i.packageId : i.productId) && i.quantity);
      if (validItems.length === 0) {
        alert('Mohon tambahkan minimal 1 item ke bundle.');
        return;
      }

      const items = validItems.map(i => ({
        productId: i.isPackage ? 0 : Number(i.productId),
        packageId: i.isPackage ? Number(i.packageId) : null,
        quantity: Number(i.quantity),
        isPackage: i.isPackage,
      }));

      // Prepare promo data
      const promoData = bundlePromoConfig.promoEnabled ? {
        promo_enabled: 1,
        promo_type: bundlePromoConfig.promoType || 'fixed',
        promo_value: bundlePromoConfig.promoValue || 0,
        promo_days: JSON.stringify(bundlePromoConfig.promoDays || []),
        promo_start_time: bundlePromoConfig.promoStartTime || null,
        promo_end_time: bundlePromoConfig.promoEndTime || null,
        promo_start_date: bundlePromoConfig.promoStartDate || null,
        promo_end_date: bundlePromoConfig.promoEndDate || null,
        promo_min_purchase: bundlePromoConfig.promoMinPurchase || null,
        promo_description: bundlePromoConfig.promoDescription || null,
      } : {
        promo_enabled: 0,
      };

      const bundleData: any = {
        name: bundleForm.name,
        price: Number(bundleForm.price),
        outletId: isFactoryBundle ? 0 : Number(bundleForm.outletId),
        items,
        categoryId: bundleForm.categoryId !== 'none' ? Number(bundleForm.categoryId) : null,
        image_url: bundleForm.imageUrl || undefined,
        ...promoData,
      };

      // Add manual stock if enabled
      if (bundleForm.manualStockEnabled) {
        bundleData.manualStockEnabled = true;
        bundleData.manualStock = Number(bundleForm.manualStock) || 0;
      }

      createBundle.mutate(
        bundleData,
        {
          onSuccess: () => {
            setIsAddDialogOpen(false);
            resetForms();
          },
          onError: (err) => {
            console.error(err);
            alert("Gagal menambah bundle. Periksa koneksi atau data yang diinput.");
          }
        }
      );
    }
  };

  const handleSubmitEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;

    if ('components' in selectedItem) {
      // Edit Package logic...
      const validComponents = packageComponents.filter(c => c.productId && c.quantity);
      if (validComponents.length === 0) return;
      const components = validComponents.map(c => ({
        productId: Number(c.productId),
        quantity: Number(c.quantity),
      }));

      // Prepare promo data
      const promoData = packagePromoConfig.promoEnabled ? {
        promo_enabled: 1,
        promo_type: packagePromoConfig.promoType || 'fixed',
        promo_value: packagePromoConfig.promoValue || 0,
        promo_days: JSON.stringify(packagePromoConfig.promoDays || []),
        promo_start_time: packagePromoConfig.promoStartTime || null,
        promo_end_time: packagePromoConfig.promoEndTime || null,
        promo_start_date: packagePromoConfig.promoStartDate || null,
        promo_end_date: packagePromoConfig.promoEndDate || null,
        promo_min_purchase: packagePromoConfig.promoMinPurchase || null,
        promo_description: packagePromoConfig.promoDescription || null,
      } : {
        promo_enabled: 0,
      };

      updatePackage.mutate(
        {
          id: selectedItem.id,
          name: packageForm.name,
          price: Number(packageForm.price),
          components,
          categoryId: packageForm.categoryId !== 'none' ? Number(packageForm.categoryId) : null,
          image_url: packageForm.imageUrl || undefined,
          ...promoData,
        },
        {
          onSuccess: () => {
            setIsEditDialogOpen(false);
            setSelectedItem(null);
            resetForms();
          },
          onError: (err) => {
            console.error(err);
            alert("Gagal update paket. Periksa koneksi atau data yang diinput.");
          }
        }
      );
    } else if ('items' in selectedItem && 'active' in selectedItem) {
      // Edit Bundle logic...
      // Validasi khusus - bundle pabrik memiliki outletId "0"
      const isFactoryBundle = !bundleForm.outletId || bundleForm.outletId === '' || bundleForm.outletId === '0';
      
      if (!isFactoryBundle && !bundleForm.outletId) {
        alert('Mohon pilih outlet untuk bundle non-pabrik.');
        return;
      }
      
      const validItems = bundleItems.filter(i => (i.isPackage ? i.packageId : i.productId) && i.quantity);
      if (validItems.length === 0) {
        alert('Mohon tambahkan minimal 1 item ke bundle.');
        return;
      }
      const items = validItems.map(i => ({
        productId: i.isPackage ? 0 : Number(i.productId),
        packageId: i.isPackage ? Number(i.packageId) : null,
        quantity: Number(i.quantity),
        isPackage: i.isPackage,
      }));

      // Prepare promo data
      const promoData = bundlePromoConfig.promoEnabled ? {
        promo_enabled: 1,
        promo_type: bundlePromoConfig.promoType || 'fixed',
        promo_value: bundlePromoConfig.promoValue || 0,
        promo_days: JSON.stringify(bundlePromoConfig.promoDays || []),
        promo_start_time: bundlePromoConfig.promoStartTime || null,
        promo_end_time: bundlePromoConfig.promoEndTime || null,
        promo_start_date: bundlePromoConfig.promoStartDate || null,
        promo_end_date: bundlePromoConfig.promoEndDate || null,
        promo_min_purchase: bundlePromoConfig.promoMinPurchase || null,
        promo_description: bundlePromoConfig.promoDescription || null,
      } : {
        promo_enabled: 0,
      };

      const bundleData: any = {
        id: selectedItem.id,
        name: bundleForm.name,
        price: Number(bundleForm.price),
        outletId: isFactoryBundle ? 0 : Number(bundleForm.outletId),
        items,
        categoryId: bundleForm.categoryId !== 'none' ? Number(bundleForm.categoryId) : null,
        image_url: bundleForm.imageUrl || undefined,
        ...promoData,
      };

      // Add manual stock if enabled
      if (bundleForm.manualStockEnabled) {
        bundleData.manualStockEnabled = true;
        bundleData.manualStock = Number(bundleForm.manualStock) || 0;
      } else {
        bundleData.manualStockEnabled = false;
        bundleData.manualStock = null;
      }

      updateBundle.mutate(
        bundleData,
        {
          onSuccess: () => {
            setIsEditDialogOpen(false);
            setSelectedItem(null);
            resetForms();
          },
          onError: (err) => {
            console.error(err);
            alert("Gagal update bundle. Periksa koneksi atau data yang diinput.");
          }
        }
      );
    } else {
      // Edit Product
      // Prepare promo data
      const promoData = productPromoConfig.promoEnabled ? {
        promo_enabled: 1,
        promo_type: productPromoConfig.promoType || 'fixed',
        promo_value: productPromoConfig.promoValue || 0,
        promo_days: JSON.stringify(productPromoConfig.promoDays || []),
        promo_start_time: productPromoConfig.promoStartTime || null,
        promo_end_time: productPromoConfig.promoEndTime || null,
        promo_start_date: productPromoConfig.promoStartDate || null,
        promo_end_date: productPromoConfig.promoEndDate || null,
        promo_min_purchase: productPromoConfig.promoMinPurchase || null,
        promo_description: productPromoConfig.promoDescription || null,
      } : {
        promo_enabled: 0,
      };

      updateProduct.mutate(
        {
          id: selectedItem.id,
          name: productForm.name,
          price: Number(productForm.price),
          stock: Number(productForm.stock),
          outletId: productForm.outletId ? String(productForm.outletId) : null,
          categoryId: productForm.categoryId !== 'none' ? Number(productForm.categoryId) : null,
          brandId: productForm.brandId !== 'none' ? Number(productForm.brandId) : null,
          image_url: productForm.imageUrl || undefined,
          ...promoData,
        },
        {
          onSuccess: () => {
            setIsEditDialogOpen(false);
            setSelectedItem(null);
            resetForms();
          },
          onError: (err) => {
            console.error(err);
            alert("Gagal update produk. Periksa koneksi atau data yang diinput.");
          }
        }
      );
    }
  };

  const handleConfirmDelete = () => {
    if (!selectedItem) return;
    if ('components' in selectedItem) {
      markPackageInactive.mutate(selectedItem.id, { onSuccess: () => { setIsDeleteDialogOpen(false); setSelectedItem(null); }, });
    } else if ('items' in selectedItem && 'active' in selectedItem) {
      markBundleInactive.mutate(selectedItem.id, { onSuccess: () => { setIsDeleteDialogOpen(false); setSelectedItem(null); }, });
    } else {
      deleteProduct.mutate(selectedItem.id, { onSuccess: () => { setIsDeleteDialogOpen(false); setSelectedItem(null); }, });
    }
  };

  const formatCurrency = (amount: number | bigint) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(Number(amount));
  };

  const getOutletName = (outletId?: string | null) => {
    // PERBAIKAN: Tampilkan "Stok Pabrik" untuk bundle/paket dengan outlet_id = 0
    if (!outletId || outletId === '' || outletId === 'null' || outletId === 'undefined' || outletId === '0' || outletId === 0) {
      return 'Stok Pabrik';
    }
    const outlet = outlets?.find(o => o.id === outletId.toString());
    return outlet?.name || `Outlet #${outletId}`;
  };

  const getCategoryName = (categoryId?: string) => {
    if (!categoryId || categoryId === '0') return '-';
    const category = categories?.find(c => c.id.toString() === categoryId.toString());
    return category?.name || '-';
  };

  const getBrandName = (brandId?: string) => {
    if (!brandId || brandId === '0') return '-';
    const brand = brands?.find(b => b.id.toString() === brandId.toString());
    return brand?.name || '-';
  };

  const getProductName = (productId: string) => {
    const product = products?.find(p => p.id === productId);
    return product?.name || `Produk #${productId}`;
  };

  const getAvailableProducts = (currentOutletId: string, isFactoryBundle: boolean = false) => {
    if (!products) return [];
    // PERBAIKAN: Jika bundle pabrik (outletId = 0 atau empty), tampilkan semua produk tanpa filter outlet
    if (!currentOutletId || currentOutletId === '' || currentOutletId === '0' || isFactoryBundle) return products;
    return products.filter(p => String(p.outletId) === String(currentOutletId));
  };

  const getAvailablePackages = (currentOutletId: string, isFactoryBundle: boolean = false) => {
    if (!packages) return [];
    // PERBAIKAN: Jika bundle pabrik (outletId = 0 atau empty), tampilkan semua paket tanpa filter outlet
    if (!currentOutletId || currentOutletId === '' || currentOutletId === '0' || isFactoryBundle) return packages.filter(p => p.isActive);
    return packages.filter(p => String(p.outletId) === String(currentOutletId) && p.isActive);
  };

  const addPackageComponent = () => setPackageComponents([...packageComponents, { productId: '', quantity: '1' }]);
  const removePackageComponent = (index: number) => { if (packageComponents.length > 1) setPackageComponents(packageComponents.filter((_, i) => i !== index)); };
  const updatePackageComponent = (index: number, field: 'productId' | 'quantity', value: string) => { const newComponents = [...packageComponents]; newComponents[index][field] = value; setPackageComponents(newComponents); };
  
  const addBundleItem = () => setBundleItems([...bundleItems, { productId: '', packageId: '', quantity: '1', isPackage: false }]);
  const removeBundleItem = (index: number) => { if (bundleItems.length > 1) setBundleItems(bundleItems.filter((_, i) => i !== index)); };
  const updateBundleItem = (index: number, field: keyof BundleItemInput, value: string | boolean) => { const newItems = [...bundleItems]; if (field === 'isPackage') { newItems[index][field] = value as boolean; newItems[index].productId = ''; newItems[index].packageId = ''; } else { newItems[index][field] = value as string; } setBundleItems(newItems); };

  const isLoading = productsLoading || packagesLoading || bundlesLoading;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Manajemen Produk</h1>
          <p className="text-muted-foreground">
            {isOwner ? 'Kelola produk satuan, paket, dan bundle di semua outlet' : 'Lihat daftar produk di outlet Anda'}
          </p>
        </div>
        {isOwner && (
          <Button onClick={handleAdd}>
            <Plus className="mr-2 h-4 w-4" />
            Tambah {activeTab === 'products' ? 'Produk' : activeTab === 'packages' ? 'Paket' : 'Bundle'}
          </Button>
        )}
      </div>

      {!isOwner && (
        <Alert>
          <Eye className="h-4 w-4" />
          <AlertDescription>
            Anda memiliki akses hanya-baca. Hanya owner yang dapat menambah, mengubah, atau menghapus item.
          </AlertDescription>
        </Alert>
      )}

      {/* PERBAIKAN: Filter outlet untuk owner */}
      {isOwner && outlets && outlets.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <Label htmlFor="outlet-filter" className="whitespace-nowrap font-semibold">
                Filter berdasarkan Outlet:
              </Label>
              <Select value={selectedOutletFilter} onValueChange={setSelectedOutletFilter}>
                <SelectTrigger id="outlet-filter" className="w-[300px]">
                  <SelectValue placeholder="Pilih outlet" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Outlet</SelectItem>
                  <SelectItem value="factory">Bundle Pabrik Saja</SelectItem>
                  {outlets.map((outlet) => (
                    <SelectItem key={outlet.id} value={outlet.id}>
                      {outlet.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedOutletFilter !== 'all' && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setSelectedOutletFilter('all')}
                >
                  Reset Filter
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="products">
            <Package className="mr-2 h-4 w-4" />
            Produk Satuan
          </TabsTrigger>
          <TabsTrigger value="packages">
            <PackagePlus className="mr-2 h-4 w-4" />
            Paket
          </TabsTrigger>
          <TabsTrigger value="bundles">
            <Layers className="mr-2 h-4 w-4" />
            Bundle
          </TabsTrigger>
        </TabsList>

        {/* Products Tab */}
        <TabsContent value="products">
          <Card>
            <CardHeader>
              <CardTitle>Daftar Produk Satuan</CardTitle>
              <CardDescription>
                Produk individual yang dapat dijual secara terpisah atau sebagai komponen paket/bundle
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5].map(i => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : !products || products.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-semibold">Belum ada produk</h3>
                  <p className="text-sm text-muted-foreground mt-2">
                    {isOwner ? 'Mulai dengan menambahkan produk pertama Anda' : 'Belum ada produk yang tersedia'}
                  </p>
                  {isOwner && (
                    <Button onClick={handleAdd} className="mt-4">
                      <Plus className="mr-2 h-4 w-4" />
                      Tambah Produk
                    </Button>
                  )}
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-semibold">Tidak ada produk untuk outlet ini</h3>
                  <p className="text-sm text-muted-foreground mt-2">
                    Coba ubah filter outlet atau tambahkan produk baru
                  </p>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Gambar</TableHead>
                        <TableHead>Nama Produk</TableHead>
                        {isOwner && <TableHead>Outlet</TableHead>}
                        <TableHead>Kategori</TableHead>
                        <TableHead>Brand</TableHead>
                        <TableHead>Harga</TableHead>
                        <TableHead>Stok</TableHead>
                        {isOwner && <TableHead className="text-right">Aksi</TableHead>}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredProducts.map((product) => (
                        <TableRow key={product.id}>
                          <TableCell>
                            {product.image ? (
                              <img 
                                src={product.image} 
                                alt={product.name} 
                                className="w-12 h-12 object-cover rounded-md"
                              />
                            ) : (
                              <div 
                                className={`w-12 h-12 rounded-md flex items-center justify-center text-white font-bold text-sm ${getColorFromString(product.name)}`}
                              >
                                {getInitials(product.name)}
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="font-medium">{product.name}</TableCell>
                          {isOwner && <TableCell>{getOutletName(product.outletId)}</TableCell>}
                          <TableCell>
                            <Badge variant="outline">
                              {product.category || getCategoryName(product.categoryId)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {product.brand || getBrandName(product.brandId)}
                            </Badge>
                          </TableCell>
                          <TableCell>{formatCurrency(product.price)}</TableCell>
                          <TableCell>
                            <span
                              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                product.stock === 0
                                  ? 'bg-destructive/10 text-destructive'
                                  : product.stock < 10
                                  ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-500'
                                  : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-500'
                              }`}
                            >
                              {product.stock}
                            </span>
                          </TableCell>
                          {isOwner && (
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleEdit(product)}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDelete(product)}
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
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

        {/* Packages Tab */}
        <TabsContent value="packages">
          <Card>
            <CardHeader>
              <CardTitle>Daftar Paket</CardTitle>
              <CardDescription>
                Paket berisi beberapa produk satuan dengan harga bundling
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : !packagesWithStock || packagesWithStock.length === 0 ? (
                <div className="text-center py-12">
                  <PackagePlus className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-semibold">Belum ada paket</h3>
                  {isOwner && (
                    <Button onClick={handleAdd} className="mt-4">
                      <Plus className="mr-2 h-4 w-4" />
                      Tambah Paket
                    </Button>
                  )}
                </div>
              ) : filteredPackages.length === 0 ? (
                <div className="text-center py-12">
                  <PackagePlus className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-semibold">Tidak ada paket untuk outlet ini</h3>
                  <p className="text-sm text-muted-foreground mt-2">
                    Coba ubah filter outlet atau tambahkan paket baru
                  </p>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Gambar</TableHead>
                        <TableHead>Nama Paket</TableHead>
                        {isOwner && <TableHead>Outlet</TableHead>}
                        <TableHead>Kategori</TableHead>
                        <TableHead>Harga</TableHead>
                        <TableHead>Komponen</TableHead>
                        <TableHead>Stok</TableHead>
                        {isOwner && <TableHead className="text-right">Aksi</TableHead>}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredPackages.map((pkg) => (
                        <TableRow key={pkg.id}>
                          <TableCell>
                            {pkg.image ? (
                              <img 
                                src={pkg.image} 
                                alt={pkg.name} 
                                className="w-12 h-12 object-cover rounded-md"
                              />
                            ) : (
                              <div 
                                className={`w-12 h-12 rounded-md flex items-center justify-center text-white font-bold text-sm ${getColorFromString(pkg.name)}`}
                              >
                                {getInitials(pkg.name)}
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="font-medium">{pkg.name}</TableCell>
                          {isOwner && <TableCell>{getOutletName(pkg.outletId)}</TableCell>}
                          <TableCell>
                            <Badge variant="outline">
                              {getCategoryName((pkg as any).categoryId || (pkg as any).category_id)}
                            </Badge>
                          </TableCell>
                          <TableCell>{formatCurrency(pkg.price)}</TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              {/* Defensive mapping here too */}
                              {(pkg.components || pkg.items || []).map((comp: any, idx: number) => {
                                const pId = comp.productId || comp.product_id;
                                const prod = products?.find(p => p.id === String(pId));
                                return (
                                  <div key={idx} className="text-sm">
                                    {prod ? prod.name : pId} × {comp.quantity}
                                  </div>
                                );
                              })}
                            </div>
                          </TableCell>
                          <TableCell>{pkg.stock ? pkg.stock.toString() : '0'}</TableCell>
                          {isOwner && (
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button variant="ghost" size="icon" onClick={() => handleEdit(pkg)}>
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => handleDelete(pkg)}>
                                  <Trash2 className="h-4 w-4 text-destructive" />
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

        {/* Bundles Tab */}
        <TabsContent value="bundles">
          <Card>
            <CardHeader>
              <CardTitle>Daftar Bundle</CardTitle>
              <CardDescription>
                Bundle dapat berisi kombinasi produk satuan dan paket
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : !bundlesWithStock || bundlesWithStock.length === 0 ? (
                <div className="text-center py-12">
                  <Layers className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-semibold">Belum ada bundle</h3>
                  {isOwner && (
                    <Button onClick={handleAdd} className="mt-4">
                      <Plus className="mr-2 h-4 w-4" />
                      Tambah Bundle
                    </Button>
                  )}
                </div>
              ) : filteredBundles.length === 0 ? (
                <div className="text-center py-12">
                  <Layers className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-semibold">Tidak ada bundle untuk outlet ini</h3>
                  <p className="text-sm text-muted-foreground mt-2">
                    Coba ubah filter outlet atau tambahkan bundle baru
                  </p>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Gambar</TableHead>
                        <TableHead>Nama Bundle</TableHead>
                        {isOwner && <TableHead>Outlet</TableHead>}
                        <TableHead>Kategori</TableHead>
                        <TableHead>Harga</TableHead>
                        <TableHead>Item</TableHead>
                        <TableHead>Tipe Stok</TableHead>
                        <TableHead>Stok</TableHead>
                        {isOwner && <TableHead className="text-right">Aksi</TableHead>}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredBundles.map((bundle) => (
                        <TableRow key={bundle.id}>
                          <TableCell>
                            {bundle.image ? (
                              <img 
                                src={bundle.image} 
                                alt={bundle.name} 
                                className="w-12 h-12 object-cover rounded-md"
                              />
                            ) : (
                              <div 
                                className={`w-12 h-12 rounded-md flex items-center justify-center text-white font-bold text-sm ${getColorFromString(bundle.name)}`}
                              >
                                {getInitials(bundle.name)}
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="font-medium">{bundle.name}</TableCell>
                          {isOwner && <TableCell>{getOutletName(bundle.outletId)}</TableCell>}
                          <TableCell>
                            <Badge variant="outline">
                              {getCategoryName((bundle as any).categoryId || (bundle as any).category_id)}
                            </Badge>
                          </TableCell>
                          <TableCell>{formatCurrency(bundle.price)}</TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              {(bundle.items || []).map((item: any, idx: number) => {
                                let name = item.productId || item.product_id || item.packageId || item.package_id;
                                const isPkg = item.isPackage || item.is_package;

                                if (isPkg) {
                                   const pkId = item.packageId || item.package_id;
                                   const pk = packages?.find(p => p.id === String(pkId));
                                   name = pk ? pk.name : `Paket #${pkId}`;
                                } else {
                                   const prId = item.productId || item.product_id;
                                   const pr = products?.find(p => p.id === String(prId));
                                   name = pr ? pr.name : `Produk #${prId}`;
                                }
                                return (
                                  <div key={idx} className="text-sm">
                                    <Badge variant={isPkg ? "secondary" : "outline"} className="mr-1">
                                      {isPkg ? "Paket" : "Produk"}
                                    </Badge>
                                    {name} × {item.quantity}
                                  </div>
                                );
                              })}
                            </div>
                          </TableCell>
                          <TableCell>
                            {bundle.manualStockEnabled ? (
                              <Badge className="bg-blue-500 hover:bg-blue-600 text-white font-medium">
                                Manual
                              </Badge>
                            ) : (
                              <Badge className="bg-green-500 hover:bg-green-600 text-white font-medium">
                                Calculated
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <span className="font-medium">
                              {bundle.stock !== undefined && bundle.stock !== null ? bundle.stock.toString() : '0'}
                            </span>
                          </TableCell>
                          {isOwner && (
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button variant="ghost" size="icon" onClick={() => handleEdit(bundle)}>
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => handleDelete(bundle)}>
                                  <Trash2 className="h-4 w-4 text-destructive" />
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

        {/* Add Dialog */}
        {isOwner && (
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              {/* Form Content same as before */}
              <DialogHeader>
              <DialogTitle>
                Tambah {activeTab === 'products' ? 'Produk' : activeTab === 'packages' ? 'Paket' : 'Bundle'} Baru
              </DialogTitle>
              <DialogDescription>
                {activeTab === 'products' && 'Masukkan informasi produk yang akan ditambahkan'}
                {activeTab === 'packages' && 'Buat paket produk dengan beberapa komponen'}
                {activeTab === 'bundles' && 'Buat bundle dengan kombinasi produk dan paket'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmitAdd}>
              <div className="space-y-4 py-4">
                {activeTab === 'products' && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="add-name">Nama Produk</Label>
                        <Input
                          id="add-name"
                          value={productForm.name}
                          onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                          placeholder="Contoh: Kopi Susu Gula Aren"
                          required
                        />
                      </div>
                      {outlets && outlets.length > 0 && (
                        <div className="space-y-2">
                          <Label htmlFor="add-outlet">Outlet</Label>
                          <Select value={productForm.outletId} onValueChange={(value) => setProductForm({ ...productForm, outletId: value })} required>
                            <SelectTrigger id="add-outlet">
                              <SelectValue placeholder="Pilih outlet" />
                            </SelectTrigger>
                            <SelectContent>
                              {outlets.map((outlet) => (
                                <SelectItem key={outlet.id} value={outlet.id}>
                                  {outlet.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="add-category">Kategori</Label>
                        <Select value={productForm.categoryId} onValueChange={(value) => setProductForm({ ...productForm, categoryId: value })}>
                          <SelectTrigger id="add-category">
                            <SelectValue placeholder="Pilih Kategori" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Pilih Kategori</SelectItem>
                            {categories && categories.filter(c => c.isActive).map((category) => (
                              <SelectItem key={category.id} value={category.id}>
                                {category.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="add-brand">Brand</Label>
                        <Select value={productForm.brandId} onValueChange={(value) => setProductForm({ ...productForm, brandId: value })}>
                          <SelectTrigger id="add-brand">
                            <SelectValue placeholder="Pilih Brand" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Pilih Brand</SelectItem>
                            {brands && brands.filter(b => b.isActive).map((brand) => (
                              <SelectItem key={brand.id} value={brand.id}>
                                {brand.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="add-price">Harga (Rp)</Label>
                        <Input
                          id="add-price"
                          type="number"
                          min="0"
                          value={productForm.price}
                          onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="add-stock">Stok</Label>
                        <Input
                          id="add-stock"
                          type="number"
                          min="0"
                          value={productForm.stock}
                          onChange={(e) => setProductForm({ ...productForm, stock: e.target.value })}
                          required
                        />
                      </div>
                    </div>
                    
                    {/* Image Upload untuk Product */}
                    <ImageUpload
                      label="Gambar Produk"
                      value={productForm.imageUrl}
                      onChange={(url) => setProductForm({ ...productForm, imageUrl: url })}
                      onClear={() => setProductForm({ ...productForm, imageUrl: '' })}
                    />

                    {/* Promo Configuration for Product */}
                    <PromoConfigForm
                      value={productPromoConfig}
                      onChange={setProductPromoConfig}
                      originalPrice={Number(productForm.price) || undefined}
                    />
                  </>
                )}

                {/* Package Form */}
                {activeTab === 'packages' && (
                  <>
                     <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="add-pkg-name">Nama Paket</Label>
                        <Input
                          id="add-pkg-name"
                          value={packageForm.name}
                          onChange={(e) => setPackageForm({ ...packageForm, name: e.target.value })}
                          placeholder="Contoh: Paket Hemat"
                          required
                        />
                      </div>
                      {outlets && outlets.length > 0 && (
                        <div className="space-y-2">
                          <Label htmlFor="add-pkg-outlet">Outlet</Label>
                          <Select 
                            value={packageForm.outletId} 
                            onValueChange={(value) => {
                              setPackageForm({ ...packageForm, outletId: value });
                              setPackageComponents([{ productId: '', quantity: '1' }]);
                            }}
                            required
                          >
                            <SelectTrigger id="add-pkg-outlet">
                              <SelectValue placeholder="Pilih outlet" />
                            </SelectTrigger>
                            <SelectContent>
                              {outlets.map((outlet) => (
                                <SelectItem key={outlet.id} value={outlet.id}>
                                  {outlet.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="add-pkg-category">Kategori</Label>
                        <Select value={packageForm.categoryId} onValueChange={(value) => setPackageForm({ ...packageForm, categoryId: value })}>
                          <SelectTrigger id="add-pkg-category">
                            <SelectValue placeholder="Pilih Kategori" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Pilih Kategori</SelectItem>
                            {categories && categories.filter(c => c.isActive).map((category) => (
                              <SelectItem key={category.id} value={category.id}>
                                {category.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="add-pkg-price">Harga Paket (Rp)</Label>
                        <Input
                          id="add-pkg-price"
                          type="number"
                          min="0"
                          value={packageForm.price}
                          onChange={(e) => setPackageForm({ ...packageForm, price: e.target.value })}
                          required
                        />
                      </div>
                    </div>
                    
                    {/* Image Upload untuk Package */}
                    <ImageUpload
                      label="Gambar Paket"
                      value={packageForm.imageUrl}
                      onChange={(url) => setPackageForm({ ...packageForm, imageUrl: url })}
                      onClear={() => setPackageForm({ ...packageForm, imageUrl: '' })}
                    />
                    
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label>Komponen Paket</Label>
                        <Button type="button" variant="outline" size="sm" onClick={addPackageComponent}>
                          <Plus className="h-4 w-4 mr-1" />
                          Tambah Komponen
                        </Button>
                      </div>
                      {packageComponents.map((comp, index) => (
                        <div key={index} className="flex gap-2 items-end">
                          <div className="flex-1 space-y-2">
                            <Label>Produk</Label>
                            <Select
                              value={comp.productId}
                              onValueChange={(value) => updatePackageComponent(index, 'productId', value)}
                              disabled={!packageForm.outletId}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder={packageForm.outletId ? "Pilih produk" : "Pilih outlet dulu"} />
                              </SelectTrigger>
                              <SelectContent>
                                {getAvailableProducts(packageForm.outletId).map((product) => (
                                  <SelectItem key={product.id} value={product.id}>
                                    {product.name} (Stok: {product.stock})
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="w-32 space-y-2">
                            <Label>Jumlah</Label>
                            <Input
                              type="number"
                              min="1"
                              value={comp.quantity}
                              onChange={(e) => updatePackageComponent(index, 'quantity', e.target.value)}
                            />
                          </div>
                          {packageComponents.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => removePackageComponent(index)}
                            >
                              <Minus className="h-4 w-4 text-destructive" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {/* Bundle Form */}
                {activeTab === 'bundles' && (
                  <>
                     <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="add-bundle-name">Nama Bundle</Label>
                        <Input
                          id="add-bundle-name"
                          value={bundleForm.name}
                          onChange={(e) => setBundleForm({ ...bundleForm, name: e.target.value })}
                          placeholder="Contoh: Bundle Spesial"
                          required
                        />
                      </div>
                      
                      {/* Outlet Selection with Bundle Pabrik option */}
                      {outlets && outlets.length > 0 && (
                        <div className="space-y-2">
                          <Label htmlFor="add-bundle-outlet">Outlet</Label>
                          <Select 
                            value={bundleForm.outletId} 
                            onValueChange={(value) => {
                              setBundleForm({ ...bundleForm, outletId: value });
                              setBundleItems([{ productId: '', packageId: '', quantity: '1', isPackage: false }]);
                            }}
                            required
                          >
                            <SelectTrigger id="add-bundle-outlet">
                              <SelectValue placeholder="Pilih outlet" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="factory">Bundle Pabrik (Semua Outlet)</SelectItem>
                              {outlets.map((outlet) => (
                                <SelectItem key={outlet.id} value={outlet.id}>
                                  {outlet.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="add-bundle-category">Kategori</Label>
                        <Select value={bundleForm.categoryId} onValueChange={(value) => setBundleForm({ ...bundleForm, categoryId: value })}>
                          <SelectTrigger id="add-bundle-category">
                            <SelectValue placeholder="Pilih Kategori" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Pilih Kategori</SelectItem>
                            {categories && categories.filter(c => c.isActive).map((category) => (
                              <SelectItem key={category.id} value={category.id}>
                                {category.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="add-bundle-price">Harga Bundle (Rp)</Label>
                        <Input
                          id="add-bundle-price"
                          type="number"
                          min="0"
                          value={bundleForm.price}
                          onChange={(e) => setBundleForm({ ...bundleForm, price: e.target.value })}
                          required
                        />
                      </div>
                    </div>
                    
                    {/* Image Upload untuk Bundle */}
                    <ImageUpload
                      label="Gambar Bundle"
                      value={bundleForm.imageUrl}
                      onChange={(url) => setBundleForm({ ...bundleForm, imageUrl: url })}
                      onClear={() => setBundleForm({ ...bundleForm, imageUrl: '' })}
                    />
                    
                    <div className="space-y-3 p-4 border rounded-lg bg-muted/50">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="add-manual-stock"
                          checked={bundleForm.manualStockEnabled}
                          onCheckedChange={(checked) => 
                            setBundleForm({ 
                              ...bundleForm, 
                              manualStockEnabled: checked as boolean,
                              manualStock: checked ? bundleForm.manualStock : ''
                            })
                          }
                        />
                        <Label htmlFor="add-manual-stock" className="text-sm font-medium cursor-pointer">
                          Gunakan Stok Manual (Override stok otomatis)
                        </Label>
                      </div>
                      {bundleForm.manualStockEnabled && (
                        <div className="space-y-2">
                          <Label htmlFor="add-manual-stock-value">Jumlah Stok Manual</Label>
                          <Input
                            id="add-manual-stock-value"
                            type="number"
                            min="0"
                            value={bundleForm.manualStock}
                            onChange={(e) => setBundleForm({ ...bundleForm, manualStock: e.target.value })}
                            placeholder="Masukkan jumlah stok"
                            required
                          />
                          <p className="text-xs text-muted-foreground">
                            💡 Stok manual akan menggantikan perhitungan stok otomatis dari komponen bundle
                          </p>
                        </div>
                      )}
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label>Item Bundle</Label>
                        <Button type="button" variant="outline" size="sm" onClick={addBundleItem}>
                          <Plus className="h-4 w-4 mr-1" />
                          Tambah Item
                        </Button>
                      </div>
                      {bundleItems.map((item, index) => (
                        <div key={index} className="space-y-2 p-3 border rounded-lg">
                          <div className="flex items-center gap-2">
                            <Checkbox
                              id={`bundle-item-${index}-isPackage`}
                              checked={item.isPackage}
                              onCheckedChange={(checked) => updateBundleItem(index, 'isPackage', checked as boolean)}
                            />
                            <Label htmlFor={`bundle-item-${index}-isPackage`}>Gunakan Paket</Label>
                          </div>
                          <div className="flex gap-2 items-end">
                            <div className="flex-1 space-y-2">
                              <Label>{item.isPackage ? 'Paket' : 'Produk'}</Label>
                              <Select
                                value={item.isPackage ? item.packageId : item.productId}
                                onValueChange={(value) => updateBundleItem(index, item.isPackage ? 'packageId' : 'productId', value)}
                                disabled={!bundleForm.outletId && bundleForm.outletId !== '' && bundleForm.outletId !== 'factory'}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder={`Pilih ${item.isPackage ? 'paket' : 'produk'}`} />
                                </SelectTrigger>
                                <SelectContent>
                                  {item.isPackage 
                                    ? getAvailablePackages(bundleForm.outletId, !bundleForm.outletId || bundleForm.outletId === '' || bundleForm.outletId === 'factory').map((pkg) => (
                                        <SelectItem key={pkg.id} value={pkg.id}>
                                          {pkg.name}
                                        </SelectItem>
                                      ))
                                    : getAvailableProducts(bundleForm.outletId, !bundleForm.outletId || bundleForm.outletId === '' || bundleForm.outletId === 'factory').map((product) => (
                                        <SelectItem key={product.id} value={product.id}>
                                          {product.name} (Stok: {product.stock})
                                        </SelectItem>
                                      ))
                                  }
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="w-32 space-y-2">
                              <Label>Jumlah</Label>
                              <Input
                                type="number"
                                min="1"
                                value={item.quantity}
                                onChange={(e) => updateBundleItem(index, 'quantity', e.target.value)}
                              />
                            </div>
                            {bundleItems.length > 1 && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => removeBundleItem(index)}
                              >
                                <Minus className="h-4 w-4 text-destructive" />
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAddDialogOpen(false)}
                >
                  Batal
                </Button>
                <Button 
                  type="submit" 
                  disabled={
                    activeTab === 'products' ? addProduct.isPending :
                    activeTab === 'packages' ? createPackage.isPending :
                    createBundle.isPending
                  }
                >
                  {(activeTab === 'products' ? addProduct.isPending :
                    activeTab === 'packages' ? createPackage.isPending :
                    createBundle.isPending) ? 'Menyimpan...' : 'Simpan'}
                </Button>
              </DialogFooter>
            </form>
            </DialogContent>
          </Dialog>
        )}

        {/* Edit Dialog */}
        {isOwner && selectedItem && (
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              {/* Form Content same as before */}
              <DialogHeader>
              <DialogTitle>
                Edit {'components' in selectedItem ? 'Paket' : 'items' in selectedItem ? 'Bundle' : 'Produk'}
              </DialogTitle>
              <DialogDescription>Perbarui informasi item</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmitEdit}>
              <div className="space-y-4 py-4">
                {!('components' in selectedItem) && !('items' in selectedItem) && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="edit-name">Nama Produk</Label>
                        <Input
                          id="edit-name"
                          value={productForm.name}
                          onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                          required
                        />
                      </div>
                      {outlets && outlets.length > 0 && (
                        <div className="space-y-2">
                          <Label htmlFor="edit-outlet">Outlet</Label>
                          <Select value={productForm.outletId} onValueChange={(value) => setProductForm({ ...productForm, outletId: value })}>
                            <SelectTrigger id="edit-outlet">
                              <SelectValue placeholder="Pilih outlet" />
                            </SelectTrigger>
                            <SelectContent>
                              {outlets.map((outlet) => (
                                <SelectItem key={outlet.id} value={outlet.id}>
                                  {outlet.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="edit-category">Kategori</Label>
                        <Select value={productForm.categoryId} onValueChange={(value) => setProductForm({ ...productForm, categoryId: value })}>
                          <SelectTrigger id="edit-category">
                            <SelectValue placeholder="Pilih Kategori" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Pilih Kategori</SelectItem>
                            {categories && categories.filter(c => c.isActive).map((category) => (
                              <SelectItem key={category.id} value={category.id}>
                                {category.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-brand">Brand</Label>
                        <Select value={productForm.brandId} onValueChange={(value) => setProductForm({ ...productForm, brandId: value })}>
                          <SelectTrigger id="edit-brand">
                            <SelectValue placeholder="Pilih Brand" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Pilih Brand</SelectItem>
                            {brands && brands.filter(b => b.isActive).map((brand) => (
                              <SelectItem key={brand.id} value={brand.id}>
                                {brand.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="edit-price">Harga (Rp)</Label>
                        <Input
                          id="edit-price"
                          type="number"
                          min="0"
                          value={productForm.price}
                          onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-stock">Stok</Label>
                        <Input
                          id="edit-stock"
                          type="number"
                          min="0"
                          value={productForm.stock}
                          onChange={(e) => setProductForm({ ...productForm, stock: e.target.value })}
                          required
                        />
                      </div>
                    </div>
                    
                    {/* Image Upload untuk Edit Product */}
                    <ImageUpload
                      label="Gambar Produk"
                      value={productForm.imageUrl}
                      onChange={(url) => setProductForm({ ...productForm, imageUrl: url })}
                      onClear={() => setProductForm({ ...productForm, imageUrl: '' })}
                    />
                  </>
                )}
                
                {/* Edit Package Form */}
                 {'components' in selectedItem && !('active' in selectedItem) && (
                   <>
                     <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="edit-pkg-name">Nama Paket</Label>
                        <Input
                          id="edit-pkg-name"
                          value={packageForm.name}
                          onChange={(e) => setPackageForm({ ...packageForm, name: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Outlet</Label>
                        <div className="p-3 bg-muted rounded-md">
                          {getOutletName(packageForm.outletId)}
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="edit-pkg-category">Kategori</Label>
                        <Select value={packageForm.categoryId} onValueChange={(value) => setPackageForm({ ...packageForm, categoryId: value })}>
                          <SelectTrigger id="edit-pkg-category">
                            <SelectValue placeholder="Pilih Kategori" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Pilih Kategori</SelectItem>
                            {categories && categories.filter(c => c.isActive).map((category) => (
                              <SelectItem key={category.id} value={category.id}>
                                {category.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-pkg-price">Harga Paket (Rp)</Label>
                        <Input
                          id="edit-pkg-price"
                          type="number"
                          min="0"
                          value={packageForm.price}
                          onChange={(e) => setPackageForm({ ...packageForm, price: e.target.value })}
                          required
                        />
                      </div>
                    </div>
                    
                    {/* Image Upload untuk Edit Package */}
                    <ImageUpload
                      label="Gambar Paket"
                      value={packageForm.imageUrl}
                      onChange={(url) => setPackageForm({ ...packageForm, imageUrl: url })}
                      onClear={() => setPackageForm({ ...packageForm, imageUrl: '' })}
                    />
                    
                    {/* Components editor */}
                     <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label>Komponen Paket</Label>
                        <Button type="button" variant="outline" size="sm" onClick={addPackageComponent}>
                          <Plus className="h-4 w-4 mr-1" />
                          Tambah Komponen
                        </Button>
                      </div>
                      {packageComponents.map((comp, index) => (
                        <div key={index} className="flex gap-2 items-end">
                          <div className="flex-1 space-y-2">
                            <Label>Produk</Label>
                            <Select
                              value={comp.productId}
                              onValueChange={(value) => updatePackageComponent(index, 'productId', value)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Pilih produk" />
                              </SelectTrigger>
                              <SelectContent>
                                {getAvailableProducts(packageForm.outletId).map((product) => (
                                  <SelectItem key={product.id} value={product.id}>
                                    {product.name} (Stok: {product.stock})
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="w-32 space-y-2">
                            <Label>Jumlah</Label>
                            <Input
                              type="number"
                              min="1"
                              value={comp.quantity}
                              onChange={(e) => updatePackageComponent(index, 'quantity', e.target.value)}
                            />
                          </div>
                          {packageComponents.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => removePackageComponent(index)}
                            >
                              <Minus className="h-4 w-4 text-destructive" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                   </>
                )}

                {/* Edit Bundle Form */}
                {'items' in selectedItem && 'active' in selectedItem && (
                   <>
                     <div className="space-y-2">
                      <Label htmlFor="edit-bundle-name">Nama Bundle</Label>
                      <Input
                        id="edit-bundle-name"
                        value={bundleForm.name}
                        onChange={(e) => setBundleForm({ ...bundleForm, name: e.target.value })}
                        required
                      />
                    </div>
                    
                    {/* Outlet Selection with Bundle Pabrik option - SAMA SEPERTI FORM ADD */}
                    {outlets && outlets.length > 0 && (
                      <div className="space-y-2">
                        <Label htmlFor="edit-bundle-outlet">Outlet</Label>
                        <Select 
                          value={bundleForm.outletId} 
                          onValueChange={(value) => {
                            setBundleForm({ ...bundleForm, outletId: value });
                            // Pertahankan bundleItems yang sudah ada
                            // List produk/paket akan otomatis ter-filter berdasarkan outlet yang dipilih
                          }}
                          required
                        >
                          <SelectTrigger id="edit-bundle-outlet">
                            <SelectValue placeholder="Pilih outlet" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="factory">Bundle Pabrik (Semua Outlet)</SelectItem>
                            {outlets.map((outlet) => (
                              <SelectItem key={outlet.id} value={outlet.id}>
                                {outlet.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="edit-bundle-category">Kategori</Label>
                        <Select value={bundleForm.categoryId} onValueChange={(value) => setBundleForm({ ...bundleForm, categoryId: value })}>
                          <SelectTrigger id="edit-bundle-category">
                            <SelectValue placeholder="Pilih Kategori" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Pilih Kategori</SelectItem>
                            {categories && categories.filter(c => c.isActive).map((category) => (
                              <SelectItem key={category.id} value={category.id}>
                                {category.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-bundle-price">Harga Bundle (Rp)</Label>
                        <Input
                          id="edit-bundle-price"
                          type="number"
                          min="0"
                          value={bundleForm.price}
                          onChange={(e) => setBundleForm({ ...bundleForm, price: e.target.value })}
                          required
                        />
                      </div>
                    </div>
                    
                    {/* Image Upload untuk Edit Bundle */}
                    <ImageUpload
                      label="Gambar Bundle"
                      value={bundleForm.imageUrl}
                      onChange={(url) => setBundleForm({ ...bundleForm, imageUrl: url })}
                      onClear={() => setBundleForm({ ...bundleForm, imageUrl: '' })}
                    />
                    
                    <div className="space-y-3 p-4 border rounded-lg bg-muted/50">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="edit-manual-stock"
                          checked={bundleForm.manualStockEnabled}
                          onCheckedChange={(checked) => 
                            setBundleForm({ 
                              ...bundleForm, 
                              manualStockEnabled: checked as boolean,
                              manualStock: checked ? bundleForm.manualStock : ''
                            })
                          }
                        />
                        <Label htmlFor="edit-manual-stock" className="text-sm font-medium cursor-pointer">
                          Gunakan Stok Manual (Override stok otomatis)
                        </Label>
                      </div>
                      {bundleForm.manualStockEnabled && selectedItem && 'items' in selectedItem && (
                        <>
                          <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-md">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                                Stok Terhitung Otomatis:
                              </span>
                              <Badge className="bg-green-500 text-white font-semibold">
                                {bundlesWithStock.find(b => b.id === selectedItem.id)?.calculatedStock?.toString() || '0'}
                              </Badge>
                            </div>
                            <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                              Ini adalah stok yang dihitung berdasarkan komponen bundle
                            </p>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="edit-manual-stock-value">Jumlah Stok Manual</Label>
                            <Input
                              id="edit-manual-stock-value"
                              type="number"
                              min="0"
                              value={bundleForm.manualStock}
                              onChange={(e) => setBundleForm({ ...bundleForm, manualStock: e.target.value })}
                              placeholder="Masukkan jumlah stok"
                              required
                            />
                            <p className="text-xs text-muted-foreground">
                              💡 Stok manual akan menggantikan perhitungan stok otomatis dari komponen bundle
                            </p>
                          </div>
                        </>
                      )}
                      {!bundleForm.manualStockEnabled && selectedItem && 'items' in selectedItem && (
                        <div className="p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-md">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-green-900 dark:text-green-100">
                              Stok Terhitung Otomatis:
                            </span>
                            <Badge className="bg-green-500 text-white font-semibold">
                              {bundlesWithStock.find(b => b.id === selectedItem.id)?.calculatedStock?.toString() || '0'}
                            </Badge>
                          </div>
                          <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                            Stok dihitung otomatis berdasarkan komponen bundle
                          </p>
                        </div>
                      )}
                    </div>
                    {/* Bundle items editor */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label>Item Bundle</Label>
                        <Button type="button" variant="outline" size="sm" onClick={addBundleItem}>
                          <Plus className="h-4 w-4 mr-1" />
                          Tambah Item
                        </Button>
                      </div>
                      {bundleItems.map((item, index) => (
                        <div key={index} className="space-y-2 p-3 border rounded-lg">
                          <div className="flex items-center gap-2">
                            <Checkbox
                              id={`edit-bundle-item-${index}-isPackage`}
                              checked={item.isPackage}
                              onCheckedChange={(checked) => updateBundleItem(index, 'isPackage', checked as boolean)}
                            />
                            <Label htmlFor={`edit-bundle-item-${index}-isPackage`}>Gunakan Paket</Label>
                          </div>
                          <div className="flex gap-2 items-end">
                            <div className="flex-1 space-y-2">
                              <Label>{item.isPackage ? 'Paket' : 'Produk'}</Label>
                              <Select
                                value={item.isPackage ? item.packageId : item.productId}
                                onValueChange={(value) => updateBundleItem(index, item.isPackage ? 'packageId' : 'productId', value)}
                                disabled={!bundleForm.outletId && bundleForm.outletId !== '' && bundleForm.outletId !== 'factory'}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder={`Pilih ${item.isPackage ? 'paket' : 'produk'}`} />
                                </SelectTrigger>
                                <SelectContent>
                                  {item.isPackage 
                                    ? getAvailablePackages(bundleForm.outletId, !bundleForm.outletId || bundleForm.outletId === '' || bundleForm.outletId === 'factory').map((pkg) => (
                                        <SelectItem key={pkg.id} value={pkg.id}>
                                          {pkg.name}
                                        </SelectItem>
                                      ))
                                    : getAvailableProducts(bundleForm.outletId, !bundleForm.outletId || bundleForm.outletId === '' || bundleForm.outletId === 'factory').map((product) => (
                                        <SelectItem key={product.id} value={product.id}>
                                          {product.name} (Stok: {product.stock})
                                        </SelectItem>
                                      ))
                                  }
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="w-32 space-y-2">
                              <Label>Jumlah</Label>
                              <Input
                                type="number"
                                min="1"
                                value={item.quantity}
                                onChange={(e) => updateBundleItem(index, 'quantity', e.target.value)}
                              />
                            </div>
                            {bundleItems.length > 1 && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => removeBundleItem(index)}
                              >
                                <Minus className="h-4 w-4 text-destructive" />
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                   </>
                )}
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditDialogOpen(false)}
                >
                  Batal
                </Button>
                <Button 
                  type="submit" 
                  disabled={
                    'components' in selectedItem ? updatePackage.isPending :
                    'items' in selectedItem ? updateBundle.isPending :
                    updateProduct.isPending
                  }
                >
                  {('components' in selectedItem ? updatePackage.isPending :
                    'items' in selectedItem ? updateBundle.isPending :
                    updateProduct.isPending) ? 'Menyimpan...' : 'Simpan'}
                </Button>
              </DialogFooter>
            </form>
            </DialogContent>
          </Dialog>
        )}

        {/* Delete Dialog - Same as before */}
        {isOwner && selectedItem && (
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {'components' in selectedItem ? 'Nonaktifkan Paket' : 'items' in selectedItem ? 'Nonaktifkan Bundle' : 'Hapus Produk'}
              </AlertDialogTitle>
              <AlertDialogDescription>
                Apakah Anda yakin ingin {('components' in selectedItem || 'items' in selectedItem) ? 'menonaktifkan' : 'menghapus'} "{selectedItem.name}"? 
                {('components' in selectedItem || 'items' in selectedItem) 
                  ? ' Item ini tidak akan muncul lagi dalam daftar aktif.' 
                  : ' Tindakan ini tidak dapat dibatalkan.'}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Batal</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleConfirmDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {('components' in selectedItem ? markPackageInactive.isPending :
                  'items' in selectedItem ? markBundleInactive.isPending :
                  deleteProduct.isPending) 
                  ? ('components' in selectedItem || 'items' in selectedItem ? 'Menonaktifkan...' : 'Menghapus...') 
                  : ('components' in selectedItem || 'items' in selectedItem ? 'Nonaktifkan' : 'Hapus')}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
      </Tabs>
    </div>
  
  );
}