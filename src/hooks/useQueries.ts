import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';

// --- AUTH HOOKS ---
export const useIsCallerAdmin = () => {
  return useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      // Cek user dari localStorage dulu agar cepat (optimistic)
      const stored = localStorage.getItem('posq_user');
      if (stored) {
        const user = JSON.parse(stored);
        return ['owner', 'admin', 'administrator'].includes(user.role);
      }
      // Atau fetch dari API jika perlu validasi token
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

// --- OUTLET HOOKS ---
export const useListOutlets = () => {
  return useQuery({
    queryKey: ['outlets'],
    queryFn: api.outlets.getAll,
  });
};

export const useAddOutlet = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.outlets.create,
    onSuccess: () => {
      // Refresh data outlet otomatis setelah berhasil tambah
      queryClient.invalidateQueries({ queryKey: ['outlets'] });
    },
  });
};

export const useUpdateOutlet = () => {
  const queryClient = useQueryClient();
  return useMutation({
    // Sesuaikan parameter agar cocok dengan api.outlets.update(id, data)
    mutationFn: ({ id, ...data }: { id: string; name: string; address: string; isActive?: boolean }) => 
      api.outlets.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['outlets'] });
    },
  });
};

export const useGetMenuAccessConfig = () => {
  return useQuery({
    queryKey: ['menuAccess'],
    queryFn: async () => {
      try {
        return await api.settings.getMenuAccess();
      } catch (e) {
        return null; // Return null biar pakai default local state
      }
    }
  });
};

export const useSaveMenuAccessConfig = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.settings.saveMenuAccess,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menuAccess'] });
      alert('Pengaturan menu berhasil disimpan!');
    },
    onError: () => {
      alert('Gagal menyimpan pengaturan.');
    }
  });
};
// --- TAMBAHAN (Jika file admin lain butuh hooks serupa) ---
export const useListStaff = () => useQuery({ queryKey: ['staff'], queryFn: api.staff.getAll });
export const useListProducts = () => useQuery({ queryKey: ['products'], queryFn: api.products.getAll });