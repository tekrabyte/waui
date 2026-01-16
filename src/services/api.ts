import { 
  Product, Staff, Outlet, InventoryItem, Category, 
  Expense, CashflowSummary, Brand, Package, Bundle, 
  Transaction, StockLog, Customer, Table
} from '../types/types';

// Sesuaikan URL ini dengan alamat WordPress Anda
const BASE_URL = 'https://erpos.tekrabyte.id/wp-json/posq/v1';

// --- HELPER FUNCTIONS ---

const getAuthHeaders = () => {
  const token = localStorage.getItem('posq_token');
  return {
    'Content-Type': 'application/json',
    // Backend mendukung header Authorization: Bearer atau X-Posq-Token
    'Authorization': token ? `Bearer ${token}` : '',
  };
};

const handleResponse = async (response: Response) => {
  const data = await response.json();
  if (!response.ok) {
    // Menangkap error dari WP_Error
    const error = (data && data.message) || (data && data.code) || response.statusText;
    throw new Error(error);
  }
  return data;
};

// --- API SERVICE OBJECT ---

export const api = {
  // 1. AUTHENTICATION
  auth: {
    login: async (username: string, password: string) => {
      const response = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      return handleResponse(response);
    },
    me: async () => {
      const response = await fetch(`${BASE_URL}/auth/me`, { headers: getAuthHeaders() });
      return handleResponse(response);
    },
    isAdmin: async () => {
      const response = await fetch(`${BASE_URL}/auth/is-admin`, { headers: getAuthHeaders() });
      return handleResponse(response);
    }
  },

  // 2. STAFF / USERS
  staff: {
    getAll: async (): Promise<Staff[]> => {
      const response = await fetch(`${BASE_URL}/users`, { headers: getAuthHeaders() });
      const data = await handleResponse(response);
      
      // Mapping dari format WP (posq-backend.php) ke format Frontend
      return data.map((user: any) => ({
        id: String(user.id),
        name: user.name,
        email: user.email,
        username: user.username,
        role: user.role,
        outletId: user.outletId || 'none',
        status: user.status || 'active',
        avatar: user.avatar,
      }));
    },
    create: async (staffData: any) => {
      // Backend: create_user
      const payload = {
        username: staffData.username || staffData.email, // WP butuh username
        email: staffData.email,
        password: staffData.password,
        name: staffData.name,
        role: staffData.role,
        outletId: staffData.outletId === 'none' ? null : staffData.outletId,
      };
      const response = await fetch(`${BASE_URL}/users`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });
      return handleResponse(response);
    },
    update: async (id: string, staffData: any) => {
      // Backend: update_user
      const payload: any = { id };
      if (staffData.name) payload.name = staffData.name;
      if (staffData.email) payload.email = staffData.email;
      if (staffData.role) payload.role = staffData.role;
      if (staffData.outletId) payload.outletId = staffData.outletId === 'none' ? null : staffData.outletId;
      if (staffData.password) payload.password = staffData.password;

      const response = await fetch(`${BASE_URL}/users/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });
      return handleResponse(response);
    },
    delete: async (id: string) => {
      const response = await fetch(`${BASE_URL}/users/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      return handleResponse(response);
    }
  },

  // 3. OUTLETS
  outlets: {
    getAll: async (): Promise<Outlet[]> => {
      const response = await fetch(`${BASE_URL}/outlets`, { headers: getAuthHeaders() });
      const data = await handleResponse(response);
      return data.map((item: any) => ({
        id: String(item.id),
        name: item.name,
        address: item.address,
        status: item.is_active ? 'active' : 'inactive',
        createdAt: item.created_at
      }));
    },
    create: async (data: any) => {
      const response = await fetch(`${BASE_URL}/outlets`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      });
      return handleResponse(response);
    },
    update: async (id: string, data: any) => {
      const response = await fetch(`${BASE_URL}/outlets/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      });
      return handleResponse(response);
    },
    delete: async (id: string) => {
      const response = await fetch(`${BASE_URL}/outlets/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      return handleResponse(response);
    }
  },

  // 4. PRODUCTS
  products: {
    getAll: async (): Promise<Product[]> => {
      const response = await fetch(`${BASE_URL}/products`, { headers: getAuthHeaders() });
      const data = await handleResponse(response);
      return data.map((item: any) => ({
        id: String(item.id),
        name: item.name,
        price: Number(item.price),
        category: item.category_name || 'Uncategorized',
        categoryId: item.category_id ? String(item.category_id) : undefined,
        brand: item.brand_name || undefined,
        brandId: item.brand_id ? String(item.brand_id) : undefined,
        image: item.image_url,
        description: item.description,
        stock: Number(item.stock || 0), 
        outletId: item.outlet_id ? String(item.outlet_id) : undefined,
        available: true, // Backend defaultnya aktif jika tidak deleted
        // Promo fields
        promoEnabled: !!item.promo_enabled,
        promoType: item.promo_type || 'fixed',
        promoValue: item.promo_value ? Number(item.promo_value) : undefined,
        promoDays: item.promo_days ? (typeof item.promo_days === 'string' ? JSON.parse(item.promo_days) : item.promo_days) : undefined,
        promoStartTime: item.promo_start_time || undefined,
        promoEndTime: item.promo_end_time || undefined,
        promoStartDate: item.promo_start_date || undefined,
        promoEndDate: item.promo_end_date || undefined,
        promoMinPurchase: item.promo_min_purchase ? Number(item.promo_min_purchase) : undefined,
        promoDescription: item.promo_description || undefined,
        appliedPromoId: item.applied_promo_id ? String(item.applied_promo_id) : undefined,
      }));
    },
    getOne: async (id: string): Promise<Product> => {
      const response = await fetch(`${BASE_URL}/products/${id}`, { headers: getAuthHeaders() });
      const item = await handleResponse(response);
      return {
        id: String(item.id),
        name: item.name,
        price: Number(item.price),
        category: item.category_name,
        categoryId: item.category_id,
        brand: item.brand_name,
        brandId: item.brand_id,
        image: item.image_url,
        description: item.description,
        stock: Number(item.stock),
        outletId: String(item.outlet_id),
        available: true
      };
    },
    search: async (params: { keyword?: string, outletId?: string, categoryId?: string, brandId?: string }) => {
      const query = new URLSearchParams(params as any).toString();
      const response = await fetch(`${BASE_URL}/products/search?${query}`, { headers: getAuthHeaders() });
      return handleResponse(response);
    },
    create: async (data: any) => {
      const response = await fetch(`${BASE_URL}/products`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      });
      return handleResponse(response);
    },
    update: async (id: string, data: any) => {
      const response = await fetch(`${BASE_URL}/products/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      });
      return handleResponse(response);
    },
    delete: async (id: string) => {
      const response = await fetch(`${BASE_URL}/products/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      return handleResponse(response);
    }
  },

  // 5. PACKAGES
  packages: {
    getAll: async (): Promise<Package[]> => {
      const response = await fetch(`${BASE_URL}/packages`, { headers: getAuthHeaders() });
      const data = await handleResponse(response);
      // Map backend response (snake_case) to frontend format (camelCase)
      return data.map((pkg: any) => ({
        id: String(pkg.id),
        name: pkg.name,
        price: Number(pkg.price),
        outletId: pkg.outlet_id ? String(pkg.outlet_id) : undefined,
        categoryId: pkg.category_id ? String(pkg.category_id) : undefined,
        image: pkg.image_url || undefined,
        components: (pkg.components || []).map((comp: any) => ({
          productId: String(comp.product_id),
          quantity: Number(comp.quantity),
        })),
        isActive: !!pkg.is_active,
        available: !!pkg.is_active,
        createdAt: pkg.created_at,
        // Promo fields
        promoEnabled: !!pkg.promo_enabled,
        promoType: pkg.promo_type || 'fixed',
        promoValue: pkg.promo_value ? Number(pkg.promo_value) : undefined,
        promoDays: pkg.promo_days ? (typeof pkg.promo_days === 'string' ? JSON.parse(pkg.promo_days) : pkg.promo_days) : undefined,
        promoStartTime: pkg.promo_start_time || undefined,
        promoEndTime: pkg.promo_end_time || undefined,
        promoStartDate: pkg.promo_start_date || undefined,
        promoEndDate: pkg.promo_end_date || undefined,
        promoMinPurchase: pkg.promo_min_purchase ? Number(pkg.promo_min_purchase) : undefined,
        promoDescription: pkg.promo_description || undefined,
        appliedPromoId: pkg.applied_promo_id ? String(pkg.applied_promo_id) : undefined,
      }));
    },
    create: async (data: any) => {
      const response = await fetch(`${BASE_URL}/packages`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      });
      return handleResponse(response);
    },
    update: async (id: string, data: any) => {
      const response = await fetch(`${BASE_URL}/packages/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      });
      return handleResponse(response);
    },
    delete: async (id: string) => {
      const response = await fetch(`${BASE_URL}/packages/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      return handleResponse(response);
    }
  },

  // 6. BUNDLES (New Feature in Backend)
  bundles: {
    getAll: async (): Promise<Bundle[]> => {
      const response = await fetch(`${BASE_URL}/bundles`, { headers: getAuthHeaders() });
      const data = await handleResponse(response);
      // Map backend response (snake_case) to frontend format (camelCase)
      return data.map((bundle: any) => ({
        id: String(bundle.id),
        name: bundle.name,
        price: Number(bundle.price),
        outletId: bundle.outlet_id ? String(bundle.outlet_id) : '0',
        categoryId: bundle.category_id ? String(bundle.category_id) : undefined,
        image: bundle.image_url || undefined,
        items: (bundle.items || []).map((item: any) => ({
          productId: item.product_id ? String(item.product_id) : undefined,
          packageId: item.package_id ? String(item.package_id) : undefined,
          quantity: Number(item.quantity),
          isPackage: !!item.is_package,
        })),
        active: !!bundle.is_active,
        isActive: !!bundle.is_active,
        available: !!bundle.is_active,
        createdAt: bundle.created_at,
        // Manual stock fields
        manualStockEnabled: !!bundle.manual_stock_enabled,
        manualStock: bundle.manual_stock ? Number(bundle.manual_stock) : undefined,
        // Promo fields
        promoEnabled: !!bundle.promo_enabled,
        promoType: bundle.promo_type || 'fixed',
        promoValue: bundle.promo_value ? Number(bundle.promo_value) : undefined,
        promoDays: bundle.promo_days ? (typeof bundle.promo_days === 'string' ? JSON.parse(bundle.promo_days) : bundle.promo_days) : undefined,
        promoStartTime: bundle.promo_start_time || undefined,
        promoEndTime: bundle.promo_end_time || undefined,
        promoStartDate: bundle.promo_start_date || undefined,
        promoEndDate: bundle.promo_end_date || undefined,
        promoMinPurchase: bundle.promo_min_purchase ? Number(bundle.promo_min_purchase) : undefined,
        promoDescription: bundle.promo_description || undefined,
        appliedPromoId: bundle.applied_promo_id ? String(bundle.applied_promo_id) : undefined,
      }));
    },
    create: async (data: any) => {
      const response = await fetch(`${BASE_URL}/bundles`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      });
      return handleResponse(response);
    },
    update: async (id: string, data: any) => {
      const response = await fetch(`${BASE_URL}/bundles/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      });
      return handleResponse(response);
    },
    delete: async (id: string) => {
      const response = await fetch(`${BASE_URL}/bundles/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      return handleResponse(response);
    }
  },

  // 7. STOCK MANAGEMENT (Inventory)
  stock: {
    // Menambah stok (Restocking)
    add: async (productId: string, quantity: number) => {
      const response = await fetch(`${BASE_URL}/stock/add`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ productId, quantity }),
      });
      return handleResponse(response);
    },
    // Mengurangi stok (Waste, etc)
    reduce: async (productId: string, quantity: number) => {
      const response = await fetch(`${BASE_URL}/stock/reduce`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ productId, quantity }),
      });
      return handleResponse(response);
    },
    // Transfer stok antar outlet
    transfer: async (productId: string, toOutletId: string, quantity: number) => {
      const response = await fetch(`${BASE_URL}/stock/transfer`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ productId, toOutletId, quantity }),
      });
      return handleResponse(response);
    },
    // Mengambil history log stok
    getLogs: async (): Promise<StockLog[]> => {
      const response = await fetch(`${BASE_URL}/stock/logs`, { headers: getAuthHeaders() });
      return handleResponse(response);
    }
  },

  // 8. CATEGORIES
  categories: {
    getAll: async (): Promise<Category[]> => {
      const response = await fetch(`${BASE_URL}/categories`, { headers: getAuthHeaders() });
      const data = await handleResponse(response);
      return data.map((c: any) => ({
        id: String(c.id),
        name: c.name,
        icon: 'Box', // Backend tidak simpan icon, default frontend
        description: c.description,
        isActive: c.is_active
      }));
    },
    create: async (data: any) => {
      const response = await fetch(`${BASE_URL}/categories`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data)
      });
      return handleResponse(response);
    },
    update: async (id: string, data: any) => {
      const response = await fetch(`${BASE_URL}/categories/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(data)
      });
      return handleResponse(response);
    },
    delete: async (id: string) => {
      const response = await fetch(`${BASE_URL}/categories/${id}`, {
         method: 'DELETE',
         headers: getAuthHeaders()
      });
      return handleResponse(response);
    }
  },

  // 9. BRANDS
  brands: {
    getAll: async (): Promise<Brand[]> => {
      const response = await fetch(`${BASE_URL}/brands`, { headers: getAuthHeaders() });
      const data = await handleResponse(response);
      return data.map((b: any) => ({
        id: String(b.id),
        name: b.name,
        description: b.description,
        isActive: b.is_active
      }));
    },
    create: async (data: any) => {
       const response = await fetch(`${BASE_URL}/brands`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data)
      });
      return handleResponse(response);
    },
    update: async (id: string, data: any) => {
      const response = await fetch(`${BASE_URL}/brands/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(data)
      });
      return handleResponse(response);
    },
    delete: async (id: string) => {
       const response = await fetch(`${BASE_URL}/brands/${id}`, {
         method: 'DELETE',
         headers: getAuthHeaders()
      });
      return handleResponse(response);
    }
  },

  // 10. TRANSACTIONS / ORDERS
  transactions: {
    getAll: async (): Promise<Transaction[]> => {
      // Backend endpoint: /transactions
      const response = await fetch(`${BASE_URL}/transactions`, { headers: getAuthHeaders() });
      return handleResponse(response);
    },
    create: async (orderData: any) => {
      // Payload harus sesuai: { items: [], paymentMethods: [], outletId: int }
      const response = await fetch(`${BASE_URL}/transactions`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(orderData)
      });
      return handleResponse(response);
    }
  },

  // 11. EXPENSES
  expenses: {
    getAll: async (outletId?: string): Promise<Expense[]> => {
      const url = outletId ? `${BASE_URL}/expenses?outlet_id=${outletId}` : `${BASE_URL}/expenses`;
      const response = await fetch(url, { headers: getAuthHeaders() });
      const data = await handleResponse(response);
      return data.map((e: any) => ({
        id: String(e.id),
        title: e.title || e.description || 'Pengeluaran',
        amount: Number(e.amount),
        category: e.category || 'Lainnya',
        description: e.description || e.note,
        type: e.type || 'expense',
        paymentMethod: e.payment_method,
        imageUrl: e.image_url,
        date: e.date || e.timestamp || e.created_at,
        note: e.note,
        outletId: e.outlet_id ? String(e.outlet_id) : undefined,
        outletName: e.outlet_name,
        timestamp: e.timestamp || e.date || e.created_at
      }));
    },
    create: async (data: any) => {
      const payload: any = {
        title: data.title || data.description || 'Pengeluaran',
        amount: Number(data.amount),
        category: data.category || 'Lainnya',
        description: data.description || data.note || '',
        note: data.note || '',
        type: data.type || 'expense',
        outletId: data.outletId
      };
      if (data.paymentMethod) payload.paymentMethod = data.paymentMethod;
      if (data.imageUrl) payload.imageUrl = data.imageUrl;
      if (data.timestamp) payload.timestamp = data.timestamp;
      
      const response = await fetch(`${BASE_URL}/expenses`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload)
      });
      return handleResponse(response);
    },
    update: async (id: string, data: any) => {
      const payload: any = {};
      if (data.title) payload.title = data.title;
      if (data.amount) payload.amount = Number(data.amount);
      if (data.category) payload.category = data.category;
      if (data.description) payload.description = data.description;
      if (data.note !== undefined) payload.note = data.note;
      if (data.type) payload.type = data.type;
      if (data.paymentMethod !== undefined) payload.paymentMethod = data.paymentMethod;
      if (data.imageUrl !== undefined) payload.imageUrl = data.imageUrl;
      if (data.outletId) payload.outletId = data.outletId;
      if (data.timestamp) payload.timestamp = data.timestamp;
      
      const response = await fetch(`${BASE_URL}/expenses/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload)
      });
      return handleResponse(response);
    },
    delete: async (id: string) => {
      const response = await fetch(`${BASE_URL}/expenses/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      return handleResponse(response);
    }
  },

  // 11b. CASHFLOW CATEGORIES
  cashflowCategories: {
    getAll: async () => {
      const response = await fetch(`${BASE_URL}/cashflow-categories`, { headers: getAuthHeaders() });
      return handleResponse(response);
    },
    create: async (data: any) => {
      const response = await fetch(`${BASE_URL}/cashflow-categories`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data)
      });
      return handleResponse(response);
    },
    update: async (id: string, data: any) => {
      const response = await fetch(`${BASE_URL}/cashflow-categories/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(data)
      });
      return handleResponse(response);
    },
    delete: async (id: string) => {
      const response = await fetch(`${BASE_URL}/cashflow-categories/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      return handleResponse(response);
    }
  },

  // 12. ANALYTICS / REPORTS
  // Backend sekarang menyediakan endpoint khusus laporan, tidak perlu hitung manual di frontend
  reports: {
    getTopOutlets: async (): Promise<Array<{outlet_id: string, revenue: number}>> => {
      const response = await fetch(`${BASE_URL}/reports/top-outlets`, { headers: getAuthHeaders() });
      return handleResponse(response);
    },
    
    getDailySummary: async (outletId?: string) => {
      let url = `${BASE_URL}/reports/daily-summary`;
      if (outletId) url += `?outlet_id=${outletId}`; // Note: Backend implementation might need outlet_id check update if generic
      const response = await fetch(url, { headers: getAuthHeaders() });
      return handleResponse(response);
    },
    
    getOverallSummary: async () => {
      const response = await fetch(`${BASE_URL}/reports/overall-summary`, { headers: getAuthHeaders() });
      return handleResponse(response);
    },
    
    getBestSellers: async () => {
      const response = await fetch(`${BASE_URL}/reports/best-sellers`, { headers: getAuthHeaders() });
      return handleResponse(response);
    },

    getCashflow: async (period: 'daily' | 'weekly' | 'monthly' = 'monthly', outletId?: string): Promise<CashflowSummary> => {
      let url = `${BASE_URL}/reports/cashflow?period=${period}`;
      if (outletId && outletId !== 'all') url += `&outlet_id=${outletId}`;
      const response = await fetch(url, { headers: getAuthHeaders() });
      const data = await handleResponse(response);
      return {
        totalIncome: Number(data.total_income || 0),
        totalExpense: Number(data.total_expense || 0),
        netProfit: Number(data.net_profit || 0),
        period: period,
        chartData: data.chart_data || []
      };
    }
  },

  // 13. CASHFLOW (Alias for backward compatibility)
  cashflow: {
    getSummary: async (period: 'daily' | 'weekly' | 'monthly' = 'monthly', outletId?: string): Promise<CashflowSummary> => {
      let url = `${BASE_URL}/reports/cashflow?period=${period}`;
      if (outletId && outletId !== 'all') url += `&outlet_id=${outletId}`;
      const response = await fetch(url, { headers: getAuthHeaders() });
      const data = await handleResponse(response);
      return {
        totalIncome: Number(data.total_income || 0),
        totalExpense: Number(data.total_expense || 0),
        netProfit: Number(data.net_profit || 0),
        period: period,
        chartData: data.chart_data || []
      };
    }
  },

  // 14. ANALYTICS (Additional analytics endpoints)
  analytics: {
    getTopOutlets: async (): Promise<Array<[string, number]>> => {
      const response = await fetch(`${BASE_URL}/reports/top-outlets`, { headers: getAuthHeaders() });
      const data = await handleResponse(response);
      return data.map((item: any) => [item.outlet_id, item.revenue]);
    },
    
    getDailySummary: async (outletId: string) => {
      const response = await fetch(`${BASE_URL}/reports/daily-summary?outlet_id=${outletId}`, { headers: getAuthHeaders() });
      return handleResponse(response);
    },
    
    getOverallSummary: async (outletId: string): Promise<[number, number]> => {
      const response = await fetch(`${BASE_URL}/reports/overall-summary?outlet_id=${outletId}`, { headers: getAuthHeaders() });
      const data = await handleResponse(response);
      return [data.revenue || 0, data.transactions || 0];
    },
    
    getBestSellers: async (outletId: string): Promise<Array<[string, number]>> => {
      const response = await fetch(`${BASE_URL}/reports/best-sellers?outlet_id=${outletId}`, { headers: getAuthHeaders() });
      const data = await handleResponse(response);
      return data.map((item: any) => [item.product_name, item.quantity]);
    }
  },
