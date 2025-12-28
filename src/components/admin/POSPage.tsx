import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { ShoppingCart, Plus, Minus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export default function POSPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [cart, setCart] = useState<any[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const data = await api.products.getAll();
      setProducts(data);
    } catch (e) { console.error(e); }
  };

  const addToCart = (product: any) => {
    setCart(prev => {
      const exist = prev.find(item => item.id === product.id);
      if (exist) return prev.map(item => item.id === product.id ? {...item, qty: item.qty + 1} : item);
      return [...prev, { ...product, qty: 1 }];
    });
  };

  const updateQty = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if(item.id === id) return { ...item, qty: Math.max(0, item.qty + delta) };
      return item;
    }).filter(item => item.qty > 0));
  };

  const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);

  const handleCheckout = async () => {
    try {
      if(cart.length === 0) return;
      // Kirim transaksi ke API
      await api.transactions.create({
        items: cart.map(c => ({ product_id: c.id, quantity: c.qty, price: c.price })),
        total: totalPrice,
        status: 'completed'
      });
      toast.success("Transaksi Berhasil!");
      setCart([]);
    } catch (e) {
      toast.error("Gagal memproses transaksi");
    }
  };

  const filteredProducts = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      {/* Left: Product Grid */}
      <div className="flex-1 flex flex-col p-4 gap-4">
        <Input placeholder="Cari produk..." value={search} onChange={e => setSearch(e.target.value)} className="bg-white" />
        <ScrollArea className="flex-1">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pb-20">
            {filteredProducts.map(p => (
              <Card key={p.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => addToCart(p)}>
                <CardContent className="p-4 flex flex-col items-center text-center gap-2">
                  <div className="h-24 w-24 bg-gray-100 rounded-md mb-2 flex items-center justify-center">
                    {p.image ? <img src={p.image} className="h-full w-full object-cover rounded" /> : <span className="text-2xl font-bold text-gray-400">{p.name[0]}</span>}
                  </div>
                  <h3 className="font-medium line-clamp-2">{p.name}</h3>
                  <p className="text-green-600 font-bold">Rp {p.price.toLocaleString()}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Right: Cart */}
      <div className="w-[350px] bg-white border-l shadow-xl flex flex-col">
        <div className="p-4 border-b"><h2 className="font-bold text-lg flex items-center gap-2"><ShoppingCart /> Keranjang</h2></div>
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {cart.map(item => (
              <div key={item.id} className="flex justify-between items-center">
                <div className="flex-1">
                  <p className="font-medium">{item.name}</p>
                  <p className="text-sm text-gray-500">Rp {item.price.toLocaleString()}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => updateQty(item.id, -1)}><Minus className="h-3 w-3"/></Button>
                  <span className="w-4 text-center text-sm">{item.qty}</span>
                  <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => updateQty(item.id, 1)}><Plus className="h-3 w-3"/></Button>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
        <div className="p-4 border-t bg-gray-50">
          <div className="flex justify-between mb-4 text-lg font-bold">
            <span>Total</span>
            <span>Rp {totalPrice.toLocaleString()}</span>
          </div>
          <Button className="w-full bg-[#008069] hover:bg-[#006a57]" size="lg" onClick={handleCheckout} disabled={cart.length === 0}>
            Bayar Sekarang
          </Button>
        </div>
      </div>
    </div>
  );
}