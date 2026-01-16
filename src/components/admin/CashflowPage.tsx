import { useState, useMemo, useEffect } from 'react';
import { 
  useGetExpenses, useGetCashflowSummary, useAddExpense, useUpdateExpense, useDeleteExpense, 
  useListAllTransactions, useListOutlets, useGetCashflowCategories, useAddCashflowCategory, useDeleteCashflowCategory
} from '../../hooks/useQueries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { DollarSign, TrendingUp, TrendingDown, Plus, Edit, Trash2, Calendar, Building2, Filter, Image as ImageIcon, FolderPlus, X, Receipt } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { ImageUpload } from '../ImageUpload';
import { api } from '@/services/api';

type TimeFilter = 'daily' | 'weekly' | 'monthly';
type TransactionType = 'income' | 'expense';

interface CashflowCategory {
  id: string;
  name: string;
  type: string;
  description?: string;
}

interface ItemizedProduct {
  id: string;
  product: string;
  price: string;
}

interface PaymentMethodConfig {
  id: string;
  name: string;
  enabled: boolean;
  category: string;
  subCategory?: string;
}

export default function CashflowPageEnhanced() {
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('daily');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<any>(null);
  const [deleteExpenseId, setDeleteExpenseId] = useState<string | null>(null);
  const [transactionFilter, setTransactionFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [selectedOutletFilter, setSelectedOutletFilter] = useState<string>('all');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>('all');
  
  // Payment methods from settings
  const [enabledPaymentMethods, setEnabledPaymentMethods] = useState<PaymentMethodConfig[]>([]);
  
  // Category Management
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryType, setNewCategoryType] = useState<TransactionType>('expense');
  const [deleteCategoryId, setDeleteCategoryId] = useState<string | null>(null);

  // Form state for manual entries
  const [title, setTitle] = useState('');
  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [outletId, setOutletId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [viewingImage, setViewingImage] = useState<string | null>(null);
  const [viewingReceipt, setViewingReceipt] = useState<ItemizedProduct[] | null>(null);
  const [viewingReceiptNote, setViewingReceiptNote] = useState<string>('');
  const [viewingReceiptTitle, setViewingReceiptTitle] = useState<string>('');
  
  // Date and time inputs
  const [transactionDate, setTransactionDate] = useState('');
  const [transactionTime, setTransactionTime] = useState('');
  
  // Itemized products
  const [itemizedProducts, setItemizedProducts] = useState<ItemizedProduct[]>([]);
  
  // Payment method selection
  const [isCustomPaymentMethod, setIsCustomPaymentMethod] = useState(false);

  const { data: expenses, isLoading: expensesLoading } = useGetExpenses();
  const { data: transactions, isLoading: transactionsLoading } = useListAllTransactions();
  const { data: outlets, isLoading: outletsLoading } = useListOutlets();
  const { data: cashflowCategories, isLoading: categoriesLoading } = useGetCashflowCategories();
  
  // Get cashflow summary based on time filter and outlet
  const { data: cashflowSummary, isLoading: summaryLoading } = useGetCashflowSummary(
    timeFilter, 
    selectedOutletFilter !== 'all' ? selectedOutletFilter : undefined
  );

  const addExpenseMutation = useAddExpense();
  const updateExpenseMutation = useUpdateExpense();
  const deleteExpenseMutation = useDeleteExpense();
  const addCategoryMutation = useAddCashflowCategory();
  const deleteCategoryMutation = useDeleteCashflowCategory();

  // Load enabled payment methods from PaymentSettingsPage
  useEffect(() => {
    const loadPaymentMethods = async () => {
      try {
        const response = await api.paymentMethods.getAll();
        const enabledMethods = response.filter((m: any) => m.enabled);
        setEnabledPaymentMethods(enabledMethods);
      } catch (error) {
        console.error('Failed to load payment methods:', error);
        // Fallback to localStorage
        try {
          const saved = localStorage.getItem('payment_methods_config');
          if (saved) {
            const parsed = JSON.parse(saved);
            const enabledMethods = parsed.filter((m: any) => m.enabled);
            setEnabledPaymentMethods(enabledMethods);
          }
        } catch (e) {
          console.error('Failed to load from localStorage:', e);
        }
      }
    };
    
    loadPaymentMethods();
  }, []);

  // Auto-calculate amount from itemized products
  useEffect(() => {
    if (itemizedProducts.length > 0) {
      const total = itemizedProducts.reduce((sum, item) => {
        return sum + (Number(item.price) || 0);
      }, 0);
      
      // Only auto-fill if amount is empty or zero
      if (!amount || amount === '0' || amount === '') {
        setAmount(total.toString());
      }
    }
  }, [itemizedProducts]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(Number(amount));
  };

  const formatDate = (timestamp: any) => {
    let date: Date;
    if (typeof timestamp === 'bigint') {
      date = new Date(Number(timestamp) / 1_000_000);
    } else if (typeof timestamp === 'number') {
      if (timestamp > 1e15) {
        date = new Date(timestamp / 1_000_000);
      } else if (timestamp > 1e12) {
        date = new Date(timestamp / 1000);
      } else if (timestamp > 1e10) {
        date = new Date(timestamp);
      } else {
        date = new Date(timestamp * 1000);
      }
    } else if (typeof timestamp === 'string') {
      date = new Date(timestamp);
    } else {
      date = new Date();
    }
    
    return new Intl.DateTimeFormat('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  // Default categories
  const defaultCategories = [
    'Operasional', 'Inventori', 'Gaji', 'Pemasaran', 'Investasi', 'Lainnya'
  ];

  // Predefined payment methods
  const predefinedPaymentMethods = [
    'Cash',
    'Transfer Bank',
    'E-wallet',
    'QRIS',
    'Kartu Kredit',
    'Kartu Debit',
    'GoPay',
    'OVO',
    'Dana',
    'ShopeePay',
    'LinkAja'
  ];

  // Get available payment methods (enabled from settings + predefined as fallback)
  const availablePaymentMethodsForInput = useMemo(() => {
    if (enabledPaymentMethods.length > 0) {
      return enabledPaymentMethods.map(m => m.name);
    }
    // Fallback to predefined if no methods enabled
    return predefinedPaymentMethods;
  }, [enabledPaymentMethods]);

  // Merge default and custom categories
  const allCategories = useMemo(() => {
    const custom = cashflowCategories?.map((c: CashflowCategory) => c.name) || [];
    return [...defaultCategories, ...custom];
  }, [cashflowCategories]);

  // Filter categories by type
  const filteredCategories = useMemo(() => {
    if (!cashflowCategories) return defaultCategories;
    
    const customForType = cashflowCategories
      .filter((c: CashflowCategory) => c.type === type)
      .map((c: CashflowCategory) => c.name);
    
    return [...defaultCategories, ...customForType];
  }, [cashflowCategories, type]);

  // Helper functions for itemized products
  const addItemizedProduct = () => {
    setItemizedProducts([...itemizedProducts, { id: Date.now().toString(), product: '', price: '' }]);
  };

  const removeItemizedProduct = (id: string) => {
    setItemizedProducts(itemizedProducts.filter(item => item.id !== id));
  };

  const updateItemizedProduct = (id: string, field: 'product' | 'price', value: string) => {
    setItemizedProducts(itemizedProducts.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  // Initialize date/time to current on dialog open
  const initializeDateTimeToNow = () => {
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD
    const timeStr = now.toTimeString().slice(0, 5); // HH:mm
    setTransactionDate(dateStr);
    setTransactionTime(timeStr);
  };

  const handleAddExpense = async () => {
    if (!title || !amount || !category) {
      toast.error('Judul, jumlah, dan kategori wajib diisi');
      return;
    }

    // Parse date and time to timestamp
    let timestamp = Date.now();
    if (transactionDate && transactionTime) {
      const dateTimeStr = `${transactionDate}T${transactionTime}:00`;
      const dateObj = new Date(dateTimeStr);
      timestamp = dateObj.getTime();
      
      console.log('Input date:', transactionDate, 'Input time:', transactionTime);
      console.log('Parsed timestamp:', timestamp, 'Date object:', dateObj);
    }

    // Prepare itemized description or regular note
    let finalDescription = '';
    let finalNote = description;
    
    if (itemizedProducts.length > 0) {
      const itemsJson = JSON.stringify(itemizedProducts.filter(item => item.product.trim() !== ''));
      finalDescription = itemsJson;
    }

    try {
      await addExpenseMutation.mutateAsync({
        title,
        type,
        amount: Number(amount),
        category,
        description: finalDescription,
        note: finalNote,
        outletId: outletId || '1',
        paymentMethod: paymentMethod || null,
        imageUrl: imageUrl || null,
        timestamp,
      });
      toast.success(`${type === 'income' ? 'Pemasukan' : 'Pengeluaran'} berhasil ditambahkan`);
      setIsAddDialogOpen(false);
      resetForm();
    } catch (error: any) {
      toast.error(error.message || 'Gagal menambahkan transaksi');
    }
  };

  const handleUpdateExpense = async () => {
    if (!editingExpense || !title || !amount || !category) {
      toast.error('Semua field wajib diisi');
      return;
    }

    // Parse date and time to timestamp
    let timestamp = editingExpense.timestamp || Date.now();
    if (transactionDate && transactionTime) {
      const dateTimeStr = `${transactionDate}T${transactionTime}:00`;
      const dateObj = new Date(dateTimeStr);
      timestamp = dateObj.getTime();
      
      console.log('Update - Input date:', transactionDate, 'Input time:', transactionTime);
      console.log('Update - Parsed timestamp:', timestamp, 'Date object:', dateObj);
    }

    // Prepare itemized description or regular note
    let finalDescription = '';
    let finalNote = description;
    
    if (itemizedProducts.length > 0) {
      const itemsJson = JSON.stringify(itemizedProducts.filter(item => item.product.trim() !== ''));
      finalDescription = itemsJson;
    }

    try {
      await updateExpenseMutation.mutateAsync({
        id: editingExpense.id,
        title,
        type,
        amount: Number(amount),
        category,
        description: finalDescription,
        note: finalNote,
        paymentMethod: paymentMethod || null,
        imageUrl: imageUrl || null,
        timestamp,
      });
      toast.success('Data berhasil diperbarui');
      setEditingExpense(null);
      resetForm();
    } catch (error: any) {
      toast.error(error.message || 'Gagal memperbarui data');
    }
  };

  const handleDeleteExpense = async () => {
    if (!deleteExpenseId) return;

    try {
      await deleteExpenseMutation.mutateAsync(deleteExpenseId);
      toast.success('Data berhasil dihapus');
      setDeleteExpenseId(null);
    } catch (error: any) {
      toast.error(error.message || 'Gagal menghapus data');
    }
  };

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) {
      toast.error('Nama kategori wajib diisi');
      return;
    }

    try {
      await addCategoryMutation.mutateAsync({
        name: newCategoryName,
        type: newCategoryType,
        description: '',
      });
      toast.success('Kategori berhasil ditambahkan');
      setNewCategoryName('');
      setNewCategoryType('expense');
    } catch (error: any) {
      toast.error(error.message || 'Gagal menambahkan kategori');
    }
  };

  const handleDeleteCategory = async () => {
    if (!deleteCategoryId) return;

    try {
      await deleteCategoryMutation.mutateAsync(deleteCategoryId);
      toast.success('Kategori berhasil dihapus');
      setDeleteCategoryId(null);
    } catch (error: any) {
      toast.error(error.message || 'Gagal menghapus kategori');
    }
  };

  const resetForm = () => {
    setTitle('');
    setType('expense');
    setAmount('');
    setCategory('');
    setDescription('');
    setOutletId('');
    setPaymentMethod('');
    setImageUrl('');
    setTransactionDate('');
    setTransactionTime('');
    setItemizedProducts([]);
    setIsCustomPaymentMethod(false);
  };

  const openEditDialog = (expense: any) => {
    setEditingExpense(expense);
    setTitle(expense.title || '');
    setType(expense.type || 'expense');
    setAmount(String(expense.amount || 0));
    setCategory(expense.category || '');
    
    // Parse itemized description if exists
    const desc = expense.description || '';
    const note = expense.note || '';
    
    try {
      const parsed = JSON.parse(desc);
      if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].product !== undefined) {
        setItemizedProducts(parsed);
        setDescription(note); // Use note field for catatan tambahan
      } else {
        setDescription(desc || note);
        setItemizedProducts([]);
      }
    } catch (e) {
      setDescription(desc || note);
      setItemizedProducts([]);
    }
    
    setOutletId(expense.outletId ? String(expense.outletId) : '');
    setPaymentMethod(expense.paymentMethod || '');
    setImageUrl(expense.imageUrl || '');
    
    // Set date and time from timestamp
    if (expense.timestamp) {
      const date = new Date(typeof expense.timestamp === 'number' ? expense.timestamp : Date.now());
      setTransactionDate(date.toISOString().split('T')[0]);
      setTransactionTime(date.toTimeString().slice(0, 5));
    } else {
      initializeDateTimeToNow();
    }
    
    // Check if payment method is custom
    setIsCustomPaymentMethod(!availablePaymentMethodsForInput.includes(expense.paymentMethod || ''));
  };

  // Calculate date range based on filter
  const dateRange = useMemo(() => {
    const now = new Date();
    const end = now.getTime();
    let start: number;

    switch (timeFilter) {
      case 'daily':
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        start = startOfDay.getTime();
        break;
      case 'weekly':
        start = now.getTime() - 7 * 24 * 60 * 60 * 1000;
        break;
      case 'monthly':
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        start = startOfMonth.getTime();
        break;
      default:
        start = 0;
    }

    return { start, end };
  }, [timeFilter]);

  // Filter transactions by time range, outlet, and payment method
  const filteredTransactions = useMemo(() => {
    if (!transactions) return [];
    
    let filtered = transactions.filter(t => {
      const tTime = typeof t.timestamp === 'number' ? t.timestamp : 
                    typeof t.timestamp === 'string' ? new Date(t.timestamp).getTime() :
                    t.createdAt ? new Date(t.createdAt).getTime() : Date.now();
      
      return tTime >= dateRange.start && tTime <= dateRange.end;
    });
    
    if (selectedOutletFilter !== 'all') {
      filtered = filtered.filter(t => 
        t.outletId && String(t.outletId) === selectedOutletFilter
      );
    }
    
    if (paymentMethodFilter !== 'all') {
      filtered = filtered.filter(t => {
        if (!t.paymentMethods || !Array.isArray(t.paymentMethods)) return false;
        return t.paymentMethods.some((pm: any) => {
          const methodName = pm.methodName || pm.method || pm.name || '';
          return methodName.toLowerCase().includes(paymentMethodFilter.toLowerCase());
        });
      });
    }
    
    return filtered;
  }, [transactions, dateRange, selectedOutletFilter, paymentMethodFilter]);

  // Filter expenses by time range and outlet
  const filteredExpenses = useMemo(() => {
    if (!expenses) return [];
    
    let filtered = expenses.filter(e => {
      const eTime = typeof e.timestamp === 'number' ? e.timestamp :
                    e.date ? (typeof e.date === 'number' ? e.date : new Date(e.date).getTime()) :
                    Date.now();
      
      return eTime >= dateRange.start && eTime <= dateRange.end;
    });
    
    if (selectedOutletFilter !== 'all') {
      filtered = filtered.filter(e => 
        e.outletId && String(e.outletId) === selectedOutletFilter
      );
    }
    
    return filtered;
  }, [expenses, dateRange, selectedOutletFilter]);

  // Group income by payment method (manual entries only)
  const manualIncomeByPaymentMethod = useMemo(() => {
    const breakdown: Record<string, number> = {};
    
    filteredExpenses
      .filter(e => e.type === 'income')
      .forEach(e => {
        const method = e.paymentMethod || 'Tidak disebutkan';
        breakdown[method] = (breakdown[method] || 0) + Number(e.amount || 0);
      });
    
    return breakdown;
  }, [filteredExpenses]);

  // Group expenses by payment method (manual entries)
  const manualExpensesByPaymentMethod = useMemo(() => {
    const breakdown: Record<string, number> = {};
    
    filteredExpenses
      .filter(e => e.type !== 'income')
      .forEach(e => {
        const method = e.paymentMethod || 'Tidak disebutkan';
        breakdown[method] = (breakdown[method] || 0) + Number(e.amount || 0);
      });
    
    return breakdown;
  }, [filteredExpenses]);

  // Group transactions by outlet and payment method for detailed breakdown
  const incomeByOutletAndPayment = useMemo(() => {
    const breakdown: Record<string, Record<string, number>> = {};
    
    filteredTransactions.forEach(t => {
      const outletKey = t.outletId ? String(t.outletId) : 'unknown';
      if (!breakdown[outletKey]) {
        breakdown[outletKey] = {};
      }
      
      if (t.paymentMethods && Array.isArray(t.paymentMethods)) {
        t.paymentMethods.forEach((pm: any) => {
          const method = pm.methodName || pm.method || pm.name || 'cash';
          const amount = Number(pm.amount || 0);
          breakdown[outletKey][method] = (breakdown[outletKey][method] || 0) + amount;
        });
      } else {
        breakdown[outletKey]['cash'] = (breakdown[outletKey]['cash'] || 0) + Number(t.total || 0);
      }
    });
    
    return breakdown;
  }, [filteredTransactions]);

  // Combine transactions and expenses for display
  const allCashflowItems = useMemo(() => {
    const items: Array<{
      id: string;
      type: 'income' | 'expense';
      amount: number;
      description: string;
      category: string;
      timestamp: number;
      outletId?: string;
      paymentMethod?: string;
      imageUrl?: string;
      data?: any;
    }> = [];

    // Add income from transactions
    filteredTransactions.forEach(t => {
      const tTime = typeof t.timestamp === 'number' ? t.timestamp :
                    t.createdAt ? new Date(t.createdAt).getTime() : Date.now();
      
      const primaryPayment = t.paymentMethods && t.paymentMethods.length > 0 
        ? t.paymentMethods[0] 
        : null;
      const paymentMethod = primaryPayment 
        ? (primaryPayment.methodName || primaryPayment.method || primaryPayment.name || 'Cash')
        : 'Cash';
      
      items.push({
        id: `transaction-${t.id}`,
        type: 'income',
        amount: Number(t.total || 0),
        description: `Transaksi #${t.id}${t.items && t.items.length ? ` - ${t.items.length} item` : ''}`,
        category: 'Penjualan',
        timestamp: tTime,
        outletId: t.outletId,
        paymentMethod,
        data: t,
      });
    });

    // Add manual entries (expenses and income)
    filteredExpenses.forEach(e => {
      const eTime = typeof e.timestamp === 'number' ? e.timestamp :
                    e.date ? (typeof e.date === 'number' ? e.date : new Date(e.date).getTime()) :
                    Date.now();
      
      items.push({
        id: `expense-${e.id}`,
        type: e.type === 'income' ? 'income' : 'expense',
        amount: Number(e.amount || 0),
        description: e.title || e.description || 'Transaksi Manual',
        category: e.category || 'Lainnya',
        timestamp: eTime,
        outletId: e.outletId,
        paymentMethod: e.paymentMethod,
        imageUrl: e.imageUrl,
        data: e,
      });
    });

    return items.sort((a, b) => b.timestamp - a.timestamp);
  }, [filteredTransactions, filteredExpenses]);

  const displayedItems = useMemo(() => {
    if (transactionFilter === 'all') return allCashflowItems;
    return allCashflowItems.filter(item => item.type === transactionFilter);
  }, [allCashflowItems, transactionFilter]);

  // Calculate filtered summary
  const filteredSummary = useMemo(() => {
    const totalIncome = filteredTransactions.reduce((sum, t) => sum + Number(t.total || 0), 0);
    const manualIncome = filteredExpenses
      .filter(e => e.type === 'income')
      .reduce((sum, e) => sum + Number(e.amount || 0), 0);
    const totalExpenses = filteredExpenses
      .filter(e => e.type !== 'income')
      .reduce((sum, e) => sum + Number(e.amount || 0), 0);
    
    const totalIncomeAll = totalIncome + manualIncome;
    const balance = totalIncomeAll - totalExpenses;
    
    return { 
      totalIncome: totalIncomeAll, 
      totalExpenses, 
      balance,
      autoIncome: totalIncome,
      manualIncome
    };
  }, [filteredTransactions, filteredExpenses]);

  const getTimeFilterLabel = () => {
    switch (timeFilter) {
      case 'daily': return 'Hari Ini';
      case 'weekly': return '7 Hari Terakhir';
      case 'monthly': return 'Bulan Ini';
      default: return '';
    }
  };

  const balanceColor = filteredSummary.balance >= 0 ? 'text-green-600' : 'text-red-600';

  // Get unique payment methods from transactions
  const availablePaymentMethods = useMemo(() => {
    const methods = new Set<string>();
    filteredTransactions.forEach(t => {
      if (t.paymentMethods && Array.isArray(t.paymentMethods)) {
        t.paymentMethods.forEach((pm: any) => {
          const method = pm.methodName || pm.method || pm.name || 'cash';
          methods.add(method);
        });
      }
    });
    return Array.from(methods);
  }, [filteredTransactions]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Arus Kas</h1>
          <p className="text-muted-foreground">Kelola pemasukan dan pengeluaran bisnis Anda</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <FolderPlus className="mr-2 h-4 w-4" />
                Kelola Kategori
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Kelola Kategori Arus Kas</DialogTitle>
                <DialogDescription>
                  Tambah atau hapus kategori custom untuk transaksi manual
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                {/* Add New Category */}
                <div className="flex gap-2">
                  <Input
                    placeholder="Nama kategori baru..."
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    className="flex-1"
                  />
                  <Select value={newCategoryType} onValueChange={(v) => setNewCategoryType(v as TransactionType)}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="income">Pemasukan</SelectItem>
                      <SelectItem value="expense">Pengeluaran</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button onClick={handleAddCategory} disabled={addCategoryMutation.isPending}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                {/* Default Categories */}
                <div>
                  <h4 className="text-sm font-semibold mb-2">Kategori Default</h4>
                  <div className="flex flex-wrap gap-2">
                    {defaultCategories.map((cat) => (
                      <Badge key={cat} variant="secondary">
                        {cat}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Custom Categories */}
                {cashflowCategories && cashflowCategories.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold mb-2">Kategori Custom</h4>
                    <div className="space-y-2">
                      {cashflowCategories.map((cat: CashflowCategory) => (
                        <div key={cat.id} className="flex items-center justify-between p-2 border rounded">
                          <div className="flex items-center gap-2">
                            <Badge variant={cat.type === 'income' ? 'default' : 'destructive'}>
                              {cat.name}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              ({cat.type === 'income' ? 'Pemasukan' : 'Pengeluaran'})
                            </span>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteCategoryId(cat.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
            setIsAddDialogOpen(open);
            if (open) {
              resetForm();
              setEditingExpense(null);
              initializeDateTimeToNow();
            }
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Tambah Transaksi Manual
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Tambah Transaksi Manual</DialogTitle>
                <DialogDescription>Catat pemasukan atau pengeluaran manual dengan detail lengkap</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                {/* Date and Time Inputs */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="transaction-date">Tanggal *</Label>
                    <Input
                      id="transaction-date"
                      type="date"
                      value={transactionDate}
                      onChange={(e) => setTransactionDate(e.target.value)}
                      data-testid="transaction-date-input"
                    />
                  </div>
                  <div>
                    <Label htmlFor="transaction-time">Jam *</Label>
                    <Input
                      id="transaction-time"
                      type="time"
                      value={transactionTime}
                      onChange={(e) => setTransactionTime(e.target.value)}
                      data-testid="transaction-time-input"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="title">Judul *</Label>
                    <Input
                      id="title"
                      placeholder="Contoh: Pembelian Bahan Baku"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      data-testid="title-input"
                    />
                  </div>
                  <div>
                    <Label htmlFor="type">Tipe *</Label>
                    <Select value={type} onValueChange={(v) => {
                      setType(v as TransactionType);
                      setCategory(''); // Reset category when type changes
                    }}>
                      <SelectTrigger data-testid="type-select">
                        <SelectValue placeholder="Pilih tipe" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="income">Pemasukan</SelectItem>
                        <SelectItem value="expense">Pengeluaran</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="amount">Jumlah (Rp) *</Label>
                    <Input
                      id="amount"
                      type="number"
                      placeholder="0"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      data-testid="amount-input"
                    />
                  </div>
                  <div>
                    <Label htmlFor="category">Kategori *</Label>
                    <Select value={category} onValueChange={setCategory}>
                      <SelectTrigger data-testid="category-select">
                        <SelectValue placeholder="Pilih kategori" />
                      </SelectTrigger>
                      <SelectContent>
                        {filteredCategories.map((cat) => (
                          <SelectItem key={cat} value={cat}>
                            {cat}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Payment Method - Dropdown + Manual */}
                <div>
                  <Label htmlFor="paymentMethod">Metode Pembayaran</Label>
                  {enabledPaymentMethods.length === 0 ? (
                    <p className="text-sm text-yellow-600 bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                      ⚠️ Tidak ada metode pembayaran yang diaktifkan di Pengaturan Pembayaran. Menggunakan daftar default.
                    </p>
                  ) : null}
                  <div className="flex gap-2">
                    {!isCustomPaymentMethod ? (
                      <>
                        <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                          <SelectTrigger className="flex-1" data-testid="payment-method-select">
                            <SelectValue placeholder="Pilih metode pembayaran" />
                          </SelectTrigger>
                          <SelectContent>
                            {availablePaymentMethodsForInput.map((method) => (
                              <SelectItem key={method} value={method}>
                                {method}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={() => {
                            setIsCustomPaymentMethod(true);
                            setPaymentMethod('');
                          }}
                          data-testid="custom-payment-toggle"
                        >
                          Manual
                        </Button>
                      </>
                    ) : (
                      <>
                        <Input
                          id="paymentMethod"
                          placeholder="Ketik metode pembayaran..."
                          value={paymentMethod}
                          onChange={(e) => setPaymentMethod(e.target.value)}
                          className="flex-1"
                          data-testid="payment-method-input"
                        />
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={() => {
                            setIsCustomPaymentMethod(false);
                            setPaymentMethod('');
                          }}
                        >
                          Dropdown
                        </Button>
                      </>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Pilih dari dropdown atau input manual
                  </p>
                </div>

                {/* Itemized Products Section */}
                <div className="border rounded-lg p-4 bg-muted/30">
                  <div className="flex items-center justify-between mb-3">
                    <Label className="text-base font-semibold">Deskripsi Itemisasi (Opsional)</Label>
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm" 
                      onClick={addItemizedProduct}
                      data-testid="add-item-button"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Tambah Item
                    </Button>
                  </div>
                  
                  {itemizedProducts.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Belum ada item. Klik "Tambah Item" untuk menambahkan produk dengan harga.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {itemizedProducts.map((item, index) => (
                        <div key={item.id} className="flex gap-2 items-start">
                          <div className="flex-1">
                            <Input
                              placeholder="Nama produk..."
                              value={item.product}
                              onChange={(e) => updateItemizedProduct(item.id, 'product', e.target.value)}
                              data-testid={`item-product-${index}`}
                            />
                          </div>
                          <div className="w-32">
                            <Input
                              type="number"
                              placeholder="Harga"
                              value={item.price}
                              onChange={(e) => updateItemizedProduct(item.id, 'price', e.target.value)}
                              data-testid={`item-price-${index}`}
                            />
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeItemizedProduct(item.id)}
                            data-testid={`remove-item-${index}`}
                          >
                            <X className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      ))}
                      <div className="pt-2 border-t mt-3">
                        <div className="flex justify-between items-center text-sm font-semibold">
                          <span>Total Item:</span>
                          <span>
                            {formatCurrency(
                              itemizedProducts.reduce((sum, item) => sum + (Number(item.price) || 0), 0)
                            )}
                          </span>
                        </div>
                        <p className="text-xs text-blue-600 mt-2">
                          💡 Total ini akan otomatis mengisi field "Jumlah (Rp)" di atas
                        </p>
                      </div>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground mt-2">
                    Itemisasi akan ditampilkan sebagai nota di detail transaksi
                  </p>
                </div>

                {/* Regular Description */}
                <div>
                  <Label htmlFor="description">Catatan Tambahan</Label>
                  <Textarea
                    id="description"
                    placeholder="Deskripsi atau catatan tambahan..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={2}
                    data-testid="description-input"
                  />
                </div>

                {outlets && outlets.length > 1 && (
                  <div>
                    <Label htmlFor="outlet">Outlet</Label>
                    <Select value={outletId} onValueChange={setOutletId}>
                      <SelectTrigger data-testid="outlet-select">
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

                <div>
                  <ImageUpload
                    label="Foto Bukti (Opsional)"
                    value={imageUrl}
                    onChange={setImageUrl}
                    onClear={() => setImageUrl('')}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Upload foto struk, nota, atau bukti transaksi
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Batal
                </Button>
                <Button onClick={handleAddExpense} disabled={addExpenseMutation.isPending} data-testid="submit-transaction">
                  {addExpenseMutation.isPending ? 'Menyimpan...' : 'Simpan'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filter & Periode
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <Tabs value={timeFilter} onValueChange={(v) => setTimeFilter(v as TimeFilter)}>
                <TabsList>
                  <TabsTrigger value="daily">Harian</TabsTrigger>
                  <TabsTrigger value="weekly">Mingguan</TabsTrigger>
                  <TabsTrigger value="monthly">Bulanan</TabsTrigger>
                </TabsList>
              </Tabs>
              <span className="text-sm text-muted-foreground ml-2">{getTimeFilterLabel()}</span>
            </div>

            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <Select value={selectedOutletFilter} onValueChange={setSelectedOutletFilter}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Pilih outlet" />
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

            {availablePaymentMethods.length > 0 && (
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <Select value={paymentMethodFilter} onValueChange={setPaymentMethodFilter}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Metode Pembayaran" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Metode</SelectItem>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="online">Online</SelectItem>
                    {availablePaymentMethods.map((method) => (
                      <SelectItem key={method} value={method}>
                        {method}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pemasukan</CardTitle>
            <TrendingUp className="h-5 w-5 text-green-600" />
          </CardHeader>
          <CardContent>
            {summaryLoading ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <div className="space-y-2">
                <p className="text-3xl font-bold text-green-600">
                  {formatCurrency(filteredSummary.totalIncome)}
                </p>
                <div className="text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Penjualan Otomatis:</span>
                    <span className="font-medium">{formatCurrency(filteredSummary.autoIncome)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Pemasukan Manual:</span>
                    <span className="font-medium">{formatCurrency(filteredSummary.manualIncome)}</span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pengeluaran</CardTitle>
            <TrendingDown className="h-5 w-5 text-red-600" />
          </CardHeader>
          <CardContent>
            {summaryLoading ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <div className="space-y-2">
                <p className="text-3xl font-bold text-red-600">
                  {formatCurrency(filteredSummary.totalExpenses)}
                </p>
                <p className="text-xs text-muted-foreground">Pengeluaran manual</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldo Bersih</CardTitle>
            <DollarSign className="h-5 w-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            {summaryLoading ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <div className="space-y-2">
                <p className={`text-3xl font-bold ${balanceColor}`}>
                  {formatCurrency(filteredSummary.balance)}
                </p>
                <div className="flex items-center gap-2">
                  <Badge variant={filteredSummary.balance >= 0 ? 'default' : 'destructive'}>
                    {filteredSummary.balance >= 0 ? 'Surplus' : 'Defisit'}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {filteredSummary.balance >= 0 ? '✓ Sehat' : '⚠ Perlu Perhatian'}
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Manual Income by Payment Method */}
      {Object.keys(manualIncomeByPaymentMethod).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Pemasukan Manual per Metode Pembayaran</CardTitle>
            <CardDescription>Breakdown pemasukan manual berdasarkan metode pembayaran</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {Object.entries(manualIncomeByPaymentMethod).map(([method, total]) => (
                <div key={method} className="flex flex-col p-3 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
                  <span className="text-sm font-medium text-green-700 dark:text-green-300 capitalize">
                    {method}
                  </span>
                  <span className="text-lg font-bold text-green-600 dark:text-green-400 mt-1">
                    {formatCurrency(total)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Manual Expenses by Payment Method */}
      {Object.keys(manualExpensesByPaymentMethod).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Pengeluaran Manual per Metode Pembayaran</CardTitle>
            <CardDescription>Breakdown pengeluaran manual berdasarkan metode pembayaran</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {Object.entries(manualExpensesByPaymentMethod).map(([method, total]) => (
                <div key={method} className="flex flex-col p-3 bg-red-50 dark:bg-red-950 rounded-lg border border-red-200 dark:border-red-800">
                  <span className="text-sm font-medium text-red-700 dark:text-red-300 capitalize">
                    {method}
                  </span>
                  <span className="text-lg font-bold text-red-600 dark:text-red-400 mt-1">
                    {formatCurrency(total)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Income Breakdown by Outlet and Payment Method (Auto) */}
      {Object.keys(incomeByOutletAndPayment).length > 0 && selectedOutletFilter === 'all' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Penjualan Otomatis per Outlet & Metode Pembayaran</CardTitle>
            <CardDescription>Breakdown penjualan dari transaksi POS</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(incomeByOutletAndPayment).map(([outletKey, methods]) => {
                const outlet = outlets?.find(o => o.id === outletKey);
                const outletName = outlet?.name || `Outlet ${outletKey}`;
                
                return (
                  <div key={outletKey} className="border rounded-lg p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950">
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      {outletName}
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {Object.entries(methods).map(([method, total]) => (
                        <div key={method} className="flex items-center justify-between p-2 bg-white dark:bg-gray-900 rounded border">
                          <span className="text-sm font-medium capitalize">{method}</span>
                          <span className="text-sm text-green-600 font-semibold">
                            {formatCurrency(total)}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 pt-3 border-t flex justify-between items-center">
                      <span className="font-semibold">Total</span>
                      <span className="font-bold text-lg text-green-600">
                        {formatCurrency(Object.values(methods).reduce((sum, val) => sum + val, 0))}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Receipt className="h-5 w-5" />
                Riwayat Transaksi
              </CardTitle>
              <CardDescription>Daftar lengkap pemasukan dan pengeluaran</CardDescription>
            </div>
            <Tabs value={transactionFilter} onValueChange={(v) => setTransactionFilter(v as any)}>
              <TabsList>
                <TabsTrigger value="all">Semua</TabsTrigger>
                <TabsTrigger value="income">Pemasukan</TabsTrigger>
                <TabsTrigger value="expense">Pengeluaran</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent>
          {expensesLoading || transactionsLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map(i => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : displayedItems.length === 0 ? (
            <div className="text-center py-12">
              <Receipt className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-medium text-muted-foreground">
                Belum ada transaksi untuk periode ini
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">Bukti</TableHead>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>Deskripsi</TableHead>
                    <TableHead>Kategori</TableHead>
                    <TableHead>Metode</TableHead>
                    <TableHead>Jenis</TableHead>
                    <TableHead className="text-right">Jumlah</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayedItems.map((item) => (
                    <TableRow key={item.id} className="hover:bg-muted/50">
                      <TableCell>
                        {item.imageUrl ? (
                          <button
                            onClick={() => setViewingImage(item.imageUrl!)}
                            className="p-1 hover:bg-muted rounded transition-colors"
                            title="Lihat bukti"
                            data-testid={`view-receipt-${item.id}`}
                          >
                            <ImageIcon className="h-5 w-5 text-blue-600" />
                          </button>
                        ) : (
                          <div className="w-5 h-10" />
                        )}
                      </TableCell>
                      <TableCell className="text-sm whitespace-nowrap">
                        {formatDate(item.timestamp)}
                      </TableCell>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <span>{item.description}</span>
                          {item.data?.description && (() => {
                            try {
                              const parsed = JSON.parse(item.data.description);
                              if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].product) {
                                return (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 px-2"
                                    onClick={() => {
                                      setViewingReceipt(parsed);
                                      setViewingReceiptNote(item.data.note || '');
                                      setViewingReceiptTitle(item.data.title || item.description);
                                    }}
                                    data-testid={`view-itemized-${item.id}`}
                                  >
                                    <Receipt className="h-3 w-3 mr-1" />
                                    Nota
                                  </Button>
                                );
                              }
                            } catch (e) {}
                            return null;
                          })()}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{item.category}</Badge>
                      </TableCell>
                      <TableCell>
                        {item.paymentMethod ? (
                          <Badge variant="secondary" className="capitalize">
                            {item.paymentMethod}
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={item.type === 'income' ? 'default' : 'destructive'}>
                          {item.type === 'income' ? 'Pemasukan' : 'Pengeluaran'}
                        </Badge>
                      </TableCell>
                      <TableCell className={`text-right font-semibold whitespace-nowrap ${item.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                        {item.type === 'income' ? '+' : '-'} {formatCurrency(item.amount)}
                      </TableCell>
                      <TableCell className="text-right">
                        {item.id.startsWith('expense-') && (
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openEditDialog(item.data)}
                              data-testid={`edit-transaction-${item.id}`}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setDeleteExpenseId(item.data.id)}
                              data-testid={`delete-transaction-${item.id}`}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={!!editingExpense} onOpenChange={(open) => !open && setEditingExpense(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Transaksi</DialogTitle>
            <DialogDescription>Perbarui informasi transaksi</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* Date and Time Inputs */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-transaction-date">Tanggal *</Label>
                <Input
                  id="edit-transaction-date"
                  type="date"
                  value={transactionDate}
                  onChange={(e) => setTransactionDate(e.target.value)}
                  data-testid="edit-transaction-date-input"
                />
              </div>
              <div>
                <Label htmlFor="edit-transaction-time">Jam *</Label>
                <Input
                  id="edit-transaction-time"
                  type="time"
                  value={transactionTime}
                  onChange={(e) => setTransactionTime(e.target.value)}
                  data-testid="edit-transaction-time-input"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-title">Judul *</Label>
                <Input
                  id="edit-title"
                  placeholder="Judul transaksi"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  data-testid="edit-title-input"
                />
              </div>
              <div>
                <Label htmlFor="edit-type">Tipe *</Label>
                <Select value={type} onValueChange={(v) => {
                  setType(v as TransactionType);
                  setCategory('');
                }}>
                  <SelectTrigger data-testid="edit-type-select">
                    <SelectValue placeholder="Pilih tipe" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="income">Pemasukan</SelectItem>
                    <SelectItem value="expense">Pengeluaran</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-amount">Jumlah (Rp) *</Label>
                <Input
                  id="edit-amount"
                  type="number"
                  placeholder="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  data-testid="edit-amount-input"
                />
              </div>
              <div>
                <Label htmlFor="edit-category">Kategori *</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger data-testid="edit-category-select">
                    <SelectValue placeholder="Pilih kategori" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredCategories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Payment Method - Dropdown + Manual */}
            <div>
              <Label htmlFor="edit-paymentMethod">Metode Pembayaran</Label>
              <div className="flex gap-2">
                {!isCustomPaymentMethod ? (
                  <>
                    <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                      <SelectTrigger className="flex-1" data-testid="edit-payment-method-select">
                        <SelectValue placeholder="Pilih metode pembayaran" />
                      </SelectTrigger>
                      <SelectContent>
                        {availablePaymentMethodsForInput.map((method) => (
                          <SelectItem key={method} value={method}>
                            {method}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => {
                        setIsCustomPaymentMethod(true);
                        setPaymentMethod('');
                      }}
                    >
                      Manual
                    </Button>
                  </>
                ) : (
                  <>
                    <Input
                      id="edit-paymentMethod"
                      placeholder="Ketik metode pembayaran..."
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="flex-1"
                      data-testid="edit-payment-method-input"
                    />
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => {
                        setIsCustomPaymentMethod(false);
                        setPaymentMethod('');
                      }}
                    >
                      Dropdown
                    </Button>
                  </>
                )}
              </div>
            </div>

            {/* Itemized Products Section */}
            <div className="border rounded-lg p-4 bg-muted/30">
              <div className="flex items-center justify-between mb-3">
                <Label className="text-base font-semibold">Deskripsi Itemisasi (Opsional)</Label>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  onClick={addItemizedProduct}
                  data-testid="edit-add-item-button"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Tambah Item
                </Button>
              </div>
              
              {itemizedProducts.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Belum ada item. Klik "Tambah Item" untuk menambahkan produk dengan harga.
                </p>
              ) : (
                <div className="space-y-2">
                  {itemizedProducts.map((item, index) => (
                    <div key={item.id} className="flex gap-2 items-start">
                      <div className="flex-1">
                        <Input
                          placeholder="Nama produk..."
                          value={item.product}
                          onChange={(e) => updateItemizedProduct(item.id, 'product', e.target.value)}
                          data-testid={`edit-item-product-${index}`}
                        />
                      </div>
                      <div className="w-32">
                        <Input
                          type="number"
                          placeholder="Harga"
                          value={item.price}
                          onChange={(e) => updateItemizedProduct(item.id, 'price', e.target.value)}
                          data-testid={`edit-item-price-${index}`}
                        />
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeItemizedProduct(item.id)}
                        data-testid={`edit-remove-item-${index}`}
                      >
                        <X className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                  <div className="pt-2 border-t mt-3">
                    <div className="flex justify-between items-center text-sm font-semibold">
                      <span>Total Item:</span>
                      <span>
                        {formatCurrency(
                          itemizedProducts.reduce((sum, item) => sum + (Number(item.price) || 0), 0)
                        )}
                      </span>
                    </div>
                    <p className="text-xs text-blue-600 mt-2">
                      💡 Total ini akan otomatis mengisi field "Jumlah (Rp)" di atas
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Regular Description */}
            <div>
              <Label htmlFor="edit-description">Catatan Tambahan</Label>
              <Textarea
                id="edit-description"
                placeholder="Deskripsi atau catatan tambahan..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                data-testid="edit-description-input"
              />
            </div>

            <div>
              <ImageUpload
                label="Foto Bukti (Opsional)"
                value={imageUrl}
                onChange={setImageUrl}
                onClear={() => setImageUrl('')}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingExpense(null)}>
              Batal
            </Button>
            <Button onClick={handleUpdateExpense} disabled={updateExpenseMutation.isPending} data-testid="edit-submit-transaction">
              {updateExpenseMutation.isPending ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Expense Confirmation */}
      <AlertDialog open={!!deleteExpenseId} onOpenChange={(open) => !open && setDeleteExpenseId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Transaksi?</AlertDialogTitle>
            <AlertDialogDescription>
              Tindakan ini tidak dapat dibatalkan. Transaksi akan dihapus secara permanen.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteExpense} disabled={deleteExpenseMutation.isPending}>
              {deleteExpenseMutation.isPending ? 'Menghapus...' : 'Hapus'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Category Confirmation */}
      <AlertDialog open={!!deleteCategoryId} onOpenChange={(open) => !open && setDeleteCategoryId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Kategori?</AlertDialogTitle>
            <AlertDialogDescription>
              Kategori akan dihapus secara permanen. Transaksi yang menggunakan kategori ini tidak akan terpengaruh.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteCategory} disabled={deleteCategoryMutation.isPending}>
              {deleteCategoryMutation.isPending ? 'Menghapus...' : 'Hapus'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Image Viewer Dialog */}
      <Dialog open={!!viewingImage} onOpenChange={(open) => !open && setViewingImage(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Bukti Transaksi</DialogTitle>
          </DialogHeader>
          <div className="relative w-full h-[600px] bg-gray-100 dark:bg-gray-900 rounded-lg overflow-hidden">
            {viewingImage && (
              <img
                src={viewingImage}
                alt="Bukti transaksi"
                className="w-full h-full object-contain"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Receipt/Nota Viewer Dialog */}
      <Dialog open={!!viewingReceipt} onOpenChange={(open) => {
        if (!open) {
          setViewingReceipt(null);
          setViewingReceiptNote('');
          setViewingReceiptTitle('');
        }
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              Nota Transaksi
            </DialogTitle>
            <DialogDescription>Detail itemisasi produk dan harga</DialogDescription>
          </DialogHeader>
          <div className="border rounded-lg p-4 bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-950">
            <div className="space-y-1 mb-4 pb-4 border-b-2 border-dashed">
              <h3 className="font-bold text-center text-lg">NOTA TRANSAKSI</h3>
              {viewingReceiptTitle && (
                <p className="text-sm text-center font-semibold">{viewingReceiptTitle}</p>
              )}
              <p className="text-xs text-center text-muted-foreground">
                {new Date().toLocaleDateString('id-ID', { 
                  day: '2-digit', 
                  month: 'long', 
                  year: 'numeric' 
                })}
              </p>
            </div>
            
            <div className="space-y-2 mb-4">
              <div className="flex justify-between font-semibold text-sm pb-2 border-b">
                <span>Item</span>
                <span>Harga</span>
              </div>
              {viewingReceipt?.map((item, index) => (
                <div key={index} className="flex justify-between text-sm py-1">
                  <span className="flex-1">{item.product}</span>
                  <span className="font-medium">{formatCurrency(Number(item.price))}</span>
                </div>
              ))}
            </div>

            {viewingReceiptNote && (
              <div className="mb-4 pb-4 border-t-2 border-dashed pt-4">
                <p className="text-xs font-semibold mb-2 text-muted-foreground">CATATAN TAMBAHAN:</p>
                <p className="text-sm bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded p-3">
                  {viewingReceiptNote}
                </p>
              </div>
            )}
            
            <div className="border-t-2 border-dashed pt-4 space-y-2">
              <div className="flex justify-between text-lg font-bold">
                <span>TOTAL</span>
                <span>
                  {formatCurrency(
                    viewingReceipt?.reduce((sum, item) => sum + Number(item.price), 0) || 0
                  )}
                </span>
              </div>
            </div>
            
            <p className="text-xs text-center text-muted-foreground mt-4">
              Terima kasih atas transaksi Anda
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