// 15. CUSTOMERS (DIKEMBALIKAN)
  customers: {
    getAll: async (): Promise<Customer[]> => {
      const response = await fetch(`${BASE_URL}/customers`, { headers: getAuthHeaders() });
      const data = await handleResponse(response);
      return data.map((c: any) => ({
        id: String(c.id),
        name: c.name,
        email: c.email,
        phone: c.phone,
        address: c.address,
        avatar: '', // Backend belum support avatar customer
        lastOrder: '', // Perlu query tambahan jika ingin data ini
        status: 'offline', // Default value
        registeredAt: new Date(c.created_at).getTime()
      }));
    },
    create: async (data: any) => {
      const response = await fetch(`${BASE_URL}/customers`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data)
      });
      return handleResponse(response);
    },
    update: async (id: string, data: any) => {
      const response = await fetch(`${BASE_URL}/customers/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(data)
      });
      return handleResponse(response);
    },
    delete: async (id: string) => {
      const response = await fetch(`${BASE_URL}/customers/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      return handleResponse(response);
    }
  },
  // 16. SETTINGS
  settings: {
    getMenuAccess: async (): Promise<any> => {
      const response = await fetch(`${BASE_URL}/settings/menu-access`, { headers: getAuthHeaders() });
      return handleResponse(response);
    },
    saveMenuAccess: async (config: any) => {
      const response = await fetch(`${BASE_URL}/settings/menu-access`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(config)
      });
      return handleResponse(response);
    },
    getRoleMenuAccess: async () => {
       const response = await fetch(`${BASE_URL}/settings/role-menu-access`, { headers: getAuthHeaders() });
       return handleResponse(response);
    }
  },

  // 17. IMAGE UPLOAD
  images: {
    upload: async (file: File) => {
      const token = localStorage.getItem('posq_token');
      console.log('[API] Starting image upload:', {
        filename: file.name,
        size: file.size,
        type: file.type,
        hasToken: !!token
      });
      
      const formData = new FormData();
      formData.append('image', file);

      try {
        const response = await fetch(`${BASE_URL}/upload-image`, {
          method: 'POST',
          headers: {
            'Authorization': token ? `Bearer ${token}` : '',
          },
          body: formData,
        });

        console.log('[API] Upload response status:', response.status);
        const result = await handleResponse(response);
        console.log('[API] Upload success:', result);
        return result;
      } catch (error) {
        console.error('[API] Upload fetch error:', error);
        throw error;
      }
    }
  },

  // 18. PAYMENT METHODS CONFIGURATION
  paymentMethods: {
    getAll: async () => {
      const response = await fetch(`${BASE_URL}/payment-methods`, { headers: getAuthHeaders() });
      return handleResponse(response);
    },
    update: async (id: string, data: any) => {
      const response = await fetch(`${BASE_URL}/payment-methods/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(data)
      });
      return handleResponse(response);
    },
    createCustom: async (data: any) => {
      const response = await fetch(`${BASE_URL}/payment-methods/custom`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data)
      });
      return handleResponse(response);
    },
    deleteCustom: async (id: string) => {
      const response = await fetch(`${BASE_URL}/payment-methods/custom/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      return handleResponse(response);
    }
  },

  // 19. TABLES (Table Management for Dine-in)
  tables: {
    // Get all tables from localStorage
    getAll: async (): Promise<Table[]> => {
      const tablesData = localStorage.getItem('posq_tables');
      if (!tablesData) {
        // Return default tables if none exist
        const defaultTables: Table[] = [
          { id: '1', tableNumber: 'T-01', capacity: 4, status: 'available', area: 'Indoor', isActive: true, createdAt: new Date().toISOString() },
          { id: '2', tableNumber: 'T-02', capacity: 2, status: 'available', area: 'Indoor', isActive: true, createdAt: new Date().toISOString() },
          { id: '3', tableNumber: 'T-03', capacity: 6, status: 'available', area: 'Outdoor', isActive: true, createdAt: new Date().toISOString() },
        ];
        localStorage.setItem('posq_tables', JSON.stringify(defaultTables));
        return defaultTables;
      }
      return JSON.parse(tablesData);
    },

    // Create new table
    create: async (data: Partial<Table>): Promise<Table> => {
      const tables = await api.tables.getAll();
      const newTable: Table = {
        id: Date.now().toString(),
        tableNumber: data.tableNumber || '',
        capacity: data.capacity || 2,
        status: 'available',
        area: data.area || 'Indoor',
        isActive: true,
        createdAt: new Date().toISOString()
      };
      const updatedTables = [...tables, newTable];
      localStorage.setItem('posq_tables', JSON.stringify(updatedTables));
      return newTable;
    },

    // Update table
    update: async (id: string, data: Partial<Table>): Promise<Table> => {
      const tables = await api.tables.getAll();
      const updatedTables = tables.map(table => 
        table.id === id ? { ...table, ...data } : table
      );
      localStorage.setItem('posq_tables', JSON.stringify(updatedTables));
      const updated = updatedTables.find(t => t.id === id);
      if (!updated) throw new Error('Table not found');
      return updated;
    },

    // Delete table
    delete: async (id: string): Promise<void> => {
      const tables = await api.tables.getAll();
      const updatedTables = tables.filter(table => table.id !== id);
      localStorage.setItem('posq_tables', JSON.stringify(updatedTables));
    },

    // Update table status
    updateStatus: async (id: string, status: 'available' | 'occupied' | 'reserved', orderId?: string): Promise<Table> => {
      const tables = await api.tables.getAll();
      const updatedTables = tables.map(table => 
        table.id === id ? { ...table, status, currentOrderId: orderId } : table
      );
      localStorage.setItem('posq_tables', JSON.stringify(updatedTables));
      const updated = updatedTables.find(t => t.id === id);
      if (!updated) throw new Error('Table not found');
      return updated;
    }
  },

  inventory: {
    update: async (productId: string, quantity: number, action: 'add' | 'reduce') => {
      const endpoint = action === 'add' ? 'add' : 'reduce';
      const response = await fetch(`${BASE_URL}/stock/${endpoint}`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ productId, quantity })
      });
      return handleResponse(response);
    }
  },

  // 20. STANDALONE PROMOS
  standalonePromos: {
    getAll: async () => {
      const response = await fetch(`${BASE_URL}/standalone-promos`, { headers: getAuthHeaders() });
      const data = await handleResponse(response);
      return data.map((promo: any) => ({
        id: String(promo.id),
        name: promo.name,
        promoType: promo.promoType || 'fixed',
        promoValue: Number(promo.promoValue || 0),
        promoDays: promo.promoDays || [],
        promoStartTime: promo.promoStartTime || '',
        promoEndTime: promo.promoEndTime || '',
        promoStartDate: promo.promoStartDate || null,
        promoEndDate: promo.promoEndDate || null,
        promoMinPurchase: promo.promoMinPurchase ? Number(promo.promoMinPurchase) : null,
        promoDescription: promo.promoDescription || '',
        isActive: !!promo.isActive,
        createdAt: promo.createdAt
      }));
    },
    create: async (data: any) => {
      const payload = {
        name: data.name,
        promo_type: data.promoType || 'fixed',
        promo_value: Number(data.promoValue || 0),
        promo_days: JSON.stringify(data.promoDays || []),
        promo_start_time: data.promoStartTime || null,
        promo_end_time: data.promoEndTime || null,
        promo_start_date: data.promoStartDate || null,
        promo_end_date: data.promoEndDate || null,
        promo_min_purchase: data.promoMinPurchase ? Number(data.promoMinPurchase) : null,
        promo_description: data.promoDescription || ''
      };
      const response = await fetch(`${BASE_URL}/standalone-promos`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload)
      });
      return handleResponse(response);
    },
    update: async (id: string, data: any) => {
      const payload = {
        name: data.name,
        promo_type: data.promoType || 'fixed',
        promo_value: Number(data.promoValue || 0),
        promo_days: JSON.stringify(data.promoDays || []),
        promo_start_time: data.promoStartTime || null,
        promo_end_time: data.promoEndTime || null,
        promo_start_date: data.promoStartDate || null,
        promo_end_date: data.promoEndDate || null,
        promo_min_purchase: data.promoMinPurchase ? Number(data.promoMinPurchase) : null,
        promo_description: data.promoDescription || ''
      };
      const response = await fetch(`${BASE_URL}/standalone-promos/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload)
      });
      return handleResponse(response);
    },
    delete: async (id: string) => {
      const response = await fetch(`${BASE_URL}/standalone-promos/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      return handleResponse(response);
    }
  }
};

