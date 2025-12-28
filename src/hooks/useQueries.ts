import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';

// --- AUTH ---
export const useIsCallerAdmin = () => {
  return useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      try {
        const data = await api.auth.me();
        return ['owner', 'admin', 'administrator'].includes(data.user?.role);
      } catch { return false; }
    },
    initialData: false
  });
};

// --- OUTLETS ---
export const useListOutlets = () => useQuery({ queryKey: ['outlets'], queryFn: api.outlets.getAll });

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
    mutationFn: ({ id, ...data }: any) => api.outlets.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['outlets'] }),
  });
};

// --- STAFF ---
export const useListStaff = () => useQuery({ queryKey: ['staff'], queryFn: api.staff.getAll });

// --- CUSTOMERS ---
export const useGetAllCustomers = () => useQuery({ queryKey: ['customers'], queryFn: api.customers.getAll });

// --- TRANSACTIONS ---
export const useListAllTransactions = () => useQuery({ queryKey: ['transactions'], queryFn: api.transactions.getAll });

export const useUpdateTransactionStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => api.transactions.updateStatus(id, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['transactions'] })
  });
};

// --- SETTINGS ---
export const useGetMenuAccessConfig = () => useQuery({ 
  queryKey: ['menuAccess'], 
  queryFn: api.settings.getMenuAccess 
});

export const useSaveMenuAccessConfig = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.settings.saveMenuAccess,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['menuAccess'] })
  });
};