import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Store, 
  Users, 
  Package, 
  BarChart3, 
  CreditCard, 
  Settings, 
  LogOut, 
  Menu, 
  X,
  Tags,
  Boxes,
  DollarSign,
  FileText,
  ShoppingCart,
  UserCheck,
  Armchair
} from 'lucide-react';
import { motion } from 'framer-motion';

interface AdminLayoutProps {
  children: React.ReactNode;
  activePage: string;
  onNavigate: (page: string) => void;
  onLogout: () => void;
}

export function AdminLayout({ children, activePage, onNavigate, onLogout }: AdminLayoutProps) {
  // Ubah default sidebar menjadi false di mobile jika perlu, atau biarkan true di desktop
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const u = localStorage.getItem('posq_user');
    if(u) setUser(JSON.parse(u));
    
    // Auto collapse sidebar on mobile
    if (window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
  }, []);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'pos', label: 'POS', icon: ShoppingCart },
    { id: 'kiosk', label: 'Kiosk', icon: Store },
    { id: 'tables', label: 'Table Management', icon: Armchair },
    { id: 'outlets', label: 'Outlets', icon: Store },
    { id: 'staff', label: 'Staff', icon: Users },
    { id: 'customers', label: 'Customers', icon: UserCheck },
    { id: 'products', label: 'Products', icon: Package },
    { id: 'inventory', label: 'Inventory', icon: Boxes },
    { id: 'categorybrand', label: 'Kategori & Brand', icon: Tags },
    { id: 'reports', label: 'Reports', icon: FileText },
    { id: 'promo', label: 'Promos', icon: FileText },
    { id: 'cashflow', label: 'Cashflow', icon: DollarSign },
    { id: 'payments', label: 'Payments', icon: CreditCard },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    // Pastikan bg-muted/20 atau gray-100 konsisten
    <div className="flex h-screen bg-muted/20 font-sans">
      {/* Sidebar */}
      <motion.aside 
        initial={false} 
        animate={{ 
          width: isSidebarOpen ? 260 : 0, 
          opacity: isSidebarOpen ? 1 : 0 
        }} 
        className="bg-background border-r border-border flex flex-col overflow-hidden shadow-sm z-20"
      >
        <div className="p-6 flex items-center gap-3 border-b border-border h-16">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-primary-foreground font-bold">
            P
          </div>
          <span className="font-bold text-foreground text-lg whitespace-nowrap">Admin Panel</span>
        </div>
        
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map(item => (
            <button 
              key={item.id} 
              onClick={() => onNavigate(item.id)} 
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors whitespace-nowrap 
                ${activePage === item.id 
                  ? 'bg-primary/10 text-primary' 
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
            >
              <item.icon size={20} />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-border">
          <button 
            onClick={onLogout} 
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
          >
            <LogOut size={20} /> Logout
          </button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <header className="bg-background border-b border-border h-16 px-6 flex items-center justify-between shrink-0">
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)} 
            className="p-2 hover:bg-muted rounded-lg text-foreground transition-colors"
          >
            {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-foreground">{user?.name || 'Admin'}</p>
              <p className="text-xs text-muted-foreground capitalize">{user?.role || 'User'}</p>
            </div>
            <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center text-muted-foreground font-bold">
              {user?.name?.[0]?.toUpperCase() || 'A'}
            </div>
          </div>
        </header>
        
        {/* Konten Halaman */}
        <main className="flex-1 overflow-auto p-4 md:p-6 bg-muted/20">
          <div className="max-w-7xl mx-auto space-y-6">
            {children} 
          </div>
        </main>
      </div>
    </div>
  );
}