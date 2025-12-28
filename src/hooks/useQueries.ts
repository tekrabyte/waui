import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import {
  Product,
  ProductPackage,
  Bundle,
  TransactionItem,
  PaymentMethod,
  GuestCustomerData,
  UserProfile,
  AppRole,
  Outlet,
  Expense,
  CashflowSummary,
  Category,
  Brand,
} from '../types/types';

/* =====================================================
   AUTH
===================================================== */

export const useIsCallerAdmin = () =>
  useQuery({
    queryKey: ['me', 'isAdmin'],
    queryFn: async () => {
      try {
        const res = await api.auth.me();
        return ['owner', 'admin', 'administrator'].includes(res.user?.role);
      } catch {
        return false;
      }
    },
    initialData: false,
  });

export const useGetCallerUserProfile = () =>
  useQuery({
    queryKey: ['me'],
    queryFn: async (): Promise<UserProfile> => {
      const res = await api.auth.me();
      return {
        id: res.user.id,
        name: res.user.name,
        email: res.user.email,
        role: res.user.role as AppRole,
        outletId: res.user.outletId || undefined,
      };
    },
  });

/* =====================================================
   OUTLET
===================================================== */

export const useListOutlets = () =>
  useQuery({
    queryKey: ['outlets'],
    queryFn: async (): Promise<Outlet[]> => {
      const res = await api.outlets.getAll();
      return res.map((o: any) => ({
        id: String(o.id),
        name: o.name,
        address: o.address,
        isActive: o.status === 'active' || o.isActive === true,
        createdAt: o.createdAt,
      }));
    },
  });

export const useAddOutlet = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.outlets.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['outlets'] }),
  });
};

export const useUpdateOutlet = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string; name?: string; address?: string; isActive?: boolean }) =>
      api.outlets.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['outlets'] }),
  });
};

/* =====================================================
   PRODUCT
===================================================== */

export const useListProductsByOutlet = (outletId?: string) =>
  useQuery({
    queryKey: ['products', outletId],
    queryFn: async (): Promise<Product[]> => {
      const res = await api.products.getAll();
      return res
        .filter((p: any) => !outletId || p.outletId === outletId)
        .map((p: any) => ({
          id: String(p.id),
          name: p.name,
          price: Number(p.price),
          stock: Number(p.stock ?? 0),
          available: !!p.available,
          outletId: p.outletId,
          category: p.category,
          brand: p.brand,
        }));
    },
  });

/* =====================================================
   EXPENSE & CASHFLOW
===================================================== */

export const useGetExpenses = (outletId?: string) =>
  useQuery({
    queryKey: ['expenses', outletId],
    queryFn: () => api.expenses.getAll(outletId),
  });

export const useAddExpense = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.expenses.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['expenses'] });
      qc.invalidateQueries({ queryKey: ['cashflow'] });
    },
  });
};

export const useGetCashflowSummary = (period: 'daily' | 'weekly' | 'monthly', outletId?: string) =>
  useQuery({
    queryKey: ['cashflow', period, outletId],
    queryFn: (): Promise<CashflowSummary> =>
      api.cashflow.getSummary(period, outletId),
  });

/* =====================================================
   PACKAGE & BUNDLE
===================================================== */

export const useListPackages = () =>
  useQuery({
    queryKey: ['packages'],
    queryFn: async (): Promise<ProductPackage[]> => {
      const res = await api.packages.getAll();
      return res.map((p: any) => ({
        id: String(p.id),
        name: p.name,
        price: Number(p.price),
        items: p.items ?? [],
        isActive: !!p.isActive,
      }));
    },
  });

export const useListBundles = () =>
  useQuery({
    queryKey: ['bundles'],
    queryFn: async (): Promise<Bundle[]> => {
      const res = await api.bundles.getAll();
      return res.map((b: any) => ({
        id: String(b.id),
        name: b.name,
        price: Number(b.price),
      }));
    },
  });

/* =====================================================
   CUSTOMER & STAFF
===================================================== */

