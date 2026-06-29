import { Link } from 'react-router-dom';
import { Star, CheckCircle, Heart, ShoppingCart } from 'lucide-react';
import { useFavorites } from '../context/FavoritesContext';
import { useCart } from '../context/CartContext';

export default function ListingCard({ listing }) {
  const { toggleFavorite, isFavorite } = useFavorites();
  const { addToCart, isInCart } = useCart();
  const favorite = isFavorite(listing.id);
  const inCart = isInCart(listing.id);

  return (
    <div className="group bg-dark-800 rounded-xl overflow-hidden border border-dark-700 hover:border-primary/50 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/10">
      {/* GÃ¶rsel */}
      <div className="relative aspect-[16/10] overflow-hidden bg-dark-900">
        <Link to={`/listing/${listing.id}`}>
          <img
            src={listing.image}
            alt={listing.title}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            onError={(e) => {
              e.target.src = 'https://via.placeholder.com/600x400/1a1d2d/7c3aed?text=Oyun+Gorseli';
            }}
          />
        </Link>
        
        {/* Vitrin Badge */}
        {listing.is_featured && (
          <div className="absolute top-2.5 left-2.5 bg-primary text-white text-xs font-bold px-2.5 py-1 rounded-md shadow-lg shadow-primary/30 flex items-center gap-1">
            <Star className="w-3 h-3 fill-white" />
            Vitrin
          </div>
        )}

        {/* Kategori Badge */}
        {listing.category_slug && (
          <div className="absolute top-2.5 right-2.5 bg-dark-900/80 backdrop-blur-sm text-white text-xs font-medium px-2.5 py-1 rounded-md border border-white/10">
            {listing.category_slug.toUpperCase()}
          </div>
        )}

        {/* Favori Kalp Butonu */}
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleFavorite(listing);
          }}
          className={`absolute bottom-2.5 right-2.5 w-9 h-9 rounded-full flex items-center justify-center transition-all ${
            favorite 
              ? 'bg-red-500 text-white shadow-lg shadow-red-500/50' 
              : 'bg-dark-900/80 backdrop-blur-sm text-white hover:bg-red-500 hover:text-white border border-white/10'
          }`}
          aria-label={favorite ? 'Favorilerden Ã§Ä±kar' : 'Favorilere ekle'}
        >
          <Heart className={`w-4 h-4 ${favorite ? 'fill-white' : ''}`} />
        </button>
      </div>

      {/* Ä°Ã§erik */}
      <div className="p-4">
        {/* BaÅŸlÄ±k */}
        <Link to={`/listing/${listing.id}`}>
          <h3 className="text-white font-semibold text-sm mb-2 line-clamp-2 group-hover:text-primary transition-colors leading-snug min-h-[2.5rem]">
            {listing.title}
          </h3>
        </Link>
        
        {/* KÄ±sa AÃ§Ä±klama */}
        {listing.description && (
          <p className="text-text-muted text-xs mb-3 line-clamp-2 leading-relaxed">
            {listing.description}
          </p>
        )}

        {/* SatÄ±cÄ± Bilgisi */}
        <div className="flex items-center justify-between mb-3 pb-3 border-b border-dark-700">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-6 h-6 rounded-full bg-dark-700 overflow-hidden flex-shrink-0 border border-dark-600">
              {listing.seller?.avatar ? (
                <img 
                  src={listing.seller.avatar} 
                  alt={listing.seller.username}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xs">ðŸ‘¤</div>
              )}
            </div>
            <span className="text-text-muted text-xs truncate">{listing.seller?.username || 'SatÄ±cÄ±'}</span>
          </div>
          
          {listing.seller?.verified && (
            <div className="flex items-center gap-1 text-primary flex-shrink-0">
              <CheckCircle className="w-3.5 h-3.5" />
              <span className="text-[10px] font-medium">OnaylÄ±</span>
            </div>
          )}
        </div>

        {/* Fiyat + Sepete Ekle */}
        <div className="flex items-center justify-between">
          <div>
            <span className="text-text-muted text-xs block">Fiyat</span>
            <span className="text-white font-bold text-lg">
              â‚º{listing.price?.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
            </span>
          </div>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              addToCart(listing);
            }}
            disabled={inCart}
            className={`text-xs font-semibold transition-all flex items-center gap-1 px-3 py-1.5 rounded-lg ${
              inCart
                ? 'bg-green-500/10 text-green-400 border border-green-500/30 cursor-default'
                : 'bg-primary/10 text-primary hover:bg-primary hover:text-white border border-primary/30'
            }`}
          >
            <ShoppingCart className="w-3 h-3" />
            {inCart ? 'Sepette' : 'Sepete Ekle'}
          </button>
        </div>
      </div>
    </div>
  );
}