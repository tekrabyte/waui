import { useState, useEffect } from 'react';
import { 
  useListAllUsers, 
  useUpdateUserProfile, 
  useRemoveUser, 
  useListOutlets, 
  useCreateUser // Pastikan hook ini sudah dibuat di useQueries.ts
} from '../../hooks/useQueries';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Pencil, Trash2, Users, Plus, KeyRound, Store } from 'lucide-react';
import { AppRole, Staff } from '../../types/types';
import { toast } from 'sonner';

export default function StaffManagementPage() {
  // Queries
  const { data: users, isLoading } = useListAllUsers(); 
  const { data: outlets } = useListOutlets();
  
  // Mutations
  const createUser = useCreateUser();
  const updateUserProfile = useUpdateUserProfile();
  const removeUser = useRemoveUser();

  // State Dialogs
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  
  // State Selected Data
  const [selectedUser, setSelectedUser] = useState<Staff | null>(null);

  // Form States (Create)
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<AppRole>(AppRole.cashier);
  const [newOutletId, setNewOutletId] = useState<string>('none');

  // Form States (Edit)
  const [editName, setEditName] = useState('');
  const [editRole, setEditRole] = useState<AppRole>(AppRole.cashier);
  const [editOutletId, setEditOutletId] = useState<string>('none');
  const [editEmail, setEditEmail] = useState('');
  const [editPassword, setEditPassword] = useState(''); // Optional untuk reset password

  // --- LOGIC TAMBAH STAF ---
  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newName || !newEmail || !newPassword) {
      toast.error("Mohon lengkapi nama, email, dan password");
      return;
    }

    if ((newRole === AppRole.manager || newRole === AppRole.cashier) && newOutletId === 'none') {
      toast.error("Staf dan Manager wajib ditempatkan di sebuah Outlet");
      return;
    }

    const payload = {
      name: newName,
      email: newEmail,
      password: newPassword,
      role: newRole,
      outletId: newRole === AppRole.owner ? null : newOutletId,
      username: newEmail // Menggunakan email sebagai username
    };

    createUser.mutate(payload, {
      onSuccess: () => {
        setAddDialogOpen(false);
        // Reset form
        setNewName('');
        setNewEmail('');
        setNewPassword('');
        setNewRole(AppRole.cashier);
        setNewOutletId('none');
      }
    });
  };

  // --- LOGIC EDIT STAF ---
  const handleEditClick = (user: Staff) => {
    setSelectedUser(user);
    setEditName(user.name);
    setEditEmail(user.email || '');
    setEditRole((user.role as AppRole) || AppRole.cashier);
    setEditOutletId(user.outletId ? String(user.outletId) : 'none');
    setEditPassword(''); // Reset field password edit
    setEditDialogOpen(true);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || !editName.trim()) return;

    const updatedData: any = {
      id: selectedUser.id,
      name: editName.trim(),
      email: editEmail,
      role: editRole,
      outletId: editRole === AppRole.owner || editOutletId === 'none' ? null : editOutletId,
    };

    // Jika password diisi, kirim ke backend untuk diubah
    if (editPassword.trim()) {
      updatedData.password = editPassword.trim();
    }

    updateUserProfile.mutate(
      updatedData,
      {
        onSuccess: () => {
          setEditDialogOpen(false);
          setSelectedUser(null);
          setEditPassword('');
        },
      }
    );
  };

  // --- LOGIC HAPUS STAF ---
  const handleDeleteClick = (user: Staff) => {
    setSelectedUser(user);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (!selectedUser) return;
    removeUser.mutate(selectedUser.id, {
      onSuccess: () => {
        setDeleteDialogOpen(false);
        setSelectedUser(null);
      },
    });
  };

  // Helper UI
  const getRoleBadge = (role: string) => {
    switch (role) {
      case AppRole.owner: return <Badge className="bg-purple-600 hover:bg-purple-700">Owner</Badge>;
      case AppRole.manager: return <Badge className="bg-blue-600 hover:bg-blue-700">Manager</Badge>;
      case AppRole.cashier: return <Badge variant="outline" className="border-green-600 text-green-600">Kasir</Badge>;
      default: return <Badge variant="secondary">{role}</Badge>;
    }
  };

  const getOutletName = (outletId?: string) => {
    if (!outletId || outletId === 'none' || !outlets) return <span className="text-muted-foreground text-xs">-</span>;
    const outlet = outlets.find((o) => String(o.id) === String(outletId));
    return outlet ? <span className="flex items-center gap-1"><Store className="w-3 h-3" /> {outlet.name}</span> : '-';
  };

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground">Memuat data staf...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Manajemen Staf</h1>
          <p className="text-muted-foreground">Atur Manager, Kasir, dan hak akses Outlet.</p>
        </div>
        <Button onClick={() => setAddDialogOpen(true)} className="bg-primary hover:bg-primary/90">
          <Plus className="mr-2 h-4 w-4" /> Tambah Staf Baru
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Daftar Pengguna
          </CardTitle>
          <CardDescription>
            Kelola {users?.length || 0} akun staf yang terdaftar di sistem.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!users || users.length === 0 ? (
            <div className="text-center py-12 border rounded-lg bg-muted/10">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Belum ada staf. Silakan tambah baru.</p>
            </div>
          ) : (
            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead>Nama</TableHead>
                    <TableHead>Email (Login)</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Outlet Access</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user, index) => (
                    <TableRow key={user.id || index}>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{getRoleBadge(user.role)}</TableCell>
                      <TableCell>{getOutletName(user.outletId)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={() => handleEditClick(user)}>
                            <Pencil className="h-4 w-4 text-blue-500" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteClick(user)}>
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

      {/* --- DIALOG TAMBAH STAF --- */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Tambah Staf Baru</DialogTitle>
            <DialogDescription>
              Buat akun login baru untuk Manager atau Kasir.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddSubmit} className="space-y-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="newName">Nama Lengkap</Label>
              <Input 
                id="newName" 
                placeholder="Contoh: Budi Santoso" 
                value={newName} 
                onChange={e => setNewName(e.target.value)} 
                required 
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="newEmail">Email (Untuk Login)</Label>
              <Input 
                id="newEmail" 
                type="email" 
                placeholder="staf@outlet.com" 
                value={newEmail} 
                onChange={e => setNewEmail(e.target.value)} 
                required 
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="newPassword">Password</Label>
              <div className="relative">
                <Input 
                  id="newPassword" 
                  type="text" 
                  placeholder="Password minimal 6 karakter" 
                  value={newPassword} 
                  onChange={e => setNewPassword(e.target.value)} 
                  required 
                  className="pr-10"
                />
                <KeyRound className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Role</Label>
                <Select value={newRole} onValueChange={(v: AppRole) => setNewRole(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={AppRole.cashier}>Kasir</SelectItem>
                    <SelectItem value={AppRole.manager}>Manager</SelectItem>
                    <SelectItem value={AppRole.owner}>Owner</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label>Outlet</Label>
                <Select 
                  value={newOutletId} 
                  onValueChange={setNewOutletId} 
                  disabled={newRole === AppRole.owner}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih Outlet" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">-- Pilih Outlet --</SelectItem>
                    {outlets?.map(o => (
                      <SelectItem key={o.id} value={String(o.id)}>{o.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setAddDialogOpen(false)}>Batal</Button>
              <Button type="submit" disabled={createUser.isPending}>
                {createUser.isPending ? 'Menyimpan...' : 'Buat Akun'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* --- DIALOG EDIT STAF --- */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Profil Staf</DialogTitle>
            <DialogDescription>
              Ubah data atau reset password pengguna.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4 py-2">
            <div className="grid gap-2">
              <Label>Nama Lengkap</Label>
              <Input 
                value={editName} 
                onChange={(e) => setEditName(e.target.value)} 
                required 
              />
            </div>
            
            <div className="grid gap-2">
              <Label>Email</Label>
              <Input 
                value={editEmail} 
                onChange={(e) => setEditEmail(e.target.value)} 
                required 
              />
            </div>

            <div className="grid gap-2">
              <Label>Reset Password (Opsional)</Label>
              <Input 
                type="text"
                placeholder="Isi hanya jika ingin mengganti password" 
                value={editPassword} 
                onChange={(e) => setEditPassword(e.target.value)} 
              />
              <p className="text-xs text-muted-foreground">Kosongkan jika tidak ingin mengubah password.</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Role</Label>
                <Select value={editRole} onValueChange={(v: AppRole) => setEditRole(v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={AppRole.cashier}>Kasir</SelectItem>
                    <SelectItem value={AppRole.manager}>Manager</SelectItem>
                    <SelectItem value={AppRole.owner}>Owner</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label>Outlet</Label>
                <Select 
                  value={editOutletId} 
                  onValueChange={setEditOutletId}
                  disabled={editRole === AppRole.owner}
                >
                  <SelectTrigger><SelectValue placeholder="Pilih" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Tidak Ada</SelectItem>
                    {outlets?.map(o => (
                      <SelectItem key={o.id} value={String(o.id)}>{o.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)}>Batal</Button>
              <Button type="submit" disabled={updateUserProfile.isPending}>
                {updateUserProfile.isPending ? 'Menyimpan...' : 'Simpan Perubahan'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* --- DIALOG HAPUS --- */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Staf?</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus akses untuk <strong>{selectedUser?.name}</strong>? 
              Tindakan ini permanen dan mereka tidak akan bisa login lagi.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={removeUser.isPending}
            >
              {removeUser.isPending ? 'Menghapus...' : 'Hapus Akses'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}