import { Shield, CreditCard, Download, Headphones } from 'lucide-react';

export default function HowItWorks() {
  const steps = [
    {
      icon: <Shield className="w-7 h-7" />,
      title: 'Hesap OluÅŸtur',
      description: 'Ãœcretsiz kayÄ±t ol ve profilini tamamla'
    },
    {
      icon: <CreditCard className="w-7 h-7" />,
      title: 'Ä°lan Bul',
      description: 'Ä°stediÄŸin oyun hesabÄ±nÄ± veya itemi seÃ§'
    },
    {
      icon: <Download className="w-7 h-7" />,
      title: 'GÃ¼venli Ã–deme',
      description: '%100 korumalÄ± Ã¶deme ile satÄ±n al'
    },
    {
      icon: <Headphones className="w-7 h-7" />,
      title: 'AnÄ±nda Teslim',
      description: 'Hesap bilgilerin anÄ±nda e-postana gelsin'
    }
  ];

  return (
    <section className="mb-10">
      <div className="text-center mb-10">
        <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
          NasÄ±l Ã‡alÄ±ÅŸÄ±r?
        </h2>
        <p className="text-text-muted text-sm">
          4 kolay adÄ±mda gÃ¼venli alÄ±ÅŸveriÅŸ
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {steps.map((step, index) => (
          <div 
            key={index}
            className="relative bg-dark-800 rounded-xl p-6 border border-dark-700 hover:border-primary/50 transition-all group hover:-translate-y-1"
          >
            {/* AdÄ±m NumarasÄ± */}
            <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
              <span className="text-primary font-bold text-sm">{index + 1}</span>
            </div>

            {/* Ä°kon */}
            <div className="w-14 h-14 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-4 group-hover:scale-110 transition-transform">
              {step.icon}
            </div>

            {/* Ä°Ã§erik */}
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