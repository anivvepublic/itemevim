import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, SlidersHorizontal, TrendingUp, Clock, DollarSign } from 'lucide-react';
import ListingCard from '../components/ListingCard';

export default function CategoryPage() {
  const { slug } = useParams();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState(null);
  const [sortBy, setSortBy] = useState('newest');
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        const catRes = await fetch('/api/categories');
        const categories = await catRes.json();
        const currentCategory = categories.find(c => c.slug === slug);
        setCategory(currentCategory);

        const res = await fetch(`/api/listings?category=${slug}&limit=100`);
        const data = await res.json();
        
        let results = [];
        if (data.data && Array.isArray(data.data)) {
          results = data.data;
        } else if (Array.isArray(data)) {
          results = data;
        }

        // Fiyat filtresi
        if (priceRange.min) {
          results = results.filter(l => l.price >= parseFloat(priceRange.min));
        }
        if (priceRange.max) {
          results = results.filter(l => l.price <= parseFloat(priceRange.max));
        }

        // SÄ±ralama
        switch (sortBy) {
          case 'price_asc':
            results.sort((a, b) => a.price - b.price);
            break;
          case 'price_desc':
            results.sort((a, b) => b.price - a.price);
            break;
          case 'newest':
          default:
            results.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
            break;
        }

        setListings(results);
      } catch (err) {
        console.error('Kategori yÃ¼klenemedi:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [slug, sortBy, priceRange]);

  return (
    <div>
      <Link to="/" className="inline-flex items-center gap-2 text-text-muted hover:text-white mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Ana Sayfaya DÃ¶n
      </Link>

      {/* BaÅŸlÄ±k */}
      <div className="bg-dark-800 rounded-2xl p-8 mb-6 border border-dark-700">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
              {category?.name || slug?.toUpperCase()}
            </h1>
            <p className="text-text-muted">
              {listings.length} ilan bulundu
            </p>
          </div>
          
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className={`px-5 py-2.5 rounded-lg font-medium flex items-center gap-2 transition-all ${
              showFilters 
                ? 'bg-primary text-white' 
                : 'bg-dark-700 hover:bg-dark-600 text-white'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            Filtrele
          </button>
        </div>
      </div>

      {/* Filtreler */}
      {showFilters && (
        <div className="bg-dark-800 rounded-2xl p-6 mb-6 border border-dark-700">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Fiyat AralÄ±ÄŸÄ± */}
            <div>
              <label className="block text-white text-sm font-medium mb-2">Fiyat AralÄ±ÄŸÄ±</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={priceRange.min}
                  onChange={(e) => setPriceRange(prev => ({ ...prev, min: e.target.value }))}
                  className="flex-1 bg-dark-900 text-white px-3 py-2 rounded-lg border border-dark-700 focus:outline-none focus:border-primary text-sm"
                />
                <input
                  type="number"
                  placeholder="Max"
                  value={priceRange.max}
                  onChange={(e) => setPriceRange(prev => ({ ...prev, max: e.target.value }))}
                  className="flex-1 bg-dark-900 text-white px-3 py-2 rounded-lg border border-dark-700 focus:outline-none focus:border-primary text-sm"
                />
              </div>
            </div>

            {/* SÄ±ralama */}
            <div>
              <label className="block text-white text-sm font-medium mb-2">SÄ±ralama</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full bg-dark-900 text-white px-3 py-2 rounded-lg border border-dark-700 focus:outline-none focus:border-primary text-sm"
              >
                <option value="newest">En Yeni</option>
                <option value="price_asc">Fiyat: DÃ¼ÅŸÃ¼kten YÃ¼kseÄŸe</option>
                <option value="price_desc">Fiyat: YÃ¼ksekten DÃ¼ÅŸÃ¼ÄŸe</option>
              </select>
            </div>

            {/* Temizle */}
            <div className="flex items-end">
              <button
                onClick={() => {
                  setPriceRange({ min: '', max: '' });
                  setSortBy('newest');
                }}
                className="w-full bg-dark-700 hover:bg-dark-600 text-white px-4 py-2 rounded-lg text-sm transition-all"
              >
                Filtreleri Temizle
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Ä°lan Listesi */}
      {loading ? (
        <div className="text-center py-16">
          <div className="inline-block w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-text-muted mt-4">Ä°lanlar yÃ¼kleniyor...</p>
        </div>
      ) : listings.length === 0 ? (
        <div className="bg-dark-800 rounded-xl border border-dark-700 p-12 text-center">
          <p className="text-text-muted text-lg mb-2">Bu kategoride ilan bulunamadÄ±.</p>
          <Link to="/" className="text-primary hover:underline">
            â† Ana Sayfaya DÃ¶n
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {listings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      )}
    </div>
  );
}