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
// PRODUCT & CATALOG
// ======================================================

export interface Product {
  id: string;
  name: string;
  price: number;
  category?: string;
  categoryId?: bigint;
  brand?: string;
  brandId?: bigint;
  image?: string;
  available: boolean;
  description?: string;
  stock: bigint;
  outletId?: string;
  isDeleted?: boolean;
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
}

export interface BundleItem {
  productId: string;
  packageId?: string;
  quantity: number;
  isPackage?: boolean;
}

export interface PackageComponent {
  productId: bigint;
  packageId: bigint;
  quantity: bigint;
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
  status?: string;
  createdAt?: string;
  outletId?: string;
  items?: TransactionItem[];
  paymentMethods?: PaymentMethod[];
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
  date: number;
  note?: string;
  outletId?: string;
}

export interface CashflowSummary {
  totalIncome: number;
  totalExpense: number;
  netProfit: number;
  period: string;
  chartData: {
    date: string;
    income: number;
    expense: number;
  }[];
}
