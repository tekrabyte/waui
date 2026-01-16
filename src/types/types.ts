// src/types.ts

// ======================================================
// ENUMS & CONSTANTS (RUNTIME-SAFE)
// ======================================================
export const AppRole = {
  owner: "owner",
  admin: "admin",
  administrator: "administrator",
  manager: "manager",
  cashier: "cashier",
  staff: "staff",
  user: "user",
  guest: "guest",
} as const;

export type AppRole = typeof AppRole[keyof typeof AppRole];

export type OrderStatus =
  | "pending"
  | "processing"
  | "ready"
  | "completed"
  | "canceled"
  | "refunded";

export type OrderType = 
  | "dine-in"
  | "takeaway"
  | "delivery";

export enum PaymentCategory {
  offline = "offline",
  online = "online",
  foodDelivery = "foodDelivery"
}

export enum PaymentSubCategory {
  qris = "qris",
  eWallet = "eWallet",
  debit = "debit",
  credit = "credit",
  transfer = "transfer",
  cash = "cash",
  shopeeFood = "shopeeFood",
  goFood = "goFood",
  grabFood = "grabFood"
}

// ======================================================
// TABLE MANAGEMENT (NEW)
// ======================================================

export type TableStatus = "available" | "occupied" | "reserved";

export interface Table {
  id: string;
  tableNumber: string;
  capacity: number;
  status: TableStatus;
  area: string;
  currentOrderId?: string;
  isActive: boolean;
  createdAt?: string;
}

// ======================================================
// PROMO CONFIGURATION
// ======================================================

export interface PromoConfig {
  promoEnabled: boolean;
  promoType: 'fixed' | 'percentage';
  promoValue: number;
  promoDays: string[]; // ['Monday', 'Tuesday', ...]
  promoStartTime: string; // HH:mm format
  promoEndTime: string; // HH:mm format
  promoStartDate?: string; // Optional: YYYY-MM-DD
  promoEndDate?: string; // Optional: YYYY-MM-DD
  promoMinPurchase?: number; // Optional: minimum purchase amount
  promoDescription?: string; // Optional: promo description
}

// ======================================================
// PRODUCT & CATALOG
// ======================================================

export interface Product {
  id: string;
  name: string;
  price: number;
  category?: string;
  categoryId?: string;
  brand?: string;
  brandId?: string;
  image?: string;
  available: boolean;
  description?: string;
  stock: number;
  outletId?: string;
  isDeleted?: boolean;
  // Promo fields
  promoEnabled?: boolean;
  promoType?: 'fixed' | 'percentage';
  promoValue?: number;
  promoDays?: string[];
  promoStartTime?: string;
  promoEndTime?: string;
  promoStartDate?: string;
  promoEndDate?: string;
  promoMinPurchase?: number;
  promoDescription?: string;
}

export interface ProductPackage {
  id: string;
  name: string;
  price: number;
  description?: string;
  image?: string;
  available: boolean;
  items: {
    productId: string;
    quantity: number;
  }[];
  components?: {
    productId: string;
    quantity: number;
  }[];
  stock?: bigint;
  isActive?: boolean;
  outletId?: string;
  categoryId?: string;
  manualStockEnabled?: boolean;
  manualStock?: number;
  // Promo fields
  promoEnabled?: boolean;
  promoType?: 'fixed' | 'percentage';
  promoValue?: number;
  promoDays?: string[];
  promoStartTime?: string;
  promoEndTime?: string;
  promoStartDate?: string;
  promoEndDate?: string;
  promoMinPurchase?: number;
  promoDescription?: string;
}

// Alias untuk kompatibilitas dengan API
export type Package = ProductPackage;

export interface BundleItem {
  productId: string;
  packageId?: string;
  quantity: number;
  isPackage?: boolean;
}

export interface PackageComponent {
  productId: string;
  packageId: string;
  quantity: number;
  isPackage: boolean;
}

export interface Bundle {
  id: string;
  name: string;
  price: number;
  items: BundleItem[];
  image?: string;
  active: boolean;
  description?: string;
  calculatedStock?: number;
  outletId?: string;
  categoryId?: string;
  manualStockEnabled?: boolean;
  manualStock?: number;
  // Promo fields
  promoEnabled?: boolean;
  promoType?: 'fixed' | 'percentage';
  promoValue?: number;
  promoDays?: string[];
  promoStartTime?: string;
  promoEndTime?: string;
  promoStartDate?: string;
  promoEndDate?: string;
  promoMinPurchase?: number;
  promoDescription?: string;
}

export interface Category {
  id: string;
  name: string;
  icon?: string;
  count?: number;
  description?: string;
  isActive?: boolean;
}

export interface Brand {
  id: string;
  name: string;
  description?: string;
  isActive?: boolean;
}

// ======================================================
// CUSTOMER & CART
// ======================================================

export interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  avatar?: string;
  lastOrder?: string;
  status: "online" | "offline";
  unread?: number;
  registeredAt?: number;
}

export interface CartItem extends Product {
  quantity: number;
  type?: "product" | "package" | "bundle";
  availableStock?: number;
}

