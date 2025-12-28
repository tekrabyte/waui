import { useState } from 'react';

export const useKioskCart = () => {
  const [cart, setCart] = useState<any[]>([]);
  
  const addToCart = (product: any) => {
    setCart([...cart, { ...product, quantity: 1 }]);
  };

  const removeFromCart = (id: string) => {
    setCart(cart.filter(item => item.id !== id));
  };

  const clearCart = () => setCart([]);

  return { cart, addToCart, removeFromCart, clearCart, total: 0 };
};