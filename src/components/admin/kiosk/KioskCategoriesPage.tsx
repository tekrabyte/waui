import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Search, ArrowLeft } from 'lucide-react';
import { useGetAllCategories } from '../../hooks/useQueries';
import { Input } from '../../components/ui/input';

export default function KioskCategoriesPage() {
  const navigate = useNavigate();
  const { data: categories = [], isLoading } = useGetAllCategories();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredCategories = categories.filter(cat =>
    cat.isActive && cat.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCategoryClick = (categoryId: number) => {
    navigate({ to: '/', search: { category: categoryId } });
  };

  return (
    <div className="min-h-screen bg-white pb-20">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center gap-3 mb-3">
          <button onClick={() => navigate({ to: '/' })} className="p-1">
            <ArrowLeft className="w-6 h-6 text-gray-900" />
          </button>
          <h1 className="text-xl font-bold text-gray-900">Kategori</h1>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            type="text"
            placeholder="Cari kategori..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 focus:border-[#1D6FFF] focus:ring-1 focus:ring-[#1D6FFF]"
            style={{ borderRadius: 0 }}
          />
        </div>
      </div>

      {/* Categories Grid */}
      <div className="px-4 py-4">
        {isLoading ? (
          <div className="text-center py-8 text-gray-500">Loading...</div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {filteredCategories.map((category) => (
              <button
                key={Number(category.id)}
                onClick={() => handleCategoryClick(Number(category.id))}
                className="bg-white border border-gray-200 p-4 hover:border-[#1D6FFF] transition-colors"
              >
                <div className="aspect-square bg-gray-100 mb-3 flex items-center justify-center text-4xl">
                  🍽️
                </div>
                <h3 className="font-semibold text-sm text-gray-900 text-center">
                  {category.name}
                </h3>
                <p className="text-xs text-gray-500 text-center mt-1">
                  {category.description || 'Lihat semua'}
                </p>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
