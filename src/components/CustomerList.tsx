import React from 'react';
import { Customer } from '../types';
import { Avatar } from './ui/Avatar';
import { motion } from 'framer-motion';
interface CustomerListProps {
  customers: Customer[];
  selectedCustomer?: string;
  onSelect: (id: string) => void;
}
export function CustomerList({
  customers,
  selectedCustomer,
  onSelect
}: CustomerListProps) {
  return <div className="flex-1 overflow-y-auto">
      {customers.map((customer, index) => <motion.div key={customer.id} initial={{
      opacity: 0,
      y: 10
    }} animate={{
      opacity: 1,
      y: 0
    }} transition={{
      delay: index * 0.05
    }} onClick={() => onSelect(customer.id)} className={`flex items-center px-4 py-3 cursor-pointer border-b border-gray-100 hover:bg-[#F5F5F5] transition-colors ${selectedCustomer === customer.id ? 'bg-[#E7F8EE]' : 'bg-white'}`}>
          <div className="relative">
            <Avatar src={customer.avatar} alt={customer.name} fallback={customer.name.substring(0, 2).toUpperCase()} size="lg" />
            {customer.status === 'online' && <span className="absolute bottom-0 right-0 block h-3 w-3 rounded-full ring-2 ring-white bg-[#25D366]" />}
          </div>

          <div className="ml-4 flex-1 min-w-0">
            <div className="flex justify-between items-baseline">
              <h3 className="text-base font-medium text-gray-900 truncate">
                {customer.name}
              </h3>
              <span className={`text-xs ${customer.unread ? 'text-[#25D366] font-medium' : 'text-gray-500'}`}>
                {customer.lastOrder}
              </span>
            </div>
            <div className="flex justify-between items-center mt-1">
              <p className="text-sm text-gray-500 truncate">
                {customer.status === 'online' ? 'Typing...' : 'Last seen recently'}
              </p>
              {customer.unread && <span className="bg-[#25D366] text-white text-xs font-bold px-2 py-0.5 rounded-full min-w-[1.25rem] text-center shadow-sm">
                  {customer.unread}
                </span>}
            </div>
          </div>
        </motion.div>)}
    </div>;
}