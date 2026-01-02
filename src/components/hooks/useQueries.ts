import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../services/api';
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
  CashflowSummary,
  Category,
  Brand,
} from '../../types/types';

const safeParse = (data: any) => {
  if (Array.isArray(data)) return data;
  if (typeof data === 'string') {
    try {
      const parsed = JSON.parse(data);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
};
/* =====================================================
   AUTH
===================================================== */

export const useIsCallerAdmin = () =>
  useQuery({
    queryKey: ['me', 'isAdmin'],
    queryFn: async () => {
      try {
        const res = await api.auth.me();
        const role = res.user?.role || '';
        return ['owner', 'admin', 'administrator'].includes(role);
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
      // FIX: Cek outlet_id (snake_case) dan outletId (camelCase)
      const rawOutletId = res.user.outlet_id || res.user.outletId;
      
      return {
        id: String(res.user.id),
        name: res.user.name,
        email: res.user.email,
        role: res.user.role as AppRole,
        outletId: rawOutletId ? String(rawOutletId) : undefined,
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
        isActive: o.is_active === true || o.is_active === 1 || o.is_active === '1' || o.status === 'active',
        createdAt: o.created_at,
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
        isActive: outlet.is_active === true || outlet.is_active === 1 || outlet.status === 'active',
        createdAt: outlet.created_at,
      };
    },
    enabled: !!id,
  });

export const useGetTopOutlets = () =>
  useQuery({
    queryKey: ['outlets', 'top'],
    queryFn: async (): Promise<Array<[string, number]>> => {
      return await api.analytics.getTopOutlets();
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
      console.log('Raw Products Data:', res); // Debugging

      return res
        .filter((p: any) => {
          if (!outletId) return true;
          const pOutletId = String(p.outlet_id || p.outletId);
          return pOutletId === String(outletId);
        })
        .map((p: any) => ({
          id: String(p.id),
          name: p.name,
          price: Number(p.price),
          stock: Number(p.stock ?? 0),
          available: !!p.available,
          
          // Mapping yang kuat untuk snake_case dan camelCase
          outletId: p.outlet_id ? String(p.outlet_id) : (p.outletId ? String(p.outletId) : undefined),
          categoryId: p.category_id ? String(p.category_id) : (p.categoryId ? String(p.categoryId) : undefined),
          brandId: p.brand_id ? String(p.brand_id) : (p.brandId ? String(p.brandId) : undefined),
          
          // Nama langsung dari backend
          category: p.category_name || p.categoryName || p.category,
          brand: p.brand_name || p.brandName || p.brand,
          
          description: p.description,
          image: p.image_url || p.image,
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
   PACKAGES
===================================================== */
export const useListActivePackages = (outletId?: string | null) =>
  useQuery({
    queryKey: ['packages', outletId],
    queryFn: async (): Promise<ProductPackage[]> => {
      const res = await api.packages.getAll();
      
      return res
        .filter((p: any) => {
          if (!outletId) return true;
          const pOutletId = String(p.outletId || p.outlet_id);
          return pOutletId === String(outletId);
        })
        .map((p: any) => {
          const rawComponents = p.items || p.components || [];
          const parsedComponents = safeParse(rawComponents);

          const mappedComponents = parsedComponents.map((c: any) => ({
            productId: String(c.productId || c.product_id),
            quantity: Number(c.quantity)
          }));

          return {
            id: String(p.id),
            name: p.name,
            price: Number(p.price),
            items: mappedComponents,     // Standardize to 'items'
            components: mappedComponents, // Keep 'components' for backward compat
            outletId: p.outletId ? String(p.outletId) : (p.outlet_id ? String(p.outlet_id) : undefined),
            isActive: p.isActive || p.is_active === true || p.is_active === 1,
          };
        });
    },
  });

export const useCreatePackage = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => api.packages.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['packages'] }),
  });
};

export const useUpdatePackage = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string } & any) => api.packages.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['packages'] }),
  });
};

export const useMarkPackageInactive = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.packages.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['packages'] }),
  });
};

