import React from 'react';
import { Category } from '../types';
import { motion } from 'framer-motion';
interface CategoryFilterChipsProps {
  categories: Category[];
  selectedCategory: string | null;
  onSelectCategory: (id: string | null) => void;
}
export function CategoryFilterChips({
  categories,
  selectedCategory,
  onSelectCategory
}: CategoryFilterChipsProps) {
  // Add "All" option manually if not present in categories list logic
  const allOption = {
    id: 'all',
    name: 'All'
  };
  const displayCategories = [allOption, ...categories];
  return <div className="sticky top-0 z-40 bg-white border-b border-gray-100 py-2">
      <div className="flex overflow-x-auto px-4 gap-2 no-scrollbar pb-1">
        {displayCategories.map(category => {
        const isSelected = category.id === 'all' && !selectedCategory || category.id === selectedCategory;
        return <button key={category.id} onClick={() => onSelectCategory(category.id === 'all' ? null : category.id)} className={`
                whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-medium transition-colors flex-shrink-0
                ${isSelected ? 'bg-[#008069]/10 text-[#008069]' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}
              `}>
              {category.name}
            </button>;
      })}
      </div>
    </div>;
}