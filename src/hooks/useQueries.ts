import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { 
  Product, ProductPackage, Bundle, TransactionItem, PaymentMethod, GuestCustomerData, Principal, UserProfile, AppRole, Outlet, Expense, CashflowSummary 
} from '../types';
// --- AUTH HOOKS ---
export const useIsCallerAdmin = () => {
  return useQuery({
    queryKey: ['me', 'isAdmin'],
    queryFn: async () => {
      try {
        const data = await api.auth.me();
        return ['owner', 'admin', 'administrator'].includes(data.user?.role);
      } catch (e) {
        return false;
      }
    },
    initialData: false
  });
};

export const useGetCallerUserProfile = () => {
  return useQuery({
    queryKey: ['userProfile'],
    queryFn: async () => {
      const data = await api.auth.me();
      return {
        ...data.user,
        outletId: data.user.outletId === 'none' ? undefined : data.user.outletId
      };
    }
  });
};

// --- OUTLET HOOKS ---
export const useListOutlets = () => {
  return useQuery({
    queryKey: ['outlets'],
    queryFn: async () => {
      const outlets = await api.outlets.getAll();
      // Transform ke format yang diharapkan Admin Page (isActive boolean, createdAt BigInt)
      return outlets.map((o: any) => ({
        ...o,
        isActive: o.status === 'active' || o.isActive === true,
        createdAt: BigInt(Date.now() * 1000000) // Mock timestamp jika API tidak menyediakan
      })) as Outlet[];
    },
  });
};

export const useAddOutlet = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.outlets.create,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['outlets'] }),
  });
};

export const useUpdateOutlet = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string; name: string; address: string; isActive?: boolean }) => 
      api.outlets.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['outlets'] }),
  });
};

// --- PRODUCT & PACKAGE HOOKS ---
export const useListProductsByOutlet = (outletId?: string | bigint | null) => {
  const strOutletId = outletId?.toString();
  return useQuery({
    queryKey: ['products', strOutletId],
    queryFn: api.products.getAll,
    select: (products) => {
      let filtered = products;
      if (strOutletId && strOutletId !== 'all') {
        filtered = products.filter(p => !p.outletId || p.outletId === strOutletId);
      }
      // Konversi ke BigInt untuk kompatibilitas POS
      return filtered.map(p => ({
        ...p,
        price: BigInt(p.price),
        stock: BigInt(p.stock || 0),
        isDeleted: !p.available
      })) as Product[];
    }
  });
};

export const useGetExpenses = (outletId?: string) => {
  return useQuery({
    queryKey: ['expenses', outletId],
    queryFn: () => api.expenses.getAll(outletId),
  });
};

export const useAddExpense = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Expense>) => api.expenses.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['cashflow'] }); // Refresh cashflow juga
    },
  });
};

export const useUpdateExpense = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string } & Partial<Expense>) => 
      api.expenses.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['cashflow'] });
    },
  });
};

export const useDeleteExpense = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.expenses.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['cashflow'] });
    },
  });
};

// --- CASHFLOW HOOKS ---

export const useGetCashflowSummary = (period: 'daily' | 'weekly' | 'monthly' = 'monthly', outletId?: string) => {
  return useQuery({
    queryKey: ['cashflow', period, outletId],
    queryFn: () => api.cashflow.getSummary(period, outletId),
  });
};

export const useListActivePackages = (outletId?: string | bigint | null) => {
  return useQuery({
    queryKey: ['packages'],
    queryFn: async () => {
      // @ts-ignore
      const data = api.packages ? await api.packages.getAll() : [];
      return data.map((pkg: any) => ({
        ...pkg,
        price: BigInt(pkg.price || 0),
        items: pkg.items || [],
        isActive: true
      })) as ProductPackage[];
    }
  });
};

export const useListActiveBundles = (outletId?: string | bigint | null) => {
  return useQuery({
    queryKey: ['bundles'],
    queryFn: async () => {
      // @ts-ignore
      const data = api.bundles ? await api.bundles.getAll() : [];
      return data.map((b: any) => ({
        ...b,
        price: BigInt(b.price || 0)
      })) as Bundle[];
    }
  });
};

