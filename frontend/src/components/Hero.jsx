import { Shield, Zap, Headphones, TrendingUp, ArrowRight } from 'lucide-react';

export default function Hero() {
  return (
    <section className="relative bg-dark-800 rounded-2xl overflow-hidden mb-6 border border-dark-700">
      {/* Arka Plan GÃ¶rseli */}
      <div className="absolute inset-0 z-0">
        <img 
          src="/images/hero-bg.jpg" 
          alt="Hero Background" 
          className="w-full h-full object-cover object-[65%_center] scale-125"
        />
      </div>

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-dark-900 via-dark-900/90 to-dark-900/30 z-10" />
      <div className="absolute inset-0 bg-gradient-to-t from-dark-900/50 to-transparent z-10" />
      
      {/* Ä°Ã§erik */}
      <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20 lg:py-24">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/30 text-primary px-3 py-1.5 rounded-full text-xs font-medium mb-6">
            <span className="w-2 h-2 bg-primary rounded-full animate-pulse"></span>
            TÃ¼rkiye'nin #1 Dijital Marketplace'i
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-5 leading-[1.1]">
            Dijital DÃ¼nyanÄ±n
            <span className="block bg-gradient-to-r from-primary via-purple-400 to-pink-400 bg-clip-text text-transparent">
              GÃ¼venilir Adresi
            </span>
          </h1>
          
          <p className="text-base md:text-lg text-text-muted mb-8 max-w-xl leading-relaxed">
            Oyun hesaplarÄ±ndan sosyal medya profillerine, dijital itemlerden premium Ã¼yeliklere kadar 
            <span className="text-white font-medium"> binlerce Ã¼rÃ¼n </span>
            arasÄ±ndan size en uygununu seÃ§in.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <button className="bg-primary hover:bg-primaryHover text-white px-7 py-3.5 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5">
              <TrendingUp className="w-5 h-5" />
              AlÄ±ÅŸveriÅŸe BaÅŸla
              <ArrowRight className="w-4 h-4" />
            </button>
            
            <button className="bg-dark-700/80 hover:bg-dark-700 text-white px-7 py-3.5 rounded-xl font-semibold border border-dark-600 hover:border-primary/50 transition-all backdrop-blur-sm">
              Ä°lan Ver
            </button>
          </div>

          {/* Ã–zellikler */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-12 pt-8 border-t border-white/10">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/15 border border-primary/20 flex items-center justify-center flex-shrink-0">
                <Shield className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="text-white font-semibold text-sm">GÃ¼venli AlÄ±ÅŸveriÅŸ</h3>
                <p className="text-text-muted text-xs mt-0.5">%100 Koruma Garantisi</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/15 border border-primary/20 flex items-center justify-center flex-shrink-0">
                <Zap className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="text-white font-semibold text-sm">HÄ±zlÄ± Teslimat</h3>
                <p className="text-text-muted text-xs mt-0.5">AnÄ±nda Teslim</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/15 border border-primary/20 flex items-center justify-center flex-shrink-0">
                <Headphones className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="text-white font-semibold text-sm">7/24 Destek</h3>
                <p className="text-text-muted text-xs mt-0.5">Her Zaman YanÄ±nÄ±zda</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}