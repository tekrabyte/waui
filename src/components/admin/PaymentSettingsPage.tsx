import React, { useState, useEffect } from 'react';
import { PaymentMethod } from '../../types/types';
import { api } from '../../services/api';
import { CreditCard, Smartphone, Banknote, QrCode } from 'lucide-react';

export default function PaymentSettingsPage() {
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadPayments();
  }, []);

  const loadPayments = async () => {
    try {
      setIsLoading(true);
      const data = await api.payments.getAll();
      setMethods(data);
    } catch (err) {
      console.error('Failed to load payments', err);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMethod = async (id: string) => {
    // Cari status saat ini
    const method = methods.find(m => m.id === id);
    if (!method) return;

    // Optimistic Update (ubah tampilan dulu agar responsif)
    setMethods(prev => prev.map(m => m.id === id ? { ...m, enabled: !m.enabled } : m));

    try {
      // Kirim ke backend
      await api.payments.toggle(id, !method.enabled);
    } catch (err) {
      // Kembalikan jika gagal
      alert('Failed to update payment method');
      setMethods(prev => prev.map(m => m.id === id ? { ...m, enabled: method.enabled } : m));
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'cash': return Banknote;
      case 'card': return CreditCard;
      case 'ewallet': return Smartphone;
      case 'qr': return QrCode;
      default: return Banknote;
    }
  };

  if (isLoading) return <div className="p-8 text-center">Loading payment settings...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payment Methods</h1>
          <p className="text-gray-500">Configure accepted payment options</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {methods.length === 0 ? (
          <div className="col-span-2 text-center py-8 text-gray-500">No payment methods found.</div>
        ) : (
          methods.map(method => {
            const Icon = getIcon(method.type);
            return (
              <div key={method.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex items-start justify-between">
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

                <button 
                  onClick={() => toggleMethod(method.id)} 
                  className={`w-12 h-6 rounded-full p-1 transition-colors ${method.enabled ? 'bg-[#25D366]' : 'bg-gray-300'}`}
                >
                  <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${method.enabled ? 'translate-x-6' : 'translate-x-0'}`} />
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}