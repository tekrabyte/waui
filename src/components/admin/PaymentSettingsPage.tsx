import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Banknote, 
  QrCode, 
  Building2, 
  UtensilsCrossed, 
  Plus, 
  Trash2, 
  Upload,
  Save,
  Settings,
  CreditCard,
  Smartphone,
  ImageIcon
} from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/services/api';

interface PaymentMethodConfig {
  id: string;
  name: string;
  category: 'offline' | 'online' | 'foodDelivery';
  subCategory?: string;
  enabled: boolean;
  icon: any;
  color: string;
  isDefault: boolean;
  fee?: number;
  feeType?: 'percentage' | 'flat'; // percentage (%) or flat (Rp)
  config?: {
    qrisImage?: string;
    merchantName?: string;
    bankName?: string;
    accountNumber?: string;
    accountName?: string;
  };
}

const defaultPaymentMethods: PaymentMethodConfig[] = [
  {
    id: 'cash',
    name: 'Cash',
    category: 'offline',
    subCategory: 'cash',
    enabled: true,
    icon: Banknote,
    color: 'bg-green-500',
    isDefault: true,
    fee: 0,
    feeType: 'flat'
  },
  {
    id: 'qris-static',
    name: 'QRIS Statis',
    category: 'online',
    subCategory: 'qris',
    enabled: false,
    icon: QrCode,
    color: 'bg-blue-500',
    isDefault: true,
    fee: 0.7,
    feeType: 'percentage',
    config: {}
  },
  {
    id: 'bank-transfer',
    name: 'Transfer Bank',
    category: 'online',
    subCategory: 'transfer',
    enabled: false,
    icon: Building2,
    color: 'bg-purple-500',
    isDefault: true,
    fee: 0,
    feeType: 'flat',
    config: {}
  },
  {
    id: 'debit',
    name: 'Kartu Debit',
    category: 'offline',
    subCategory: 'debit',
    enabled: false,
    icon: CreditCard,
    color: 'bg-indigo-500',
    isDefault: true,
    fee: 1.5,
    feeType: 'percentage'
  },
  {
    id: 'credit',
    name: 'Kartu Kredit',
    category: 'offline',
    subCategory: 'credit',
    enabled: false,
    icon: CreditCard,
    color: 'bg-pink-500',
    isDefault: true,
    fee: 2.5,
    feeType: 'percentage'
  },
  {
    id: 'ewallet',
    name: 'E-Wallet',
    category: 'online',
    subCategory: 'eWallet',
    enabled: false,
    icon: Smartphone,
    color: 'bg-teal-500',
    isDefault: true,
    fee: 1.0,
    feeType: 'percentage'
  },
  {
    id: 'gofood',
    name: 'GoFood',
    category: 'foodDelivery',
    subCategory: 'goFood',
    enabled: false,
    icon: UtensilsCrossed,
    color: 'bg-green-600',
    isDefault: true,
    fee: 20,
    feeType: 'percentage'
  },
  {
    id: 'grabfood',
    name: 'GrabFood',
    category: 'foodDelivery',
    subCategory: 'grabFood',
    enabled: false,
    icon: UtensilsCrossed,
    color: 'bg-emerald-600',
    isDefault: true,
    fee: 20,
    feeType: 'percentage'
  },
  {
    id: 'shopeefood',
    name: 'ShopeeFood',
    category: 'foodDelivery',
    subCategory: 'shopeeFood',
    enabled: false,
    icon: UtensilsCrossed,
    color: 'bg-orange-600',
    isDefault: true,
    fee: 20,
    feeType: 'percentage'
  }
];

