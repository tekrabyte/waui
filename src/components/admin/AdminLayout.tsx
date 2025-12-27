import React, { useState } from 'react';
import { LayoutDashboard, Store, Users, Package, BarChart3, CreditCard, Settings, LogOut, Menu, X } from 'lucide-react';
import { motion } from 'framer-motion';
interface AdminLayoutProps {
  children: React.ReactNode;
  activePage: string;
  onNavigate: (page: string) => void;
  onLogout: () => void;
}
export function AdminLayout({
  children,
  activePage,
  onNavigate,
  onLogout
}: AdminLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const navItems = [{
    id: 'dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard
  }, {
    id: 'outlets',
    label: 'Outlets',
    icon: Store
  }, {
    id: 'staff',
    label: 'Staff',
    icon: Users
  }, {
    id: 'products',
    label: 'Products',
    icon: Package
  }, {
    id: 'inventory',
    label: 'Inventory',
    icon: BarChart3
  }, {
    id: 'payments',
    label: 'Payments',
    icon: CreditCard
  }, {
    id: 'settings',
    label: 'Settings',
    icon: Settings
  }];
  return <div className="flex h-screen bg-gray-100 font-sans">
      {/* Sidebar */}
      <motion.aside initial={false} animate={{
      width: isSidebarOpen ? 240 : 0,
      opacity: isSidebarOpen ? 1 : 0
    }} className="bg-white border-r border-gray-200 flex flex-col overflow-hidden">
        <div className="p-6 flex items-center gap-3 border-b border-gray-100">
          <div className="w-8 h-8 bg-[#008069] rounded-lg flex items-center justify-center text-white font-bold">
            WP
          </div>
          <span className="font-bold text-gray-800 text-lg whitespace-nowrap">
            Admin Panel
          </span>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map(item => {
          const Icon = item.icon;
          const isActive = activePage === item.id;
          return <button key={item.id} onClick={() => onNavigate(item.id)} className={`
                  w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors whitespace-nowrap
                  ${isActive ? 'bg-[#008069]/10 text-[#008069]' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}
                `}>
                <Icon size={20} />
                {item.label}
              </button>;
        })}
        </nav>

        <div className="p-4 border-t border-gray-100">
          <button onClick={() => {
          if (confirm('Are you sure you want to log out?')) {
            onLogout();
          }
        }} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors whitespace-nowrap">
            <LogOut size={20} />
            Logout
          </button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 h-16 px-6 flex items-center justify-between">
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-600">
            {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-gray-900">Admin User</p>
              <p className="text-xs text-gray-500">Super Admin</p>
            </div>
            <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-gray-600 font-bold">
              AU
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-6">
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
    </div>;
}