import { Shield, CreditCard, Download, Headphones } from 'lucide-react';

export default function HowItWorks() {
  const steps = [
    {
      icon: <Shield className="w-7 h-7" />,
      title: 'Hesap Oluştur',
      description: 'Ücretsiz kayıt ol ve profilini tamamla'
    },
    {
      icon: <CreditCard className="w-7 h-7" />,
      title: 'İlan Bul',
      description: 'İstediğin oyun hesabını veya itemi seç'
    },
    {
      icon: <Download className="w-7 h-7" />,
      title: 'Güvenli Ödeme',
      description: '%100 korumalı ödeme ile satın al'
    },
    {
      icon: <Headphones className="w-7 h-7" />,
      title: 'Anında Teslim',
      description: 'Hesap bilgilerin anında e-postana gelsin'
    }
  ];

  return (
    <section className="mb-10">
      <div className="text-center mb-10">
        <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
          Nasıl Çalışır?
        </h2>
        <p className="text-text-muted text-sm">
          4 kolay adımda güvenli alışveriş
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {steps.map((step, index) => (
          <div 
            key={index}
            className="relative bg-dark-800 rounded-xl p-6 border border-dark-700 hover:border-primary/50 transition-all group hover:-translate-y-1"
          >
            {/* Adım Numarası */}
            <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
              <span className="text-primary font-bold text-sm">{index + 1}</span>
            </div>

            {/* İkon */}
            <div className="w-14 h-14 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-4 group-hover:scale-110 transition-transform">
              {step.icon}
            </div>

            {/* İçerik */}
            <h3 className="text-white font-semibold text-base mb-2">
              {step.title}
            </h3>
            <p className="text-text-muted text-sm leading-relaxed">
              {step.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}