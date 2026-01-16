import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Users, MapPin, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { api } from '@/services/api';
import { Table, TableStatus } from '@/types/types';
import { toast } from 'sonner';

export default function TableManagementPage() {
  const [tables, setTables] = useState<Table[]>([]);
  const [filteredTables, setFilteredTables] = useState<Table[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTable, setEditingTable] = useState<Table | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | TableStatus>('all');
  const [filterArea, setFilterArea] = useState<string>('all');

  // Form state
  const [formData, setFormData] = useState({
    tableNumber: '',
    capacity: 2,
    area: 'Indoor'
  });

  // Load tables
  useEffect(() => {
    loadTables();
  }, []);

  // Filter tables
  useEffect(() => {
    let filtered = tables;

    if (filterStatus !== 'all') {
      filtered = filtered.filter(t => t.status === filterStatus);
    }

    if (filterArea !== 'all') {
      filtered = filtered.filter(t => t.area === filterArea);
    }

    setFilteredTables(filtered);
  }, [tables, filterStatus, filterArea]);

  const loadTables = async () => {
    setIsLoading(true);
    try {
      const data = await api.tables.getAll();
      setTables(data);
      setFilteredTables(data);
    } catch (error) {
      console.error('Failed to load tables:', error);
      toast.error('Gagal memuat data meja');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenDialog = (table?: Table) => {
    if (table) {
      setEditingTable(table);
      setFormData({
        tableNumber: table.tableNumber,
        capacity: table.capacity,
        area: table.area
      });
    } else {
      setEditingTable(null);
      setFormData({
        tableNumber: '',
        capacity: 2,
        area: 'Indoor'
      });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingTable(null);
    setFormData({
      tableNumber: '',
      capacity: 2,
      area: 'Indoor'
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.tableNumber.trim()) {
      toast.error('Nomor meja harus diisi');
      return;
    }

    try {
      if (editingTable) {
        await api.tables.update(editingTable.id, formData);
        toast.success('Meja berhasil diperbarui');
      } else {
        await api.tables.create(formData);
        toast.success('Meja berhasil ditambahkan');
      }
      loadTables();
      handleCloseDialog();
    } catch (error) {
      console.error('Failed to save table:', error);
      toast.error('Gagal menyimpan data meja');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Yakin ingin menghapus meja ini?')) return;

    try {
      await api.tables.delete(id);
      toast.success('Meja berhasil dihapus');
      loadTables();
    } catch (error) {
      console.error('Failed to delete table:', error);
      toast.error('Gagal menghapus meja');
    }
  };

  const handleStatusChange = async (id: string, newStatus: TableStatus) => {
    try {
      await api.tables.updateStatus(id, newStatus);
      toast.success('Status meja diperbarui');
      loadTables();
    } catch (error) {
      console.error('Failed to update status:', error);
      toast.error('Gagal memperbarui status');
    }
  };

  const getStatusBadge = (status: TableStatus) => {
    const variants: Record<TableStatus, { label: string; color: string; icon: React.ReactNode }> = {
      available: { 
        label: 'Tersedia', 
        color: 'bg-green-100 text-green-700 border-green-300',
        icon: <CheckCircle2 size={14} />
      },
      occupied: { 
        label: 'Terisi', 
        color: 'bg-red-100 text-red-700 border-red-300',
        icon: <XCircle size={14} />
      },
      reserved: { 
        label: 'Reservasi', 
        color: 'bg-yellow-100 text-yellow-700 border-yellow-300',
        icon: <Clock size={14} />
      }
    };

    const config = variants[status];
    return (
      <Badge className={`${config.color} flex items-center gap-1`} variant="outline">
        {config.icon}
        {config.label}
      </Badge>
    );
  };

  const areas = Array.from(new Set(tables.map(t => t.area)));
  
  const stats = {
    total: tables.length,
    available: tables.filter(t => t.status === 'available').length,
    occupied: tables.filter(t => t.status === 'occupied').length,
    reserved: tables.filter(t => t.status === 'reserved').length
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-muted-foreground">Memuat data meja...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="table-management-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Table Management</h1>
          <p className="text-muted-foreground mt-1">Kelola meja untuk dine-in restaurant</p>
        </div>
        <Button onClick={() => handleOpenDialog()} data-testid="add-table-btn">
          <Plus size={18} className="mr-2" />
          Tambah Meja
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Meja</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-foreground">{stats.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Tersedia</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600">{stats.available}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Terisi</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-red-600">{stats.occupied}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Reservasi</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-yellow-600">{stats.reserved}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="w-48">
          <Label className="text-sm mb-2 block">Filter Status</Label>
          <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as any)}>
            <SelectTrigger data-testid="filter-status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Status</SelectItem>
              <SelectItem value="available">Tersedia</SelectItem>
              <SelectItem value="occupied">Terisi</SelectItem>
              <SelectItem value="reserved">Reservasi</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="w-48">
          <Label className="text-sm mb-2 block">Filter Area</Label>
          <Select value={filterArea} onValueChange={setFilterArea}>
            <SelectTrigger data-testid="filter-area">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Area</SelectItem>
              {areas.map(area => (
                <SelectItem key={area} value={area}>{area}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Tables Grid */}
      {filteredTables.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground mb-4">Tidak ada meja ditemukan</p>
            <Button onClick={() => handleOpenDialog()} variant="outline">
              <Plus size={18} className="mr-2" />
              Tambah Meja Pertama
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredTables.map((table) => (
            <Card key={table.id} className="hover:shadow-lg transition-shadow" data-testid={`table-card-${table.id}`}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-xl font-bold">{table.tableNumber}</CardTitle>
                    <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                      <MapPin size={14} />
                      {table.area}
                    </p>
                  </div>
                  {getStatusBadge(table.status)}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Users size={18} />
                  <span className="text-sm">Kapasitas: {table.capacity} orang</span>
                </div>

                {/* Quick Status Actions */}
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Ubah Status:</Label>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant={table.status === 'available' ? 'default' : 'outline'}
                      className="flex-1 text-xs"
                      onClick={() => handleStatusChange(table.id, 'available')}
                      data-testid={`status-available-${table.id}`}
                    >
                      Tersedia
                    </Button>
                    <Button
                      size="sm"
                      variant={table.status === 'occupied' ? 'default' : 'outline'}
                      className="flex-1 text-xs"
                      onClick={() => handleStatusChange(table.id, 'occupied')}
                      data-testid={`status-occupied-${table.id}`}
                    >
                      Terisi
                    </Button>
                    <Button
                      size="sm"
                      variant={table.status === 'reserved' ? 'default' : 'outline'}
                      className="flex-1 text-xs"
                      onClick={() => handleStatusChange(table.id, 'reserved')}
                      data-testid={`status-reserved-${table.id}`}
                    >
                      Reservasi
                    </Button>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2 border-t">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="flex-1"
                    onClick={() => handleOpenDialog(table)}
                    data-testid={`edit-table-${table.id}`}
                  >
                    <Edit2 size={16} className="mr-1" />
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="flex-1 text-destructive hover:text-destructive"
                    onClick={() => handleDelete(table.id)}
                    data-testid={`delete-table-${table.id}`}
                  >
                    <Trash2 size={16} className="mr-1" />
                    Hapus
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent data-testid="table-dialog">
          <DialogHeader>
            <DialogTitle>{editingTable ? 'Edit Meja' : 'Tambah Meja Baru'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="tableNumber">Nomor Meja *</Label>
              <Input
                id="tableNumber"
                data-testid="table-number-input"
                placeholder="Contoh: T-01, A1, Meja 5"
                value={formData.tableNumber}
                onChange={(e) => setFormData({ ...formData, tableNumber: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="capacity">Kapasitas (Orang) *</Label>
              <Input
                id="capacity"
                data-testid="table-capacity-input"
                type="number"
                min="1"
                max="20"
                value={formData.capacity}
                onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || 2 })}
                required
              />
            </div>

            <div>
              <Label htmlFor="area">Area / Lokasi *</Label>
              <Input
                id="area"
                data-testid="table-area-input"
                placeholder="Contoh: Indoor, Outdoor, VIP"
                value={formData.area}
                onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                required
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                Batal
              </Button>
              <Button type="submit" data-testid="save-table-btn">
                {editingTable ? 'Perbarui' : 'Tambah'} Meja
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
