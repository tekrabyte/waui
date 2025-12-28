import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Search, MapPin } from 'lucide-react';
import { useListProductsByOutlet, useGetAllCategories } from '../../hooks/useQueries';
import { useKioskCart } from '../../hooks/useKioskCart';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { toast } from 'sonner';

export default function KioskHomePage() {
  const navigate = useNavigate();
  const { data: products = [], isLoading: productsLoading } = useListProductsByOutlet(null);
  const { data: categories = [] } = useGetAllCategories();
  const { addToCart } = useKioskCart();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);

  const userName = "Guest";
  const userAddress = "Jakarta";

  const activeProducts = products.filter(p => !p.isDeleted);
  
  const filteredProducts = activeProducts.filter(product => {
    const matchesSearch = searchQuery === '' || 
      product.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === null || 
      (product.categoryId && Number(product.categoryId) === selectedCategory);
    return matchesSearch && matchesCategory;
  });

  const handleAddToCart = (product: typeof products[0]) => {
    if (product.stock <= 0n) {
      toast.error('Produk habis');
      return;
    }
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      type: 'product',
      availableStock: product.stock,
      outletId: product.outletId,
    });
    toast.success('Ditambahkan ke keranjang');
  };

  const categoryChips = [
    { id: null, name: 'Semua', icon: '🍽️' },
    ...categories.filter(c => c.isActive).slice(0, 4).map(c => ({
      id: Number(c.id),
      name: c.name,
      icon: '🍽️'
    }))
  ];

  return (
    <div className="min-h-screen bg-white pb-20">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Hello {userName}!</h1>
            <div className="flex items-center gap-1 mt-1">
              <MapPin className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-600">Delivering to:</span>
              <span className="text-sm font-medium text-gray-900">{userAddress}</span>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            type="text"
            placeholder="Find good food around you"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 focus:border-[#1D6FFF] focus:ring-1 focus:ring-[#1D6FFF]"
            style={{ borderRadius: 0 }}
          />
        </div>
      </div>

      {/* Category Chips */}
      <div className="px-4 py-3 overflow-x-auto">
        <div className="flex gap-2 min-w-max">
          {categoryChips.map((cat) => (
            <button
              key={cat.id ?? 'all'}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors ${
                selectedCategory === cat.id
                  ? 'bg-[#1D6FFF] text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              style={{ borderRadius: 0 }}
            >
              <span className="mr-1">{cat.icon}</span>
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Promo Banner */}
      <div className="px-4 py-3">
        <div className="relative overflow-hidden bg-gradient-to-r from-orange-400 to-orange-500 h-32">
          <div className="absolute inset-0 flex items-center justify-between px-6">
            <div className="text-white">
              <h3 className="text-2xl font-bold mb-1">Promo Spesial</h3>
              <p className="text-lg">Hemat hingga <span className="text-3xl font-bold">60%</span></p>
            </div>
            <div className="text-6xl">🍱</div>
          </div>
        </div>
      </div>

      {/* Recommended Section */}
      <div className="px-4 py-3">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-gray-900">Recommended for you</h2>
        </div>

        {productsLoading ? (
          <div className="text-center py-8 text-gray-500">Loading...</div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {filteredProducts.slice(0, 6).map((product) => (
              <div key={Number(product.id)} className="bg-white border border-gray-200 overflow-hidden">
                <div className="aspect-square bg-gray-100 relative">
                  <div className="absolute inset-0 flex items-center justify-center text-4xl">
                    🍽️
                  </div>
                </div>
                <div className="p-3">
                  <h3 className="font-semibold text-sm text-gray-900 mb-1 line-clamp-1">
                    {product.name}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                    <span>1.5 km</span>
                    <span>•</span>
                    <span>15 min</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      ⭐ 4.8
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-base font-bold text-gray-900">
                      Rp {Number(product.price).toLocaleString('id-ID')}
                    </span>
                    <Button
                      size="sm"
                      onClick={() => handleAddToCart(product)}
                      disabled={product.stock <= 0n}
                      className="bg-[#1D6FFF] hover:bg-[#1557CC] text-white px-3 py-1 text-xs"
                      style={{ borderRadius: 0 }}
                    >
                      {product.stock <= 0n ? 'Habis' : 'Add'}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Your Latest Meals Section */}
      <div className="px-4 py-3">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-gray-900">Your latest meals</h2>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {filteredProducts.slice(6, 10).map((product) => (
            <div key={Number(product.id)} className="bg-white border border-gray-200 overflow-hidden">
              <div className="aspect-square bg-gray-100 relative">
                <div className="absolute inset-0 flex items-center justify-center text-4xl">
                  🍜
                </div>
              </div>
              <div className="p-3">
                <h3 className="font-semibold text-sm text-gray-900 mb-1 line-clamp-1">
                  {product.name}
                </h3>
                <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                  <span>2.0 km</span>
                  <span>•</span>
                  <span>20 min</span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    ⭐ 4.6
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-base font-bold text-gray-900">
                    Rp {Number(product.price).toLocaleString('id-ID')}
                  </span>
                  <Button
                    size="sm"
                    onClick={() => handleAddToCart(product)}
                    disabled={product.stock <= 0n}
                    className="bg-[#1D6FFF] hover:bg-[#1557CC] text-white px-3 py-1 text-xs"
                    style={{ borderRadius: 0 }}
                  >
                    {product.stock <= 0n ? 'Habis' : 'Add'}
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
