import { createContext, useContext, useState, useEffect } from 'react';
import { useToast } from './ToastContext';

const FavoritesContext = createContext(null);

export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (!context) throw new Error('useFavorites must be used within FavoritesProvider');
  return context;
}

export function FavoritesProvider({ children }) {
  const { addToast } = useToast();
  
  // âœ… FIX: Initial state'i localStorage'dan oku
  const [favorites, setFavorites] = useState(() => {
    try {
      const saved = localStorage.getItem('itemevim_favorites');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error('Favorites parse error:', e);
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('itemevim_favorites', JSON.stringify(favorites));
  }, [favorites]);

  const toggleFavorite = (listing) => {
    const exists = favorites.find(f => f.id === listing.id);
    
    if (exists) {
      setFavorites(prev => prev.filter(f => f.id !== listing.id));
      addToast('Favorilerden Ã§Ä±karÄ±ldÄ±', 'info', 2000);
    } else {
      setFavorites(prev => [...prev, listing]);
      addToast('Favorilere eklendi â¤ï¸', 'success', 2000);
    }
  };

  const isFavorite = (listingId) => {
    return favorites.some(f => f.id === listingId);
  };

  const clearFavorites = () => {
    setFavorites([]);
    addToast('TÃ¼m favoriler temizlendi', 'info');
  };

  return (
    <FavoritesContext.Provider value={{ favorites, toggleFavorite, isFavorite, clearFavorites }}>
      {children}
    </FavoritesContext.Provider>
  );
}