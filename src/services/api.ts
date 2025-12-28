import { Product, Staff, Outlet, InventoryItem, PaymentMethod, Category, Customer } from '../types';

const BASE_URL = 'https://erpos.tekrabyte.id/wp-json/posq/v1';

// --- HELPER FUNCTIONS ---

const getAuthHeaders = () => {
  const token = localStorage.getItem('posq_token');
  return {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : '',
  };
};

const handleResponse = async (response: Response) => {
  const data = await response.json();
  if (!response.ok) {
    const error = (data && data.message) || response.statusText;
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
  },

  // 2. STAFF / USERS
  staff: {
    getAll: async (): Promise<Staff[]> => {
      const response = await fetch(`${BASE_URL}/users`, { headers: getAuthHeaders() });
      const data = await handleResponse(response);
      
      return data.map((user: any) => ({
        id: String(user.id),
        name: user.name,
        email: user.email,
        role: user.role,
        outletId: user.outlet_id ? String(user.outlet_id) : 'none',
        status: user.status || 'active',
        avatar: user.avatar,
      }));
    },
    create: async (staffData: any) => {
      const payload = {
        username: staffData.email,
        email: staffData.email,
        password: staffData.password,
        name: staffData.name,
        role: staffData.role,
        outlet_id: staffData.outletId === 'none' ? null : staffData.outletId,
      };
      const response = await fetch(`${BASE_URL}/users`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });
      return handleResponse(response);
    },
    update: async (id: string, staffData: any) => {
      // Mapping frontend camelCase to backend snake_case
      const payload: any = { id };
      if (staffData.name) payload.name = staffData.name;
      if (staffData.email) payload.email = staffData.email;
      if (staffData.role) payload.role = staffData.role;
      if (staffData.outletId) payload.outlet_id = staffData.outletId === 'none' ? null : staffData.outletId;
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
        phone: item.phone || '-',
        manager: item.manager || '-',
        status: item.is_active ? 'active' : 'inactive',
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
        category: item.category_name || 'general',
        image: item.image_url,
        available: item.is_active !== false,
        description: item.description,
        // Tambahan field untuk manajemen stok jika backend support
        stock: Number(item.stock || 0), 
        outletId: item.outlet_id ? String(item.outlet_id) : undefined
      }));
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

  // 5. INVENTORY
  inventory: {
    getAll: async (): Promise<InventoryItem[]> => {
      const response = await fetch(`${BASE_URL}/inventory`, { headers: getAuthHeaders() });
      const data = await handleResponse(response);
      return data.map((item: any) => ({
        productId: String(item.product_id),
        currentStock: Number(item.stock),
        minStock: Number(item.min_stock),
        maxStock: Number(item.max_stock),
        lastUpdated: item.updated_at
      }));
    },
    // Placeholder methods for stock actions (Add/Reduce/Transfer)
    // Backend perlu implementasi spesifik atau gunakan update product
    update: async (productId: string, quantity: number, type: 'add' | 'reduce' | 'set') => {
       const response = await fetch(`${BASE_URL}/inventory/update`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ product_id: productId, quantity, type }),
      });
      return handleResponse(response);
    }
  },

  // 6. PAYMENTS
  payments: {
    getAll: async (): Promise<PaymentMethod[]> => {
       const response = await fetch(`${BASE_URL}/payments`, { headers: getAuthHeaders() });
       const data = await handleResponse(response);
       return data.map((item: any) => ({
         id: String(item.id),
         name: item.name,
         type: item.type,
         enabled: item.is_enabled,
         transactionFee: Number(item.fee)
       }));
    },
    toggle: async (id: string, enabled: boolean) => {
      const response = await fetch(`${BASE_URL}/payments/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ is_enabled: enabled })
      });
      return handleResponse(response);
    }
  },

  // 7. CATEGORIES & BRANDS
  categories: {
    getAll: async (): Promise<Category[]> => {
      const response = await fetch(`${BASE_URL}/categories`, { headers: getAuthHeaders() });
      const data = await handleResponse(response);
      return data.map((c: any) => ({
        id: String(c.id),
        name: c.name,
        icon: c.icon || 'Box',
        count: c.count || 0
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
    delete: async (id: string) => {
      const response = await fetch(`${BASE_URL}/categories/${id}`, {
         method: 'DELETE',
         headers: getAuthHeaders()
      });
      return handleResponse(response);
    }
  },

  brands: {
    getAll: async () => {
      const response = await fetch(`${BASE_URL}/brands`, { headers: getAuthHeaders() });
      return handleResponse(response);
    },
    create: async (data: any) => {
       const response = await fetch(`${BASE_URL}/brands`, {
        method: 'POST',
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

  // 8. TRANSACTIONS / ORDERS (POS & Reports)
  transactions: {
    getAll: async () => {
      const response = await fetch(`${BASE_URL}/orders`, { headers: getAuthHeaders() });
      return handleResponse(response);
    },
    create: async (orderData: any) => {
      const response = await fetch(`${BASE_URL}/orders`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(orderData)
      });
      return handleResponse(response);
    },
    updateStatus: async (id: string, status: string) => {
       const response = await fetch(`${BASE_URL}/orders/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ status })
      });
      return handleResponse(response);
    }
  },

  
settings: {
    getMenuAccess: async (): Promise<MenuAccessConfig> => {
      const response = await fetch(`${BASE_URL}/settings/menu-access`, { headers: getAuthHeaders() });
      // Fallback jika API belum siap, return null agar frontend pakai default
      if (response.status === 404) return null as any; 
      return handleResponse(response);
    },
    saveMenuAccess: async (config: MenuAccessConfig) => {
      const response = await fetch(`${BASE_URL}/settings/menu-access`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(config)
      });
      return handleResponse(response);
    }
  },


  // 9. EXPENSES / CASHFLOW
  expenses: {
    getAll: async () => {
      const response = await fetch(`${BASE_URL}/expenses`, { headers: getAuthHeaders() });
      return handleResponse(response);
    },
    create: async (data: any) => {
      const response = await fetch(`${BASE_URL}/expenses`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data)
      });
      return handleResponse(response);
    }
  },

  // 10. CUSTOMERS
  customers: {
    getAll: async (): Promise<Customer[]> => {
      const response = await fetch(`${BASE_URL}/customers`, { headers: getAuthHeaders() });
      const data = await handleResponse(response);
      return data.map((c: any) => ({
        id: String(c.id),
        name: c.name,
        lastOrder: c.last_order_date || '-',
        status: c.status || 'offline',
        unread: 0
      }));
    }
  }
};