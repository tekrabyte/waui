import { Product, Staff, Outlet, InventoryItem, PaymentMethod, Category, Customer, Expense, CashflowSummary } from '../types/types';
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

  // 5. PACKAGES (New)
  packages: {
    getAll: async () => {
      const response = await fetch(`${BASE_URL}/packages`, { headers: getAuthHeaders() });
      return handleResponse(response);
    }
  },

  // 6. INVENTORY
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
    update: async (productId: string, quantity: number, type: 'add' | 'reduce' | 'set') => {
      const response = await fetch(`${BASE_URL}/inventory/update`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ product_id: productId, quantity, type }),
      });
      return handleResponse(response);
    }
  },

  // 7. PAYMENTS
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

  // 8. CATEGORIES & BRANDS
  categories: {
    getAll: async (): Promise<Category[]> => {
      const response = await fetch(`${BASE_URL}/categories`, { headers: getAuthHeaders() });
      const data = await handleResponse(response);
      return data.map((c: any) => ({
        id: String(c.id),
        name: c.name,
        icon: c.icon || 'Box',
        count: c.count || 0,
        description: c.description,
        isActive: c.is_active !== false // Default true
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

  brands: {
    getAll: async (): Promise<Brand[]> => {
      const response = await fetch(`${BASE_URL}/brands`, { headers: getAuthHeaders() });
      const data = await handleResponse(response);
      return data.map((b: any) => ({
        id: String(b.id),
        name: b.name,
        description: b.description,
        isActive: b.is_active !== false
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

  // 9. TRANSACTIONS / ORDERS
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

  // 10. SETTINGS
  settings: {
    getMenuAccess: async (): Promise<any> => {
      const response = await fetch(`${BASE_URL}/settings/menu-access`, { headers: getAuthHeaders() });
      if (response.status === 404) return null as any; 
      return handleResponse(response);
    },
    saveMenuAccess: async (config: any) => {
      const response = await fetch(`${BASE_URL}/settings/menu-access`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(config)
      });
      return handleResponse(response);
    }
  },

 expenses: {
    getAll: async (outletId?: string): Promise<Expense[]> => {
      const url = outletId ? `${BASE_URL}/expenses?outlet_id=${outletId}` : `${BASE_URL}/expenses`;
      const response = await fetch(url, { headers: getAuthHeaders() });
      const data = await handleResponse(response);
      return data.map((e: any) => ({
        id: String(e.id),
        title: e.title,
        amount: BigInt(e.amount),
        category: e.category,
        date: BigInt(e.date || Date.now() * 1000000),
        note: e.note,
        outletId: e.outlet_id ? String(e.outlet_id) : undefined
      }));
    },
    create: async (data: any) => {
      // Konversi BigInt ke number sebelum kirim JSON
      const payload = {
        ...data,
        amount: Number(data.amount),
        outlet_id: data.outletId
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

  // 12. CUSTOMERS
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
  },

  // 12. CASHFLOW / REPORTS
  cashflow: {
    getSummary: async (period: 'daily' | 'weekly' | 'monthly' = 'monthly', outletId?: string): Promise<CashflowSummary> => {
      let url = `${BASE_URL}/reports/cashflow?period=${period}`;
      if (outletId) url += `&outlet_id=${outletId}`;
      
      const response = await fetch(url, { headers: getAuthHeaders() });
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

  // 13. ANALYTICS / REPORTS
  analytics: {
    getTopOutlets: async (): Promise<Array<[string, number]>> => {
      try {
        const response = await fetch(`${BASE_URL}/reports/top-outlets`, { headers: getAuthHeaders() });
        const data = await handleResponse(response);
        // Expected format: [{outlet_id: "1", revenue: 1000000}, ...]
        return data.map((item: any) => [String(item.outlet_id), Number(item.revenue || 0)]);
      } catch (error) {
        // Fallback: aggregate from transactions if endpoint doesn't exist
        const transactions = await api.transactions.getAll();
        const revenueByOutlet: Record<string, number> = {};
        
        transactions.forEach((txn: any) => {
          const outletId = String(txn.outlet_id || txn.outletId || '0');
          const total = Number(txn.total || 0);
          revenueByOutlet[outletId] = (revenueByOutlet[outletId] || 0) + total;
        });
        
        return Object.entries(revenueByOutlet)
          .map(([outletId, revenue]) => [outletId, revenue] as [string, number])
          .sort((a, b) => b[1] - a[1]);
      }
    },
    
    getDailySummary: async (outletId: string): Promise<{ transactionCount: number; totalRevenue: number }> => {
      try {
        const response = await fetch(`${BASE_URL}/reports/daily-summary?outlet_id=${outletId}`, { headers: getAuthHeaders() });
        const data = await handleResponse(response);
        return {
          transactionCount: Number(data.transaction_count || 0),
          totalRevenue: Number(data.total_revenue || 0)
        };
      } catch (error) {
        // Fallback: calculate from transactions
        const transactions = await api.transactions.getAll();
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayTimestamp = today.getTime();
        
        const todayTransactions = transactions.filter((txn: any) => {
          const txnOutletId = String(txn.outlet_id || txn.outletId || '0');
          const txnDate = new Date(txn.created_at || txn.timestamp || 0);
          return txnOutletId === outletId && txnDate.getTime() >= todayTimestamp;
        });
        
        return {
          transactionCount: todayTransactions.length,
          totalRevenue: todayTransactions.reduce((sum: number, txn: any) => sum + Number(txn.total || 0), 0)
        };
      }
    },
    
    getOverallSummary: async (outletId: string): Promise<[number, number]> => {
      try {
        const response = await fetch(`${BASE_URL}/reports/overall-summary?outlet_id=${outletId}`, { headers: getAuthHeaders() });
        const data = await handleResponse(response);
        return [Number(data.transaction_count || 0), Number(data.total_revenue || 0)];
      } catch (error) {
        // Fallback: calculate from transactions
        const transactions = await api.transactions.getAll();
        const outletTransactions = transactions.filter((txn: any) => {
          const txnOutletId = String(txn.outlet_id || txn.outletId || '0');
          return txnOutletId === outletId;
        });
        
        return [
          outletTransactions.length,
          outletTransactions.reduce((sum: number, txn: any) => sum + Number(txn.total || 0), 0)
        ];
      }
    },
    
    getBestSellers: async (outletId: string): Promise<Array<[string, number]>> => {
      try {
        const response = await fetch(`${BASE_URL}/reports/best-sellers?outlet_id=${outletId}`, { headers: getAuthHeaders() });
        const data = await handleResponse(response);
        // Expected format: [{product_id: "1", quantity: 100}, ...]
        return data.map((item: any) => [String(item.product_id), Number(item.quantity || 0)]);
      } catch (error) {
        // Fallback: aggregate from transactions
        const transactions = await api.transactions.getAll();
        const productSales: Record<string, number> = {};
        
        transactions.forEach((txn: any) => {
          const txnOutletId = String(txn.outlet_id || txn.outletId || '0');
          if (txnOutletId === outletId && txn.items) {
            txn.items.forEach((item: any) => {
              const productId = String(item.product_id || item.productId);
              const quantity = Number(item.quantity || 0);
              productSales[productId] = (productSales[productId] || 0) + quantity;
            });
          }
        });
        
        return Object.entries(productSales)
          .map(([productId, quantity]) => [productId, quantity] as [string, number])
          .sort((a, b) => b[1] - a[1]);
      }
    }
  }
  };