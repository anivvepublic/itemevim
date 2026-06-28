import { Link } from 'react-router-dom';
import { Home, Search, ArrowLeft } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="text-center max-w-2xl">
        {/* 404 Görsel */}
        <div className="relative mb-8">
          <div className="text-[180px] md:text-[240px] font-black text-primary/10 leading-none select-none">
            404
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-primary/20 border-4 border-primary/40 flex items-center justify-center animate-pulse">
              <Search className="w-12 h-12 md:w-16 md:h-16 text-primary" />
            </div>
          </div>
        </div>

        {/* Başlık */}
        <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
          Sayfa Bulunamadı
        </h1>
        <p className="text-text-muted text-lg md:text-xl mb-8 max-w-lg mx-auto leading-relaxed">
          Aradığınız sayfa silinmiş, taşınmış veya hiç var olmamış olabilir.
        </p>

        {/* Butonlar */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to="/"
            className="bg-primary hover:bg-primaryHover text-white px-8 py-3.5 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all hover:shadow-lg hover:shadow-primary/30"
          >
            <Home className="w-5 h-5" />
            Ana Sayfaya Dön
          </Link>
          <Link
            to="/categories"
            className="bg-dark-700 hover:bg-dark-600 text-white px-8 py-3.5 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all border border-dark-600"
          >
            <Search className="w-5 h-5" />
            Kategorilere Göz At
          </Link>
        </div>

        {/* Alt bilgi */}
        <div className="mt-12 pt-8 border-t border-dark-700">
          <p className="text-text-muted text-sm">
            Bir sorun olduğunu düşünüyorsanız{' '}
            <Link to="/" className="text-primary hover:underline">
              destek ekibimize
            </Link>{' '}
            ulaşabilirsiniz.
          </p>
        </div>
      </div>
    </div>
  );
}