// --- CUSTOMER HOOKS ---
export const useGetAllCustomers = () => {
  return useQuery({
    queryKey: ['customers'],
    queryFn: async () => {
      const customers = await api.customers.getAll();
      // MAPPING PENTING: Ubah Customer[] menjadi [Principal, UserProfile][]
      // Karena CustomerManagementPage.tsx mengharapkan format Tuple ini.
      return customers.map(c => [
        new Principal(c.id), 
        {
          name: c.name,
          role: AppRole.cashier, // Default placeholder
          registeredAt: BigInt(Date.now() * 1000000), // Mock timestamp
          email: c.name.toLowerCase() + '@example.com' // Mock email
        }
      ]) as [Principal, UserProfile][];
    },
  });
};

// --- STAFF HOOKS (Untuk StaffManagementPage) ---
export const useListAllUsers = () => {
  return useQuery({
    queryKey: ['staff'],
    queryFn: async () => {
      const users = await api.staff.getAll();
      // Mapping ke format Tuple [Principal, UserProfile] jika diperlukan oleh StaffPage lama
      // Atau biarkan jika StaffPage menggunakan object
      // Berdasarkan error log, StaffPage error di AppRole, jadi kita asumsikan object
      // Tapi untuk aman, kita kembalikan array yang propertinya lengkap
      return users.map(u => {
        // Jika page mengharapkan tuple:
        return [
           new Principal(u.id),
           {
             name: u.name,
             email: u.email,
             role: u.role as AppRole,
             outletId: u.outletId
           }
        ];
      });
    }
  });
};

export const useUpdateUserProfile = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, profile }: { userId: any, profile: any }) => {
      const id = userId.toString();
      const payload = {
        name: profile.name,
        role: profile.role,
        outletId: profile.outletId
      };
      return api.staff.update(id, payload);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['staff'] })
  });
};

export const useRemoveUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (principal: any) => api.staff.delete(principal.toString()),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['staff'] })
  });
};

// --- TRANSACTION HOOKS ---
export const useListAllTransactions = () => {
  return useQuery({
    queryKey: ['orders'],
    queryFn: async () => {
      const orders = await api.transactions.getAll();
      return orders.map((o: any) => ({
        ...o,
        id: BigInt(o.id),
        total: BigInt(o.total || 0),
        timestamp: BigInt(Date.parse(o.created_at || new Date().toISOString()) * 1000000),
        userId: o.user_id || 'guest'
      }));
    },
  });
};

export const useCreateTransaction = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { items: TransactionItem[]; outletId: string | bigint; paymentMethods: PaymentMethod[]; guestData?: GuestCustomerData | null }) => {
      const payload = {
        outlet_id: data.outletId.toString(),
        items: data.items.map(i => ({
          product_id: i.productId,
          quantity: Number(i.quantity),
          price: Number(i.price),
          is_package: i.isPackage,
          is_bundle: i.isBundle
        })),
        payment_methods: data.paymentMethods.map(p => ({
          method: p.methodName,
          category: p.category,
          amount: Number(p.amount)
        })),
        customer: data.guestData
      };
      const res = await api.transactions.create(payload);
      return BigInt(res.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
};

export const useUpdateTransactionStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ transactionId, newStatus }: { transactionId: bigint; newStatus: string }) => 
      api.transactions.updateStatus(transactionId.toString(), newStatus),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['orders'] }),
  });
};

export const useGetAllCategories = () => {
  return useQuery({
    queryKey: ['categories'],
    queryFn: api.categories.getAll,
  });
};

export const useCreateCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.categories.create,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['categories'] }),
  });
};

export const useUpdateCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string } & Partial<Category>) => 
      api.categories.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['categories'] }),
  });
};

// --- BRAND HOOKS ---
export const useGetAllBrands = () => {
  return useQuery({
    queryKey: ['brands'],
    queryFn: api.brands.getAll,
  });
};

export const useCreateBrand = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.brands.create,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['brands'] }),
  });
};

export const useUpdateBrand = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string } & Partial<Brand>) => 
      api.brands.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['brands'] }),
  });
};

export const useDeleteBrand = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.brands.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['brands'] }),
  });
};

export const useGetUserTransactionHistory = () => useQuery({ queryKey: ['my-orders'], queryFn: () => [] });
export const useGetPaymentSettings = () => useQuery({ queryKey: ['payment-settings'], queryFn: () => ({}) });
export const useUploadPaymentProof = () => useMutation({ mutationFn: async () => {} });
export const useListStaff = () => useQuery({ queryKey: ['staff-raw'], queryFn: api.staff.getAll });