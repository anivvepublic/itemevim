import ListingCard from './ListingCard';
import { ArrowRight, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function FeaturedListings({ listings, title = "Ã–ne Ã‡Ä±kan Ä°lanlar" }) {
  if (!listings || listings.length === 0) {
    return null;
  }

  return (
    <section className="mb-10">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-primary" />
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-white">{title}</h2>
            <p className="text-text-muted text-sm">Vitrin ilanlarÄ±</p>
          </div>
        </div>
        <Link 
          to="/search" 
          className="text-primary hover:text-primaryHover text-sm font-medium transition-colors flex items-center gap-1 group"
        >
          TÃ¼mÃ¼nÃ¼ GÃ¶r
          <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {listings.map((listing) => (
          <ListingCard key={listing.id} listing={listing} />
        ))}
      </div>
    </section>
  );
}