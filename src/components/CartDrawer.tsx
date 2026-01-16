import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CartItem } from '../types';
import { X, Minus, Plus, ShoppingBag } from 'lucide-react';
interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQuantity: (id: string, delta: number) => void;
  onCheckout: () => void;
}
export function CartDrawer({
  isOpen,
  onClose,
  items,
  onUpdateQuantity,
  onCheckout
}: CartDrawerProps) {
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  return <AnimatePresence>
      {isOpen && <>
          {/* Backdrop */}
          <motion.div initial={{
        opacity: 0
      }} animate={{
        opacity: 1
      }} exit={{
        opacity: 0
      }} onClick={onClose} className="fixed inset-0 bg-black/60 z-[60] backdrop-blur-sm" />

          {/* Drawer */}
          <motion.div initial={{
        y: '100%'
      }} animate={{
        y: 0
      }} exit={{
        y: '100%'
      }} transition={{
        type: 'spring',
        damping: 25,
        stiffness: 200
      }} className="fixed bottom-0 left-0 right-0 bg-[#efeae2] z-[70] rounded-t-2xl h-[85vh] flex flex-col shadow-2xl">
            {/* Handle */}
            <div className="h-1.5 w-12 bg-gray-300 rounded-full mx-auto mt-3 mb-1" />

            {/* Header */}
            <div className="px-4 py-3 border-b border-gray-200 bg-[#008069] text-white rounded-t-xl mx-2 mt-2 flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-2">
                <ShoppingBag size={20} />
                <span className="font-bold text-lg">Your Cart</span>
                <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs font-medium">
                  {items.reduce((acc, item) => acc + item.quantity, 0)} items
                </span>
              </div>
              <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-full">
                <X size={20} />
              </button>
            </div>

            {/* Items List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {items.length === 0 ? <div className="flex flex-col items-center justify-center h-full text-gray-400 space-y-4">
                  <ShoppingBag size={64} strokeWidth={1} />
                  <p>Your cart is empty</p>
                </div> : items.map(item => <div key={item.id} className="bg-white p-3 rounded-lg shadow-sm flex gap-3 relative">
                    <div className="w-16 h-16 bg-gray-100 rounded-md overflow-hidden flex-shrink-0">
                      {item.image && <img src={item.image} alt={item.name} className="w-full h-full object-cover" />}
                    </div>

                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{item.name}</h4>
                      <p className="text-[#008069] font-bold text-sm">
                        ${item.price.toFixed(2)}
                      </p>

                      <div className="flex items-center justify-end gap-3 mt-2">
                        <button onClick={() => onUpdateQuantity(item.id, -1)} className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 active:bg-gray-200">
                          <Minus size={14} />
                        </button>
                        <span className="font-medium w-4 text-center">
                          {item.quantity}
                        </span>
                        <button onClick={() => onUpdateQuantity(item.id, 1)} className="w-7 h-7 rounded-full bg-[#008069] flex items-center justify-center text-white active:bg-[#006a57]">
                          <Plus size={14} />
                        </button>
                      </div>
                    </div>
                  </div>)}
            </div>

            {/* Footer */}
            <div className="bg-white p-4 border-t border-gray-200 pb-safe">
              <div className="flex justify-between items-center mb-4">
                <span className="text-gray-500">Total</span>
                <span className="text-2xl font-bold text-gray-900">
                  ${total.toFixed(2)}
                </span>
              </div>

              <button onClick={onCheckout} disabled={items.length === 0} className="w-full bg-[#25D366] text-white font-bold py-3.5 rounded-full shadow-md active:scale-[0.98] transition-transform disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                <span>Place Order</span>
                <ShoppingBag size={18} />
              </button>
            </div>
          </motion.div>
        </>}
    </AnimatePresence>;
}