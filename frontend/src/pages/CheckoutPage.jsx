import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle, Shield, Lock, Loader2, Mail, AtSign } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { supabase } from '../lib/supabase';

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const { cart, cartTotal, clearCart } = useCart();
  
  const [currentUser, setCurrentUser] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [userBalance, setUserBalance] = useState(0);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState('confirm'); // confirm, processing, success
  
  // ðŸ†• E-posta teslimat seÃ§enekleri
  const [deliveryOption, setDeliveryOption] = useState('current'); // 'current' veya 'other'
  const [customEmail, setCustomEmail] = useState('');
  const [emailError, setEmailError] = useState('');

  useEffect(() => {
    if (cart.length === 0) {
      navigate('/cart');
      return;
    }

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session?.user) {
        navigate('/login');
        return;
      }
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
    });
  }, [cart, navigate]);

  const serviceFee = cartTotal * 0.05;
  const grandTotal = cartTotal + serviceFee;

  // E-posta validasyonu
  const validateEmail = (email) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  const handleCustomEmailChange = (e) => {
    const email = e.target.value;
    setCustomEmail(email);
    
    if (email && !validateEmail(email)) {
      setEmailError('GeÃ§erli bir e-posta adresi girin');
    } else {
      setEmailError('');
    }
  };

  const getDeliveryEmail = () => {
    if (deliveryOption === 'current') {
      return currentUser?.email;
    }
    return customEmail;
  };

  const handlePurchase = async () => {
    // E-posta kontrolÃ¼
    const deliveryEmail = getDeliveryEmail();
    
    if (deliveryOption === 'other' && !customEmail) {
      addToast('LÃ¼tfen teslimat e-posta adresini girin', 'warning');
      return;
    }

    if (deliveryOption === 'other' && !validateEmail(customEmail)) {
      addToast('GeÃ§erli bir e-posta adresi girin', 'error');
      return;
    }

    if (userBalance < grandTotal) {
      addToast('Yetersiz bakiye', 'error');
      return;
    }

    setLoading(true);
    setStep('processing');

    try {
      const results = [];
      
      for (const item of cart) {
        const res = await fetch('/api/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            buyer_id: currentUserId,
            listing_id: item.id,
            delivery_email: deliveryEmail
          })
        });

        const data = await res.json();
        
        if (!res.ok) {
          throw new Error(data.error || `Ä°lan satÄ±n alÄ±namadÄ±: ${item.title}`);
        }
        
        results.push(data);
      }

      setStep('success');
      addToast(`${results.length} ilan baÅŸarÄ±yla satÄ±n alÄ±ndÄ±!`, 'success', 5000);
      
      clearCart();

      setTimeout(() => {
        navigate('/orders');
      }, 3000);

    } catch (err) {
      console.error('Purchase error:', err);
      addToast(err.message, 'error');
      setStep('confirm');
    } finally {
      setLoading(false);
    }
  };

  if (step === 'processing') {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16">
        <div className="bg-dark-800 rounded-2xl p-12 border border-dark-700 text-center">
          <Loader2 className="w-16 h-16 text-primary mx-auto mb-6 animate-spin" />
          <h2 className="text-2xl font-bold text-white mb-3">Ä°ÅŸlem GerÃ§ekleÅŸtiriliyor</h2>
          <p className="text-text-muted mb-4">
            LÃ¼tfen bekleyin, sipariÅŸiniz iÅŸleniyor...
          </p>
          <p className="text-text-muted text-sm">
            Bu iÅŸlem birkaÃ§ saniye sÃ¼rebilir. LÃ¼tfen sayfayÄ± kapatmayÄ±n.
          </p>
        </div>
      </div>
    );
  }

  if (step === 'success') {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16">
        <div className="bg-dark-800 rounded-2xl p-12 border border-green-500/30 text-center">
          <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-6" />
          <h2 className="text-3xl font-bold text-white mb-3">SatÄ±n Alma BaÅŸarÄ±lÄ±!</h2>
          <p className="text-text-muted mb-6">
            {cart.length} ilan baÅŸarÄ±yla satÄ±n alÄ±ndÄ±.
          </p>
          <div className="bg-green-500/10 rounded-xl p-4 border border-green-500/30 mb-6">
            <p className="text-green-400 text-sm flex items-center justify-center gap-2">
              <Mail className="w-4 h-4" />
              Hesap bilgileri <span className="font-bold text-white">{getDeliveryEmail()}</span> adresine gÃ¶nderilecek.
            </p>
          </div>
          <Link 
            to="/orders"
            className="inline-block bg-primary hover:bg-primaryHover text-white px-6 py-3 rounded-xl font-semibold transition-all"
          >
            SipariÅŸlerimi GÃ¶r
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <Link to="/cart" className="inline-flex items-center gap-2 text-text-muted hover:text-white mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Sepete DÃ¶n
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Sol: Ã–zet + E-posta SeÃ§imi */}
        <div className="lg:col-span-2 space-y-6">
          {/* ÃœrÃ¼n Listesi */}
          <div className="bg-dark-800 rounded-2xl border border-dark-700 p-8">
            <h1 className="text-2xl font-bold text-white mb-6">SipariÅŸ OnayÄ±</h1>

            <div className="space-y-4 mb-6">
              {cart.map(item => (
                <div key={item.id} className="flex gap-4 p-4 bg-dark-900 rounded-xl">
                  <img 
                    src={item.image} 
                    alt={item.title}
                    className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white font-semibold line-clamp-2">{item.title}</h3>
                    <p className="text-text-muted text-sm mt-1">
                      {item.category_slug?.toUpperCase()} â€¢ {item.seller?.username}
                    </p>
                    <p className="text-white font-bold mt-2">
                      â‚º{parseFloat(item.price).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ðŸ†• TESLÄ°MAT E-POSTA SEÃ‡Ä°MÄ° */}
          <div className="bg-dark-800 rounded-2xl border border-dark-700 p-8">
            <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
              <Mail className="w-5 h-5 text-primary" />
              Teslimat Bilgileri
            </h2>
            <p className="text-text-muted text-sm mb-6">
              SatÄ±n aldÄ±ÄŸÄ±nÄ±z hesaplarÄ±n giriÅŸ bilgileri hangi e-posta adresine gÃ¶nderilsin?
            </p>

            <div className="space-y-3">
              {/* SeÃ§enek 1: Mevcut E-posta */}
              <label 
                className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  deliveryOption === 'current'
                    ? 'border-primary bg-primary/5'
                    : 'border-dark-700 hover:border-dark-600 bg-dark-900'
                }`}
              >
                <input
                  type="radio"
                  name="deliveryOption"
                  value="current"
                  checked={deliveryOption === 'current'}
                  onChange={(e) => setDeliveryOption(e.target.value)}
                  className="mt-1 w-4 h-4 text-primary focus:ring-primary bg-dark-800 border-dark-600"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-white font-semibold">Mevcut hesabÄ±ma gÃ¶nder</span>
                    <span className="bg-primary/10 text-primary text-xs px-2 py-0.5 rounded">Ã–nerilen</span>
                  </div>
                  <p className="text-text-muted text-sm flex items-center gap-1">
                    <AtSign className="w-3.5 h-3.5" />
                    {currentUser?.email}
                  </p>
                </div>
              </label>

              {/* SeÃ§enek 2: BaÅŸka E-posta */}
              <label 
                className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  deliveryOption === 'other'
                    ? 'border-primary bg-primary/5'
                    : 'border-dark-700 hover:border-dark-600 bg-dark-900'
                }`}
              >
                <input
                  type="radio"
                  name="deliveryOption"
                  value="other"
                  checked={deliveryOption === 'other'}
                  onChange={(e) => setDeliveryOption(e.target.value)}
                  className="mt-1 w-4 h-4 text-primary focus:ring-primary bg-dark-800 border-dark-600"
                />
                <div className="flex-1">
                  <div className="text-white font-semibold mb-1">FarklÄ± bir e-postaya gÃ¶nder</div>
                  <p className="text-text-muted text-sm">
                    ArkadaÅŸÄ±na veya baÅŸka bir e-posta adresine teslim edebilirsin
                  </p>
                  
                  {deliveryOption === 'other' && (
                    <div className="mt-3">
                      <input
                        type="email"
                        value={customEmail}
                        onChange={handleCustomEmailChange}
                        placeholder="ornek@email.com"
                        className={`w-full bg-dark-800 text-white px-4 py-2.5 rounded-lg border transition-all placeholder-text-muted ${
                          emailError 
                            ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' 
                            : 'border-dark-700 focus:border-primary focus:ring-primary/20'
                        } focus:outline-none focus:ring-2`}
                      />
                      {emailError && (
                        <p className="text-red-400 text-xs mt-1.5 flex items-center gap-1">
                          âš ï¸ {emailError}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </label>
            </div>

            <div className="mt-4 p-3 bg-yellow-500/5 border border-yellow-500/20 rounded-lg">
              <p className="text-yellow-400 text-xs flex items-start gap-2">
                <Shield className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>GÃ¼venlik notu: Hesap bilgileri sadece belirttiÄŸiniz e-posta adresine gÃ¶nderilecektir. BaÅŸka kimse eriÅŸemez.</span>
              </p>
            </div>
          </div>

          {/* GÃ¼ven Bilgileri */}
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 space-y-3">
            <h3 className="text-white font-semibold flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              GÃ¼venli AlÄ±ÅŸveriÅŸ Garantisi
            </h3>
            <ul className="space-y-2 text-text-muted text-sm">
              <li className="flex items-start gap-2">
                <Lock className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                <span>Ã–demeniz 256-bit SSL ile ÅŸifrelenir</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                <span>Hesap bilgileri teslim edilene kadar paranÄ±z gÃ¼vende</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                <span>Sorun yaÅŸarsanÄ±z 7/24 destek ekibimiz yanÄ±nÄ±zda</span>
              </li>
            </ul>
          </div>
        </div>

        {/* SaÄŸ: Ã–deme */}
        <div className="lg:col-span-1">
          <div className="bg-dark-800 rounded-2xl border border-dark-700 p-6 sticky top-24">
            <h2 className="text-xl font-bold text-white mb-6">Ã–deme Ã–zeti</h2>

            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-text-muted">
                <span>Ara Toplam</span>
                <span>â‚º{cartTotal.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-text-muted">
                <span>Hizmet Bedeli (%5)</span>
                <span>â‚º{serviceFee.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="border-t border-dark-700 pt-3 flex justify-between">
                <span className="text-white font-semibold">Toplam</span>
                <span className="text-2xl font-bold text-primary">
                  â‚º{grandTotal.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            {/* Teslimat Bilgisi Ã–zet */}
            <div className="bg-dark-900 rounded-xl p-3 mb-4 border border-dark-700">
              <div className="flex items-start gap-2 text-xs">
                <Mail className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <span className="text-text-muted block mb-0.5">Teslimat:</span>
                  <span className="text-white font-medium break-all">{getDeliveryEmail()}</span>
                </div>
              </div>
            </div>

            {/* Bakiye */}
            <div className="bg-dark-900 rounded-xl p-4 mb-4 border border-dark-700">
              <div className="flex justify-between text-sm">
                <span className="text-text-muted">Mevcut Bakiye</span>
                <span className="text-white font-semibold">â‚º{userBalance.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm mt-2">
                <span className="text-text-muted">Ã–deme SonrasÄ±</span>
                <span className="text-white font-semibold">
                  â‚º{(userBalance - grandTotal).toFixed(2)}
                </span>
              </div>
            </div>

            {/* SatÄ±n Al Butonu */}
            <button
              onClick={handlePurchase}
              disabled={
                loading || 
                userBalance < grandTotal || 
                (deliveryOption === 'other' && (!customEmail || emailError))
              }
              className="w-full bg-primary hover:bg-primaryHover disabled:bg-dark-700 disabled:cursor-not-allowed text-white py-4 rounded-xl font-semibold transition-all hover:shadow-lg hover:shadow-primary/30 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Ä°ÅŸleniyor...
                </>
              ) : (
                <>
                  <Lock className="w-5 h-5" />
                  Ã–demeyi Onayla
                </>
              )}
            </button>

            <p className="text-text-muted text-xs text-center mt-3">
              Ã–deme yaparak <Link to="/terms" className="text-primary hover:underline">kullanÄ±m ÅŸartlarÄ±nÄ±</Link> kabul etmiÅŸ olursunuz.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}