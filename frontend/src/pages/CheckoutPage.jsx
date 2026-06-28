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
  
  // 🆕 E-posta teslimat seçenekleri
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
      setEmailError('Geçerli bir e-posta adresi girin');
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
    // E-posta kontrolü
    const deliveryEmail = getDeliveryEmail();
    
    if (deliveryOption === 'other' && !customEmail) {
      addToast('Lütfen teslimat e-posta adresini girin', 'warning');
      return;
    }

    if (deliveryOption === 'other' && !validateEmail(customEmail)) {
      addToast('Geçerli bir e-posta adresi girin', 'error');
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
        const res = await fetch('http://localhost:5000/api/orders', {
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
          throw new Error(data.error || `İlan satın alınamadı: ${item.title}`);
        }
        
        results.push(data);
      }

      setStep('success');
      addToast(`${results.length} ilan başarıyla satın alındı!`, 'success', 5000);
      
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
          <h2 className="text-2xl font-bold text-white mb-3">İşlem Gerçekleştiriliyor</h2>
          <p className="text-text-muted mb-4">
            Lütfen bekleyin, siparişiniz işleniyor...
          </p>
          <p className="text-text-muted text-sm">
            Bu işlem birkaç saniye sürebilir. Lütfen sayfayı kapatmayın.
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
          <h2 className="text-3xl font-bold text-white mb-3">Satın Alma Başarılı!</h2>
          <p className="text-text-muted mb-6">
            {cart.length} ilan başarıyla satın alındı.
          </p>
          <div className="bg-green-500/10 rounded-xl p-4 border border-green-500/30 mb-6">
            <p className="text-green-400 text-sm flex items-center justify-center gap-2">
              <Mail className="w-4 h-4" />
              Hesap bilgileri <span className="font-bold text-white">{getDeliveryEmail()}</span> adresine gönderilecek.
            </p>
          </div>
          <Link 
            to="/orders"
            className="inline-block bg-primary hover:bg-primaryHover text-white px-6 py-3 rounded-xl font-semibold transition-all"
          >
            Siparişlerimi Gör
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <Link to="/cart" className="inline-flex items-center gap-2 text-text-muted hover:text-white mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Sepete Dön
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Sol: Özet + E-posta Seçimi */}
        <div className="lg:col-span-2 space-y-6">
          {/* Ürün Listesi */}
          <div className="bg-dark-800 rounded-2xl border border-dark-700 p-8">
            <h1 className="text-2xl font-bold text-white mb-6">Sipariş Onayı</h1>

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
                      {item.category_slug?.toUpperCase()} • {item.seller?.username}
                    </p>
                    <p className="text-white font-bold mt-2">
                      ₺{parseFloat(item.price).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 🆕 TESLİMAT E-POSTA SEÇİMİ */}
          <div className="bg-dark-800 rounded-2xl border border-dark-700 p-8">
            <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
              <Mail className="w-5 h-5 text-primary" />
              Teslimat Bilgileri
            </h2>
            <p className="text-text-muted text-sm mb-6">
              Satın aldığınız hesapların giriş bilgileri hangi e-posta adresine gönderilsin?
            </p>

            <div className="space-y-3">
              {/* Seçenek 1: Mevcut E-posta */}
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
                    <span className="text-white font-semibold">Mevcut hesabıma gönder</span>
                    <span className="bg-primary/10 text-primary text-xs px-2 py-0.5 rounded">Önerilen</span>
                  </div>
                  <p className="text-text-muted text-sm flex items-center gap-1">
                    <AtSign className="w-3.5 h-3.5" />
                    {currentUser?.email}
                  </p>
                </div>
              </label>

              {/* Seçenek 2: Başka E-posta */}
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
                  <div className="text-white font-semibold mb-1">Farklı bir e-postaya gönder</div>
                  <p className="text-text-muted text-sm">
                    Arkadaşına veya başka bir e-posta adresine teslim edebilirsin
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
                          ⚠️ {emailError}
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
                <span>Güvenlik notu: Hesap bilgileri sadece belirttiğiniz e-posta adresine gönderilecektir. Başka kimse erişemez.</span>
              </p>
            </div>
          </div>

          {/* Güven Bilgileri */}
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 space-y-3">
            <h3 className="text-white font-semibold flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              Güvenli Alışveriş Garantisi
            </h3>
            <ul className="space-y-2 text-text-muted text-sm">
              <li className="flex items-start gap-2">
                <Lock className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                <span>Ödemeniz 256-bit SSL ile şifrelenir</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                <span>Hesap bilgileri teslim edilene kadar paranız güvende</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                <span>Sorun yaşarsanız 7/24 destek ekibimiz yanınızda</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Sağ: Ödeme */}
        <div className="lg:col-span-1">
          <div className="bg-dark-800 rounded-2xl border border-dark-700 p-6 sticky top-24">
            <h2 className="text-xl font-bold text-white mb-6">Ödeme Özeti</h2>

            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-text-muted">
                <span>Ara Toplam</span>
                <span>₺{cartTotal.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-text-muted">
                <span>Hizmet Bedeli (%5)</span>
                <span>₺{serviceFee.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="border-t border-dark-700 pt-3 flex justify-between">
                <span className="text-white font-semibold">Toplam</span>
                <span className="text-2xl font-bold text-primary">
                  ₺{grandTotal.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            {/* Teslimat Bilgisi Özet */}
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
                <span className="text-white font-semibold">₺{userBalance.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm mt-2">
                <span className="text-text-muted">Ödeme Sonrası</span>
                <span className="text-white font-semibold">
                  ₺{(userBalance - grandTotal).toFixed(2)}
                </span>
              </div>
            </div>

            {/* Satın Al Butonu */}
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
                  İşleniyor...
                </>
              ) : (
                <>
                  <Lock className="w-5 h-5" />
                  Ödemeyi Onayla
                </>
              )}
            </button>

            <p className="text-text-muted text-xs text-center mt-3">
              Ödeme yaparak <Link to="/terms" className="text-primary hover:underline">kullanım şartlarını</Link> kabul etmiş olursunuz.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}