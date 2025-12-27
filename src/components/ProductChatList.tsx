import React from 'react';
import { Product } from '../types';
import { MobileProductCard } from './MobileProductCard';
import { motion } from 'framer-motion';
interface ProductChatListProps {
  products: Product[];
  cartItems: {
    id: string;
    quantity: number;
  }[];
  onAddToCart: (product: Product) => void;
}
export function ProductChatList({
  products,
  cartItems,
  onAddToCart
}: ProductChatListProps) {
  return <div className="bg-white min-h-full pb-20">
      {products.map((product, index) => <motion.div key={product.id} initial={{
      opacity: 0,
      y: 10
    }} animate={{
      opacity: 1,
      y: 0
    }} transition={{
      delay: index * 0.03
    }}>
          <MobileProductCard product={product} onAdd={onAddToCart} addedCount={cartItems.find(item => item.id === product.id)?.quantity || 0} />
        </motion.div>)}

      {products.length === 0 && <div className="p-8 text-center text-gray-500">
          <p>No products found in this category.</p>
        </div>}
    </div>;
}