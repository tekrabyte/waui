import React, { useState } from 'react';
import { PaymentMethod } from '../../types';
import { CreditCard, Smartphone, Banknote, QrCode } from 'lucide-react';
const MOCK_PAYMENTS: PaymentMethod[] = [{
  id: '1',
  name: 'Cash',
  type: 'cash',
  enabled: true,
  transactionFee: 0
}, {
  id: '2',
  name: 'Credit Card',
  type: 'card',
  enabled: true,
  transactionFee: 2.5
}, {
  id: '3',
  name: 'E-Wallet',
  type: 'ewallet',
  enabled: true,
  transactionFee: 1.5
}, {
  id: '4',
  name: 'QRIS',
  type: 'qr',
  enabled: false,
  transactionFee: 0.7
}];
export function PaymentSettings() {
  const [methods, setMethods] = useState<PaymentMethod[]>(MOCK_PAYMENTS);
  const toggleMethod = (id: string) => {
    setMethods(prev => prev.map(m => m.id === id ? {
      ...m,
      enabled: !m.enabled
    } : m));
  };
  const getIcon = (type: string) => {
    switch (type) {
      case 'cash':
        return Banknote;
      case 'card':
        return CreditCard;
      case 'ewallet':
        return Smartphone;
      case 'qr':
        return QrCode;
      default:
        return Banknote;
    }
  };
  return <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payment Methods</h1>
          <p className="text-gray-500">Configure accepted payment options</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {methods.map(method => {
        const Icon = getIcon(method.type);
        return <div key={method.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex items-start justify-between">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center text-gray-600">
                  <Icon size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">{method.name}</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Fee: {method.transactionFee}%
                  </p>
                </div>
              </div>

              <button onClick={() => toggleMethod(method.id)} className={`w-12 h-6 rounded-full p-1 transition-colors ${method.enabled ? 'bg-[#25D366]' : 'bg-gray-300'}`}>
                <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${method.enabled ? 'translate-x-6' : 'translate-x-0'}`} />
              </button>
            </div>;
      })}
      </div>
    </div>;
}