// ======================================================
// TRANSACTION & PAYMENT
// ======================================================

export interface Transaction {
  id: string;
  total: number;
  timestamp?: number;
  userId?: string;
  status?: OrderStatus;
  createdAt?: string;
  outletId?: string;
  items?: TransactionItem[];
  paymentMethods?: PaymentMethod[];
  orderType?: OrderType;
  tableNumber?: string;
  customerName?: string;
  estimatedReadyTime?: number;
  notes?: string;
}

export interface TransactionItem {
  productId: string;
  name?: string;
  price: number;
  quantity: number;
  subtotal?: number;
  note?: string;
  isPackage?: boolean;
  isBundle?: boolean;
}

export interface PaymentMethod {
  id?: string;
  category: PaymentCategory;
  subCategory?: PaymentSubCategory;
  methodName: string;
  amount: number;
  name?: string;
  type?: string;
  enabled?: boolean;
  transactionFee?: number;
}

export interface GuestCustomerData {
  name: string;
  phone: string;
  address: string;
}

// ======================================================
// OUTLET & STAFF
// ======================================================

export interface Outlet {
  id: string;
  name: string;
  address: string;
  phone?: string;
  manager?: string;
  isActive: boolean;
  createdAt?: string;
  status?: string;
}

export interface Staff {
  id: string;
  name: string;
  email: string;
  role: AppRole | string;
  outletId?: string;
  status: "active" | "inactive";
  avatar?: string;
}

// ======================================================
// ACCESS & MENU
// ======================================================

export interface InventoryItem {
  productId: string;
  currentStock: number;
  minStock: number;
  maxStock: number;
  lastUpdated: string;
}

export interface MenuAccess {
  menu: string;
  isAccessible: boolean;
}

export interface MenuAccessConfig {
  manager: MenuAccess[];
  cashier: MenuAccess[];
  owner: MenuAccess[];
}

// ======================================================
// USER / IDENTITY (LEGACY SAFE)
// ======================================================

export interface UserProfile {
  id: string;
  name: string;
  role: AppRole;
  email?: string;
  outletId?: string;
  userId?: string;
  registeredAt?: number;
}

export class Principal {
  private _id: string;

  constructor(id: string) {
    this._id = id;
  }

  toString(): string {
    return this._id;
  }

  toText(): string {
    return this._id;
  }

  static fromText(text: string): Principal {
    return new Principal(text);
  }
}

// ======================================================
// FINANCE
// ======================================================

export interface Expense {
  id: string;
  title: string;
  amount: number;
  category: string;
  description?: string;
  type?: 'income' | 'expense';
  date?: number;
  timestamp?: number;
  note?: string;
  outletId?: string;
  outletName?: string;
}

export interface CashflowSummary {
  totalIncome: number;
  totalExpense: number;
  totalExpenses?: number; // Alias for compatibility
  balance?: number; // net profit
  netProfit?: number;
  period: string;
  chartData?: {
    date: string;
    income: number;
    expense: number;
  }[];
}

// ======================================================
// SETTINGS & CONFIGURATION
// ======================================================

export interface PaymentSettings {
  qrisEnabled: boolean;
  uploadEnabled: boolean;
  takeawayEnabled?: boolean;
  deliveryEnabled?: boolean;
  qrisStaticEnabled?: boolean;
  bankTransferEnabled?: boolean;
  qrisStaticImageBlob?: string | null;
  qrisMerchantName?: string;
  bankName?: string;
  bankAccountNumber?: string;
  bankAccountName?: string;
}

export interface DashboardSummary {
  totalRevenue: number;
  totalTransactions: number;
  transactionCount?: number;
  averageTransaction: number;
}

export interface BestSellerItem {
  productId: string;
  quantity: number;
  revenue: number;
}

export interface StockLog {
  id: string;
  productId: string;
  action: 'add' | 'reduce' | 'transfer';
  quantity: number;
  timestamp: string;
  userId?: string;
  outletId?: string;
  notes?: string;
}

// ======================================================
// HELD ORDERS & KITCHEN DISPLAY
// ======================================================

export interface HeldOrder {
  id: string;
  outletId: string;
  userId?: string;
  cart: {
    id: string;
    name: string;
    price: number;
    quantity: number;
    isPackage: boolean;
    isBundle: boolean;
    productId: string;
    availableStock: number;
  }[];
  paymentMethods: {
    id: string;
    category: PaymentCategory;
    subCategory?: PaymentSubCategory;
    methodName: string;
    amount: string;
  }[];
  orderType?: OrderType;
  tableNumber?: string;
  customerName?: string;
  notes?: string;
  timestamp: number;
  createdAt?: string;
}

export interface KitchenOrder {
  id: string;
  orderNumber: string;
  outletId: string;
  orderType: OrderType;
  tableNumber?: string;
  customerName?: string;
  items: TransactionItem[];
  total: number;
  status: OrderStatus;
  createdAt: number;
  estimatedReadyTime?: number;
  actualReadyTime?: number;
  notes?: string;
  source: 'pos' | 'kiosk';
}


