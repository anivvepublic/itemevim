import { Shield, Lock, Award, Users } from 'lucide-react';

export default function TrustBanner() {
  const features = [
    {
      icon: <Shield className="w-6 h-6" />,
      title: '%100 GÃ¼venli',
      description: 'TÃ¼m iÅŸlemler SSL ile ÅŸifrelenir'
    },
    {
      icon: <Lock className="w-6 h-6" />,
      title: 'Para Koruma',
      description: 'Hesap teslim edilene kadar paranÄ±z gÃ¼vende'
    },
    {
      icon: <Award className="w-6 h-6" />,
      title: 'OnaylÄ± SatÄ±cÄ±lar',
      description: 'Kimlik doÄŸrulamasÄ± yapÄ±lmÄ±ÅŸ satÄ±cÄ±lar'
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: '75.000+ KullanÄ±cÄ±',
      description: 'Binlerce mutlu oyuncunun tercihi'
    }
  ];

  return (
    <section className="bg-gradient-to-r from-primary/10 via-purple-900/10 to-primary/10 rounded-2xl p-8 mb-10 border border-primary/20">
      <div className="text-center mb-8">
        <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
          Neden Itemevim?
        </h2>
        <p className="text-text-muted text-sm">
          GÃ¼venli alÄ±ÅŸveriÅŸin adresi
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {features.map((feature, index) => (
          <div key={index} className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center text-primary flex-shrink-0">
              {feature.icon}
            </div>
            <div>
              <h3 className="text-white font-semibold mb-1">
                {feature.title}
              </h3>
              <p className="text-text-muted text-sm leading-relaxed">
                {feature.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}