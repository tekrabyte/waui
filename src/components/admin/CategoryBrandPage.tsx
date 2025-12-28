import { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Pencil, Trash2, Tag } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

export default function CategoryBrandPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]); // Jika ada fitur brand
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formType, setFormType] = useState<'category' | 'brand'>('category');
  const [formData, setFormData] = useState({ name: '' });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      // Fallback array kosong jika endpoint belum ada
      const cats = await api.categories?.getAll() || []; 
      const brs = await api.brands?.getAll() || [];
      setCategories(cats);
      setBrands(brs);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (formType === 'category') {
        await api.categories.create(formData);
        toast.success("Kategori dibuat");
      } else {
        await api.brands.create(formData);
        toast.success("Brand dibuat");
      }
      await loadData();
      setIsDialogOpen(false);
      setFormData({ name: '' });
    } catch (err) {
      toast.error("Gagal menyimpan");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, type: 'category' | 'brand') => {
    if(!confirm("Yakin hapus?")) return;
    try {
       if(type === 'category') await api.categories.delete(id);
       else await api.brands.delete(id);
       await loadData();
       toast.success("Terhapus");
    } catch(e) {
       toast.error("Gagal hapus");
    }
  }

  if (isLoading) return <div className="p-8"><Skeleton className="h-48 w-full" /></div>;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Kategori & Brand</h1>
      
      <Tabs defaultValue="categories">
        <TabsList>
          <TabsTrigger value="categories">Kategori</TabsTrigger>
          <TabsTrigger value="brands">Brand</TabsTrigger>
        </TabsList>

        <TabsContent value="categories">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Kategori Produk</CardTitle>
                <CardDescription>Kelola kategori untuk pengelompokan produk</CardDescription>
              </div>
              <Button onClick={() => { setFormType('category'); setIsDialogOpen(true); }}>
                <Plus className="mr-2 h-4 w-4" /> Tambah Kategori
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow><TableHead>Nama</TableHead><TableHead className="text-right">Aksi</TableHead></TableRow></TableHeader>
                <TableBody>
                  {categories.map(c => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium flex items-center gap-2"><Tag className="h-4 w-4"/> {c.name}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(c.id, 'category')}><Trash2 className="h-4 w-4 text-destructive"/></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {categories.length === 0 && <TableRow><TableCell colSpan={2} className="text-center">Belum ada kategori</TableCell></TableRow>}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="brands">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Brand Produk</CardTitle>
                <CardDescription>Kelola merk produk</CardDescription>
              </div>
              <Button onClick={() => { setFormType('brand'); setIsDialogOpen(true); }}>
                <Plus className="mr-2 h-4 w-4" /> Tambah Brand
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow><TableHead>Nama</TableHead><TableHead className="text-right">Aksi</TableHead></TableRow></TableHeader>
                <TableBody>
                  {brands.map(b => (
                    <TableRow key={b.id}>
                      <TableCell className="font-medium">{b.name}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(b.id, 'brand')}><Trash2 className="h-4 w-4 text-destructive"/></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {brands.length === 0 && <TableRow><TableCell colSpan={2} className="text-center">Belum ada brand</TableCell></TableRow>}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Tambah {formType === 'category' ? 'Kategori' : 'Brand'}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Nama</Label>
              <Input value={formData.name} onChange={e => setFormData({name: e.target.value})} required />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Batal</Button>
              <Button type="submit" disabled={isSubmitting}>Simpan</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}