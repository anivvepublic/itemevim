import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Mail, Lock, User, Eye, EyeOff, CheckCircle, AlertCircle, Loader2, Sparkles, FileText, Shield } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useToast } from '../context/ToastContext';
import TermsModal from '../components/TermsModal';

export default function LoginPage() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [termsModalOpen, setTermsModalOpen] = useState(false);
  const [termsShake, setTermsShake] = useState(false);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    username: ''
  });

  const [usernameStatus, setUsernameStatus] = useState({
    checking: false,
    available: null,
    suggestions: []
  });

  const [passwordStrength, setPasswordStrength] = useState(0);
  const debounceTimer = useRef(null);

  // Kullanıcı adı kontrolü (debounce)
  useEffect(() => {
    if (!formData.username || formData.username.length < 3) {
      setUsernameStatus({ checking: false, available: null, suggestions: [] });
      return;
    }

    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    debounceTimer.current = setTimeout(async () => {
      setUsernameStatus(prev => ({ ...prev, checking: true }));

      try {
        const { data, error } = await supabase
          .from('users')
          .select('username')
          .eq('username', formData.username)
          .limit(1);

        if (error) throw error;

        const taken = data && data.length > 0;
        setUsernameStatus(prev => ({
          ...prev,
          checking: false,
          available: !taken,
          suggestions: taken ? generateSuggestions(formData.username) : []
        }));
      } catch (err) {
        setUsernameStatus(prev => ({ ...prev, checking: false }));
      }
    }, 500);

    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [formData.username]);

  // Şifre gücü hesapla
  useEffect(() => {
    const pwd = formData.password;
    let strength = 0;
    if (pwd.length >= 6) strength++;
    if (pwd.length >= 10) strength++;
    if (/[A-Z]/.test(pwd)) strength++;
    if (/[0-9]/.test(pwd)) strength++;
    if (/[^A-Za-z0-9]/.test(pwd)) strength++;
    setPasswordStrength(strength);
  }, [formData.password]);

  const generateSuggestions = (username) => {
    const suggestions = [];
    const randomNum = Math.floor(Math.random() * 900) + 100;
    const year = new Date().getFullYear();
    
    suggestions.push(`${username}_${randomNum}`);
    suggestions.push(`${username}${randomNum}`);
    suggestions.push(`${username}_tr`);
    suggestions.push(`${username}${year}`);
    suggestions.push(`the_${username}`);
    suggestions.push(`${username}_official`);
    
    return suggestions.slice(0, 4);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSuggestionClick = (suggestion) => {
    setFormData(prev => ({ ...prev, username: suggestion }));
    addToast(`"${suggestion}" seçildi`, 'info', 2000);
  };

  const validateForm = () => {
    if (!isLogin) {
      if (formData.username.length < 3) {
        addToast('Kullanıcı adı en az 3 karakter olmalıdır', 'warning');
        return false;
      }
      if (!usernameStatus.available) {
        addToast('Bu kullanıcı adı zaten alınmış', 'error');
        return false;
      }
      if (formData.password !== formData.confirmPassword) {
        addToast('Şifreler eşleşmiyor', 'error');
        return false;
      }
      if (passwordStrength < 3) {
        addToast('Şifreniz çok zayıf, daha güçlü bir şifre kullanın', 'warning');
        return false;
      }
      // SÖZLEŞME KONTROLÜ
      if (!termsAccepted) {
        setTermsShake(true);
        setTimeout(() => setTermsShake(false), 600);
        addToast('⚠️ Kayıt olmak için Kullanıcı Sözleşmesi\'ni okuyup kabul etmelisiniz', 'warning', 4000);
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password
        });

        if (error) {
          if (error.message.includes('Invalid login credentials')) {
            throw new Error('E-posta veya şifre hatalı');
          }
          throw error;
        }
        
        addToast('Giriş başarılı! Hoş geldin 👋', 'success');
        setTimeout(() => navigate('/'), 1000);
      } else {
        const { error } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: { username: formData.username }
          }
        });

        if (error) {
          if (error.message.includes('already registered')) {
            throw new Error('Bu e-posta adresi zaten kayıtlı');
          }
          throw error;
        }

        // Kullanıcıyı users tablosuna ekle
        const { error: userError } = await supabase
          .from('users')
          .insert([{
            username: formData.username,
            avatar: null,
            rating: 5.0,
            verified: true,
            terms_accepted: true,
            terms_accepted_at: new Date().toISOString()
          }]);

        if (userError) {
          console.error('User insert error:', userError);
        }
        
        addToast('Kayıt başarılı! Hoş geldin 🎉', 'success');
        setTimeout(() => navigate('/'), 1500);
      }
    } catch (err) {
      addToast(err.message || 'Bir hata oluştu', 'error');
    } finally {
      setLoading(false);
    }
  };

  const strengthColors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-lime-500', 'bg-green-500'];
  const strengthLabels = ['Çok Zayıf', 'Zayıf', 'Orta', 'Güçlü', 'Çok Güçlü'];

  return (
    <div className="max-w-md mx-auto">
      <Link to="/" className="inline-flex items-center gap-2 text-text-muted hover:text-white mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Ana Sayfaya Dön
      </Link>

      <div className="bg-dark-800 rounded-2xl p-8 border border-dark-700 shadow-2xl">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-primary to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary/30">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-1">
            {isLogin ? 'Tekrar Hoş Geldin!' : 'Aramıza Katıl'}
          </h1>
          <p className="text-text-muted text-sm">
            {isLogin ? 'Hesabına giriş yap' : 'Hemen ücretsiz hesap oluştur'}
          </p>
        </div>

        {/* Mod Değiştirici */}
        <div className="flex gap-2 mb-6 p-1 bg-dark-900 rounded-xl">
          <button
            onClick={() => setIsLogin(true)}
            className={`flex-1 py-2.5 rounded-lg font-medium text-sm transition-all ${
              isLogin ? 'bg-primary text-white shadow-lg' : 'text-text-muted hover:text-white'
            }`}
          >
            Giriş Yap
          </button>
          <button
            onClick={() => setIsLogin(false)}
            className={`flex-1 py-2.5 rounded-lg font-medium text-sm transition-all ${
              !isLogin ? 'bg-primary text-white shadow-lg' : 'text-text-muted hover:text-white'
            }`}
          >
            Kayıt Ol
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Kullanıcı Adı (Sadece kayıtta) */}
          {!isLogin && (
            <div>
              <label className="block text-white text-sm font-medium mb-2">
                Kullanıcı Adı <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="kullanici_adi"
                  className={`w-full bg-dark-900 text-white pl-10 pr-10 py-3 rounded-xl border focus:outline-none focus:ring-2 transition-all placeholder-text-muted ${
                    usernameStatus.available === true 
                      ? 'border-green-500/50 focus:border-green-500 focus:ring-green-500/20' 
                      : usernameStatus.available === false 
                      ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/20'
                      : 'border-dark-700 focus:border-primary focus:ring-primary/20'
                  }`}
                  minLength={3}
                  required
                />
                <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
                  {usernameStatus.checking ? (
                    <Loader2 className="w-4 h-4 text-text-muted animate-spin" />
                  ) : usernameStatus.available === true ? (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  ) : usernameStatus.available === false ? (
                    <AlertCircle className="w-4 h-4 text-red-500" />
                  ) : null}
                </div>
              </div>

              {formData.username.length >= 3 && !usernameStatus.checking && (
                <div className="mt-2">
                  {usernameStatus.available ? (
                    <p className="text-green-400 text-xs flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      Bu kullanıcı adı müsait
                    </p>
                  ) : (
                    <p className="text-red-400 text-xs flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      Bu kullanıcı adı zaten alınmış
                    </p>
                  )}
                </div>
              )}

              {usernameStatus.suggestions.length > 0 && (
                <div className="mt-3 p-3 bg-dark-900 rounded-xl border border-dark-700">
                  <p className="text-text-muted text-xs mb-2">Önerilen kullanıcı adları:</p>
                  <div className="flex flex-wrap gap-2">
                    {usernameStatus.suggestions.map(suggestion => (
                      <button
                        key={suggestion}
                        type="button"
                        onClick={() => handleSuggestionClick(suggestion)}
                        className="px-3 py-1.5 bg-primary/10 hover:bg-primary/20 border border-primary/30 text-primary text-xs rounded-lg transition-all hover:scale-105"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* E-posta */}
          <div>
            <label className="block text-white text-sm font-medium mb-2">E-posta</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="ornek@email.com"
                className="w-full bg-dark-900 text-white pl-10 pr-4 py-3 rounded-xl border border-dark-700 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all placeholder-text-muted"
                required
              />
            </div>
          </div>

          {/* Şifre */}
          <div>
            <label className="block text-white text-sm font-medium mb-2">Şifre</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                className="w-full bg-dark-900 text-white pl-10 pr-12 py-3 rounded-xl border border-dark-700 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all placeholder-text-muted"
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {!isLogin && formData.password && (
              <div className="mt-2">
                <div className="flex gap-1 mb-1">
                  {[1, 2, 3, 4, 5].map(level => (
                    <div
                      key={level}
                      className={`h-1 flex-1 rounded-full transition-all ${
                        level <= passwordStrength ? strengthColors[passwordStrength - 1] : 'bg-dark-700'
                      }`}
                    />
                  ))}
                </div>
                <p className="text-xs text-text-muted">
                  Şifre gücü: <span className="text-white font-medium">{strengthLabels[passwordStrength - 1] || 'Çok Zayıf'}</span>
                </p>
              </div>
            )}
          </div>

          {/* Şifre Tekrar (sadece kayıtta) */}
          {!isLogin && (
            <div>
              <label className="block text-white text-sm font-medium mb-2">Şifre Tekrar</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className={`w-full bg-dark-900 text-white pl-10 pr-12 py-3 rounded-xl border focus:outline-none focus:ring-2 transition-all placeholder-text-muted ${
                    formData.confirmPassword && formData.password !== formData.confirmPassword
                      ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/20'
                      : 'border-dark-700 focus:border-primary focus:ring-primary/20'
                  }`}
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-white transition-colors"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  Şifreler eşleşmiyor
                </p>
              )}
            </div>
          )}

          {/* Şifremi Unuttum */}
          {isLogin && (
            <div className="flex justify-end">
              <button type="button" className="text-primary hover:text-primaryHover text-sm transition-colors">
                Şifremi Unuttum
              </button>
            </div>
          )}

          {/* SÖZLEŞME CHECKBOX (sadece kayıtta) */}
          {!isLogin && (
            <div className={`bg-dark-900/50 rounded-xl p-4 border ${termsShake ? 'border-red-500 animate-shake' : 'border-dark-700'}`}>
              <label className="flex items-start gap-3 cursor-pointer group">
                <div className="relative flex-shrink-0 mt-0.5">
                  <input
                    type="checkbox"
                    checked={termsAccepted}
                    onChange={(e) => setTermsAccepted(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className={`w-5 h-5 rounded border-2 transition-all flex items-center justify-center ${
                    termsAccepted 
                      ? 'bg-primary border-primary' 
                      : 'bg-dark-800 border-dark-600 group-hover:border-primary/50'
                  }`}>
                    {termsAccepted && <CheckCircle className="w-4 h-4 text-white" />}
                  </div>
                </div>
                <div className="flex-1 text-sm">
                  <span className="text-text-muted leading-relaxed">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        setTermsModalOpen(true);
                      }}
                      className="text-primary hover:text-primaryHover font-medium underline decoration-dashed underline-offset-2 inline-flex items-center gap-1 transition-colors"
                    >
                      <Shield className="w-3.5 h-3.5" />
                      Kullanıcı Sözleşmesi'ni
                    </button>
                    {' '}okudum, anladım ve kabul ediyorum.
                  </span>
                  <p className="text-text-muted/60 text-xs mt-1.5">
                    Kayıt olarak 18 yaşını doldurduğunuzu ve KVKK kapsamında verilerinizin işlenmesini kabul edersiniz.
                  </p>
                </div>
              </label>
            </div>
          )}

          {/* Buton */}
          <button
            type="submit"
            disabled={loading || (!isLogin && !termsAccepted)}
            className="w-full bg-primary hover:bg-primaryHover disabled:bg-dark-700 disabled:cursor-not-allowed disabled:opacity-60 text-white py-3.5 rounded-xl font-semibold transition-all hover:shadow-lg hover:shadow-primary/30 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                İşleniyor...
              </>
            ) : (
              isLogin ? 'Giriş Yap' : 'Hesap Oluştur'
            )}
          </button>
        </form>

        {/* Alt Metin */}
        <div className="text-center mt-6">
          <p className="text-text-muted text-xs">
            {isLogin ? (
              <>
                Hesabın yok mu?{' '}
                <button
                  onClick={() => setIsLogin(false)}
                  className="text-primary hover:text-primaryHover font-medium transition-colors"
                >
                  Hemen kayıt ol
                </button>
              </>
            ) : (
              <>
                Zaten hesabın var mı?{' '}
                <button
                  onClick={() => setIsLogin(true)}
                  className="text-primary hover:text-primaryHover font-medium transition-colors"
                >
                  Giriş yap
                </button>
              </>
            )}
          </p>
        </div>
      </div>

      {/* Sözleşme Modal */}
      <TermsModal 
        isOpen={termsModalOpen} 
        onClose={() => setTermsModalOpen(false)} 
      />
    </div>
  );
}