/* =====================================================
   BUNDLES
===================================================== */
export const useListActiveBundles = (outletId?: string | null) =>
  useQuery({
    queryKey: ['bundles', outletId],
    queryFn: async (): Promise<Bundle[]> => {
      const res = await api.bundles.getAll();
      
      return res
        .filter((b: any) => {
          if (!outletId) return true;
          const bOutletId = String(b.outletId || b.outlet_id);
          return bOutletId === String(outletId);
        })
        .map((b: any) => {
          const rawItems = b.items || [];
          const parsedItems = safeParse(rawItems);

          const mappedItems = parsedItems.map((i: any) => ({
            productId: i.productId || i.product_id ? String(i.productId || i.product_id) : '',
            packageId: i.packageId || i.package_id ? String(i.packageId || i.package_id) : '',
            quantity: Number(i.quantity),
            isPackage: !!(i.isPackage || i.is_package)
          }));

          return {
            id: String(b.id),
            name: b.name,
            price: Number(b.price),
            items: mappedItems,
            outletId: b.outletId ? String(b.outletId) : (b.outlet_id ? String(b.outlet_id) : undefined),
            active: b.active || b.is_active === true || b.is_active === 1,
          };
        });
    },
  });

export const useCreateBundle = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => api.bundles.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['bundles'] }),
  });
};

export const useUpdateBundle = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string } & any) => api.bundles.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['bundles'] }),
  });
};

export const useMarkBundleInactive = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.bundles.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['bundles'] }),
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
   CUSTOMER & STAFF
===================================================== */

export const useGetAllCustomers = () =>
  useQuery({
    queryKey: ['customers'],
    queryFn: async () => {
      const res = await api.customers.getAll();
      return Array.isArray(res) ? res : [];
    },
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
        outletId: u.outlet_id ? String(u.outlet_id) : (u.outletId ? String(u.outletId) : undefined),
      }));
    },
  });

export const useListAllUsers = () =>
  useQuery({
    queryKey: ['staff'],
    queryFn: async () => {
      const res = await api.staff.getAll();
      return res.map((u: any) => ({
        id: String(u.id),
        name: u.name,
        email: u.email,
        role: u.role as AppRole,
        outletId: u.outlet_id ? String(u.outlet_id) : (u.outletId ? String(u.outletId) : undefined),
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
        createdAt: t.created_at || t.timestamp,
        outletId: t.outlet_id ? String(t.outlet_id) : t.outletId,
      }));
    },
  });

export const useListMyTransactions = (outletId?: string) =>
  useQuery({
    queryKey: ['transactions', 'my', outletId],
    queryFn: async () => {
      const res = await api.transactions.getAll();
      return res
        .filter((t: any) => !outletId || String(t.outlet_id || t.outletId) === String(outletId))
        .map((t: any) => ({
          id: String(t.id),
          total: Number(t.total),
          status: t.status,
          createdAt: t.created_at || t.timestamp,
          outletId: t.outlet_id ? String(t.outlet_id) : t.outletId,
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
    queryFn: async (): Promise<Category[]> => {
      const res = await api.categories.getAll();
      return res.map((c: any) => ({
        ...c,
        id: String(c.id),
        isActive: c.is_active === true || c.is_active === 1 || c.is_active === '1',
      }));
    },
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
    queryFn: async (): Promise<Brand[]> => {
      const res = await api.brands.getAll();
      return res.map((b: any) => ({
        ...b,
        id: String(b.id),
        isActive: b.is_active === true || b.is_active === 1 || b.is_active === '1',
      }));
    },
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
      api.inventory.update(productId, quantity, 'reduce'),
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
      return await api.analytics.getDailySummary(outletId);
    },
    enabled: !!outletId,
  });

export const useGetOverallSummaryOutlet = (outletId: string) =>
  useQuery({
    queryKey: ['overallSummary', outletId],
    queryFn: async (): Promise<[number, number]> => {
      return await api.analytics.getOverallSummary(outletId);
    },
    enabled: !!outletId,
  });

export const useGetBestSellers = (outletId: string) =>
  useQuery({
    queryKey: ['bestSellers', outletId],
    queryFn: async (): Promise<Array<[string, number]>> => {
      return await api.analytics.getBestSellers(outletId);
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
      return [] as any[];
    },
  });

export const useGetPaymentSettings = () =>
  useQuery({
    queryKey: ['paymentSettings'],
    queryFn: async () => {
      return {
        qrisEnabled: false,
        uploadEnabled: true,
        takeawayEnabled: false,
        deliveryEnabled: false,
        qrisStaticEnabled: false,
        bankTransferEnabled: false,
        qrisStaticImageBlob: null,
        qrisMerchantName: '',
        bankName: '',
        bankAccountNumber: '',
        bankAccountName: '',
      };
    },
  });

export const useUploadPaymentProof = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { transactionId: string; file: File }) => {
      return { success: true };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['userTransactionHistory'] });
    },
  });
};

export const useCreateUser = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => api.staff.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['staff'] }),
  });
};