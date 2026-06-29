import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Search, Gamepad2, Smartphone, Sparkles, TrendingUp, ArrowRight } from 'lucide-react';

export default function AllCategoriesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const groupParam = searchParams.get('group') || 'all';
  
  const [categories, setCategories] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState(groupParam);
  const [loading, setLoading] = useState(true);

  // URL parametresi deÄŸiÅŸtiÄŸinde activeFilter'Ä± gÃ¼ncelle
  useEffect(() => {
    setActiveFilter(groupParam);
  }, [groupParam]);

  // Kategorileri yÃ¼kle
  useEffect(() => {
    fetch('/api/categories/all')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setCategories(data);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Filtre deÄŸiÅŸtiÄŸinde URL'i gÃ¼ncelle
  const handleFilterChange = (newFilter) => {
    setActiveFilter(newFilter);
    setSearchParams({ group: newFilter });
  };

  const filteredCategories = categories.filter(cat => {
    const matchesGroup = activeFilter === 'all' || cat.category_group === activeFilter;
    const matchesSearch = searchQuery.trim() === '' || 
      cat.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesGroup && matchesSearch;
  });

  const gameCategories = filteredCategories.filter(cat => cat.category_group === 'game');
  const socialCategories = filteredCategories.filter(cat => cat.category_group === 'social');

  const totalListings = categories.reduce((sum, cat) => sum + (cat.listing_count || 0), 0);

  return (
    <div>
      <Link to="/" className="inline-flex items-center gap-2 text-text-muted hover:text-white mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Ana Sayfaya DÃ¶n
      </Link>

      {/* Hero Banner */}
      <div className="relative bg-gradient-to-br from-dark-800 via-dark-800 to-dark-900 rounded-2xl p-8 md:p-12 border border-dark-700 mb-8 overflow-hidden">
        {/* Dekoratif blur efektleri */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-pink-500/5 rounded-full blur-3xl"></div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-5 h-5 text-primary" />
            <span className="text-primary text-sm font-medium uppercase tracking-wider">TÃ¼m Kategoriler</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-bold text-white mb-3 leading-normal">
            Dijital DÃ¼nyanÄ±n
            <span className="block bg-gradient-to-r from-primary via-purple-400 to-pink-400 bg-clip-text text-transparent">
              TÃ¼m Kategorileri
            </span>
          </h1>
          <p className="text-text-muted text-base md:text-lg max-w-2xl">
            Oyun hesaplarÄ±ndan sosyal medya profillerine, dijital itemlerden premium Ã¼yeliklere kadar binlerce Ã¼rÃ¼n tek bir yerde.
          </p>

          {/* Ä°statistikler */}
          <div className="flex flex-wrap gap-8 mt-8 pt-8 border-t border-white/10">
            <div>
              <div className="text-3xl font-bold text-white">{categories.length}</div>
              <div className="text-text-muted text-sm mt-1">Toplam Kategori</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-white">{totalListings.toLocaleString('tr-TR')}+</div>
              <div className="text-text-muted text-sm mt-1">Aktif Ä°lan</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-white">7/24</div>
              <div className="text-text-muted text-sm mt-1">Destek</div>
            </div>
          </div>
        </div>
      </div>

      {/* Arama ve Filtreler */}
      <div className="bg-dark-800 rounded-2xl p-6 border border-dark-700 mb-8 sticky top-16 z-40 backdrop-blur-sm bg-dark-800/95">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Arama */}
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-text-muted w-5 h-5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Kategori ara..."
              className="w-full bg-dark-900 text-white pl-12 pr-4 py-3.5 rounded-xl border border-dark-700 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all placeholder-text-muted"
            />
          </div>

          {/* Filtre ButonlarÄ± */}
          <div className="flex gap-2">
            <button
              onClick={() => handleFilterChange('all')}
              className={`px-5 py-3 rounded-xl font-medium text-sm transition-all whitespace-nowrap ${
                activeFilter === 'all'
                  ? 'bg-primary text-white shadow-lg shadow-primary/30'
                  : 'bg-dark-700 text-text-muted hover:text-white hover:bg-dark-600'
              }`}
            >
              TÃ¼mÃ¼
            </button>
            <button
              onClick={() => handleFilterChange('game')}
              className={`px-5 py-3 rounded-xl font-medium text-sm transition-all flex items-center gap-2 whitespace-nowrap ${
                activeFilter === 'game'
                  ? 'bg-primary text-white shadow-lg shadow-primary/30'
                  : 'bg-dark-700 text-text-muted hover:text-white hover:bg-dark-600'
              }`}
            >
              <Gamepad2 className="w-4 h-4" />
              Oyunlar
            </button>
            <button
              onClick={() => handleFilterChange('social')}
              className={`px-5 py-3 rounded-xl font-medium text-sm transition-all flex items-center gap-2 whitespace-nowrap ${
                activeFilter === 'social'
                  ? 'bg-primary text-white shadow-lg shadow-primary/30'
                  : 'bg-dark-700 text-text-muted hover:text-white hover:bg-dark-600'
              }`}
            >
              <Smartphone className="w-4 h-4" />
              Sosyal Medya
            </button>
          </div>
        </div>
      </div>

      {/* SonuÃ§ SayÄ±sÄ± */}
      {searchQuery && (
        <div className="mb-6">
          <p className="text-text-muted">
            "<span className="text-white font-semibold">{searchQuery}</span>" iÃ§in <span className="text-white font-semibold">{filteredCategories.length}</span> sonuÃ§ bulundu
          </p>
        </div>
      )}

      {/* Kategoriler */}
      {loading ? (
        <div className="text-center py-16">
          <div className="inline-block w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-text-muted mt-4">Kategoriler yÃ¼kleniyor...</p>
        </div>
      ) : filteredCategories.length === 0 ? (
        <div className="bg-dark-800 rounded-xl border border-dark-700 p-12 text-center">
          <p className="text-text-muted text-lg">Kategori bulunamadÄ±.</p>
          <p className="text-text-muted text-sm mt-2">FarklÄ± bir arama terimi deneyin.</p>
        </div>
      ) : (
        <div className="space-y-12">
          {/* Oyun Kategorileri */}
          {gameCategories.length > 0 && (
            <section>
              <div className="flex items-end justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center shadow-lg shadow-primary/30">
                    <Gamepad2 className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">Oyun Kategorileri</h2>
                    <p className="text-text-muted text-sm">Hesaplar, itemler ve dijital oyun Ã¼rÃ¼nleri</p>
                  </div>
                </div>
                <span className="text-text-muted text-sm hidden md:block">
                  {gameCategories.length} kategori
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {gameCategories.map((cat) => (
                  <CategoryCard key={cat.slug} category={cat} type="game" />
                ))}
              </div>
            </section>
          )}

          {/* Sosyal Medya Kategorileri */}
          {socialCategories.length > 0 && (
            <section>
              <div className="flex items-end justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-500 to-orange-500 flex items-center justify-center shadow-lg shadow-pink-500/30">
                    <Smartphone className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">Sosyal Medya & Dijital</h2>
                    <p className="text-text-muted text-sm">Hesaplar, takipÃ§iler ve dijital hizmetler</p>
                  </div>
                </div>
                <span className="text-text-muted text-sm hidden md:block">
                  {socialCategories.length} kategori
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {socialCategories.map((cat) => (
                  <CategoryCard key={cat.slug} category={cat} type="social" />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}

// Kategori KartÄ± - Emojisiz, Temiz TasarÄ±m
function CategoryCard({ category, type }) {
  // Her kategori iÃ§in Ã¶zel gradient renk
  const getGradient = (slug, groupType) => {
    if (groupType === 'social') {
      const gradients = {
        instagram: 'from-purple-500 via-pink-500 to-orange-400',
        tiktok: 'from-gray-900 via-black to-pink-500',
        youtube: 'from-red-500 to-red-700',
        twitter: 'from-sky-400 to-blue-600',
        facebook: 'from-blue-600 to-blue-800',
        twitch: 'from-purple-500 to-purple-800',
        'discord-social': 'from-indigo-500 to-indigo-700',
        telegram: 'from-cyan-400 to-blue-500',
        spotify: 'from-green-400 to-green-600',
        netflix: 'from-red-600 to-red-900',
        linkedin: 'from-blue-500 to-blue-700',
        snapchat: 'from-yellow-300 to-yellow-500'
      };
      return gradients[slug] || 'from-pink-500 to-orange-500';
    } else {
      const gradients = {
        valorant: 'from-red-500 to-rose-700',
        pubg: 'from-yellow-500 to-orange-600',
        cs2: 'from-amber-500 to-yellow-700',
        lol: 'from-cyan-400 to-blue-600',
        gta5: 'from-green-500 to-emerald-700',
        rdr2: 'from-red-700 to-amber-900',
        minecraft: 'from-green-600 to-lime-700',
        apex: 'from-red-600 to-red-800',
        fortnite: 'from-blue-500 to-purple-600',
        fifa24: 'from-green-500 to-teal-600',
        cod: 'from-gray-700 to-gray-900',
        warzone: 'from-orange-500 to-red-600',
        overwatch2: 'from-orange-400 to-amber-600',
        rust: 'from-red-700 to-orange-800',
        ark: 'from-blue-600 to-indigo-800',
        terraria: 'from-green-500 to-emerald-700',
        stardew: 'from-green-400 to-lime-600',
        amongus: 'from-red-500 to-blue-600',
        fallguys: 'from-pink-400 to-purple-500',
        deadbydaylight: 'from-red-800 to-gray-900',
        genshin: 'from-cyan-400 to-blue-500',
        honkai: 'from-purple-500 to-indigo-600',
        wow: 'from-amber-600 to-yellow-800',
        lostark: 'from-blue-600 to-purple-700',
        poe: 'from-red-600 to-red-800',
        diablo4: 'from-red-700 to-red-900',
        eldenring: 'from-yellow-600 to-amber-800',
        darksouls: 'from-gray-700 to-gray-900',
        sekiro: 'from-red-600 to-gray-800',
        witcher3: 'from-gray-600 to-gray-800',
        cyberpunk: 'from-yellow-400 to-cyan-500',
        assassinscreed: 'from-gray-700 to-red-700',
        farcry: 'from-orange-500 to-red-600',
        watchdogs: 'from-gray-800 to-blue-700',
        nfs: 'from-blue-600 to-red-600',
        forza: 'from-blue-500 to-cyan-600',
        rocketleague: 'from-blue-500 to-orange-500'
      };
      return gradients[slug] || 'from-primary to-purple-600';
    }
  };

  return (
    <Link
      to={`/category/${category.slug}`}
      className="group relative bg-dark-800 hover:bg-dark-700 rounded-xl p-4 border border-dark-700 hover:border-transparent transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl overflow-hidden"
    >
      {/* Hover Gradient Border Effect */}
      <div className={`absolute inset-0 bg-gradient-to-br ${getGradient(category.slug, category.category_group)} opacity-0 group-hover:opacity-20 transition-opacity duration-300`}></div>
      
      {/* Gradient Top Line */}
      <div className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${getGradient(category.slug, category.category_group)} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}></div>

      {/* Ä°Ã§erik */}
      <div className="relative z-10">
        {/* Ä°sim */}
        <h3 className="text-white font-bold text-sm md:text-base mb-2 group-hover:text-white transition-colors truncate">
          {category.name}
        </h3>
        
        {/* Ä°lan SayÄ±sÄ± */}
        <div className="flex items-center justify-between">
          <p className="text-text-muted text-xs">
            {(category.listing_count || 0).toLocaleString('tr-TR')} ilan
          </p>
          <ArrowRight className="w-3.5 h-3.5 text-text-muted group-hover:text-white group-hover:translate-x-1 transition-all" />
        </div>
      </div>
    </Link>
  );
}