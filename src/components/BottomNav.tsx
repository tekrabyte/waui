import React from 'react';
import { ShoppingBag, ShoppingCart, Clock, MapPin, Settings } from 'lucide-react';
import { motion } from 'framer-motion';
export type TabId = 'products' | 'orders' | 'history' | 'tracking' | 'settings';
interface BottomNavProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  cartCount: number;
}
export function BottomNav({
  activeTab,
  onTabChange,
  cartCount
}: BottomNavProps) {
  const tabs = [{
    id: 'products',
    label: 'Products',
    icon: ShoppingBag
  }, {
    id: 'orders',
    label: 'Orders',
    icon: ShoppingCart
  }, {
    id: 'history',
    label: 'History',
    icon: Clock
  }, {
    id: 'tracking',
    label: 'Tracking',
    icon: MapPin
  }, {
    id: 'settings',
    label: 'Settings',
    icon: Settings
  }] as const;
  return <div className="h-[60px] bg-white border-t border-gray-200 flex items-center justify-around fixed bottom-0 left-0 right-0 z-50 pb-safe">
      {tabs.map(tab => {
      const isActive = activeTab === tab.id;
      const Icon = tab.icon;
      return <button key={tab.id} onClick={() => onTabChange(tab.id)} className="relative flex flex-col items-center justify-center w-full h-full">
            {isActive && <motion.div layoutId="activeTabIndicator" className="absolute top-0 w-12 h-1 bg-[#008069] rounded-b-full" transition={{
          type: 'spring',
          stiffness: 500,
          damping: 30
        }} />}

            <div className={`relative ${isActive ? 'text-[#008069]' : 'text-gray-500'}`}>
              <Icon strokeWidth={isActive ? 2.5 : 2} size={24} />

              {tab.id === 'orders' && cartCount > 0 && <span className="absolute -top-1 -right-2 bg-[#25D366] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center border-2 border-white">
                  {cartCount}
                </span>}
            </div>

            <span className={`text-[10px] mt-1 font-medium ${isActive ? 'text-[#008069]' : 'text-gray-500'}`}>
              {tab.label}
            </span>
          </button>;
    })}
    </div>;
}