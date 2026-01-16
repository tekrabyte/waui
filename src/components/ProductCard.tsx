import React from 'react';
import { Product } from '../types';
import { Plus, ShoppingCart } from 'lucide-react';
import { motion } from 'framer-motion';
interface ProductCardProps {
  product: Product;
  onAdd: (product: Product) => void;
}
export function ProductCard({
  product,
  onAdd
}: ProductCardProps) {
  return <motion.div whileHover={{
    y: -2
  }} className="bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden group border border-gray-100">
      <div className="relative aspect-square bg-gray-100 overflow-hidden">
        {product.image ? <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" /> : <div className="w-full h-full flex items-center justify-center bg-[#F0F2F5] text-gray-400">
            <ShoppingCart size={32} opacity={0.2} />
          </div>}
        {!product.available && <div className="absolute inset-0 bg-white/60 flex items-center justify-center backdrop-blur-[1px]">
            <span className="bg-gray-800 text-white text-xs px-2 py-1 rounded font-medium">
              Out of Stock
            </span>
          </div>}
      </div>

      <div className="p-3">
        <div className="flex justify-between items-start mb-1">
          <h3 className="font-medium text-gray-900 text-sm line-clamp-2 leading-tight">
            {product.name}
          </h3>
        </div>

        <div className="flex justify-between items-end mt-2">
          <span className="text-[#008069] font-bold">
            ${product.price.toFixed(2)}
          </span>

          <button onClick={() => product.available && onAdd(product)} disabled={!product.available} className={`
              p-2 rounded-full transition-colors shadow-sm
              ${product.available ? 'bg-[#25D366] text-white hover:bg-[#1ebc57] active:scale-95' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}
            `} aria-label={`Add ${product.name} to cart`}>
            <Plus size={16} strokeWidth={3} />
          </button>
        </div>
      </div>
    </motion.div>;
}