export const useGetAllCustomers = () =>
  useQuery({
    queryKey: ['customers'],
    queryFn: async () => api.customers.getAll(),
  });

export const useListStaff = () =>
  useQuery({
    queryKey: ['staff'],
    queryFn: async (): Promise<UserProfile[]> => {
      const res = await api.staff.getAll();
      return res.map((u: any) => ({
        id: String(u.id),
        name: u.name,
        email: u.email,
        role: u.role as AppRole,
        outletId: u.outletId,
      }));
    },
  });

export const useListAllUsers = () =>
  useQuery({
    queryKey: ['staff'],
    queryFn: async () => {
      const res = await api.staff.getAll();
      return res.map((u: any) => ({
        principal: { toString: () => String(u.id), toText: () => String(u.id) },
        profile: {
          id: String(u.id),
          name: u.name,
          email: u.email,
          role: u.role as AppRole,
          outletId: u.outletId,
        },
      }));
    },
  });

export const useUpdateUserProfile = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<UserProfile> & { id: string }) =>
      api.staff.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['staff'] }),
  });
};

export const useRemoveUser = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.staff.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['staff'] }),
  });
};

/* =====================================================
   TRANSACTION
===================================================== */

export const useListAllTransactions = () =>
  useQuery({
    queryKey: ['transactions'],
    queryFn: async () => {
      const res = await api.transactions.getAll();
      return res.map((t: any) => ({
        id: String(t.id),
        total: Number(t.total),
        status: t.status,
        createdAt: t.created_at,
        outletId: t.outletId,
      }));
    },
  });

export const useCreateTransaction = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      items: TransactionItem[];
      outletId: string;
      paymentMethods: PaymentMethod[];
      guestData?: GuestCustomerData | null;
    }) => api.transactions.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['transactions'] });
      qc.invalidateQueries({ queryKey: ['products'] });
    },
  });
};

/* =====================================================
   CATEGORY & BRAND
===================================================== */

export const useGetAllCategories = () =>
  useQuery({
    queryKey: ['categories'],
    queryFn: (): Promise<Category[]> => api.categories.getAll(),
  });

export const useGetAllBrands = () =>
  useQuery({
    queryKey: ['brands'],
    queryFn: (): Promise<Brand[]> => api.brands.getAll(),
  });

/* =====================================================
   INVENTORY / STOCK
===================================================== */

export const useListActivePackages = (outletId?: string | null) =>
  useQuery({
    queryKey: ['packages', outletId],
    queryFn: async (): Promise<ProductPackage[]> => {
      const res = await api.packages.getAll();
      return res
        .filter((p: any) => !outletId || p.outletId === outletId)
        .map((p: any) => ({
          id: String(p.id),
          name: p.name,
          price: Number(p.price),
          items: p.items ?? [],
          isActive: !!p.isActive,
        }));
    },
  });

export const useAddStock = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ productId, quantity }: { productId: string; quantity: number }) =>
      api.inventory.update(productId, quantity, 'add'),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['products'] });
      qc.invalidateQueries({ queryKey: ['packages'] });
    },
  });
};

export const useReduceStock = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ productId, quantity }: { productId: string; quantity: number }) =>
      api.inventory.update(productId, quantity, 'reduce'),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['products'] });
      qc.invalidateQueries({ queryKey: ['packages'] });
    },
  });
};

export const useTransferStock = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ productId, quantity, targetOutletId }: { productId: string; quantity: number; targetOutletId: string }) =>
      api.inventory.update(productId, quantity, 'reduce'), // Simplified for now
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['products'] });
      qc.invalidateQueries({ queryKey: ['packages'] });
    },
  });
};

/* =====================================================
   SETTINGS
===================================================== */

export const useGetMenuAccessConfig = () =>
  useQuery({
    queryKey: ['menuAccess'],
    queryFn: () => api.settings.getMenuAccess(),
  });

export const useSaveMenuAccessConfig = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (config: any) => api.settings.saveMenuAccess(config),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['menuAccess'] }),
  });
};

  