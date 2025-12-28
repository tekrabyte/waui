import { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Outlet } from '../../types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Pencil, Store, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

export function OutletsManagementPage() {
  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedOutlet, setSelectedOutlet] = useState<Outlet | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone: '',
    manager: ''
  });

  useEffect(() => {
    loadOutlets();
  }, []);

  const loadOutlets = async () => {
    try {
      setIsLoading(true);
      const data = await api.outlets.getAll();
      setOutlets(data);
    } catch (err) {
      console.error("Failed load outlets", err);
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({ name: '', address: '', phone: '', manager: '' });
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.outlets.create(formData);
      await loadOutlets();
      setIsAddDialogOpen(false);
      resetForm();
    } catch (err) {
      alert("Gagal menambah outlet");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = (outlet: Outlet) => {
    setSelectedOutlet(outlet);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedOutlet) return;
    setIsSubmitting(true);
    try {
      await api.outlets.delete(selectedOutlet.id);
      await loadOutlets();
      setIsDeleteDialogOpen(false);
    } catch (err) {
      alert("Gagal menghapus outlet");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return <div className="p-8 text-center">Loading outlets...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Outlet</h1>
          <p className="text-muted-foreground">Kelola lokasi cabang toko Anda</p>
        </div>
        <Button onClick={() => { resetForm(); setIsAddDialogOpen(true); }} className="bg-[#008069] hover:bg-[#006a57]">
          <Plus className="mr-2 h-4 w-4" /> Tambah Outlet
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Store className="h-5 w-5" /> Daftar Outlet
          </CardTitle>
          <CardDescription>Total {outlets.length} outlet aktif</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama Outlet</TableHead>
                  <TableHead>Alamat</TableHead>
                  <TableHead>Telepon</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {outlets.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-8">Belum ada outlet.</TableCell></TableRow>
                ) : (
                  outlets.map((outlet) => (
                    <TableRow key={outlet.id}>
                      <TableCell className="font-medium">{outlet.name}</TableCell>
                      <TableCell className="max-w-md truncate" title={outlet.address}>{outlet.address}</TableCell>
                      <TableCell>{outlet.phone}</TableCell>
                      <TableCell>
                        <Badge variant={outlet.status === 'active' ? 'default' : 'secondary'} className={outlet.status === 'active' ? 'bg-green-600' : ''}>
                          {outlet.status === 'active' ? 'Aktif' : 'Non-aktif'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon"><Pencil className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteClick(outlet)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Add Outlet Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tambah Outlet Baru</DialogTitle>
            <DialogDescription>Masukkan detail lokasi outlet baru.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Nama Outlet</Label>
              <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
            </div>
            <div className="space-y-2">
              <Label>Alamat</Label>
              <Textarea value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} required />
            </div>
            <div className="space-y-2">
              <Label>No. Telepon</Label>
              <Input value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>Batal</Button>
              <Button type="submit" className="bg-[#008069]" disabled={isSubmitting}>Simpan</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Outlet?</AlertDialogTitle>
            <AlertDialogDescription>Tindakan ini tidak dapat dibatalkan. Outlet <strong>{selectedOutlet?.name}</strong> akan dihapus.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive">Hapus</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}