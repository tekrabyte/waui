import React, { useEffect, useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { ProductGrid } from './components/ProductGrid';
import { Cart } from './components/Cart';
import { MobileLayout } from './components/MobileLayout';
import { LoginPage } from './components/LoginPage';
import { Category, Customer, Product, CartItem } from './types';
import { api } from './services/api';
import { Toaster } from 'sonner'; // Pastikan library sonner terinstall untuk notifikasi

// Import Halaman Admin
import { AdminLayout } from './components/admin/AdminLayout';
import DashboardPage from './components/admin/DashboardPage';
import OutletsManagementPage from './components/admin/OutletsManagementPage'; // Menggunakan OutletsPage.tsx
import StaffManagementPage from './components/admin/StaffManagementPage'; // Menggunakan StaffManagementPage.tsx
import ProductManagementPage from './components/admin/ProductManagementPage'; // Menggunakan ProductManagementPage.tsx
import StockManagementPage from './components/admin/StockManagementPage'; // Menggunakan StockManagementPage.tsx
import PaymentSettingsPage from './components/admin/PaymentSettingsPage';
import CategoryBrandPage from './components/admin/CategoryBrandPage';
import ReportsPage from './components/admin/ReportsPage';
import CashflowPage from './components/admin/CashflowPage';
import CustomerManagementPage from './components/admin/CustomerManagementPage';
import SettingsPage from './components/admin/SettingsPage';

interface AuthState {
  isAuthenticated: boolean;
  user: {
    email: string;
    role: string;
    name?: string;
  } | null;
}

export function App() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Data State (Real Data dari API)
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);

  // Auth State
  const [auth, setAuth] = useState<AuthState>({
    isAuthenticated: false,
    user: null
  });
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  // Admin Page State
  const [adminPage, setAdminPage] = useState('dashboard');

  // 1. Cek Login & Responsivitas saat Mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('posq_token');
      if (token) {
        try {
          // Validasi token ke backend
          const data = await api.auth.me();
          if (data && data.user) {
             setAuth({
               isAuthenticated: true,
               user: {
                 email: data.user.email,
                 role: data.user.role,
                 name: data.user.name
               }
             });
             localStorage.setItem('posq_user', JSON.stringify(data.user));
          }
        } catch (error) {
          console.error("Sesi berakhir atau token tidak valid", error);
          localStorage.removeItem('posq_token');
          localStorage.removeItem('posq_user');
        }
      }
      setIsLoadingAuth(false);
    };

    checkAuth();

    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // 2. Ambil Data POS (Produk, Kategori) jika Login Berhasil
  useEffect(() => {
    if (auth.isAuthenticated) {
      loadPosData();
    }
  }, [auth.isAuthenticated]);

  const loadPosData = async () => {
    setIsLoadingData(true);
    try {
      // Fetch data secara paralel agar lebih cepat
      const [prodData, catData, custData] = await Promise.all([
        api.products.getAll(),
        api.categories.getAll(),
        api.customers.getAll().catch(() => []) // Fallback array kosong jika error
      ]);

      setProducts(prodData);
      
      // Tambahkan kategori "All Items" manual di awal
      setCategories([
        { id: 'all', name: 'Semua Item', icon: '📋', count: prodData.length },
        ...catData
      ]);
      
      setCustomers(custData);
      setFilteredProducts(prodData);
    } catch (err) {
      console.error("Gagal memuat data POS", err);
    } finally {
      setIsLoadingData(false);
    }
  };

  // 3. Filter Produk saat Kategori Berubah
  useEffect(() => {
    if (selectedCategory === 'all') {
      setFilteredProducts(products);
    } else {
      // Filter berdasarkan ID kategori atau Nama kategori
      setFilteredProducts(products.filter(p => 
        p.category === selectedCategory || 
        p.category === categories.find(c => c.id === selectedCategory)?.name
      ));
    }
  }, [selectedCategory, products, categories]);

  // --- Logika Keranjang (Cart) ---
  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? {
          ...item,
          quantity: item.quantity + 1
        } : item);
      }
      return [...prev, {
        ...product,
        quantity: 1
      }];
    });
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQuantity = Math.max(0, item.quantity + delta);
        return {
          ...item,
          quantity: newQuantity
        };
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const handleCheckout = async () => {
    if(cart.length === 0) return;
    try {
      // Kirim transaksi ke backend API
      await api.transactions.create({
        items: cart.map(c => ({ 
          product_id: c.id, 
          quantity: c.quantity, 
          price: c.price 
        })),
        total: cart.reduce((sum, item) => sum + (item.price * item.quantity), 0),
        status: 'completed'
      });

      alert('Pesanan berhasil dikirim! 🚀');
      setCart([]);
    } catch (e) {
      console.error(e);
      alert('Gagal memproses pesanan. Silakan coba lagi.');
    }
  };

  // --- Auth Handlers ---
  const handleLogin = (email: string, role: string) => {
    setAuth({
      isAuthenticated: true,
      user: { email, role: role, name: email.split('@')[0] }
    });
  };

  const handleLogout = () => {
    localStorage.removeItem('posq_token');
    localStorage.removeItem('posq_user');
    setAuth({ isAuthenticated: false, user: null });
    setCart([]);
    setAdminPage('dashboard');
  };

  // --- Render Views ---

  if (isLoadingAuth) {
    return <div className="flex h-screen items-center justify-center bg-[#d1d7db] text-gray-600">Memuat sesi...</div>;
  }

  // 1. Belum Login -> Tampilkan Halaman Login
  if (!auth.isAuthenticated) {
    return (
      <>
        <Toaster position="top-right" />
        <LoginPage onLogin={handleLogin} />
      </>
    );
  }

  // 2. Role Admin/Owner/Administrator -> Tampilkan Layout Admin
  // WordPress menggunakan role 'administrator', sistem ini juga support 'owner'/'admin'
  const isAdminRole = ['owner', 'admin', 'administrator'].includes(auth.user?.role || '');
  
  if (isAdminRole) {
    return (
      <>
        <Toaster position="top-right" />
        <AdminLayout activePage={adminPage} onNavigate={setAdminPage} onLogout={handleLogout}>
          {adminPage === 'dashboard' && <DashboardPage />}
          {adminPage === 'outlets' && <OutletsManagementPage />}
          {adminPage === 'staff' && <StaffManagementPage />}
          {adminPage === 'products' && <ProductManagementPage />}
          {adminPage === 'inventory' && <StockManagementPage />}
          {adminPage === 'categories' && <CategoryBrandPage />}
          {adminPage === 'customers' && <CustomerManagementPage />}
          {adminPage === 'reports' && <ReportsPage />}
          {adminPage === 'cashflow' && <CashflowPage />}
          {adminPage === 'payments' && <PaymentSettingsPage />}
          {adminPage === 'settings' && <SettingsPage />}
        </AdminLayout>
      </>
    );
  }

  // 3. Role Kasir -> Tampilkan Layout POS (Mobile / Desktop)
  
  if (isMobile) {
    return (
      <>
        <Toaster position="top-center" />
        <MobileLayout 
          categories={categories} 
          products={filteredProducts} 
          cart={cart} 
          customers={customers} 
          onAddToCart={addToCart} 
          onUpdateQuantity={updateQuantity} 
          onCheckout={handleCheckout} 
          onLogout={handleLogout} 
        />
      </>
    );
  }

  // Desktop POS Layout
  return (
    <div className="flex h-screen w-full bg-[#d1d7db] overflow-hidden font-sans">
      <Toaster position="top-right" />
      {/* Dekorasi Background ala WhatsApp Web */}
      <div className="fixed top-0 left-0 w-full h-32 bg-[#00a884] z-0 hidden md:block" />

      <div className="relative z-10 flex w-full h-full md:h-[calc(100vh-38px)] md:w-[calc(100vw-38px)] md:m-auto md:shadow-2xl md:rounded-lg overflow-hidden bg-white">
        <Sidebar 
          categories={categories} 
          customers={customers} 
          selectedCategory={selectedCategory} 
          onSelectCategory={setSelectedCategory} 
          isOpen={isSidebarOpen} 
          onClose={() => setIsSidebarOpen(false)} 
        />

        <div className="flex-1 flex flex-col relative w-full md:w-[70%] bg-[#efeae2] mt-16 md:mt-0">
          {/* Header Desktop Panel Kanan */}
          <div className="hidden md:flex h-[59px] bg-[#F0F2F5] border-b border-gray-200 px-4 items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-xl">
                {categories.find(c => c.id === selectedCategory)?.icon || '📋'}
              </div>
              <div>
                <h2 className="font-medium text-gray-900">
                  {categories.find(c => c.id === selectedCategory)?.name || 'Semua Item'}
                </h2>
                <p className="text-xs text-gray-500">
                  Klik item untuk menambahkan ke keranjang
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-gray-600">
                {auth.user?.name || auth.user?.email}
              </span>
              <button onClick={handleLogout} className="text-sm text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors font-medium">
                Logout
              </button>
            </div>
          </div>

          {isLoadingData ? (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-gray-500">Memuat produk...</p>
            </div>
          ) : (
            <ProductGrid 
              products={filteredProducts} 
              onAddToCart={addToCart} 
              categoryName={categories.find(c => c.id === selectedCategory)?.name || 'Semua Item'} 
            />
          )}

          <Cart 
            items={cart} 
            onUpdateQuantity={updateQuantity} 
            onRemove={removeFromCart} 
            onCheckout={handleCheckout} 
          />
        </div>
      </div>
    </div>
  );
}