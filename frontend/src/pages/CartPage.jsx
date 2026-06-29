import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, ShoppingCart, Trash2, Tag, ArrowRight, AlertCircle } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { supabase } from '../lib/supabase';
import { useState, useEffect } from 'react';

export default function CartPage() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const { cart, removeFromCart, clearCart, cartTotal } = useCart();
  const [currentUser, setCurrentUser] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [userBalance, setUserBalance] = useState(0);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        setCurrentUser(session.user);
        
        const { data: users } = await supabase
          .from('users')
          .select('id, balance')
          .eq('username', session.user.email.split('@')[0])
          .limit(1);
        
        if (users && users.length > 0) {
          setCurrentUserId(users[0].id);
          setUserBalance(users[0].balance || 0);
        }
      }
    });
  }, []);

  const handleCheckout = () => {
    if (!currentUser) {
      addToast('SatÄ±n almak iÃ§in giriÅŸ yapmalÄ±sÄ±nÄ±z', 'warning');
      navigate('/login');
      return;
    }

    if (cart.length === 0) {
      addToast('Sepetiniz boÅŸ', 'warning');
      return;
    }

    navigate('/checkout');
  };

  if (cart.length === 0) {
    return (
      <div>
        <Link to="/" className="inline-flex items-center gap-2 text-text-muted hover:text-white mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Ana Sayfaya DÃ¶n
        </Link>

        <div className="bg-dark-800 rounded-2xl p-16 border border-dark-700 text-center">
          <ShoppingCart className="w-20 h-20 text-text-muted mx-auto mb-6 opacity-30" />
          <h1 className="text-3xl font-bold text-white mb-3">Sepetiniz BoÅŸ</h1>
          <p className="text-text-muted mb-8 max-w-md mx-auto">
            HenÃ¼z sepetinize Ã¼rÃ¼n eklemediniz. BeÄŸendiÄŸiniz ilanlarÄ± sepete ekleyerek satÄ±n alabilirsiniz.
          </p>
          <Link 
            to="/"
            className="inline-block bg-primary hover:bg-primaryHover text-white px-8 py-3.5 rounded-xl font-semibold transition-all hover:shadow-lg hover:shadow-primary/30"
          >
            Ä°lanlara GÃ¶z At
          </Link>
        </div>
      </div>
    );
  }

  const serviceFee = cartTotal * 0.05; // %5 hizmet bedeli
  const grandTotal = cartTotal + serviceFee;
  const insufficientBalance = currentUser && userBalance < grandTotal;

  return (
    <div>
      <Link to="/" className="inline-flex items-center gap-2 text-text-muted hover:text-white mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        AlÄ±ÅŸveriÅŸe Devam Et
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Sol: Sepet ÃœrÃ¼nleri */}
        <div className="lg:col-span-2">
          <div className="bg-dark-800 rounded-2xl border border-dark-700 overflow-hidden">
            {/* BaÅŸlÄ±k */}
            <div className="p-6 border-b border-dark-700 flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                  <ShoppingCart className="w-6 h-6 text-primary" />
                  Sepetim
                </h1>
                <p className="text-text-muted text-sm mt-1">{cart.length} Ã¼rÃ¼n</p>
              </div>
              <button
                onClick={() => {
                  if (window.confirm('Sepeti tamamen temizlemek istediÄŸinize emin misiniz?')) {
                    clearCart();
                  }
                }}
                className="text-red-400 hover:text-red-300 text-sm flex items-center gap-1 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Sepeti Temizle
              </button>
            </div>

            {/* ÃœrÃ¼n Listesi */}
            <div className="divide-y divide-dark-700">
              {cart.map(item => (
                <div key={item.id} className="p-6 hover:bg-dark-700/30 transition-colors">
                  <div className="flex gap-4">
                    {/* GÃ¶rsel */}
                    <Link to={`/listing/${item.id}`} className="flex-shrink-0">
                      <img 
                        src={item.image} 
                        alt={item.title}
                        className="w-24 h-24 rounded-xl object-cover border border-dark-700 hover:border-primary/50 transition-colors"
                      />
                    </Link>

                    {/* Bilgiler */}
                    <div className="flex-1 min-w-0">
                      <Link to={`/listing/${item.id}`} className="block">
                        <h3 className="text-white font-semibold mb-1 hover:text-primary transition-colors line-clamp-2">
                          {item.title}
                        </h3>
                      </Link>
                      <p className="text-text-muted text-sm mb-2">
                        {item.category_slug?.toUpperCase()} â€¢ SatÄ±cÄ±: {item.seller?.username || 'Bilinmiyor'}
                      </p>
                      <div className="flex items-center gap-2">
                        <span className="text-2xl font-bold text-white">
                          â‚º{parseFloat(item.price).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>

                    {/* Sil Butonu */}
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="flex-shrink-0 w-10 h-10 rounded-lg bg-dark-700 hover:bg-red-500/20 hover:text-red-400 text-text-muted flex items-center justify-center transition-all"
                      aria-label="Sepetten Ã§Ä±kar"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* SaÄŸ: Ã–zet */}
        <div className="lg:col-span-1">
          <div className="bg-dark-800 rounded-2xl border border-dark-700 p-6 sticky top-24">
            <h2 className="text-xl font-bold text-white mb-6">SipariÅŸ Ã–zeti</h2>

            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-text-muted">
                <span>Ara Toplam</span>
                <span>â‚º{cartTotal.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-text-muted">
                <span className="flex items-center gap-1">
                  Hizmet Bedeli
                  <span className="text-xs bg-dark-700 px-1.5 py-0.5 rounded">%5</span>
                </span>
                <span>â‚º{serviceFee.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="border-t border-dark-700 pt-3 flex justify-between">
                <span className="text-white font-semibold">Toplam</span>
                <span className="text-2xl font-bold text-primary">
                  â‚º{grandTotal.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            {/* Bakiye Bilgisi */}
            {currentUser && (
              <div className={`rounded-xl p-4 mb-4 border ${
                insufficientBalance 
                  ? 'bg-red-500/10 border-red-500/30' 
                  : 'bg-green-500/10 border-green-500/30'
              }`}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-text-muted text-sm">Mevcut Bakiye</span>
                  <span className="text-white font-semibold">â‚º{userBalance.toFixed(2)}</span>
                </div>
                {insufficientBalance && (
                  <div className="flex items-start gap-2 text-red-400 text-xs mt-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <div>
                      <span>Yetersiz bakiye! Eksik: â‚º{(grandTotal - userBalance).toFixed(2)}</span>
                      <Link to="/profile?tab=balance" className="block text-primary hover:underline mt-1">
                        Bakiye YÃ¼kle â†’
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* SatÄ±n Al Butonu */}
            <button
              onClick={handleCheckout}
              disabled={insufficientBalance}
              className="w-full bg-primary hover:bg-primaryHover disabled:bg-dark-700 disabled:cursor-not-allowed text-white py-4 rounded-xl font-semibold transition-all hover:shadow-lg hover:shadow-primary/30 flex items-center justify-center gap-2"
            >
              SatÄ±n Al
              <ArrowRight className="w-5 h-5" />
            </button>

            {/* GÃ¼ven Bilgisi */}
            <div className="mt-4 pt-4 border-t border-dark-700">
              <div className="flex items-start gap-2 text-text-muted text-xs">
                <Tag className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                <span>%100 gÃ¼venli alÄ±ÅŸveriÅŸ. Hesap bilgileri teslim edilene kadar paranÄ±z gÃ¼vende.</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}