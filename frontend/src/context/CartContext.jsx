import { createContext, useContext, useState, useEffect } from 'react';
import { useToast } from './ToastContext';

const CartContext = createContext(null);

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within CartProvider');
  return context;
}

export function CartProvider({ children }) {
  const { addToast } = useToast();
  
  // ✅ FIX: Initial state'i localStorage'dan oku (F5'te kaybolmaz)
  const [cart, setCart] = useState(() => {
    try {
      const saved = localStorage.getItem('itemevim_cart');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error('Cart parse error:', e);
      return [];
    }
  });

  // Değişiklikte localStorage'a kaydet
  useEffect(() => {
    localStorage.setItem('itemevim_cart', JSON.stringify(cart));
  }, [cart]);

  const addToCart = (listing) => {
    const exists = cart.find(item => item.id === listing.id);
    
    if (exists) {
      addToast('Bu ilan zaten sepetinizde', 'warning');
      return;
    }

    setCart(prev => [...prev, {
      ...listing,
      addedAt: new Date().toISOString()
    }]);
    
    addToast('Sepete eklendi 🛒', 'success', 2000);
  };

  const removeFromCart = (listingId) => {
    setCart(prev => prev.filter(item => item.id !== listingId));
    addToast('Sepetten çıkarıldı', 'info', 2000);
  };

  const clearCart = () => {
    setCart([]);
    addToast('Sepet temizlendi', 'info', 2000);
  };

  const isInCart = (listingId) => {
    return cart.some(item => item.id === listingId);
  };

  const cartTotal = cart.reduce((sum, item) => sum + parseFloat(item.price || 0), 0);
  const cartCount = cart.length;

  return (
    <CartContext.Provider value={{ 
      cart, 
      addToCart, 
      removeFromCart, 
      clearCart, 
      isInCart,
      cartTotal,
      cartCount
    }}>
      {children}
    </CartContext.Provider>
  );
}