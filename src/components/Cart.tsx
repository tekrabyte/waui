import React, { useState } from 'react';
import { CartItem } from '../types';
import { ShoppingBag, X, Minus, Plus, ChevronDown, ChevronUp, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
interface CartProps {
  items: CartItem[];
  onUpdateQuantity: (id: string, delta: number) => void;
  onRemove: (id: string) => void;
  onCheckout: () => void;
}
export function Cart({
  items,
  onUpdateQuantity,
  onRemove,
  onCheckout
}: CartProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  if (items.length === 0) return null;
  return <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end">
      <AnimatePresence>
        {isExpanded && <motion.div initial={{
        opacity: 0,
        scale: 0.9,
        y: 20
      }} animate={{
        opacity: 1,
        scale: 1,
        y: 0
      }} exit={{
        opacity: 0,
        scale: 0.9,
        y: 20
      }} className="mb-4 w-80 md:w-96 bg-white rounded-lg shadow-xl overflow-hidden border border-gray-100 flex flex-col max-h-[60vh]">
            {/* Header */}
            <div className="bg-[#008069] text-white p-3 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <ShoppingBag size={18} />
                <span className="font-medium">Current Order</span>
              </div>
              <button onClick={() => setIsExpanded(false)} className="hover:bg-white/20 p-1 rounded-full transition-colors">
                <X size={18} />
              </button>
            </div>

            {/* Items List */}
            <div className="flex-1 overflow-y-auto p-2 space-y-2 bg-[#efeae2]">
              {items.map(item => <div key={item.id} className="bg-white p-2 rounded-lg shadow-sm flex gap-2 relative group">
                  <div className="flex-1">
                    <div className="flex justify-between">
                      <h4 className="text-sm font-medium text-gray-900">
                        {item.name}
                      </h4>
                      <span className="text-xs text-gray-500">
                        ${(item.price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-gray-500">
                        ${item.price.toFixed(2)} each
                      </span>
                      <div className="flex items-center gap-3 bg-gray-50 rounded-full px-2 py-0.5 border border-gray-100">
                        <button onClick={() => onUpdateQuantity(item.id, -1)} className="text-gray-500 hover:text-red-500 transition-colors">
                          <Minus size={14} />
                        </button>
                        <span className="text-sm font-medium w-4 text-center">
                          {item.quantity}
                        </span>
                        <button onClick={() => onUpdateQuantity(item.id, 1)} className="text-gray-500 hover:text-[#25D366] transition-colors">
                          <Plus size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>)}
            </div>

            {/* Footer */}
            <div className="p-3 bg-white border-t border-gray-100">
              <div className="flex justify-between items-center mb-3">
                <span className="text-gray-600">Total</span>
                <span className="text-xl font-bold text-gray-900">
                  ${total.toFixed(2)}
                </span>
              </div>
              <button onClick={onCheckout} className="w-full bg-[#25D366] hover:bg-[#1ebc57] text-white py-2.5 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors shadow-sm">
                <span>Send Order</span>
                <Send size={16} />
              </button>
            </div>
          </motion.div>}
      </AnimatePresence>

      {/* Floating Toggle Button */}
      <motion.button layout onClick={() => setIsExpanded(!isExpanded)} className="bg-[#25D366] hover:bg-[#1ebc57] text-white p-4 rounded-full shadow-lg flex items-center gap-3 transition-colors group">
        <div className="relative">
          <ShoppingBag size={24} />
          <span className="absolute -top-2 -right-2 bg-white text-[#25D366] text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center shadow-sm">
            {itemCount}
          </span>
        </div>
        {!isExpanded && <span className="font-bold pr-1">${total.toFixed(2)}</span>}
        {isExpanded ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
      </motion.button>
    </div>;
}