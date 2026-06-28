import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Upload, X, CheckCircle, Search, AlertCircle, ChevronRight, ChevronLeft, Eye, Tag, Clock, Shield, Plus } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useToast } from '../context/ToastContext';

const CATEGORY_FIELDS = {
  valorant: [
    { name: 'rank', label: 'Rank', type: 'select', options: ['Iron', 'Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond', 'Ascendant', 'Immortal', 'Radiant'], required: true },
    { name: 'level', label: 'Hesap Seviyesi', type: 'number', placeholder: '1-500', required: true },
    { name: 'agent_count', label: 'Açık Ajan Sayısı', type: 'number', placeholder: '0-24' },
    { name: 'skin_count', label: 'Premium Skin Sayısı', type: 'number', placeholder: '0+' },
    { name: 'vp_balance', label: 'VP Bakiyesi', type: 'number', placeholder: '0+' },
    { name: 'region', label: 'Bölge', type: 'select', options: ['Europe (EU)', 'Turkey (TR)', 'Asia (AP)', 'NA', 'BR', 'KR'] }
  ],
  pubg: [
    { name: 'rank', label: 'Rank', type: 'select', options: ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond', 'Crown', 'Ace', 'Conqueror'], required: true },
    { name: 'level', label: 'Seviye', type: 'number', placeholder: '1-100' },
    { name: 'outfit_count', label: 'Kıyafet Sayısı', type: 'number' },
    { name: 'rp_balance', label: 'UC/RP Bakiyesi', type: 'number' },
    { name: 'region', label: 'Bölge', type: 'select', options: ['Asia', 'Europe', 'NA', 'KRJP'] }
  ],
  cs2: [
    { name: 'rank', label: 'Rank', type: 'select', options: ['Silver', 'Gold Nova', 'Master Guardian', 'Legendary Eagle', 'Supreme', 'Global Elite'] },
    { name: 'hours_played', label: 'Oynanan Saat', type: 'number' },
    { name: 'inventory_value', label: 'Envanter Değeri (₺)', type: 'number' },
    { name: 'prime_status', label: 'Prime Durumu', type: 'select', options: ['Evet', 'Hayır'] }
  ],
  lol: [
    { name: 'rank', label: 'Rank', type: 'select', options: ['Iron', 'Bronze', 'Silver', 'Gold', 'Platinum', 'Emerald', 'Diamond', 'Master', 'Grandmaster', 'Challenger'] },
    { name: 'level', label: 'Hesap Seviyesi', type: 'number' },
    { name: 'champion_count', label: 'Şampiyon Sayısı', type: 'number' },
    { name: 'skin_count', label: 'Skin Sayısı', type: 'number' },
    { name: 'region', label: 'Sunucu', type: 'select', options: ['TR', 'EUW', 'EUNE', 'NA', 'KR'] }
  ],
  gta5: [
    { name: 'level', label: 'Seviye', type: 'number' },
    { name: 'money', label: 'Para Miktarı ($)', type: 'number' },
    { name: 'vehicle_count', label: 'Araç Sayısı', type: 'number' },
    { name: 'property_count', label: 'Mülk Sayısı', type: 'number' }
  ],
  minecraft: [
    { name: 'edition', label: 'Versiyon', type: 'select', options: ['Java', 'Bedrock', 'Java + Bedrock'] },
    { name: 'account_type', label: 'Hesap Türü', type: 'select', options: ['Premium', 'Microsoft'] }
  ],
  instagram: [
    { name: 'follower_count', label: 'Takipçi Sayısı', type: 'number', required: true },
    { name: 'following_count', label: 'Takip Edilen', type: 'number' },
    { name: 'post_count', label: 'Gönderi Sayısı', type: 'number' },
    { name: 'account_age', label: 'Hesap Yaşı', type: 'select', options: ['0-6 ay', '6-12 ay', '1-2 yıl', '2-5 yıl', '5+ yıl'] },
    { name: 'verification_status', label: 'Doğrulama', type: 'select', options: ['Doğrulanmamış', 'Mavi Tik Bekliyor'] }
  ],
  tiktok: [
    { name: 'follower_count', label: 'Takipçi Sayısı', type: 'number', required: true },
    { name: 'following_count', label: 'Takip Edilen', type: 'number' },
    { name: 'likes_count', label: 'Toplam Beğeni', type: 'number' },
    { name: 'video_count', label: 'Video Sayısı', type: 'number' },
    { name: 'account_age', label: 'Hesap Yaşı', type: 'select', options: ['0-6 ay', '6-12 ay', '1-2 yıl', '2+ yıl'] }
  ],
  youtube: [
    { name: 'subscriber_count', label: 'Abone Sayısı', type: 'number', required: true },
    { name: 'video_count', label: 'Video Sayısı', type: 'number' },
    { name: 'total_views', label: 'Toplam İzlenme', type: 'number' },
    { name: 'monetization', label: 'Para Kazanma', type: 'select', options: ['Aktif', 'Pasif', 'Uygun'] },
    { name: 'account_age', label: 'Kanal Yaşı', type: 'select', options: ['0-6 ay', '6-12 ay', '1-3 yıl', '3+ yıl'] }
  ],
  twitter: [
    { name: 'follower_count', label: 'Takipçi Sayısı', type: 'number', required: true },
    { name: 'following_count', label: 'Takip Edilen', type: 'number' },
    { name: 'tweet_count', label: 'Tweet Sayısı', type: 'number' },
    { name: 'account_age', label: 'Hesap Yaşı', type: 'select', options: ['0-6 ay', '6-12 ay', '1-3 yıl', '3+ yıl'] }
  ],
  facebook: [
    { name: 'friend_count', label: 'Arkadaş Sayısı', type: 'number' },
    { name: 'account_age', label: 'Hesap Yaşı', type: 'select', options: ['0-1 yıl', '1-3 yıl', '3-5 yıl', '5+ yıl'] }
  ],
  twitch: [
    { name: 'follower_count', label: 'Takipçi Sayısı', type: 'number', required: true },
    { name: 'stream_hours', label: 'Yayın Saati', type: 'number' },
    { name: 'affiliate_status', label: 'Affiliate Durumu', type: 'select', options: ['Yok', 'Affiliate', 'Partner'] }
  ],
  spotify: [
    { name: 'plan', label: 'Plan Türü', type: 'select', options: ['Premium Bireysel', 'Premium Aile', 'Premium Duo', 'Student'], required: true },
    { name: 'remaining_time', label: 'Kalan Süre', type: 'select', options: ['1 Ay', '3 Ay', '6 Ay', '1 Yıl'] }
  ],
  netflix: [
    { name: 'plan', label: 'Plan Türü', type: 'select', options: ['Temel', 'Standart', 'Premium'], required: true },
    { name: 'screen_count', label: 'Ekran Sayısı', type: 'select', options: ['1', '2', '4'] },
    { name: 'remaining_time', label: 'Kalan Süre', type: 'select', options: ['1 Ay', '3 Ay', '6 Ay', '1 Yıl'] }
  ]
};

const DELIVERY_OPTIONS = [
  { value: 'instant', label: 'Anında Teslim', description: 'Otomatik teslim, 5 dakika içinde' },
  { value: '1 saat', label: '1 Saat İçinde', description: 'Manuel teslim, 1 saat içinde' },
  { value: '24 saat', label: '24 Saat İçinde', description: 'Standart teslim süresi' },
  { value: '3 gün', label: '3 Gün İçinde', description: 'Uzun süreli hazırlık gereken ilanlar' }
];

const GUARANTEE_OPTIONS = [
  { value: 0, label: 'Garanti Yok', description: 'Garanti süresi yok' },
  { value: 1, label: '24 Saat', description: '1 gün garanti' },
  { value: 7, label: '7 Gün', description: '1 hafta garanti' },
  { value: 30, label: '30 Gün', description: '1 ay garanti (Önerilen)' }
];

export default function CreateListing() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [allCategories, setAllCategories] = useState([]);
  const [filteredCategories, setFilteredCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [preview, setPreview] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [userBalance, setUserBalance] = useState(0);
  const [categorySearch, setCategorySearch] = useState('');
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState('');

  const FEATURED_PRICE = 50.00;
  const MAX_IMAGES = 5;
  const MIN_IMAGES = 1;

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    category_slug: '',
    category_name: '',
    delivery_time: '24 saat',
    guarantee_days: 7,
    is_featured: false,
    details: {}
  });

  useEffect(() => {
    fetch('http://localhost:5000/api/categories')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setAllCategories(data);
          setFilteredCategories(data);
        }
      })
      .catch(() => {});

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

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setCurrentUser(session?.user || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (categorySearch.trim() === '') {
      setFilteredCategories(allCategories);
    } else {
      const search = categorySearch.toLowerCase();
      const filtered = allCategories.filter(cat => 
        cat.name.toLowerCase().includes(search) ||
        cat.slug.toLowerCase().includes(search)
      );
      setFilteredCategories(filtered);
    }
  }, [categorySearch, allCategories]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleDetailChange = (fieldName, value) => {
    setFormData(prev => ({
      ...prev,
      details: {
        ...prev.details,
        [fieldName]: value
      }
    }));
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    const remainingSlots = MAX_IMAGES - imageFiles.length;
    const filesToAdd = files.slice(0, remainingSlots);

    if (filesToAdd.length === 0) {
      addToast(`Maksimum ${MAX_IMAGES} görsel yükleyebilirsiniz`, 'warning');
      return;
    }

    const invalidFiles = filesToAdd.filter(file => file.size > 5 * 1024 * 1024);
    if (invalidFiles.length > 0) {
      addToast('Görseller 5MB\'dan küçük olmalıdır', 'error');
      return;
    }

    const newPreviews = filesToAdd.map(file => URL.createObjectURL(file));
    
    setImageFiles(prev => [...prev, ...filesToAdd]);
    setImagePreviews(prev => [...prev, ...newPreviews]);
    
    addToast(`${filesToAdd.length} görsel eklendi`, 'success', 2000);
  };

  const removeImage = (index) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim()) && tags.length < 10) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  const handleCategorySelect = (category) => {
    setFormData(prev => ({
      ...prev,
      category_slug: category.slug,
      category_name: category.name,
      details: {}
    }));
    setCategorySearch(category.name);
    setShowCategoryDropdown(false);
    addToast(`${category.name} seçildi`, 'success', 2000);
  };

  const uploadImages = async () => {
    if (imageFiles.length === 0) return [];

    setUploadingImages(true);
    const uploadedUrls = [];

    try {
      for (const file of imageFiles) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        
        const { data, error } = await supabase.storage
          .from('listing-images')
          .upload(fileName, file, {
            cacheControl: '3600',
            upsert: false
          });

        if (error) {
          console.error('Görsel yükleme hatası:', error);
          addToast('Görseller yüklenirken hata oluştu', 'error');
          return [];
        }

        const { data: { publicUrl } } = supabase.storage
          .from('listing-images')
          .getPublicUrl(fileName);

        uploadedUrls.push(publicUrl);
      }

      return uploadedUrls;
    } catch (err) {
      console.error('Upload error:', err);
      addToast('Görsel yükleme hatası: ' + err.message, 'error');
      return [];
    } finally {
      setUploadingImages(false);
    }
  };

  const validateStep = (step) => {
    if (step === 1) {
      if (!formData.title || !formData.category_slug) {
        addToast('Lütfen başlık ve kategori seçin', 'warning');
        return false;
      }
      return true;
    }
    if (step === 2) {
      if (!formData.price || parseFloat(formData.price) <= 0) {
        addToast('Geçerli bir fiyat girin', 'warning');
        return false;
      }
      if (imageFiles.length < MIN_IMAGES) {
        addToast(`En az ${MIN_IMAGES} görsel yükleyin`, 'warning');
        return false;
      }
      return true;
    }
    return true;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 3));
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (!validateStep(1) || !validateStep(2)) return;
    
    if (!currentUser) {
      addToast('İlan vermek için giriş yapmalısınız', 'warning');
      navigate('/login');
      return;
    }

    if (formData.is_featured && userBalance < FEATURED_PRICE) {
      addToast(
        `Vitrin ilanı için bakiyeniz yetersiz. Gerekli: ₺${FEATURED_PRICE}, Bakiyeniz: ₺${userBalance}`, 
        'error'
      );
      return;
    }

    setLoading(true);

    try {
      const imageUrls = await uploadImages();
      if (imageUrls.length === 0 && imageFiles.length > 0) {
        setLoading(false);
        return;
      }

      let sellerId = currentUserId;
      if (!sellerId) {
        const { data: existingUser } = await supabase
          .from('users')
          .select('id')
          .eq('username', currentUser.email.split('@')[0])
          .single();

        sellerId = existingUser?.id;

        if (!sellerId) {
          const { data: newUser } = await supabase
            .from('users')
            .insert([{
              username: currentUser.email.split('@')[0],
              avatar: currentUser.user_metadata?.avatar_url || null,
              rating: 5.0,
              verified: false,
              balance: 0
            }])
            .select()
            .single();
          sellerId = newUser?.id;
        }
      }

      const mainImage = imageUrls.length > 0 ? imageUrls[0] : 'https://via.placeholder.com/600x400/1a1d2d/7c3aed?text=Oyun+Gorseli';

      const { data: newListing, error: listingError } = await supabase
        .from('listings')
        .insert([{
          title: formData.title,
          description: formData.description,
          price: parseFloat(formData.price),
          category_slug: formData.category_slug,
          seller_id: sellerId,
          image: mainImage,
          is_featured: formData.is_featured,
          delivery_time: formData.delivery_time,
          guarantee_days: formData.guarantee_days,
          details: formData.details,
          tags: tags,
          status: 'active'
        }])
        .select()
        .single();

      if (listingError) throw listingError;

      if (imageUrls.length > 1 && newListing?.id) {
        const additionalImages = imageUrls.slice(1).map((url, index) => ({
          listing_id: newListing.id,
          image_url: url,
          display_order: index + 1
        }));
        await supabase.from('listing_images').insert(additionalImages);
      }

      if (formData.is_featured) {
        const { error: balanceError } = await supabase.rpc('deduct_balance', {
          user_id: sellerId,
          amount: FEATURED_PRICE
        });

        if (!balanceError) {
          await supabase.from('balance_history').insert([{
            user_id: sellerId,
            amount: -FEATURED_PRICE,
            type: 'purchase',
            description: 'Vitrin ilanı ücreti'
          }]);
        }
      }

      setSuccess(true);
      addToast('İlan başarıyla yayınlandı! 🎉', 'success');
      setTimeout(() => navigate('/profile'), 2000);
    } catch (err) {
      console.error('İlan ekleme hatası:', err);
      addToast('İlan eklenirken hata oluştu: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!currentUser) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16">
        <Link to="/" className="inline-flex items-center gap-2 text-text-muted hover:text-white mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Ana Sayfaya Dön
        </Link>
        <div className="bg-dark-800 rounded-2xl p-12 border border-dark-700 text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Giriş Yapmanız Gerekiyor</h2>
          <p className="text-text-muted mb-6">İlan vermek için önce giriş yapmalısınız.</p>
          <Link to="/login" className="inline-block bg-primary hover:bg-primaryHover text-white px-6 py-3 rounded-xl font-semibold transition-all">
            Giriş Yap
          </Link>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16">
        <div className="bg-dark-800 rounded-2xl p-12 border border-green-500/30 text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">İlan Başarıyla Yayınlandı!</h2>
          <p className="text-text-muted">Profil sayfanıza yönlendiriliyorsunuz...</p>
        </div>
      </div>
    );
  }

  const currentCategoryFields = CATEGORY_FIELDS[formData.category_slug] || [];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Link to="/profile" className="inline-flex items-center gap-2 text-text-muted hover:text-white mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Profile Dön
      </Link>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">İlan Ver</h1>
        <p className="text-text-muted">3 kolay adımda ilanını yayınla</p>
      </div>

      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          {[1, 2, 3].map(step => (
            <div key={step} className="flex items-center flex-1">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all ${
                currentStep >= step 
                  ? 'bg-primary text-white' 
                  : 'bg-dark-700 text-text-muted'
              }`}>
                {currentStep > step ? <CheckCircle className="w-5 h-5" /> : step}
              </div>
              {step < 3 && (
                <div className={`flex-1 h-1 mx-2 rounded-full transition-all ${
                  currentStep > step ? 'bg-primary' : 'bg-dark-700'
                }`}></div>
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-between text-xs text-text-muted">
          <span>Temel Bilgiler</span>
          <span>Fiyat & Görseller</span>
          <span>Detaylar & Teslimat</span>
        </div>
      </div>

      <div className="bg-gradient-to-r from-primary/10 to-purple-900/10 rounded-xl p-4 border border-primary/20 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-text-muted text-sm mb-1">Mevcut Bakiye</p>
            <p className="text-2xl font-bold text-white">₺{userBalance.toFixed(2)}</p>
          </div>
          <div className="text-xs text-text-muted">
            Vitrin ücreti: ₺{FEATURED_PRICE}
          </div>
        </div>
      </div>

      {/* ADIM 1 */}
      {currentStep === 1 && (
        <div className="bg-dark-800 rounded-2xl p-8 border border-dark-700 space-y-6">
          <h2 className="text-xl font-bold text-white mb-4">Temel Bilgiler</h2>

          <div>
            <label className="block text-white font-medium mb-2">
              Kategori <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-text-muted w-4 h-4" />
              <input
                type="text"
                value={categorySearch}
                onChange={(e) => {
                  setCategorySearch(e.target.value);
                  setShowCategoryDropdown(true);
                  setFormData(prev => ({ ...prev, category_slug: '', category_name: '', details: {} }));
                }}
                onFocus={() => setShowCategoryDropdown(true)}
                placeholder="Örn: Valorant, Instagram..."
                className="w-full bg-dark-900 text-white pl-10 pr-4 py-3 rounded-xl border border-dark-700 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all placeholder-text-muted"
                required
              />
              
              {showCategoryDropdown && filteredCategories.length > 0 && (
                <div className="absolute z-50 w-full mt-2 bg-dark-800 border border-dark-700 rounded-xl shadow-2xl max-h-80 overflow-auto">
                  {filteredCategories.map(cat => (
                    <button
                      key={cat.slug}
                      type="button"
                      onClick={() => handleCategorySelect(cat)}
                      className="w-full text-left px-4 py-3 hover:bg-dark-700 transition-colors border-b border-dark-700 last:border-b-0"
                    >
                      <div className="text-white font-medium">{cat.name}</div>
                      <div className="text-text-muted text-xs">
                        {cat.category_group === 'game' ? '🎮 Oyun' : '📱 Sosyal Medya'} • {cat.listing_count} ilan
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-white font-medium mb-2">
              İlan Başlığı <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Örn: Valorant Immortal 3 Hesap - 50+ Skin"
              maxLength={100}
              className="w-full bg-dark-900 text-white px-4 py-3 rounded-xl border border-dark-700 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all placeholder-text-muted"
              required
            />
            <p className="text-text-muted text-xs mt-1">{formData.title.length}/100 karakter</p>
          </div>

          <div>
            <label className="block text-white font-medium mb-2">Açıklama</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="İlanınızın detaylarını yazın..."
              rows="5"
              maxLength={2000}
              className="w-full bg-dark-900 text-white px-4 py-3 rounded-xl border border-dark-700 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all placeholder-text-muted resize-none"
            />
            <p className="text-text-muted text-xs mt-1">{formData.description.length}/2000 karakter</p>
          </div>

          <div>
            <label className="block text-white font-medium mb-2 flex items-center gap-2">
              <Tag className="w-4 h-4 text-primary" />
              Etiketler
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
                placeholder="Etiket ekle (örn: ucuz, hızlı teslim)"
                className="flex-1 bg-dark-900 text-white px-4 py-2 rounded-xl border border-dark-700 focus:outline-none focus:border-primary text-sm"
              />
              <button
                type="button"
                onClick={handleAddTag}
                className="bg-primary hover:bg-primaryHover text-white px-4 py-2 rounded-xl text-sm transition-all"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {tags.map(tag => (
                  <span key={tag} className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs flex items-center gap-1 border border-primary/30">
                    {tag}
                    <button onClick={() => handleRemoveTag(tag)} className="hover:text-red-400">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
            <p className="text-text-muted text-xs mt-1">Maksimum 10 etiket. Arama sonuçlarında öne çıkmanızı sağlar.</p>
          </div>
        </div>
      )}

      {/* ADIM 2 */}
      {currentStep === 2 && (
        <div className="bg-dark-800 rounded-2xl p-8 border border-dark-700 space-y-6">
          <h2 className="text-xl font-bold text-white mb-4">Fiyat & Görseller</h2>

          <div>
            <label className="block text-white font-medium mb-2">
              Fiyat (₺) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              name="price"
              value={formData.price}
              onChange={handleChange}
              placeholder="0.00"
              step="0.01"
              min="0"
              className="w-full bg-dark-900 text-white px-4 py-3 rounded-xl border border-dark-700 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all placeholder-text-muted"
              required
            />
            <p className="text-text-muted text-xs mt-1">
              Hizmet bedeli (%5) düşüldükten sonra elinize geçecek: ₺{(parseFloat(formData.price || 0) * 0.95).toFixed(2)}
            </p>
          </div>

          <div>
            <label className="block text-white font-medium mb-2">
              Görseller ({imageFiles.length}/{MAX_IMAGES}) <span className="text-red-500">*</span>
            </label>
            <div className="border-2 border-dashed border-dark-700 rounded-xl p-6 hover:border-primary/50 transition-colors">
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageChange}
                className="hidden"
                id="image-upload"
                disabled={imageFiles.length >= MAX_IMAGES}
              />
              <label htmlFor="image-upload" className="cursor-pointer block">
                <div className="text-center">
                  <Upload className="w-10 h-10 text-text-muted mx-auto mb-2" />
                  <p className="text-white font-medium mb-1">
                    {imageFiles.length >= MAX_IMAGES ? 'Maksimum görsel sayısına ulaşıldı' : 'Görsel seçmek için tıklayın'}
                  </p>
                  <p className="text-text-muted text-xs">PNG, JPG, GIF (Her biri Max 5MB)</p>
                </div>
              </label>
            </div>

            {imagePreviews.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mt-4">
                {imagePreviews.map((preview, index) => (
                  <div key={index} className="relative group">
                    <img src={preview} alt={`Preview ${index + 1}`} className="w-full h-24 object-cover rounded-lg border border-dark-700" />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>
                    {index === 0 && (
                      <div className="absolute bottom-1 left-1 bg-primary text-white text-xs px-2 py-0.5 rounded">
                        Ana Görsel
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ADIM 3 */}
      {currentStep === 3 && (
        <div className="space-y-6">
          {currentCategoryFields.length > 0 && (
            <div className="bg-dark-800 rounded-2xl p-8 border border-dark-700">
              <h2 className="text-xl font-bold text-white mb-4">
                {formData.category_name} Detayları
              </h2>
              <p className="text-text-muted text-sm mb-6">Bu alanlar alıcıların karar vermesini kolaylaştırır</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {currentCategoryFields.map(field => (
                  <div key={field.name}>
                    <label className="block text-white font-medium mb-2">
                      {field.label} {field.required && <span className="text-red-500">*</span>}
                    </label>
                    {field.type === 'select' ? (
                      <select
                        value={formData.details[field.name] || ''}
                        onChange={(e) => handleDetailChange(field.name, e.target.value)}
                        className="w-full bg-dark-900 text-white px-4 py-3 rounded-xl border border-dark-700 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                      >
                        <option value="">Seçin...</option>
                        {field.options.map(opt => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type={field.type}
                        value={formData.details[field.name] || ''}
                        onChange={(e) => handleDetailChange(field.name, e.target.value)}
                        placeholder={field.placeholder || ''}
                        className="w-full bg-dark-900 text-white px-4 py-3 rounded-xl border border-dark-700 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all placeholder-text-muted"
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-dark-800 rounded-2xl p-8 border border-dark-700">
            <h2 className="text-xl font-bold text-white mb-4">Teslimat & Garanti</h2>

            <div className="mb-6">
              <label className="block text-white font-medium mb-3 flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" />
                Teslimat Süresi
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {DELIVERY_OPTIONS.map(option => (
                  <label
                    key={option.value}
                    className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      formData.delivery_time === option.value
                        ? 'border-primary bg-primary/5'
                        : 'border-dark-700 hover:border-dark-600 bg-dark-900'
                    }`}
                  >
                    <input
                      type="radio"
                      name="delivery_time"
                      value={option.value}
                      checked={formData.delivery_time === option.value}
                      onChange={handleChange}
                      className="mt-1 w-4 h-4 text-primary"
                    />
                    <div>
                      <div className="text-white font-semibold text-sm">{option.label}</div>
                      <div className="text-text-muted text-xs mt-0.5">{option.description}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-white font-medium mb-3 flex items-center gap-2">
                <Shield className="w-4 h-4 text-primary" />
                Garanti Süresi
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {GUARANTEE_OPTIONS.map(option => (
                  <label
                    key={option.value}
                    className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      formData.guarantee_days === option.value
                        ? 'border-primary bg-primary/5'
                        : 'border-dark-700 hover:border-dark-600 bg-dark-900'
                    }`}
                  >
                    <input
                      type="radio"
                      name="guarantee_days"
                      value={option.value}
                      checked={formData.guarantee_days === option.value}
                      onChange={handleChange}
                      className="mt-1 w-4 h-4 text-primary"
                    />
                    <div>
                      <div className="text-white font-semibold text-sm">{option.label}</div>
                      <div className="text-text-muted text-xs mt-0.5">{option.description}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-dark-800 rounded-2xl p-8 border border-dark-700">
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                name="is_featured"
                id="is_featured"
                checked={formData.is_featured}
                onChange={handleChange}
                className="w-5 h-5 rounded bg-dark-800 border-dark-700 text-primary focus:ring-primary mt-0.5"
              />
              <div className="flex-1">
                <label htmlFor="is_featured" className="text-white cursor-pointer block">
                  <span className="font-semibold flex items-center gap-2">
                    Vitrin İlanı
                    <span className="bg-primary text-white text-xs px-2 py-0.5 rounded">₺{FEATURED_PRICE}</span>
                  </span>
                  <span className="block text-text-muted text-sm mt-1">
                    İlanınız ana sayfada öne çıkar. Bakiyenizden ₺{FEATURED_PRICE} düşer.
                  </span>
                </label>
                {formData.is_featured && userBalance < FEATURED_PRICE && (
                  <div className="mt-2 flex items-center gap-2 text-red-400 text-sm bg-red-500/10 p-2 rounded-lg">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>Yetersiz bakiye!</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Butonlar */}
      <div className="flex gap-3 mt-8">
        {currentStep > 1 && (
          <button
            type="button"
            onClick={prevStep}
            className="px-6 py-3.5 bg-dark-700 hover:bg-dark-600 text-white rounded-xl font-semibold transition-all flex items-center gap-2"
          >
            <ChevronLeft className="w-5 h-5" />
            Geri
          </button>
        )}

        {currentStep < 3 ? (
          <button
            type="button"
            onClick={nextStep}
            className="flex-1 bg-primary hover:bg-primaryHover text-white py-3.5 rounded-xl font-semibold transition-all hover:shadow-lg hover:shadow-primary/30 flex items-center justify-center gap-2"
          >
            İleri
            <ChevronRight className="w-5 h-5" />
          </button>
        ) : (
          <>
            <button
              type="button"
              onClick={() => setPreview(true)}
              className="px-6 py-3.5 bg-dark-700 hover:bg-dark-600 text-white rounded-xl font-semibold transition-all flex items-center gap-2"
            >
              <Eye className="w-5 h-5" />
              Önizle
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading || uploadingImages}
              className="flex-1 bg-primary hover:bg-primaryHover disabled:bg-dark-700 disabled:cursor-not-allowed text-white py-3.5 rounded-xl font-semibold transition-all hover:shadow-lg hover:shadow-primary/30 flex items-center justify-center gap-2"
            >
              {loading ? (
                <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> Yayınlanıyor...</>
              ) : (
                <><CheckCircle className="w-5 h-5" /> İlanı Yayınla</>
              )}
            </button>
          </>
        )}
      </div>

      {/* Önizleme Modal */}
      {preview && (
        <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4" onClick={() => setPreview(false)}>
          <div className="bg-dark-800 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-auto border border-dark-700" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-dark-700 flex justify-between items-center sticky top-0 bg-dark-800">
              <h2 className="text-xl font-bold text-white">İlan Önizleme</h2>
              <button onClick={() => setPreview(false)} className="text-text-muted hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6">
              {imagePreviews[0] && (
                <img src={imagePreviews[0]} alt="Preview" className="w-full aspect-video object-cover rounded-xl mb-4" />
              )}
              <h3 className="text-2xl font-bold text-white mb-2">{formData.title || 'Başlık yok'}</h3>
              <div className="flex gap-2 mb-4 flex-wrap">
                <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm">{formData.category_name}</span>
                <span className="bg-dark-700 text-text-muted px-3 py-1 rounded-full text-sm">
                  <Clock className="w-3 h-3 inline mr-1" />
                  {formData.delivery_time}
                </span>
                <span className="bg-dark-700 text-text-muted px-3 py-1 rounded-full text-sm">
                  <Shield className="w-3 h-3 inline mr-1" />
                  {formData.guarantee_days} gün garanti
                </span>
              </div>
              <div className="text-3xl font-bold text-primary mb-4">
                ₺{parseFloat(formData.price || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
              </div>
              {formData.description && (
                <p className="text-text-muted leading-relaxed mb-4">{formData.description}</p>
              )}
              {Object.keys(formData.details).length > 0 && (
                <div className="bg-dark-900 rounded-xl p-4 mb-4">
                  <h4 className="text-white font-semibold mb-3">Teknik Detaylar</h4>
                  <div className="grid grid-cols-2 gap-3">
                    {Object.entries(formData.details).map(([key, value]) => {
                      const field = currentCategoryFields.find(f => f.name === key);
                      return (
                        <div key={key}>
                          <div className="text-text-muted text-xs">{field?.label || key}</div>
                          <div className="text-white font-medium">{value || '-'}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {tags.map(tag => (
                    <span key={tag} className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs">#{tag}</span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}