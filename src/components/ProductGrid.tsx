import React from 'react';
import { Product } from '../types';
import { ProductCard } from './ProductCard';
import { motion } from 'framer-motion';
interface ProductGridProps {
  products: Product[];
  onAddToCart: (product: Product) => void;
  categoryName: string;
}
export function ProductGrid({
  products,
  onAddToCart,
  categoryName
}: ProductGridProps) {
  return <div className="flex-1 p-4 md:p-6 overflow-y-auto bg-[#efeae2] relative">
      {/* WhatsApp Chat Background Pattern Overlay (Simulated with CSS) */}
      <div className="absolute inset-0 opacity-[0.06] pointer-events-none" style={{
      backgroundImage: 'radial-gradient(#4a4a4a 1px, transparent 1px)',
      backgroundSize: '20px 20px'
    }} />

      <div className="relative z-10 max-w-6xl mx-auto">
        <div className="flex items-center justify-center mb-6">
          <span className="bg-[#FFF8C5] text-gray-800 text-xs px-3 py-1.5 rounded-lg shadow-sm font-medium">
            {categoryName} • {products.length} items available
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
          {products.map(product => <ProductCard key={product.id} product={product} onAdd={onAddToCart} />)}
        </div>

        {products.length === 0 && <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <p>No products found in this category.</p>
          </div>}
      </div>
    </div>;
}