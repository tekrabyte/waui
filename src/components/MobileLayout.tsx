import React, { useState } from 'react';
import { BottomNav, TabId } from './BottomNav';
import { MobileHeader } from './MobileHeader';
import { ProductChatList } from './ProductChatList';
import { CategoryFilterChips } from './CategoryFilterChips';
import { CartDrawer } from './CartDrawer';
import { SettingsView } from './SettingsView';
import { Product, Category, CartItem, Customer } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, MapPin, Clock, Settings } from 'lucide-react';
interface MobileLayoutProps {
  categories: Category[];
  products: Product[];
  cart: CartItem[];
  customers: Customer[];
  onAddToCart: (product: Product) => void;
  onUpdateQuantity: (id: string, delta: number) => void;
  onCheckout: () => void;
  onLogout: () => void;
}
export function MobileLayout({
  categories,
  products,
  cart,
  customers,
  onAddToCart,
  onUpdateQuantity,
  onCheckout,
  onLogout
}: MobileLayoutProps) {
  const [activeTab, setActiveTab] = useState<TabId>('products');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  // Filter products based on selected category
  const filteredProducts = selectedCategory ? products.filter(p => p.category === selectedCategory) : products;
  // Handle tab changes
  const handleTabChange = (tab: TabId) => {
    if (tab === 'orders') {
      // If clicking orders tab, open cart/orders view
      setIsCartOpen(true);
    } else {
      setActiveTab(tab);
    }
  };
  // Get header title based on view
  const getHeaderTitle = () => {
    const titles: Record<TabId, string> = {
      products: 'WhatsApp POS',
      orders: 'My Orders',
      history: 'Order History',
      tracking: 'Track Order',
      settings: 'Settings'
    };
    return titles[activeTab];
  };
  return <div className="flex flex-col h-screen bg-white overflow-hidden">
      <MobileHeader title={getHeaderTitle()} showSearch={activeTab === 'products'} />

      <main className="flex-1 overflow-y-auto relative bg-white">
        <AnimatePresence mode="wait">
          {activeTab === 'products' && <motion.div key="products" initial={{
          opacity: 0
        }} animate={{
          opacity: 1
        }} exit={{
          opacity: 0
        }} className="flex flex-col min-h-full">
              <CategoryFilterChips categories={categories} selectedCategory={selectedCategory} onSelectCategory={setSelectedCategory} />

              <ProductChatList products={filteredProducts} cartItems={cart.map(i => ({
            id: i.id,
            quantity: i.quantity
          }))} onAddToCart={onAddToCart} />
            </motion.div>}

          {activeTab === 'history' && <motion.div key="history" initial={{
          opacity: 0,
          x: 20
        }} animate={{
          opacity: 1,
          x: 0
        }} exit={{
          opacity: 0,
          x: -20
        }} className="flex flex-col items-center justify-center h-full text-gray-400 p-8 text-center">
              <Clock size={48} className="mb-4 opacity-20" />
              <h3 className="text-lg font-medium text-gray-600">
                Order History
              </h3>
              <p className="text-sm mt-2">Your past orders will appear here.</p>
            </motion.div>}

          {activeTab === 'tracking' && <motion.div key="tracking" initial={{
          opacity: 0,
          x: 20
        }} animate={{
          opacity: 1,
          x: 0
        }} exit={{
          opacity: 0,
          x: -20
        }} className="flex flex-col items-center justify-center h-full text-gray-400 p-8 text-center">
              <MapPin size={48} className="mb-4 opacity-20" />
              <h3 className="text-lg font-medium text-gray-600">
                Order Tracking
              </h3>
              <p className="text-sm mt-2">Track your delivery in real-time.</p>
            </motion.div>}

          {activeTab === 'settings' && <motion.div key="settings" initial={{
          opacity: 0,
          x: 20
        }} animate={{
          opacity: 1,
          x: 0
        }} exit={{
          opacity: 0,
          x: -20
        }} className="h-full">
              <SettingsView onLogout={onLogout} />
            </motion.div>}
        </AnimatePresence>
      </main>

      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} items={cart} onUpdateQuantity={onUpdateQuantity} onCheckout={() => {
      onCheckout();
      setIsCartOpen(false);
    }} />

      <BottomNav activeTab={activeTab} onTabChange={handleTabChange} cartCount={cart.reduce((acc, item) => acc + item.quantity, 0)} />
    </div>;
}