import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { ArrowLeft, Search as SearchIcon } from 'lucide-react';
import ListingCard from '../components/ListingCard';

export default function SearchPage() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSearch = async () => {
      if (!query) {
        setListings([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const res = await fetch(`/api/listings?search=${query}&limit=50`);
        const data = await res.json();
        
        if (data.data && Array.isArray(data.data)) {
          setListings(data.data);
        } else if (Array.isArray(data)) {
          setListings(data);
        }
      } catch (err) {
        console.error('Arama yapÄ±lamadÄ±:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSearch();
  }, [query]);

  return (
    <div>
      {/* Geri Butonu */}
      <Link 
        to="/" 
        className="inline-flex items-center gap-2 text-text-muted hover:text-white mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Ana Sayfaya DÃ¶n
      </Link>

      {/* Arama BaÅŸlÄ±ÄŸÄ± */}
      <div className="bg-dark-800 rounded-2xl p-8 mb-8 border border-dark-700">
        <div className="flex items-center gap-3 mb-2">
          <SearchIcon className="w-8 h-8 text-primary" />
          <h1 className="text-2xl md:text-3xl font-bold text-white">
            Arama SonuÃ§larÄ±
          </h1>
        </div>
        <p className="text-text-muted">
          "{query}" iÃ§in {listings.length} sonuÃ§ bulundu
        </p>
      </div>

      {/* SonuÃ§lar */}
      {loading ? (
        <div className="text-center py-16">
          <div className="inline-block w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-text-muted mt-4">AranÄ±yor...</p>
        </div>
      ) : listings.length === 0 ? (
        <div className="bg-dark-800 rounded-xl border border-dark-700 p-12 text-center">
          <p className="text-text-muted text-lg mb-2">
            "{query}" iÃ§in sonuÃ§ bulunamadÄ±.
          </p>
          <p className="text-text-muted text-sm">
            FarklÄ± anahtar kelimeler deneyin.
          </p>
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