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

export const useGetOutlet = (id: string) =>
  useQuery({
    queryKey: ['outlet', id],
    queryFn: async (): Promise<Outlet> => {
      const res = await api.outlets.getAll();
      const outlet = res.find((o: any) => String(o.id) === id);
      if (!outlet) throw new Error('Outlet not found');
      return {
        id: String(outlet.id),
        name: outlet.name,
        address: outlet.address,
        phone: outlet.phone,
        manager: outlet.manager,
        isActive: outlet.status === 'active' || outlet.isActive === true,
        createdAt: outlet.createdAt,
      };
    },
    enabled: !!id,
  });

export const useGetTopOutlets = () =>
  useQuery({
    queryKey: ['outlets', 'top'],
    queryFn: async () => {
      const res = await api.outlets.getAll();
      return res.slice(0, 5); // Return top 5 outlets
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

export const useAddProduct = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => api.products.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['products'] }),
  });
};

export const useUpdateProduct = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string } & any) => api.products.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['products'] }),
  });
};

export const useDeleteProduct = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.products.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['products'] }),
  });
};

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

export const useUpdateExpense = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string } & any) => api.expenses.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['expenses'] });
      qc.invalidateQueries({ queryKey: ['cashflow'] });
    },
  });
};

export const useDeleteExpense = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.expenses.delete(id),
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

export const useCreatePackage = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => api.packages.getAll(), // Placeholder - need API endpoint
    onSuccess: () => qc.invalidateQueries({ queryKey: ['packages'] }),
  });
};

export const useUpdatePackage = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string } & any) => api.packages.getAll(), // Placeholder
    onSuccess: () => qc.invalidateQueries({ queryKey: ['packages'] }),
  });
};

export const useMarkPackageInactive = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.packages.getAll(), // Placeholder
    onSuccess: () => qc.invalidateQueries({ queryKey: ['packages'] }),
  });
};

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

export const useListActiveBundles = (outletId?: string | null) =>
  useQuery({
    queryKey: ['bundles', outletId],
    queryFn: async (): Promise<Bundle[]> => {
      const res = await api.bundles.getAll();
      return res
        .filter((b: any) => !outletId || b.outletId === outletId)
        .map((b: any) => ({
          id: String(b.id),
          name: b.name,
          price: Number(b.price),
          items: b.items ?? [],
          active: !!b.active,
        }));
    },
  });

export const useCreateBundle = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => api.bundles.getAll(), // Placeholder
    onSuccess: () => qc.invalidateQueries({ queryKey: ['bundles'] }),
  });
};

export const useUpdateBundle = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string } & any) => api.bundles.getAll(), // Placeholder
    onSuccess: () => qc.invalidateQueries({ queryKey: ['bundles'] }),
  });
};

export const useMarkBundleInactive = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.bundles.getAll(), // Placeholder
    onSuccess: () => qc.invalidateQueries({ queryKey: ['bundles'] }),
  });
};

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

export const useListMyTransactions = (outletId?: string) =>
  useQuery({
    queryKey: ['transactions', 'my', outletId],
    queryFn: async () => {
      const res = await api.transactions.getAll();
      return res
        .filter((t: any) => !outletId || t.outletId === outletId)
        .map((t: any) => ({
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

export const useUpdateTransactionStatus = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.transactions.updateStatus ? api.transactions.updateStatus(id, status) : Promise.resolve(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['transactions'] });
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

export const useCreateCategory = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => api.categories.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['categories'] }),
  });
};

export const useUpdateCategory = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string } & any) => api.categories.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['categories'] }),
  });
};

export const useGetAllBrands = () =>
  useQuery({
    queryKey: ['brands'],
    queryFn: (): Promise<Brand[]> => api.brands.getAll(),
  });

export const useCreateBrand = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => api.brands.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['brands'] }),
  });
};

export const useUpdateBrand = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string } & any) => api.brands.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['brands'] }),
  });
};

export const useDeleteBrand = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.brands.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['brands'] }),
  });
};

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

/* =====================================================
   DASHBOARD ANALYTICS
===================================================== */

export const useGetDailySummaryOutlet = (outletId: string) =>
  useQuery({
    queryKey: ['dailySummary', outletId],
    queryFn: async () => {
      // Mock data - replace with actual API call when available
      return {
        totalRevenue: 0,
        totalTransactions: 0,
        transactionCount: 0,
        averageTransaction: 0,
      };
    },
    enabled: !!outletId,
  });

export const useGetOverallSummaryOutlet = (outletId: string) =>
  useQuery({
    queryKey: ['overallSummary', outletId],
    queryFn: async () => {
      // Mock data - replace with actual API call when available
      return {
        totalRevenue: 0,
        totalProducts: 0,
        totalCustomers: 0,
      };
    },
    enabled: !!outletId,
  });

export const useGetBestSellers = (outletId: string) =>
  useQuery({
    queryKey: ['bestSellers', outletId],
    queryFn: async () => {
      // Mock data - replace with actual API call when available
      return [] as Array<{ productId: string; quantity: number; revenue: number }>;
    },
    enabled: !!outletId,
  });

/* =====================================================
   PAYMENT & TRANSACTION HISTORY
===================================================== */

export const useGetUserTransactionHistory = () =>
  useQuery({
    queryKey: ['userTransactionHistory'],
    queryFn: async () => {
      // Mock data - replace with actual API call when available
      return [] as any[];
    },
  });

export const useGetPaymentSettings = () =>
  useQuery({
    queryKey: ['paymentSettings'],
    queryFn: async () => {
      // Mock data - replace with actual API call when available
      return {
        qrisEnabled: false,
        uploadEnabled: true,
      };
    },
  });

export const useUploadPaymentProof = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { transactionId: string; file: File }) => {
      // Mock upload - replace with actual API call when available
      return { success: true };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['userTransactionHistory'] });
    },
  });
};

  