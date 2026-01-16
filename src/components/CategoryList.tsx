import React from 'react';
import { Category } from '../types';
import { Avatar } from './ui/Avatar';
import { motion } from 'framer-motion';
interface CategoryListProps {
  categories: Category[];
  selectedCategory: string;
  onSelect: (id: string) => void;
}
export function CategoryList({
  categories,
  selectedCategory,
  onSelect
}: CategoryListProps) {
  return <div className="flex-1 overflow-y-auto">
      {categories.map((category, index) => <motion.div key={category.id} initial={{
      opacity: 0,
      y: 10
    }} animate={{
      opacity: 1,
      y: 0
    }} transition={{
      delay: index * 0.05
    }} onClick={() => onSelect(category.id)} className={`flex items-center px-4 py-3 cursor-pointer border-b border-gray-100 hover:bg-[#F5F5F5] transition-colors ${selectedCategory === category.id ? 'bg-[#E7F8EE]' : 'bg-white'}`}>
          <div className="relative">
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-2xl">
              {category.icon}
            </div>
          </div>

          <div className="ml-4 flex-1 min-w-0">
            <div className="flex justify-between items-baseline">
              <h3 className="text-base font-medium text-gray-900 truncate">
                {category.name}
              </h3>
              <span className="text-xs text-gray-500">
                {new Date().toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit'
            })}
              </span>
            </div>
            <div className="flex justify-between items-center mt-1">
              <p className="text-sm text-gray-500 truncate">
                {category.count} items available
              </p>
              {selectedCategory === category.id && <span className="bg-[#25D366] text-white text-xs font-bold px-2 py-0.5 rounded-full min-w-[1.25rem] text-center">
                  ✓
                </span>}
            </div>
          </div>
        </motion.div>)}
    </div>;
}