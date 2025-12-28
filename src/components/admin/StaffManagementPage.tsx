import { useState, useEffect } from 'react';
import { api } from '../../services/api'; // Pastikan path ini sesuai
import { Staff } from '../../types'; // Pastikan tipe Staff ada
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Pencil, Trash2, Users, Plus } from 'lucide-react';
import { toast } from 'sonner'; // Asumsi Anda pakai sonner seperti file lain

// Mapping Role agar sesuai dengan UI Anda
const AppRole = {
  owner: 'owner',
  manager: 'manager',
  cashier: 'cashier',
  admin: 'admin'
};

export default function StaffManagementPage() {
  const [users, setUsers] = useState<Staff[]>([]);
  const [outlets, setOutlets] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Dialog States
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false); 
  const [selectedUser, setSelectedUser] = useState<Staff | null>(null);

  // Form States
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'cashier',
    outletId: 'none'
  });

  // Load Data
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [usersData, outletsData] = await Promise.all([
        api.staff.getAll(),
        api.outlets.getAll()
      ]);
      setUsers(usersData);
      setOutlets(outletsData);
    } catch (err) {
      console.error("Gagal memuat data:", err);
      toast.error("Gagal memuat data staf");
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({ name: '', email: '', password: '', role: 'cashier', outletId: 'none' });
  };

  const handleCreateClick = () => {
    resetForm();
    setCreateDialogOpen(true);
  };

  const handleEditClick = (user: Staff) => {
    setSelectedUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      password: '', // Password kosong saat edit (opsional)
      role: user.role,
      outletId: user.outletId || 'none'
    });
    setEditDialogOpen(true);
  };

  const handleDeleteClick = (user: Staff) => {
    setSelectedUser(user);
    setDeleteDialogOpen(true);
  };

  // --- ACTIONS ---

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.staff.create({
        ...formData,
        outletId: formData.outletId === 'none' ? undefined : formData.outletId
      });
      await loadData();
      setCreateDialogOpen(false);
      toast.success("Staf berhasil dibuat");
    } catch (err) {
      toast.error("Gagal membuat staf");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    setIsSubmitting(true);
    try {
      // Logic update (simulasi jika api.staff.update belum ada, gunakan create atau endpoint khusus)
      // await api.staff.update(selectedUser.id, formData); 
      alert("API Update belum diimplementasikan di api.ts, logika UI sudah siap.");
      // await loadData();
      setEditDialogOpen(false);
    } catch (err) {
      toast.error("Gagal mengupdate staf");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedUser) return;
    setIsSubmitting(true);
    try {
      await api.staff.delete(selectedUser.id);
      await loadData();
      setDeleteDialogOpen(false);
      toast.success("Staf berhasil dihapus");
    } catch (err) {
      toast.error("Gagal menghapus staf");
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- RENDERING HELPERS ---

  const getRoleBadge = (role: string) => {
    if (role === AppRole.owner || role === 'administrator') return <Badge variant="default">Owner</Badge>;
    if (role === AppRole.manager) return <Badge variant="secondary">Manager</Badge>;
    return <Badge variant="outline">Kasir</Badge>;
  };

  const getOutletName = (outletId?: string) => {
    if (!outletId || outletId === 'all' || outletId === 'none') return '-';
    const outlet = outlets.find((o) => String(o.id) === String(outletId));
    return outlet ? outlet.name : '-';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
          <p className="text-muted-foreground">Memuat data staf...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Manajemen Staf</h1>
          <p className="text-muted-foreground">Kelola pengguna dan hak akses mereka</p>
        </div>
        <Button onClick={handleCreateClick} className="bg-[#008069] hover:bg-[#006a57]">
            <Plus className="mr-2 h-4 w-4" /> Tambah Staf
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Daftar Staf
              </CardTitle>
              <CardDescription>
                Total {users.length} pengguna terdaftar
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {!users || users.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Belum ada staf terdaftar</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nama</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Outlet</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{getRoleBadge(user.role)}</TableCell>
                      <TableCell>{getOutletName(user.outletId)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditClick(user)}
                            title="Edit staf"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteClick(user)}
                            title="Hapus staf"
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* CREATE DIALOG (Ditambahkan karena di file asli tidak ada fitur create user baru secara eksplisit di UI) */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tambah Staf Baru</DialogTitle>
            <DialogDescription>Buat akun baru untuk karyawan.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateSubmit} className="space-y-4">
             <div className="space-y-2">
              <Label>Nama Lengkap</Label>
              <Input value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} required />
            </div>
            <div className="space-y-2">
              <Label>Password</Label>
              <Input type="password" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} required />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label>Role</Label>
                    <Select value={formData.role} onValueChange={(val) => setFormData({...formData, role: val})}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="cashier">Kasir</SelectItem>
                            <SelectItem value="manager">Manager</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label>Outlet</Label>
                    <Select value={formData.outletId} onValueChange={(val) => setFormData({...formData, outletId: val})}>
                        <SelectTrigger><SelectValue placeholder="Pilih Outlet" /></SelectTrigger>
                        <SelectContent>
                            {outlets.map(o => (
                                <SelectItem key={o.id} value={String(o.id)}>{o.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCreateDialogOpen(false)}>Batal</Button>
              <Button type="submit" disabled={isSubmitting}>Simpan</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* EDIT DIALOG */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Profil Staf</DialogTitle>
            <DialogDescription>
              Ubah informasi staf dan hak akses mereka
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Nama Lengkap</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-role">Role</Label>
              <Select 
                value={formData.role} 
                onValueChange={(value) => setFormData({...formData, role: value})}
              >
                <SelectTrigger id="edit-role">
                  <SelectValue placeholder="Pilih role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={AppRole.owner}>Owner</SelectItem>
                  <SelectItem value={AppRole.manager}>Manager</SelectItem>
                  <SelectItem value={AppRole.cashier}>Kasir</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {(formData.role === AppRole.manager || formData.role === AppRole.cashier) && (
              <div className="space-y-2">
                <Label htmlFor="edit-outlet">Outlet</Label>
                <Select 
                  value={formData.outletId} 
                  onValueChange={(val) => setFormData({...formData, outletId: val})}
                >
                  <SelectTrigger id="edit-outlet">
                    <SelectValue placeholder="Pilih outlet" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Tidak ada</SelectItem>
                    {outlets && outlets.map((outlet) => (
                      <SelectItem key={outlet.id} value={String(outlet.id)}>
                        {outlet.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)}>Batal</Button>
              <Button type="submit" disabled={isSubmitting}>Simpan Perubahan</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* DELETE DIALOG */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Staf</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus staf <strong>{selectedUser?.name}</strong>?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isSubmitting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isSubmitting ? 'Menghapus...' : 'Hapus'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}