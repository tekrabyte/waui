import { useState, useMemo, useEffect } from 'react';
import { useListProductsByOutlet, useListActivePackages, useGetCallerUserProfile, useCreateTransaction, useGetPaymentSettings, useGetAllCategories } from '../../hooks/useQueries';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ShoppingCart, Plus, Minus, Trash2, CreditCard, Smartphone, Truck, Package, Pause, Play, Clock, Bell, UtensilsCrossed, CheckCircle2, AlertCircle, XCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Alert, AlertDescription } from '@/components/ui/alert';
// Pastikan path ini benar mengarah ke file types Anda
import { PaymentCategory, PaymentSubCategory, OrderType, OrderStatus } from '../../types/types';
import type { TransactionItem, PaymentMethod } from '../../types/types';
import { calculatePackageStock } from '../../lib/packageStockCalculator';

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  isPackage: boolean;
  productId: string;
  availableStock: number;
}

interface PaymentMethodInput {
  id: string;
  category: PaymentCategory;
  subCategory?: PaymentSubCategory;
  methodName: string;
  amount: string;
}

interface HeldOrder {
  id: string;
  cart: CartItem[];
  paymentMethods: PaymentMethodInput[];
  timestamp: number;
  customerNote?: string;
  orderType?: OrderType;
}

interface KitchenOrder {
  id: string;
  orderNumber: string;
  items: CartItem[];
  status: OrderStatus;
  orderType: OrderType;
  timestamp: number;
  source: 'pos' | 'kiosk';
}

