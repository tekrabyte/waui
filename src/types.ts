export interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  image?: string;
  available: boolean;
  description?: string;
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
}
export interface CartItem extends Product {
  quantity: number;
}

// Admin Types
export interface Outlet {
  id: string;
  name: string;
  address: string;
  phone: string;
  manager: string;
  status: 'active' | 'inactive';
}
export interface Staff {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'cashier';
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
}
export interface PaymentMethod {
  id: string;
  name: string;
  type: 'cash' | 'card' | 'ewallet' | 'qr';
  enabled: boolean;
  transactionFee: number;
}