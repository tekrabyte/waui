import { useNavigate } from '@tanstack/react-router';
import { ArrowLeft, Plus, Minus, Trash2 } from 'lucide-react';
import { useKioskCart } from '../../hooks/useKioskCart';
import { Button } from '../../components/ui/button';

export default function KioskCartPage() {
  const navigate = useNavigate();
  const { cart, updateQuantity, removeFromCart, cartTotal } = useKioskCart();

  const handleCheckout = () => {
    if (cart.length === 0) return;
    // TODO: Navigate to checkout page
    navigate({ to: '/' });
  };

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-white pb-20 flex flex-col">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-3">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate({ to: '/' })} className="p-1">
              <ArrowLeft className="w-6 h-6 text-gray-900" />
            </button>
            <h1 className="text-xl font-bold text-gray-900">Keranjang</h1>
          </div>
        </div>

        {/* Empty State */}
        <div className="flex-1 flex flex-col items-center justify-center px-4">
          <div className="text-6xl mb-4">🛒</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Keranjang Kosong</h2>
          <p className="text-gray-500 text-center mb-6">
            Belum ada produk di keranjang Anda
          </p>
          <Button
            onClick={() => navigate({ to: '/' })}
            className="bg-[#1D6FFF] hover:bg-[#1557CC] text-white px-8 py-3"
            style={{ borderRadius: 0 }}
          >
            Belanja Sekarang
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pb-32">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate({ to: '/' })} className="p-1">
            <ArrowLeft className="w-6 h-6 text-gray-900" />
          </button>
          <h1 className="text-xl font-bold text-gray-900">Keranjang</h1>
          <span className="ml-auto text-sm text-gray-500">
            {cart.length} item{cart.length > 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Cart Items */}
      <div className="px-4 py-4 space-y-3">
        {cart.map((item) => (
          <div key={`${item.id}-${item.type}`} className="bg-white border border-gray-200 p-4">
            <div className="flex gap-3">
              <div className="w-20 h-20 bg-gray-100 flex items-center justify-center text-2xl flex-shrink-0">
                🍽️
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm text-gray-900 mb-1">
                  {item.name}
                </h3>
                <p className="text-base font-bold text-gray-900 mb-2">
                  Rp {Number(item.price).toLocaleString('id-ID')}
                </p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 border border-gray-300">
                    <button
                      onClick={() => updateQuantity(item.id, item.type, -1)}
                      className="p-2 hover:bg-gray-100"
                    >
                      <Minus className="w-4 h-4 text-gray-600" />
                    </button>
                    <span className="text-sm font-medium text-gray-900 min-w-[2rem] text-center">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.id, item.type, 1)}
                      disabled={item.quantity >= Number(item.availableStock)}
                      className="p-2 hover:bg-gray-100 disabled:opacity-50"
                    >
                      <Plus className="w-4 h-4 text-gray-600" />
                    </button>
                  </div>
                  <button
                    onClick={() => removeFromCart(item.id, item.type)}
                    className="p-2 text-red-500 hover:bg-red-50"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Checkout Footer */}
      <div className="fixed bottom-16 left-0 right-0 bg-white border-t border-gray-200 px-4 py-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-gray-600">Total</span>
          <span className="text-xl font-bold text-gray-900">
            Rp {cartTotal.toLocaleString('id-ID')}
          </span>
        </div>
        <Button
          onClick={handleCheckout}
          className="w-full bg-[#1D6FFF] hover:bg-[#1557CC] text-white py-3 text-base font-semibold"
          style={{ borderRadius: 0 }}
        >
          Checkout
        </Button>
      </div>
    </div>
  );
}
