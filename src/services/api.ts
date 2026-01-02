import { 
  Product, Staff, Outlet, InventoryItem, Category, 
  Expense, CashflowSummary, Brand, Package, Bundle, 
  Transaction, StockLog 
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
        available: true // Backend defaultnya aktif jika tidak deleted
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
        components: (pkg.components || []).map((comp: any) => ({
          productId: String(comp.product_id),
          quantity: Number(comp.quantity),
        })),
        isActive: !!pkg.is_active,
        available: !!pkg.is_active,
        createdAt: pkg.created_at,
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
        outletId: bundle.outlet_id ? String(bundle.outlet_id) : undefined,
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
        title: e.title,
        amount: Number(e.amount),
        category: e.category,
        date: e.date, // Timestamp dari backend
        note: e.note,
        outletId: e.outlet_id ? String(e.outlet_id) : undefined,
        outletName: e.outlet_name
      }));
    },
    create: async (data: any) => {
      const payload = {
        ...data,
        amount: Number(data.amount),
        outletId: data.outletId // Backend params case-sensitive di PHP ($data['outletId'])? 
        // Cek PHP: $data['outletId'] dipakai di create_expense. OK.
      };
      const response = await fetch(`${BASE_URL}/expenses`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload)
      });
      return handleResponse(response);
    },
    update: async (id: string, data: any) => {
      const payload = { ...data };
      if (payload.amount) payload.amount = Number(payload.amount);
      
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

    getCashflow: async (period: 'daily' | 'weekly' | 'monthly' = 'monthly'): Promise<CashflowSummary> => {
      const response = await fetch(`${BASE_URL}/reports/cashflow?period=${period}`, { headers: getAuthHeaders() });
      const data = await handleResponse(response);
      return {
        totalIncome: BigInt(data.total_income || 0),
        totalExpense: BigInt(data.total_expense || 0),
        netProfit: BigInt(data.net_profit || 0),
        period: period,
        chartData: data.chart_data || []
      };
    }
  },
// 14. CUSTOMERS (DIKEMBALIKAN)
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
  // 13. SETTINGS
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
};

// Note:
// Endpoint 'customers' dihapus karena tidak ada dalam posq-backend.php
// Endpoint 'payments' management dihapus karena backend mengatur pembayaran per transaksi saja.