import { Link } from 'react-router-dom';
import { ArrowLeft, Heart, Trash2 } from 'lucide-react';
import { useFavorites } from '../context/FavoritesContext';
import ListingCard from '../components/ListingCard';

export default function FavoritesPage() {
  const { favorites, clearFavorites } = useFavorites();

  return (
    <div>
      <Link to="/" className="inline-flex items-center gap-2 text-text-muted hover:text-white mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Ana Sayfaya DÃ¶n
      </Link>

      <div className="bg-dark-800 rounded-2xl p-8 border border-dark-700 mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center">
              <Heart className="w-7 h-7 text-red-500 fill-red-500" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white mb-1">Favorilerim</h1>
              <p className="text-text-muted">
                {favorites.length} ilan favorilerinde
              </p>
            </div>
          </div>
          
          {favorites.length > 0 && (
            <button
              onClick={() => {
                if (window.confirm('TÃ¼m favorileri silmek istediÄŸinize emin misiniz?')) {
                  clearFavorites();
                }
              }}
              className="bg-red-500/10 hover:bg-red-500/20 text-red-400 px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-all border border-red-500/30"
            >
              <Trash2 className="w-4 h-4" />
              TÃ¼mÃ¼nÃ¼ Temizle
            </button>
          )}
        </div>
      </div>

      {favorites.length === 0 ? (
        <div className="bg-dark-800 rounded-xl border border-dark-700 p-12 text-center">
          <Heart className="w-16 h-16 text-text-muted mx-auto mb-4 opacity-30" />
          <h2 className="text-xl font-bold text-white mb-2">HenÃ¼z favori ilan yok</h2>
          <p className="text-text-muted mb-6">
            BeÄŸendiÄŸin ilanlarÄ± kalp ikonuna tÄ±klayarak favorilerine ekleyebilirsin.
          </p>
          <Link 
            to="/"
            className="inline-block bg-primary hover:bg-primaryHover text-white px-6 py-3 rounded-xl font-semibold transition-all"
          >
            Ä°lanlara GÃ¶z At
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {favorites.map(listing => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      )}
    </div>
  );
}