export default function POSPage() {
  const { data: userProfile } = useGetCallerUserProfile();
  const userOutletId = userProfile?.outletId;
  const { data: products, isLoading: productsLoading } = useListProductsByOutlet(userOutletId || null);
  const { data: packages, isLoading: packagesLoading } = useListActivePackages(userOutletId || null);
  const { data: categories } = useGetAllCategories();
  const { data: paymentSettings } = useGetPaymentSettings();
  const createTransaction = useCreateTransaction();

  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodInput[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'products' | 'packages'>('products');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');
  const [heldOrders, setHeldOrders] = useState<HeldOrder[]>([]);
  const [showHeldOrders, setShowHeldOrders] = useState(false);
  const [showKitchenDisplay, setShowKitchenDisplay] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [orderType, setOrderType] = useState<OrderType | ''>('');
  const [pendingOrdersCount, setPendingOrdersCount] = useState(0);
  const [kitchenOrders, setKitchenOrders] = useState<KitchenOrder[]>([]);
  
  // Load held orders from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('pos_held_orders');
    if (saved) {
      try {
        setHeldOrders(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to load held orders:', e);
      }
    }
  }, []);
  
  // Save held orders to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('pos_held_orders', JSON.stringify(heldOrders));
  }, [heldOrders]);
  
  // Poll for new kitchen orders (every 10 seconds)
  useEffect(() => {
    const pollKitchenOrders = async () => {
      try {
        // Load kiosk orders
        const kioskOrdersStr = localStorage.getItem('kiosk_pending_orders');
        let allOrders: KitchenOrder[] = [];
        
        if (kioskOrdersStr) {
          const kioskOrders = JSON.parse(kioskOrdersStr);
          allOrders = kioskOrders
            .filter((o: any) => o.outletId === userOutletId)
            .map((o: any) => ({
              id: o.id,
              orderNumber: o.orderNumber || `#${o.id.substring(0, 8)}`,
              items: o.items || [],
              status: o.status || 'pending',
              orderType: o.orderType || 'takeaway',
              timestamp: o.timestamp || Date.now(),
              source: 'kiosk' as const,
            }));
        }
        
        const pendingCount = allOrders.filter((o: any) => o.status === 'pending' || o.status === 'processing').length;
        if (pendingCount > pendingOrdersCount) {
          // Play notification sound
          playNotificationSound();
          toast.info(`${pendingCount - pendingOrdersCount} pesanan baru!`);
        }
        setPendingOrdersCount(pendingCount);
        setKitchenOrders(allOrders);
      } catch (e) {
        console.error('Failed to poll kitchen orders:', e);
      }
    };
    
    const interval = setInterval(pollKitchenOrders, 10000); // Poll every 10 seconds
    pollKitchenOrders(); // Initial poll
    
    return () => clearInterval(interval);
  }, [pendingOrdersCount, userOutletId]);

  // Calculate package stocks dynamically
  const packagesWithStock = useMemo(() => {
    if (!packages || !products) return [];
    return packages.map(pkg => ({
      ...pkg,
      stock: calculatePackageStock(pkg, products),
    }));
  }, [packages, products]);
  
  const playNotificationSound = () => {
    // Create and play notification sound
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 800;
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
  };

  const addToCart = (item: { id: bigint; name: string; price: bigint; stock: bigint }, isPackage: boolean) => {
    const cartId = `${isPackage ? 'pkg' : 'prod'}-${item.id.toString()}`;
    const existingItem = cart.find(cartItem => cartItem.id === cartId);
    
    if (existingItem) {
      setCart(cart.map(cartItem =>
        cartItem.id === cartId
          ? { ...cartItem, quantity: cartItem.quantity + 1 }
          : cartItem
      ));
    } else {
      const newItem: CartItem = {
        id: cartId,
        name: item.name,
        price: Number(item.price),
        quantity: 1,
        isPackage,
        productId: item.id.toString(),
        availableStock: Number(item.stock),
      };
      setCart([...cart, newItem]);
    }
  };

  const updateQuantity = (cartId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(cartId);
    } else {
      setCart(cart.map(item =>
        item.id === cartId ? { ...item, quantity } : item
      ));
    }
  };

  const removeFromCart = (cartId: string) => {
    setCart(cart.filter(item => item.id !== cartId));
  };

  const calculateTotal = () => {
    return cart.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0);
  };

  const addPaymentMethod = (category: PaymentCategory, methodName: string, subCategory?: PaymentSubCategory) => {
    const newPayment: PaymentMethodInput = {
      id: Date.now().toString(),
      category,
      subCategory,
      methodName,
      amount: '',
    };
    setPaymentMethods([...paymentMethods, newPayment]);
  };

  const updatePaymentAmount = (id: string, amount: string) => {
    setPaymentMethods(paymentMethods.map(pm =>
      pm.id === id ? { ...pm, amount } : pm
    ));
  };

  const removePaymentMethod = (id: string) => {
    setPaymentMethods(paymentMethods.filter(pm => pm.id !== id));
  };

  const calculateTotalPayment = () => {
    return paymentMethods.reduce((sum, pm) => sum + (parseFloat(pm.amount) || 0), 0);
  };
  
  const handleHoldOrder = () => {
    if (cart.length === 0) {
      toast.error('Keranjang kosong');
      return;
    }
    
    const heldOrder: HeldOrder = {
      id: Date.now().toString(),
      cart: [...cart],
      paymentMethods: [...paymentMethods],
      timestamp: Date.now(),
    };
    
    setHeldOrders([...heldOrders, heldOrder]);
    setCart([]);
    setPaymentMethods([]);
    toast.success('Pesanan ditahan');
  };
  
  const handleResumeOrder = (order: HeldOrder) => {
    setCart(order.cart);
    setPaymentMethods(order.paymentMethods);
    setHeldOrders(heldOrders.filter(o => o.id !== order.id));
    setShowHeldOrders(false);
    toast.success('Pesanan dilanjutkan');
  };
  
  const handleDeleteHeldOrder = (orderId: string) => {
    setHeldOrders(heldOrders.filter(o => o.id !== orderId));
    toast.success('Pesanan dihapus');
  };

  const handleCheckout = () => {
    if (cart.length === 0) {
      toast.error('Keranjang kosong');
      return;
    }

    // Open checkout dialog instead of processing immediately
    setShowCheckout(true);
  };

  const handleConfirmCheckout = () => {
    if (cart.length === 0) {
      toast.error('Keranjang kosong');
      return;
    }

    if (!orderType) {
      toast.error('Pilih jenis pesanan');
      return;
    }

    if (paymentMethods.length === 0) {
      toast.error('Pilih metode pembayaran');
      return;
    }

    const total = calculateTotal();
    const totalPayment = calculateTotalPayment();

    if (Math.abs(total - totalPayment) > 0.01) {
      toast.error(`Total pembayaran harus sama dengan total belanja (Rp ${total.toLocaleString('id-ID')})`);
      return;
    }

    if (!userOutletId) {
      toast.error('Outlet tidak ditemukan');
      return;
    }

    // Validate stock - recalculate for packages
    for (const item of cart) {
      let currentStock = item.availableStock;
      
      if (item.isPackage) {
        // Recalculate package stock in real-time
        const pkg = packages?.find(p => p.id.toString() === item.productId);
        if (pkg) {
          currentStock = Number(calculatePackageStock(pkg, products));
        }
      }
      
      if (item.quantity > currentStock) {
        toast.error(`Stok tidak cukup untuk ${item.name}. Tersedia: ${currentStock}`);
        return;
      }
    }

    const items: TransactionItem[] = cart.map(item => ({
      productId: BigInt(item.productId),
      quantity: BigInt(item.quantity),
      price: BigInt(Math.round(item.price)),
      isPackage: item.isPackage,
      isBundle: false,
    }));

    const payments: PaymentMethod[] = paymentMethods.map(pm => ({
      category: pm.category,
      subCategory: pm.subCategory,
      methodName: pm.methodName,
      amount: BigInt(Math.round(parseFloat(pm.amount))),
    }));

    createTransaction.mutate(
      {
        items,
        outletId: userOutletId,
        paymentMethods: payments,
        orderType: orderType as OrderType,
      },
      {
        onSuccess: () => {
          setCart([]);
          setPaymentMethods([]);
          setOrderType('');
          setShowCheckout(false);
          toast.success('Transaksi berhasil disimpan');
        },
      }
    );
  };

  const updateOrderStatus = (orderId: string, newStatus: OrderStatus) => {
    const updated = kitchenOrders.map(order =>
      order.id === orderId ? { ...order, status: newStatus } : order
    );
    setKitchenOrders(updated);
    
    // Update localStorage
    const kioskOrdersStr = localStorage.getItem('kiosk_pending_orders');
    if (kioskOrdersStr) {
      const kioskOrders = JSON.parse(kioskOrdersStr);
      const updatedKioskOrders = kioskOrders.map((o: any) =>
        o.id === orderId ? { ...o, status: newStatus } : o
      );
      localStorage.setItem('kiosk_pending_orders', JSON.stringify(updatedKioskOrders));
    }
    
    toast.success(`Status pesanan diupdate ke ${newStatus}`);
  };

  const getStatusBadge = (status: OrderStatus) => {
    const statusConfig = {
      pending: { label: 'Menunggu', variant: 'secondary' as const, icon: Clock, color: 'text-yellow-600' },
      processing: { label: 'Diproses', variant: 'default' as const, icon: AlertCircle, color: 'text-blue-600' },
      ready: { label: 'Siap', variant: 'default' as const, icon: CheckCircle2, color: 'text-green-600' },
      completed: { label: 'Selesai', variant: 'outline' as const, icon: CheckCircle2, color: 'text-gray-600' },
      canceled: { label: 'Dibatalkan', variant: 'destructive' as const, icon: XCircle, color: 'text-red-600' },
    };

    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className={`h-3 w-3 ${config.color}`} />
        {config.label}
      </Badge>
    );
  };

  const getOrderTypeLabel = (type: OrderType) => {
    const types = {
      'dine-in': 'Dine In',
      'takeaway': 'Takeaway',
      'delivery': 'Delivery',
    };
    return types[type] || type;
  };

  // Group products by category
  const productsByCategory = useMemo(() => {
    if (!products) return {};
    
    const grouped: Record<string, typeof products> = {
      all: products,
    };
    
    products.forEach(product => {
      const categoryId = product.categoryId || product.category || 'uncategorized';
      if (!grouped[categoryId]) {
        grouped[categoryId] = [];
      }
      grouped[categoryId].push(product);
    });
    
    return grouped;
  }, [products]);

  // Get active categories that have products
  const activeCategories = useMemo(() => {
    if (!categories) return [];
    return categories.filter(cat => 
      cat.isActive && productsByCategory[cat.id] && productsByCategory[cat.id].length > 0
    );
  }, [categories, productsByCategory]);

  const filteredProducts = useMemo(() => {
    let filtered = products || [];
    
    // Filter by category
    if (selectedCategoryId !== 'all') {
      filtered = productsByCategory[selectedCategoryId] || [];
    }
    
    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    return filtered;
  }, [products, selectedCategoryId, searchQuery, productsByCategory]);

  const filteredPackages = packagesWithStock?.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const formatCurrency = (amount: number | bigint) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(Number(amount));
  };

  const isLoading = productsLoading || packagesLoading;

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-3xl font-bold tracking-tight">Kasir (POS)</h1>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => setShowHeldOrders(true)}
              className="relative"
            >
              <Clock className="mr-2 h-4 w-4" />
              Pesanan Ditahan
              {heldOrders.length > 0 && (
                <Badge className="ml-2 bg-blue-500">{heldOrders.length}</Badge>
              )}
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setShowKitchenDisplay(true)}
              className="relative"
            >
              <Bell className="mr-2 h-4 w-4" />
              Kitchen Display
              {pendingOrdersCount > 0 && (
                <Badge className="ml-2 bg-red-500 animate-pulse">{pendingOrdersCount}</Badge>
              )}
            </Button>
          </div>
        </div>
        <p className="text-muted-foreground">Proses transaksi penjualan produk dan paket</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Products Section */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pilih Item</CardTitle>
              <CardDescription>Cari dan tambahkan produk atau paket ke keranjang</CardDescription>
            </CardHeader>
            <CardContent>
              <Input
                placeholder="Cari produk atau paket..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="mb-4"
              />
              <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'products' | 'packages')}>
                <TabsList className="grid w-full grid-cols-2 " >
                  <TabsTrigger value="products">Produk Satuan</TabsTrigger>
                  <TabsTrigger  value="packages">Paket</TabsTrigger>
                </TabsList>
                <TabsContent value="products" className="mt-4">
                  {isLoading ? (
                    <div className="grid grid-cols-2 gap-3">
                      {[1, 2, 3, 4].map(i => (
                        <Skeleton key={i} className="h-24 w-full" />
                      ))}
                    </div>
                  ) : (
                    <>
                      {/* Category Tabs */}
                      <Tabs value={selectedCategoryId} onValueChange={setSelectedCategoryId} className="w-full">
                        <TabsList className="w-full justify-start overflow-x-auto flex-nowrap mb-4">
                          <TabsTrigger value="all" className="whitespace-nowrap">
                            Semua ({products?.length || 0})
                          </TabsTrigger>
                          {activeCategories.map((category) => (
                            <TabsTrigger key={category.id} value={category.id} className="whitespace-nowrap">
                              {category.name} ({productsByCategory[category.id]?.length || 0})
                            </TabsTrigger>
                          ))}
                          {productsByCategory['uncategorized'] && productsByCategory['uncategorized'].length > 0 && (
                            <TabsTrigger value="uncategorized" className="whitespace-nowrap">
                              Lainnya ({productsByCategory['uncategorized'].length})
                            </TabsTrigger>
                          )}
                        </TabsList>
                        
                        {/* Products Grid */}
                        {filteredProducts.length === 0 ? (
                          <div className="text-center py-8 text-muted-foreground">
                            Tidak ada produk ditemukan
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 gap-3 max-h-[500px] overflow-y-auto">
                            {filteredProducts.map((product) => (
                              <Button
                                key={product.id.toString()}
                                variant="outline"
                                className="h-auto flex flex-col items-start p-4"
                                onClick={() => addToCart(product, false)}
                                disabled={product.stock === BigInt(0)}
                              >
                                <div className="font-semibold text-left">{product.name}</div>
                                <div className="text-sm text-muted-foreground">{formatCurrency(product.price)}</div>
                                <Badge variant={product.stock === BigInt(0) ? 'destructive' : 'secondary'} className="mt-2">
                                  Stok: {product.stock.toString()}
                                </Badge>
                              </Button>
                            ))}
                          </div>
                        )}
                      </Tabs>
                    </>
                  )}
                </TabsContent>
                <TabsContent value="packages" className="mt-4">
                  {isLoading ? (
                    <div className="grid grid-cols-2 gap-3">
                      {[1, 2, 3, 4].map(i => (
                        <Skeleton key={i} className="h-24 w-full" />
                      ))}
                    </div>
                  ) : filteredPackages.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      Tidak ada paket ditemukan
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-3 max-h-[500px] overflow-y-auto">
                      {filteredPackages.map((pkg) => (
                        <Button
                          key={pkg.id.toString()}
                          variant="outline"
                          className="h-auto flex flex-col items-start p-4"
                          onClick={() => addToCart(pkg, true)}
                          disabled={pkg.stock === BigInt(0)}
                        >
                          <div className="flex items-center gap-1 font-semibold text-left">
                            <Package className="h-4 w-4" />
                            {pkg.name}
                          </div>
                          <div className="text-sm text-muted-foreground">{formatCurrency(pkg.price)}</div>
                          <Badge variant={pkg.stock === BigInt(0) ? 'destructive' : 'secondary'} className="mt-2">
                            Stok: {pkg.stock.toString()} paket
                          </Badge>
                        </Button>
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Cart and Payment Section */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Keranjang
              </CardTitle>
            </CardHeader>
            <CardContent>
              {cart.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Keranjang kosong
                </div>
              ) : (
                <div className="space-y-3">
                  {cart.map((item) => (
                    <div key={item.id} className="flex items-center justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate flex items-center gap-1">
                          {item.isPackage && <Package className="h-3 w-3" />}
                          {item.name}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {formatCurrency(item.price)}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="icon"
                          variant="outline"
                          className="h-8 w-8"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-8 text-center">{item.quantity}</span>
                        <Button
                          size="icon"
                          variant="outline"
                          className="h-8 w-8"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          disabled={item.quantity >= Number(item.availableStock)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          onClick={() => removeFromCart(item.id)}
                        >
                          <Trash2 className="h-3 w-3 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  <Separator />
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total:</span>
                    <span>{formatCurrency(calculateTotal())}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {cart.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Metode Pembayaran</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Tabs defaultValue="offline">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="offline">
                      <CreditCard className="h-4 w-4 mr-2" />
                      Offline
                    </TabsTrigger>
                    <TabsTrigger value="online">
                      <Smartphone className="h-4 w-4 mr-2" />
                      Online
                    </TabsTrigger>
                    <TabsTrigger value="delivery">
                      <Truck className="h-4 w-4 mr-2" />
                      Delivery
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="offline" className="space-y-2">
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => addPaymentMethod(PaymentCategory.offline, 'Tunai', PaymentSubCategory.cash)}
                    >
                      Tunai
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => addPaymentMethod(PaymentCategory.offline, 'Kartu Debit', PaymentSubCategory.debit)}
                    >
                      Kartu Debit
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => addPaymentMethod(PaymentCategory.offline, 'Kartu Kredit', PaymentSubCategory.credit)}
                    >
                      Kartu Kredit
                    </Button>
                  </TabsContent>
                  <TabsContent value="online" className="space-y-2">
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => addPaymentMethod(PaymentCategory.online, 'eWallet', PaymentSubCategory.eWallet)}
                    >
                      eWallet
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => addPaymentMethod(PaymentCategory.online, 'QRIS', PaymentSubCategory.qris)}
                    >
                      QRIS
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => addPaymentMethod(PaymentCategory.online, 'Transfer Bank', PaymentSubCategory.transfer)}
                    >
                      Transfer Bank
                    </Button>
                  </TabsContent>
                  <TabsContent value="delivery" className="space-y-2">
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => addPaymentMethod(PaymentCategory.foodDelivery, 'ShopeeFood', PaymentSubCategory.shopeeFood)}
                    >
                      ShopeeFood
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => addPaymentMethod(PaymentCategory.foodDelivery, 'GoFood', PaymentSubCategory.goFood)}
                    >
                      GoFood
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => addPaymentMethod(PaymentCategory.foodDelivery, 'GrabFood', PaymentSubCategory.grabFood)}
                    >
                      GrabFood
                    </Button>
                  </TabsContent>
                </Tabs>

                {paymentMethods.length > 0 && (
                  <div className="space-y-3 pt-4 border-t">
                    <Label>Pembayaran Dipilih:</Label>
                    {paymentMethods.map((pm, index) => (
                      <div key={pm.id} className="space-y-2">
                        <div className="flex items-center gap-2">
                          <div className="flex-1">
                            <div className="text-sm font-medium">{pm.methodName}</div>
                            <Input
                              type="number"
                              placeholder="Jumlah (Rp)"
                              value={pm.amount}
                              onChange={(e) => updatePaymentAmount(pm.id, e.target.value)}
                              className="mt-1"
                            />
                          </div>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => removePaymentMethod(pm.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                        {/* Saran Nominal */}
                        {index === paymentMethods.length - 1 && !pm.amount && (
                          <div className="space-y-2">
                            <Label className="text-xs text-muted-foreground">Saran Nominal:</Label>
                            <div className="grid grid-cols-3 gap-2">
                              {(() => {
                                const total = calculateTotal();
                                const remaining = total - calculateTotalPayment();
                                const suggestions = [
                                  remaining,
                                  Math.ceil(remaining / 10000) * 10000,
                                  Math.ceil(remaining / 50000) * 50000,
                                  Math.ceil(remaining / 100000) * 100000,
                                  50000,
                                  100000,
                                ].filter((val, idx, arr) => val > 0 && arr.indexOf(val) === idx)
                                  .sort((a, b) => a - b)
                                  .slice(0, 6);
                                
                                return suggestions.map((amount) => (
                                  <Button
                                    key={amount}
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="text-xs"
                                    onClick={() => updatePaymentAmount(pm.id, amount.toString())}
                                  >
                                    {formatCurrency(amount)}
                                  </Button>
                                ));
                              })()}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                    <Separator />
                    <div className="flex justify-between font-medium">
                      <span>Total Pembayaran:</span>
                      <span>{formatCurrency(calculateTotalPayment())}</span>
                    </div>
                    {calculateTotalPayment() > 0 && calculateTotalPayment() !== calculateTotal() && (
                      <div className="flex justify-between text-sm">
                        <span className={calculateTotalPayment() < calculateTotal() ? 'text-red-500' : 'text-green-600'}>
                          {calculateTotalPayment() < calculateTotal() ? 'Kurang:' : 'Kembalian:'}
                        </span>
                        <span className={calculateTotalPayment() < calculateTotal() ? 'text-red-500 font-medium' : 'text-green-600 font-medium'}>
                          {formatCurrency(Math.abs(calculateTotal() - calculateTotalPayment()))}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                <Button
                  className="w-full"
                  size="lg"
                  onClick={handleCheckout}
                  disabled={createTransaction.isPending || paymentMethods.length === 0}
                  data-testid="checkout-button"
                >
                  {createTransaction.isPending ? 'Memproses...' : 'Proses Pembayaran'}
                </Button>
                
                {cart.length > 0 && (
                  <Button
                    variant="outline"
                    className="w-full"
                    size="lg"
                    onClick={handleHoldOrder}
                  >
                    <Pause className="mr-2 h-4 w-4" />
                    Tahan Pesanan
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Held Orders Dialog */}
      <Dialog open={showHeldOrders} onOpenChange={setShowHeldOrders}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Pesanan Ditahan</DialogTitle>
            <DialogDescription>Daftar pesanan yang ditahan sementara</DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[500px] pr-4">
            {heldOrders.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Tidak ada pesanan ditahan
              </div>
            ) : (
              <div className="space-y-4">
                {heldOrders.map((order) => (
                  <Card key={order.id}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-base">
                            Pesanan #{order.id.substring(0, 8)}
                          </CardTitle>
                          <p className="text-sm text-muted-foreground">
                            {new Date(order.timestamp).toLocaleString('id-ID')}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleResumeOrder(order)}
                          >
                            <Play className="h-4 w-4 mr-2" />
                            Lanjutkan
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDeleteHeldOrder(order.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <Label className="text-sm">Items:</Label>
                        {order.cart.map((item) => (
                          <div key={item.id} className="flex justify-between text-sm">
                            <span>{item.name}</span>
                            <span>x{item.quantity}</span>
                          </div>
                        ))}
                        <Separator className="my-2" />
                        <div className="flex justify-between font-medium">
                          <span>Total:</span>
                          <span>
                            {formatCurrency(
                              order.cart.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0)
                            )}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Checkout Dialog */}
      <Dialog open={showCheckout} onOpenChange={setShowCheckout}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Konfirmasi Checkout</DialogTitle>
            <DialogDescription>Pilih jenis pesanan untuk melanjutkan</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Total Pembayaran</Label>
              <p className="text-2xl font-bold text-primary">{formatCurrency(calculateTotal())}</p>
            </div>

            <Separator />

            {/* Order Type Selection */}
            <div className="space-y-3">
              <Label>Jenis Pesanan *</Label>
              <RadioGroup value={orderType} onValueChange={(v) => setOrderType(v as OrderType)}>
                <div className="flex items-center space-x-2 border rounded-lg p-3 cursor-pointer hover:bg-accent">
                  <RadioGroupItem value="dine-in" id="dine-in" />
                  <Label htmlFor="dine-in" className="flex items-center gap-2 cursor-pointer flex-1">
                    <UtensilsCrossed className="h-4 w-4" />
                    <div>
                      <p className="font-medium">Dine In</p>
                      <p className="text-xs text-muted-foreground">Makan di tempat</p>
                    </div>
                  </Label>
                </div>
                <div className="flex items-center space-x-2 border rounded-lg p-3 cursor-pointer hover:bg-accent">
                  <RadioGroupItem value="takeaway" id="takeaway" />
                  <Label htmlFor="takeaway" className="flex items-center gap-2 cursor-pointer flex-1">
                    <Package className="h-4 w-4" />
                    <div>
                      <p className="font-medium">Takeaway</p>
                      <p className="text-xs text-muted-foreground">Dibawa pulang</p>
                    </div>
                  </Label>
                </div>
                <div className="flex items-center space-x-2 border rounded-lg p-3 cursor-pointer hover:bg-accent">
                  <RadioGroupItem value="delivery" id="delivery" />
                  <Label htmlFor="delivery" className="flex items-center gap-2 cursor-pointer flex-1">
                    <Truck className="h-4 w-4" />
                    <div>
                      <p className="font-medium">Delivery</p>
                      <p className="text-xs text-muted-foreground">Diantar ke alamat</p>
                    </div>
                  </Label>
                </div>
              </RadioGroup>
              {showCheckout && !orderType && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>Pilih jenis pesanan terlebih dahulu</AlertDescription>
                </Alert>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCheckout(false)}>
              Batal
            </Button>
            <Button
              onClick={handleConfirmCheckout}
              disabled={!orderType || createTransaction.isPending}
            >
              {createTransaction.isPending ? 'Memproses...' : 'Konfirmasi'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Kitchen Display Dialog */}
      <Dialog open={showKitchenDisplay} onOpenChange={setShowKitchenDisplay}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UtensilsCrossed className="h-5 w-5" />
              Kitchen Display System
            </DialogTitle>
            <DialogDescription>Monitor dan kelola pesanan dari kiosk dan POS</DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[600px] pr-4">
            {kitchenOrders.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <UtensilsCrossed className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">Tidak ada pesanan di dapur</p>
                <p className="text-sm">Pesanan baru akan muncul di sini</p>
              </div>
            ) : (
              <div className="space-y-4">
                {kitchenOrders.map((order) => (
                  <Card key={order.id} className="overflow-hidden" data-testid={`kitchen-order-${order.id}`}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">{order.orderNumber}</CardTitle>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline">{order.source === 'kiosk' ? 'Kiosk' : 'POS'}</Badge>
                            <Badge variant="outline">{getOrderTypeLabel(order.orderType)}</Badge>
                            {getStatusBadge(order.status)}
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {new Date(order.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="space-y-2">
                        <Label className="text-sm font-semibold">Item Pesanan:</Label>
                        {order.items.map((item, idx) => (
                          <div key={idx} className="flex justify-between text-sm">
                            <span>{item.name}</span>
                            <span className="font-medium">x{item.quantity}</span>
                          </div>
                        ))}
                      </div>
                      <Separator />
                      <div className="flex gap-2">
                        {order.status === 'pending' && (
                          <Button
                            size="sm"
                            className="flex-1"
                            onClick={() => updateOrderStatus(order.id, 'processing')}
                            data-testid={`process-order-${order.id}`}
                          >
                            <Play className="h-4 w-4 mr-2" />
                            Proses
                          </Button>
                        )}
                        {order.status === 'processing' && (
                          <Button
                            size="sm"
                            className="flex-1 bg-green-600 hover:bg-green-700"
                            onClick={() => updateOrderStatus(order.id, 'ready')}
                            data-testid={`ready-order-${order.id}`}
                          >
                            <CheckCircle2 className="h-4 w-4 mr-2" />
                            Siap
                          </Button>
                        )}
                        {(order.status === 'pending' || order.status === 'processing') && (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => updateOrderStatus(order.id, 'canceled')}
                            data-testid={`cancel-order-${order.id}`}
                          >
                            <XCircle className="h-4 w-4 mr-2" />
                            Batal
                          </Button>
                        )}
                        {order.status === 'ready' && (
                          <Button
                            size="sm"
                            className="flex-1"
                            variant="outline"
                            onClick={() => updateOrderStatus(order.id, 'completed')}
                            data-testid={`complete-order-${order.id}`}
                          >
                            <CheckCircle2 className="h-4 w-4 mr-2" />
                            Selesai
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}