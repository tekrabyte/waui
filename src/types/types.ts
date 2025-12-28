// --- CORE TYPES ---
export interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  image?: string;
  available: boolean;
  description?: string;
  stock?: number;
  outletId?: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  count: number;
}

export interface Customer {
  id: string;
  name: string;
  avatar?: string;
  lastOrder: string;
  status: 'online' | 'offline';
  unread?: number;
  email?: string;
  phone?: string;
  totalSpent?: number;
}

export interface CartItem extends Product {
  quantity: number;
}

// --- ADMIN TYPES (COMPATIBILITY MODE) ---
export type AppRole = 'admin' | 'manager' | 'cashier' | 'owner';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: AppRole;
  outletId?: string;
  avatar?: string;
}

// Alias untuk UserProfile karena beberapa file admin menyebutnya Principal
export type Principal = UserProfile;

export interface Outlet {
  id: string;
  name: string;
  address: string;
  phone: string;
  manager: string;
  status: 'active' | 'inactive';
  // Properti tambahan agar tidak error di OutletsManagementPage
  isActive?: boolean;
  createdAt?: number | string | bigint;
}

export interface Staff {
  id: string;
  name: string;
  email: string;
  role: AppRole;
  outletId: string;
  status: 'active' | 'inactive';
  avatar?: string;
}

export interface InventoryItem {
  productId: string;
  currentStock: number;
  minStock: number;
  maxStock: number;
  lastUpdated: string;
  productName?: string;
}

// --- TRANSACTION & ORDER TYPES ---
export type OrderStatus = 'pending' | 'processing' | 'ready' | 'completed' | 'canceled';

export interface TransactionItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  subtotal?: number;
}

export interface Transaction {
  id: string;
  date: string;
  customerName: string;
  total: number;
  status: OrderStatus;
  items: TransactionItem[];
  paymentMethod?: string;
}

// --- PAYMENT TYPES ---
export type PaymentCategory = 'cash' | 'edc' | 'ewallet' | 'qris' | 'transfer';

export interface PaymentMethod {
  // Kita buat semua optional agar kompatibel dengan POSPage yang membuat objek baru secara manual
  id?: string;
  name?: string;
  type?: string;
  enabled?: boolean;
  transactionFee?: number;
  
  // Field tambahan yang diminta POSPage
  category?: any;
  subCategory?: any;
  methodName?: string;
  amount?: bigint | number;
}

// --- SETTINGS TYPES ---
export interface MenuAccess {
  menu: string;
  isAccessible: boolean;
}

export interface MenuAccessConfig {
  manager: MenuAccess[];
  cashier: MenuAccess[];
  owner: MenuAccess[];
}