export default function PaymentSettingsPage() {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethodConfig | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  
  // Form states for QRIS
  const [qrisImage, setQrisImage] = useState<string>('');
  const [qrisMerchantName, setQrisMerchantName] = useState('');
  const [qrisImageFile, setQrisImageFile] = useState<File | null>(null);
  
  // Form states for Bank Transfer
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');

  // Form states for Fee Configuration
  const [selectedFee, setSelectedFee] = useState<string>('0');
  const [selectedFeeType, setSelectedFeeType] = useState<'percentage' | 'flat'>('percentage');

  // Form states for custom method
  const [customName, setCustomName] = useState('');
  const [customCategory, setCustomCategory] = useState<'offline' | 'online' | 'foodDelivery'>('offline');
  const [customFee, setCustomFee] = useState('0');
  const [customFeeType, setCustomFeeType] = useState<'percentage' | 'flat'>('percentage');

  useEffect(() => {
    loadPaymentMethods();
  }, []);

  const loadPaymentMethods = async () => {
    try {
      setIsLoading(true);
      const response = await api.paymentMethods.getAll();
      
      if (response && response.length > 0) {
        // Map backend response to frontend format
        const mappedMethods = response.map((method: any) => {
          const defaultMethod = defaultPaymentMethods.find(m => m.id === method.id || m.subCategory === method.subCategory);
          return {
            id: method.id || method.subCategory,
            name: method.name,
            category: method.category,
            subCategory: method.subCategory,
            enabled: method.enabled,
            icon: defaultMethod?.icon || CreditCard,
            color: defaultMethod?.color || 'bg-gray-500',
            isDefault: method.isDefault !== undefined ? method.isDefault : true,
            fee: method.fee || 0,
            feeType: method.feeType || 'percentage',
            config: method.config || {}
          };
        });
        setPaymentMethods(mappedMethods);
      } else {
        // If no data from backend, use defaults
        setPaymentMethods(defaultPaymentMethods);
      }
    } catch (error) {
      console.error('Failed to load payment methods from API:', error);
      // Fallback to localStorage or defaults
      try {
        const saved = localStorage.getItem('payment_methods_config');
        if (saved) {
          const parsed = JSON.parse(saved);
          const merged = defaultPaymentMethods.map(defaultMethod => {
            const savedMethod = parsed.find((m: PaymentMethodConfig) => m.id === defaultMethod.id);
            return savedMethod ? { ...defaultMethod, ...savedMethod } : defaultMethod;
          });
          const customMethods = parsed.filter((m: PaymentMethodConfig) => !m.isDefault);
          setPaymentMethods([...merged, ...customMethods]);
        } else {
          setPaymentMethods(defaultPaymentMethods);
        }
      } catch (localError) {
        console.error('Fallback to localStorage also failed:', localError);
        setPaymentMethods(defaultPaymentMethods);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const savePaymentMethods = async (methods: PaymentMethodConfig[]) => {
    try {
      // Update each method via backend API
      for (const method of methods) {
        if (method.isDefault) {
          // Update existing default methods
          await api.paymentMethods.update(method.id, {
            enabled: method.enabled,
            fee: method.fee,
            feeType: method.feeType,
            config: method.config
          });
        }
      }
      
      // Also save to localStorage as backup
      localStorage.setItem('payment_methods_config', JSON.stringify(methods));
      setPaymentMethods(methods);
      toast.success('Pengaturan pembayaran berhasil disimpan');
    } catch (error) {
      console.error('Failed to save payment methods to API:', error);
      // If API fails, still save to localStorage
      localStorage.setItem('payment_methods_config', JSON.stringify(methods));
      setPaymentMethods(methods);
      toast.success('Pengaturan pembayaran berhasil disimpan (lokal)');
    }
  };

  const toggleMethod = (id: string) => {
    const updated = paymentMethods.map(m => 
      m.id === id ? { ...m, enabled: !m.enabled } : m
    );
    savePaymentMethods(updated);
  };

  const openConfigDialog = (method: PaymentMethodConfig) => {
    setSelectedMethod(method);
    
    // Load existing config
    if (method.id === 'qris-static' && method.config) {
      setQrisImage(method.config.qrisImage || '');
      setQrisMerchantName(method.config.merchantName || '');
    } else if (method.id === 'bank-transfer' && method.config) {
      setBankName(method.config.bankName || '');
      setAccountNumber(method.config.accountNumber || '');
      setAccountName(method.config.accountName || '');
    }
    
    // Load fee config
    setSelectedFee(method.fee?.toString() || '0');
    setSelectedFeeType(method.feeType || 'percentage');
    
    setIsDialogOpen(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('File harus berupa gambar');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Ukuran file maksimal 5MB');
      return;
    }

    setQrisImageFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setQrisImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const saveMethodConfig = () => {
    if (!selectedMethod) return;

    // Validate fee
    const feeValue = parseFloat(selectedFee);
    if (isNaN(feeValue) || feeValue < 0) {
      toast.error('Nilai fee harus angka positif');
      return;
    }

    const updated = paymentMethods.map(m => {
      if (m.id === selectedMethod.id) {
        let updatedMethod = {
          ...m,
          fee: feeValue,
          feeType: selectedFeeType
        };

        if (m.id === 'qris-static') {
          updatedMethod = {
            ...updatedMethod,
            config: {
              ...m.config,
              qrisImage,
              merchantName: qrisMerchantName
            }
          };
        } else if (m.id === 'bank-transfer') {
          updatedMethod = {
            ...updatedMethod,
            config: {
              ...m.config,
              bankName,
              accountNumber,
              accountName
            }
          };
        }

        return updatedMethod;
      }
      return m;
    });

    savePaymentMethods(updated);
    setIsDialogOpen(false);
    resetForm();
  };

  const addCustomMethod = async () => {
    if (!customName.trim()) {
      toast.error('Nama metode pembayaran harus diisi');
      return;
    }

    const feeValue = parseFloat(customFee);
    if (isNaN(feeValue) || feeValue < 0) {
      toast.error('Nilai fee harus angka positif');
      return;
    }

    try {
      const newMethodData = {
        name: customName,
        category: customCategory,
        enabled: true,
        fee: feeValue,
        feeType: customFeeType
      };

      // Call backend API to create custom payment method
      const response = await api.paymentMethods.createCustom(newMethodData);
      
      const newMethod: PaymentMethodConfig = {
        id: response.id || `custom-${Date.now()}`,
        name: customName,
        category: customCategory,
        enabled: true,
        icon: CreditCard,
        color: 'bg-gray-500',
        isDefault: false,
        fee: feeValue,
        feeType: customFeeType
      };

      const updatedMethods = [...paymentMethods, newMethod];
      // Save to localStorage as well
      localStorage.setItem('payment_methods_config', JSON.stringify(updatedMethods));
      setPaymentMethods(updatedMethods);
      
      toast.success('Metode pembayaran kustom berhasil ditambahkan');
      setIsAddDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error('Failed to create custom payment method:', error);
      // Fallback to local storage only
      const newMethod: PaymentMethodConfig = {
        id: `custom-${Date.now()}`,
        name: customName,
        category: customCategory,
        enabled: true,
        icon: CreditCard,
        color: 'bg-gray-500',
        isDefault: false,
        fee: feeValue,
        feeType: customFeeType
      };

      const updatedMethods = [...paymentMethods, newMethod];
      localStorage.setItem('payment_methods_config', JSON.stringify(updatedMethods));
      setPaymentMethods(updatedMethods);
      
      toast.success('Metode pembayaran kustom berhasil ditambahkan (lokal)');
      setIsAddDialogOpen(false);
      resetForm();
    }
  };

  const deleteCustomMethod = async (id: string) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus metode pembayaran ini?')) {
      try {
        // Call backend API to delete custom payment method
        await api.paymentMethods.deleteCustom(id);
        
        const updated = paymentMethods.filter(m => m.id !== id);
        localStorage.setItem('payment_methods_config', JSON.stringify(updated));
        setPaymentMethods(updated);
        toast.success('Metode pembayaran berhasil dihapus');
      } catch (error) {
        console.error('Failed to delete custom payment method:', error);
        // Fallback to local storage only
        const updated = paymentMethods.filter(m => m.id !== id);
        localStorage.setItem('payment_methods_config', JSON.stringify(updated));
        setPaymentMethods(updated);
        toast.success('Metode pembayaran berhasil dihapus (lokal)');
      }
    }
  };

  const resetForm = () => {
    setQrisImage('');
    setQrisMerchantName('');
    setQrisImageFile(null);
    setBankName('');
    setAccountNumber('');
    setAccountName('');
    setCustomName('');
    setCustomCategory('offline');
    setCustomFee('0');
    setCustomFeeType('percentage');
    setSelectedFee('0');
    setSelectedFeeType('percentage');
  };

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case 'offline':
        return <Badge variant="secondary">Offline</Badge>;
      case 'online':
        return <Badge variant="default" className="bg-blue-500">Online</Badge>;
      case 'foodDelivery':
        return <Badge variant="default" className="bg-orange-500">Food Delivery</Badge>;
      default:
        return null;
    }
  };

  const formatFeeDisplay = (fee: number | undefined, feeType: 'percentage' | 'flat' | undefined) => {
    if (fee === undefined || fee === 0) return null;
    
    if (feeType === 'flat') {
      return `Rp ${fee.toLocaleString('id-ID')}`;
    }
    
    return `${fee}%`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Settings className="h-12 w-12 animate-spin mx-auto text-gray-400" />
          <p className="mt-4 text-gray-500">Memuat pengaturan pembayaran...</p>
        </div>
      </div>
    );
  }

  const offlineMethods = paymentMethods.filter(m => m.category === 'offline');
  const onlineMethods = paymentMethods.filter(m => m.category === 'online');
  const foodDeliveryMethods = paymentMethods.filter(m => m.category === 'foodDelivery');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Pengaturan Pembayaran</h1>
          <p className="text-muted-foreground">
            Kelola metode pembayaran yang tersedia di sistem POS Anda
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2" data-testid="add-payment-method-button">
              <Plus className="h-4 w-4" />
              Tambah Manual
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Tambah Metode Pembayaran</DialogTitle>
              <DialogDescription>
                Buat metode pembayaran kustom sesuai kebutuhan Anda
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="custom-name">Nama Metode Pembayaran</Label>
                <Input
                  id="custom-name"
                  placeholder="Contoh: OVO, DANA, dll"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  data-testid="custom-method-name-input"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="custom-category">Kategori</Label>
                <Select value={customCategory} onValueChange={(v: any) => setCustomCategory(v)}>
                  <SelectTrigger id="custom-category" data-testid="custom-category-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="offline">Offline</SelectItem>
                    <SelectItem value="online">Online</SelectItem>
                    <SelectItem value="foodDelivery">Food Delivery</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="custom-fee-type">Tipe Biaya</Label>
                <Select value={customFeeType} onValueChange={(v: any) => setCustomFeeType(v)}>
                  <SelectTrigger id="custom-fee-type" data-testid="custom-fee-type-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Persentase (%)</SelectItem>
                    <SelectItem value="flat">Nominal Tetap (Rp)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="custom-fee">
                  {customFeeType === 'percentage' ? 'Biaya Transaksi (%)' : 'Biaya Transaksi (Rp)'}
                </Label>
                <Input
                  id="custom-fee"
                  type="number"
                  min="0"
                  step={customFeeType === 'percentage' ? '0.1' : '100'}
                  placeholder={customFeeType === 'percentage' ? '0' : '0'}
                  value={customFee}
                  onChange={(e) => setCustomFee(e.target.value)}
                  data-testid="custom-fee-input"
                />
                <p className="text-xs text-muted-foreground">
                  {customFeeType === 'percentage' 
                    ? 'Contoh: 0.7 untuk 0.7% dari total transaksi'
                    : 'Contoh: 5000 untuk Rp 5.000 per transaksi'
                  }
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Batal
              </Button>
              <Button onClick={addCustomMethod} data-testid="save-custom-method-button">
                Simpan
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Metode</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{paymentMethods.length}</div>
            <p className="text-xs text-muted-foreground">
              {paymentMethods.filter(m => m.enabled).length} aktif
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Metode Default</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{paymentMethods.filter(m => m.isDefault).length}</div>
            <p className="text-xs text-muted-foreground">
              Metode bawaan sistem
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Metode Kustom</CardTitle>
            <Plus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{paymentMethods.filter(m => !m.isDefault).length}</div>
            <p className="text-xs text-muted-foreground">
              Dibuat manual
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Payment Methods Tabs */}
      <Tabs defaultValue="offline" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="offline" data-testid="offline-tab">
            <Banknote className="h-4 w-4 mr-2" />
            Offline ({offlineMethods.length})
          </TabsTrigger>
          <TabsTrigger value="online" data-testid="online-tab">
            <QrCode className="h-4 w-4 mr-2" />
            Online ({onlineMethods.length})
          </TabsTrigger>
          <TabsTrigger value="foodDelivery" data-testid="food-delivery-tab">
            <UtensilsCrossed className="h-4 w-4 mr-2" />
            Food Delivery ({foodDeliveryMethods.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="offline" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Metode Pembayaran Offline</CardTitle>
              <CardDescription>
                Metode pembayaran yang dilakukan secara langsung di outlet
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                {offlineMethods.map((method) => (
                  <PaymentMethodCard
                    key={method.id}
                    method={method}
                    onToggle={toggleMethod}
                    onConfigure={openConfigDialog}
                    onDelete={deleteCustomMethod}
                    getCategoryBadge={getCategoryBadge}
                    formatFeeDisplay={formatFeeDisplay}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="online" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Metode Pembayaran Online</CardTitle>
              <CardDescription>
                Metode pembayaran digital dan elektronik
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                {onlineMethods.map((method) => (
                  <PaymentMethodCard
                    key={method.id}
                    method={method}
                    onToggle={toggleMethod}
                    onConfigure={openConfigDialog}
                    onDelete={deleteCustomMethod}
                    getCategoryBadge={getCategoryBadge}
                    formatFeeDisplay={formatFeeDisplay}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="foodDelivery" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Food Delivery Partners</CardTitle>
              <CardDescription>
                Metode pembayaran dari platform food delivery
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                {foodDeliveryMethods.map((method) => (
                  <PaymentMethodCard
                    key={method.id}
                    method={method}
                    onToggle={toggleMethod}
                    onConfigure={openConfigDialog}
                    onDelete={deleteCustomMethod}
                    getCategoryBadge={getCategoryBadge}
                    formatFeeDisplay={formatFeeDisplay}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Configuration Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Konfigurasi {selectedMethod?.name}</DialogTitle>
            <DialogDescription>
              Atur detail untuk metode pembayaran ini
            </DialogDescription>
          </DialogHeader>

          {/* Fee Configuration - Always shown for all methods */}
          <div className="space-y-4 py-4 border-b">
            <h3 className="font-semibold text-sm">Pengaturan Biaya Transaksi</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="fee-type">Tipe Biaya</Label>
                <Select value={selectedFeeType} onValueChange={(v: any) => setSelectedFeeType(v)}>
                  <SelectTrigger id="fee-type" data-testid="fee-type-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Persentase (%)</SelectItem>
                    <SelectItem value="flat">Nominal Tetap (Rp)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="fee-amount">
                  {selectedFeeType === 'percentage' ? 'Biaya (%)' : 'Biaya (Rp)'}
                </Label>
                <Input
                  id="fee-amount"
                  type="number"
                  min="0"
                  step={selectedFeeType === 'percentage' ? '0.1' : '100'}
                  placeholder="0"
                  value={selectedFee}
                  onChange={(e) => setSelectedFee(e.target.value)}
                  data-testid="fee-amount-input"
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground bg-blue-50 p-3 rounded-lg">
              💡 {selectedFeeType === 'percentage' 
                ? 'Biaya akan dihitung sebagai persentase dari total transaksi. Contoh: 0.7% dari Rp 100.000 = Rp 700'
                : 'Biaya tetap akan dikenakan untuk setiap transaksi. Contoh: Rp 5.000 per transaksi'
              }
            </p>
          </div>

          {selectedMethod?.id === 'qris-static' && (
            <div className="space-y-4 py-4">
              <h3 className="font-semibold text-sm">Konfigurasi QRIS</h3>
              <div className="space-y-2">
                <Label htmlFor="merchant-name">Nama Merchant</Label>
                <Input
                  id="merchant-name"
                  placeholder="Nama toko/merchant Anda"
                  value={qrisMerchantName}
                  onChange={(e) => setQrisMerchantName(e.target.value)}
                  data-testid="qris-merchant-name-input"
                />
              </div>

              <div className="space-y-2">
                <Label>Gambar QRIS</Label>
                <div className="border-2 border-dashed rounded-lg p-6 text-center">
                  {qrisImage ? (
                    <div className="space-y-4">
                      <img 
                        src={qrisImage} 
                        alt="QRIS Preview" 
                        className="max-w-xs mx-auto rounded-lg shadow-lg"
                      />
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          setQrisImage('');
                          setQrisImageFile(null);
                        }}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Hapus Gambar
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <ImageIcon className="h-12 w-12 mx-auto text-gray-400" />
                      <div className="text-sm text-gray-600">
                        <label htmlFor="qris-upload" className="cursor-pointer">
                          <span className="text-blue-600 hover:text-blue-500">
                            Upload gambar QRIS
                          </span>
                          <span> atau drag and drop</span>
                        </label>
                        <input
                          id="qris-upload"
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleImageUpload}
                          data-testid="qris-image-upload"
                        />
                      </div>
                      <p className="text-xs text-gray-500">
                        PNG, JPG, JPEG (Maks. 5MB)
                      </p>
                    </div>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Gambar ini akan ditampilkan di kiosk saat pelanggan memilih QRIS
                </p>
              </div>
            </div>
          )}

          {selectedMethod?.id === 'bank-transfer' && (
            <div className="space-y-4 py-4">
              <h3 className="font-semibold text-sm">Konfigurasi Transfer Bank</h3>
              <div className="space-y-2">
                <Label htmlFor="bank-name">Nama Bank</Label>
                <Input
                  id="bank-name"
                  placeholder="Contoh: BCA, Mandiri, BRI"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  data-testid="bank-name-input"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="account-number">Nomor Rekening</Label>
                <Input
                  id="account-number"
                  placeholder="1234567890"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  data-testid="account-number-input"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="account-name">Nama Pemilik Rekening</Label>
                <Input
                  id="account-name"
                  placeholder="Nama sesuai rekening bank"
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  data-testid="account-name-input"
                />
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>Info:</strong> Informasi ini akan ditampilkan kepada pelanggan
                  saat mereka memilih metode transfer bank
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Batal
            </Button>
            <Button onClick={saveMethodConfig} className="gap-2" data-testid="save-config-button">
              <Save className="h-4 w-4" />
              Simpan Konfigurasi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Payment Method Card Component
function PaymentMethodCard({ 
  method, 
  onToggle, 
  onConfigure, 
  onDelete,
  getCategoryBadge,
  formatFeeDisplay
}: {
  method: PaymentMethodConfig;
  onToggle: (id: string) => void;
  onConfigure: (method: PaymentMethodConfig) => void;
  onDelete: (id: string) => void;
  getCategoryBadge: (category: string) => React.ReactNode;
  formatFeeDisplay: (fee: number | undefined, feeType: 'percentage' | 'flat' | undefined) => string | null;
}) {
  const Icon = method.icon;
  const needsConfiguration = (method.id === 'qris-static' || method.id === 'bank-transfer');
  const isConfigured = method.config && (
    (method.id === 'qris-static' && method.config.qrisImage) ||
    (method.id === 'bank-transfer' && method.config.bankName)
  );

  return (
    <div 
      className="border rounded-lg p-4 space-y-3 hover:shadow-md transition-shadow"
      data-testid={`payment-method-${method.id}`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3 flex-1">
          <div className={`${method.color} p-2.5 rounded-lg text-white`}>
            <Icon className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold">{method.name}</h3>
              {!method.isDefault && (
                <Badge variant="outline" className="text-xs">Custom</Badge>
              )}
            </div>
            <div className="flex items-center gap-2 mb-2">
              {getCategoryBadge(method.category)}
              {formatFeeDisplay(method.fee, method.feeType) && (
                <Badge variant="secondary" className="text-xs">
                  Fee: {formatFeeDisplay(method.fee, method.feeType)}
                </Badge>
              )}
            </div>
            {needsConfiguration && (
              <div className="mt-2">
                {isConfigured ? (
                  <Badge variant="default" className="bg-green-500 text-xs">
                    ✓ Terkonfigurasi
                  </Badge>
                ) : (
                  <Badge variant="destructive" className="text-xs">
                    ! Perlu Konfigurasi
                  </Badge>
                )}
              </div>
            )}
          </div>
        </div>
        <Switch
          checked={method.enabled}
          onCheckedChange={() => onToggle(method.id)}
          data-testid={`toggle-${method.id}`}
        />
      </div>

      <div className="flex gap-2 pt-2 border-t">
        <Button
          variant="outline"
          size="sm"
          className="flex-1 gap-2"
          onClick={() => onConfigure(method)}
          data-testid={`configure-${method.id}`}
        >
          <Settings className="h-4 w-4" />
          {needsConfiguration ? 'Konfigurasi' : 'Atur Fee'}
        </Button>
        {!method.isDefault && (
          <Button
            variant="outline"
            size="sm"
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
            onClick={() => onDelete(method.id)}
            data-testid={`delete-${method.id}`}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
