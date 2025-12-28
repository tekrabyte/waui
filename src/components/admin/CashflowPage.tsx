import { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, TrendingUp, TrendingDown } from 'lucide-react';
import { toast } from 'sonner';

export default function CashflowPage() {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({ description: '', amount: '', type: 'expense' });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Mock data jika endpoint belum ada
      const data = await api.expenses?.getAll() || [];
      setExpenses(data);
    } catch(e) { console.error(e); } 
    finally { setIsLoading(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.expenses.create({
        ...formData,
        amount: parseFloat(formData.amount)
      });
      toast.success("Data tersimpan");
      setIsDialogOpen(false);
      loadData();
    } catch(e) {
      toast.error("Gagal simpan");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between">
        <h1 className="text-3xl font-bold">Arus Kas</h1>
        <Button onClick={() => setIsDialogOpen(true)}><Plus className="mr-2 h-4 w-4" /> Catat Transaksi</Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Pemasukan</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500"/>
          </CardHeader>
          <CardContent><div className="text-2xl font-bold text-green-600">Rp 0</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Pengeluaran</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-500"/>
          </CardHeader>
          <CardContent><div className="text-2xl font-bold text-red-600">Rp 0</div></CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Riwayat Pengeluaran Operasional</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow><TableHead>Deskripsi</TableHead><TableHead>Jumlah</TableHead><TableHead>Tipe</TableHead></TableRow></TableHeader>
            <TableBody>
              {expenses.map((ex, idx) => (
                <TableRow key={idx}>
                  <TableCell>{ex.description}</TableCell>
                  <TableCell>Rp {Number(ex.amount).toLocaleString()}</TableCell>
                  <TableCell className="capitalize">{ex.type}</TableCell>
                </TableRow>
              ))}
              {expenses.length === 0 && <TableRow><TableCell colSpan={3} className="text-center">Belum ada data</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Catat Pengeluaran</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Deskripsi</Label>
              <Input value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} required/>
            </div>
            <div className="space-y-2">
              <Label>Jumlah (Rp)</Label>
              <Input type="number" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} required/>
            </div>
            <DialogFooter><Button type="submit">Simpan</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}