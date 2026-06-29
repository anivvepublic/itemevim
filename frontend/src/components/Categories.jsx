import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

export default function Categories() {
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    fetch('/api/categories/popular?limit=8')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setCategories(data);
        } else {
          setCategories(getMockCategories().slice(0, 8));
        }
      })
      .catch(() => setCategories(getMockCategories().slice(0, 8)));
  }, []);

  const getMockCategories = () => [
    { name: 'Valorant', slug: 'valorant', listing_count: 12540, color: '#ff4655' },
    { name: 'PUBG', slug: 'pubg', listing_count: 8750, color: '#f4a460' },
    { name: 'CS2', slug: 'cs2', listing_count: 15230, color: '#de9b35' },
    { name: 'LoL', slug: 'lol', listing_count: 6280, color: '#0ac8b9' },
    { name: 'GTA 5', slug: 'gta5', listing_count: 4960, color: '#59a347' },
    { name: 'RDR 2', slug: 'rdr2', listing_count: 2120, color: '#8b0000' },
    { name: 'Minecraft', slug: 'minecraft', listing_count: 3540, color: '#5c8a4c' },
    { name: 'Diğer', slug: 'diger', listing_count: 1500, color: '#7c3aed' },
  ];

  return (
    <section className="mb-10">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-1">
            Popüler Kategoriler
          </h2>
          <p className="text-text-muted text-sm">
            En çok tercih edilen oyun kategorileri
          </p>
        </div>
        <Link 
          to="/categories" 
          className="text-primary hover:text-primaryHover text-sm font-medium transition-colors flex items-center gap-1 group"
        >
          Tüm Kategoriler
          <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-8 gap-3">
        {categories.map((cat) => (
          <Link
            key={cat.slug}
            to={`/category/${cat.slug}`}
            className="group relative bg-dark-800 hover:bg-dark-700 rounded-xl p-4 border border-dark-700 hover:border-primary/50 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/5"
          >
            {/* Renkli Üst Çizgi */}
            <div 
              className="absolute top-0 left-1/2 -translate-x-1/2 w-0 group-hover:w-1/2 h-0.5 rounded-full transition-all duration-300"
              style={{ backgroundColor: cat.color }}
            />

            {/* Oyun İsmi */}
            <h3 
              className="text-white font-bold text-base mb-2 group-hover:text-primary transition-colors duration-300 truncate"
              style={{ 
                textShadow: `0 0 20px ${cat.color}20`
              }}
            >
              {cat.name}
            </h3>
            
            {/* İlan Sayısı */}
            <p className="text-text-muted text-xs flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-primary/50"></span>
              {cat.listing_count?.toLocaleString('tr-TR') || 0} ilan
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}