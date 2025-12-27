import React, { useEffect, useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { ProductGrid } from './components/ProductGrid';
import { Cart } from './components/Cart';
import { MobileLayout } from './components/MobileLayout';
import { AdminLayout } from './components/admin/AdminLayout';
import { OutletManagement } from './components/admin/OutletManagement';
import { StaffManagement } from './components/admin/StaffManagement';
import { ProductManagement } from './components/admin/ProductManagement';
import { InventoryManagement } from './components/admin/InventoryManagement';
import { PaymentSettings } from './components/admin/PaymentSettings';
import { LoginPage } from './components/LoginPage';
import { Category, Customer, Product, CartItem } from './types';
// Mock Data
const CATEGORIES: Category[] = [{
  id: 'all',
  name: 'All Items',
  icon: '📋',
  count: 45
}, {
  id: 'beverages',
  name: 'Beverages',
  icon: '☕',
  count: 12
}, {
  id: 'snacks',
  name: 'Snacks',
  icon: '🍿',
  count: 8
}, {
  id: 'meals',
  name: 'Meals',
  icon: '🍔',
  count: 15
}, {
  id: 'desserts',
  name: 'Desserts',
  icon: '🍰',
  count: 6
}, {
  id: 'specials',
  name: 'Specials',
  icon: '⭐',
  count: 4
}];
const CUSTOMERS: Customer[] = [{
  id: '1',
  name: 'Alice Freeman',
  lastOrder: '10:42 AM',
  status: 'online',
  unread: 2
}, {
  id: '2',
  name: 'Bob Smith',
  lastOrder: 'Yesterday',
  status: 'offline'
}, {
  id: '3',
  name: 'Charlie Brown',
  lastOrder: 'Tuesday',
  status: 'online'
}, {
  id: '4',
  name: 'Diana Prince',
  lastOrder: 'Monday',
  status: 'offline'
}];
const PRODUCTS: Product[] = [{
  id: '1',
  name: 'Cappuccino',
  price: 4.5,
  category: 'beverages',
  available: true,
  image: 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=400&q=80'
}, {
  id: '2',
  name: 'Latte',
  price: 4.0,
  category: 'beverages',
  available: true,
  image: 'https://images.unsplash.com/photo-1570968992193-d6ea06651af1?w=400&q=80'
}, {
  id: '3',
  name: 'Espresso',
  price: 3.0,
  category: 'beverages',
  available: true,
  image: 'https://images.unsplash.com/photo-1510707577719-ae7c14805e3a?w=400&q=80'
}, {
  id: '4',
  name: 'Green Tea',
  price: 3.5,
  category: 'beverages',
  available: true,
  image: 'https://images.unsplash.com/photo-1627435601361-ec25f5b1d0e5?w=400&q=80'
}, {
  id: '5',
  name: 'Club Sandwich',
  price: 12.5,
  category: 'meals',
  available: true,
  image: 'https://images.unsplash.com/photo-1567234669003-dce7a7a88821?w=400&q=80'
}, {
  id: '6',
  name: 'Burger Deluxe',
  price: 14.0,
  category: 'meals',
  available: true,
  image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&q=80'
}, {
  id: '7',
  name: 'Caesar Salad',
  price: 10.0,
  category: 'meals',
  available: false,
  image: 'https://images.unsplash.com/photo-1550304943-4f24f54ddde9?w=400&q=80'
}, {
  id: '8',
  name: 'Chocolate Cake',
  price: 6.5,
  category: 'desserts',
  available: true,
  image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400&q=80'
}, {
  id: '9',
  name: 'Cheesecake',
  price: 7.0,
  category: 'desserts',
  available: true,
  image: 'https://images.unsplash.com/photo-1524351199678-941a58a3dfcd?w=400&q=80'
}, {
  id: '10',
  name: 'Popcorn',
  price: 4.0,
  category: 'snacks',
  available: true,
  image: 'https://images.unsplash.com/photo-1578849278619-e73505e9610f?w=400&q=80'
}, {
  id: '11',
  name: 'Nachos',
  price: 8.5,
  category: 'snacks',
  available: true,
  image: 'https://images.unsplash.com/photo-1513456852971-30c0b8199d4d?w=400&q=80'
}, {
  id: '12',
  name: 'Special Combo',
  price: 18.0,
  category: 'specials',
  available: true,
  image: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=400&q=80'
}];
interface AuthState {
  isAuthenticated: boolean;
  user: {
    email: string;
    role: 'owner' | 'admin' | 'cashier';
  } | null;
}
export function App() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [filteredProducts, setFilteredProducts] = useState(PRODUCTS);
  const [isMobile, setIsMobile] = useState(false);
  // Auth State
  const [auth, setAuth] = useState<AuthState>({
    isAuthenticated: false,
    user: null
  });
  // Admin Page State
  const [adminPage, setAdminPage] = useState('dashboard');
  // Handle window resize
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  useEffect(() => {
    if (selectedCategory === 'all') {
      setFilteredProducts(PRODUCTS);
    } else {
      setFilteredProducts(PRODUCTS.filter(p => p.category === selectedCategory));
    }
  }, [selectedCategory]);
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
  const handleCheckout = () => {
    alert('Order sent successfully! 🚀');
    setCart([]);
  };
  const handleLogin = (email: string, role: 'owner' | 'admin' | 'cashier') => {
    setAuth({
      isAuthenticated: true,
      user: {
        email,
        role
      }
    });
  };
  const handleLogout = () => {
    setAuth({
      isAuthenticated: false,
      user: null
    });
    setCart([]);
  };
  // If not authenticated, show login page
  if (!auth.isAuthenticated) {
    return <LoginPage onLogin={handleLogin} />;
  }
  // If authenticated as owner or admin, show Admin Dashboard
  if (auth.user?.role === 'owner' || auth.user?.role === 'admin') {
    return <AdminLayout activePage={adminPage} onNavigate={setAdminPage} onLogout={handleLogout}>
        {adminPage === 'dashboard' && <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <h3 className="text-gray-500 text-sm font-medium">Total Sales</h3>
              <p className="text-3xl font-bold text-gray-900 mt-2">$12,450</p>
              <span className="text-green-600 text-sm font-medium">
                +15% from last month
              </span>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <h3 className="text-gray-500 text-sm font-medium">
                Active Orders
              </h3>
              <p className="text-3xl font-bold text-gray-900 mt-2">24</p>
              <span className="text-blue-600 text-sm font-medium">
                Processing now
              </span>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <h3 className="text-gray-500 text-sm font-medium">
                Low Stock Items
              </h3>
              <p className="text-3xl font-bold text-gray-900 mt-2">3</p>
              <span className="text-red-600 text-sm font-medium">
                Action needed
              </span>
            </div>
          </div>}
        {adminPage === 'outlets' && <OutletManagement />}
        {adminPage === 'staff' && <StaffManagement />}
        {adminPage === 'products' && <ProductManagement />}
        {adminPage === 'inventory' && <InventoryManagement />}
        {adminPage === 'payments' && <PaymentSettings />}
        {adminPage === 'settings' && <div className="text-center py-20 text-gray-500">
            Global Settings Placeholder
          </div>}
      </AdminLayout>;
  }
  // If authenticated as cashier (or others), show POS
  // Mobile Layout
  if (isMobile) {
    return <MobileLayout categories={CATEGORIES} products={PRODUCTS} cart={cart} customers={CUSTOMERS} onAddToCart={addToCart} onUpdateQuantity={updateQuantity} onCheckout={handleCheckout} onLogout={handleLogout} />;
  }
  // Desktop Layout (Split POS)
  return <div className="flex h-screen w-full bg-[#d1d7db] overflow-hidden font-sans">
      {/* Background decoration strip (WhatsApp web style) */}
      <div className="fixed top-0 left-0 w-full h-32 bg-[#00a884] z-0 hidden md:block" />

      <div className="relative z-10 flex w-full h-full md:h-[calc(100vh-38px)] md:w-[calc(100vw-38px)] md:m-auto md:shadow-2xl md:rounded-lg overflow-hidden bg-white">
        <Sidebar categories={CATEGORIES} customers={CUSTOMERS} selectedCategory={selectedCategory} onSelectCategory={setSelectedCategory} isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

        <div className="flex-1 flex flex-col relative w-full md:w-[70%] bg-[#efeae2] mt-16 md:mt-0">
          {/* Desktop Header for Right Panel */}
          <div className="hidden md:flex h-[59px] bg-[#F0F2F5] border-b border-gray-200 px-4 items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                {CATEGORIES.find(c => c.id === selectedCategory)?.icon || '📋'}
              </div>
              <div>
                <h2 className="font-medium text-gray-900">
                  {CATEGORIES.find(c => c.id === selectedCategory)?.name}
                </h2>
                <p className="text-xs text-gray-500">
                  Click on items to add to cart
                </p>
              </div>
            </div>

            <button onClick={handleLogout} className="text-sm text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors font-medium">
              Logout
            </button>
          </div>

          <ProductGrid products={filteredProducts} onAddToCart={addToCart} categoryName={CATEGORIES.find(c => c.id === selectedCategory)?.name || 'All Items'} />

          <Cart items={cart} onUpdateQuantity={updateQuantity} onRemove={removeFromCart} onCheckout={handleCheckout} />
        </div>
      </div>
    </div>;
}