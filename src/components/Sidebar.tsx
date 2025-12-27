import React, { useState } from 'react';
import { Category, Customer } from '../types';
import { CategoryList } from './CategoryList';
import { CustomerList } from './CustomerList';
import { Avatar } from './ui/Avatar';
import { Search, MoreVertical, MessageSquare, Users, CircleDashed } from 'lucide-react';
interface SidebarProps {
  categories: Category[];
  customers: Customer[];
  selectedCategory: string;
  onSelectCategory: (id: string) => void;
  isOpen: boolean;
  onClose: () => void;
}
export function Sidebar({
  categories,
  customers,
  selectedCategory,
  onSelectCategory,
  isOpen,
  onClose
}: SidebarProps) {
  const [activeTab, setActiveTab] = useState<'categories' | 'customers'>('categories');
  const [selectedCustomer, setSelectedCustomer] = useState<string>('');
  return <aside className={`
      fixed inset-y-0 left-0 z-40 w-full md:w-[30%] md:static bg-white border-r border-gray-200 flex flex-col transition-transform duration-300 ease-in-out
      ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
    `}>
      {/* Header */}
      <div className="bg-[#F0F2F5] px-4 py-3 flex justify-between items-center border-b border-gray-200">
        <Avatar alt="User" fallback="ME" size="md" />
        <div className="flex gap-4 text-gray-500">
          <button className="hover:bg-gray-200 p-2 rounded-full transition-colors" title="Status">
            <CircleDashed size={20} />
          </button>
          <button className="hover:bg-gray-200 p-2 rounded-full transition-colors" title="New Chat">
            <MessageSquare size={20} />
          </button>
          <button className="hover:bg-gray-200 p-2 rounded-full transition-colors" title="Menu">
            <MoreVertical size={20} />
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="p-3 bg-white border-b border-gray-100">
        <div className="relative bg-[#F0F2F5] rounded-lg">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-500" />
          </div>
          <input type="text" className="bg-transparent border-none w-full py-2 pl-10 pr-3 text-sm text-gray-900 placeholder-gray-500 focus:ring-0 focus:outline-none" placeholder="Search or start new chat" />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        <button onClick={() => setActiveTab('categories')} className={`flex-1 py-3 text-sm font-medium transition-colors relative ${activeTab === 'categories' ? 'text-[#008069]' : 'text-gray-500 hover:bg-gray-50'}`}>
          Categories
          {activeTab === 'categories' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-[#008069]" />}
        </button>
        <button onClick={() => setActiveTab('customers')} className={`flex-1 py-3 text-sm font-medium transition-colors relative ${activeTab === 'customers' ? 'text-[#008069]' : 'text-gray-500 hover:bg-gray-50'}`}>
          Customers
          {activeTab === 'customers' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-[#008069]" />}
        </button>
      </div>

      {/* List Content */}
      {activeTab === 'categories' ? <CategoryList categories={categories} selectedCategory={selectedCategory} onSelect={id => {
      onSelectCategory(id);
      if (window.innerWidth < 768) onClose();
    }} /> : <CustomerList customers={customers} selectedCustomer={selectedCustomer} onSelect={setSelectedCustomer} />}
    </aside>;
}