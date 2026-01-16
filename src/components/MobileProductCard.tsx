import React from 'react';
import { Product } from '../types';
import { motion } from 'framer-motion';
interface MobileProductCardProps {
  product: Product;
  onAdd: (product: Product) => void;
  addedCount?: number;
}
export function MobileProductCard({
  product,
  onAdd,
  addedCount = 0
}: MobileProductCardProps) {
  // Generate a pseudo-random time based on product ID for the "timestamp" look
  const getRandomTime = (id: string) => {
    const hours = 10 + parseInt(id) % 12;
    const mins = parseInt(id) * 7 % 60;
    return `${hours}:${mins.toString().padStart(2, '0')} ${hours >= 12 ? 'PM' : 'AM'}`;
  };
  return <motion.div whileTap={{
    backgroundColor: '#f5f5f5'
  }} onClick={() => onAdd(product)} className="flex items-center px-4 py-3 bg-white active:bg-gray-50 cursor-pointer relative group">
      {/* Avatar / Product Image */}
      <div className="relative mr-3 flex-shrink-0">
        <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200">
          {product.image ? <img src={product.image} alt={product.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center bg-gray-300 text-white font-bold text-lg">
              {product.name.charAt(0)}
            </div>}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 border-b border-gray-100 pb-3 group-last:border-none h-full flex flex-col justify-center">
        <div className="flex justify-between items-baseline mb-0.5">
          <h3 className="text-[16px] font-semibold text-gray-900 truncate pr-2">
            {product.name}
          </h3>
          <span className="text-[11px] text-gray-500 flex-shrink-0">
            {getRandomTime(product.id)}
          </span>
        </div>

        <div className="flex justify-between items-center">
          <div className="flex items-center text-gray-500 text-[14px] truncate">
            {/* Checkmarks simulation */}
            {addedCount > 0 && <span className="text-[#53bdeb] mr-1 text-[16px]">✓✓</span>}
            <span className="truncate">
              {product.description || `$${product.price.toFixed(2)}`}
            </span>
          </div>

          {/* Unread Badge / Quantity Counter */}
          {addedCount > 0 && <div className="min-w-[20px] h-[20px] bg-[#25D366] rounded-full flex items-center justify-center px-1.5 ml-2">
              <span className="text-white text-[10px] font-bold">
                {addedCount}
              </span>
            </div>}
        </div>
      </div>
    </motion.div>;
}