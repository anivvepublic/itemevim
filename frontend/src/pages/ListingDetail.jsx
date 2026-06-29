import { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Shield, CheckCircle, Star, MessageCircle, Send, 
  ChevronLeft, ChevronRight, X, Heart, ShoppingCart, User, 
  Package, Calendar, Eye, Clock, Share2, Flag, Copy, 
  MessageSquare, AlertCircle
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useToast } from '../context/ToastContext';
import { useFavorites } from '../context/FavoritesContext';
import { useCart } from '../context/CartContext';
import ListingCard from '../components/ListingCard';

// Özel Sosyal Medya İkonları (lucide-react'te yok)
const TwitterIcon = ({ className }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
);

const FacebookIcon = ({ className }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
);

export default function ListingDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const { toggleFavorite, isFavorite } = useFavorites();
  const { addToCart, isInCart } = useCart();
  
  const [listing, setListing] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [sellerRating, setSellerRating] = useState(null);
  const [similarListings, setSimilarListings] = useState([]);
  const [sellerOtherListings, setSellerOtherListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);
  
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  
  const [newReview, setNewReview] = useState({ rating: 5, comment: '' });
  const [submittingReview, setSubmittingReview] = useState(false);

  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportDescription, setReportDescription] = useState('');
  const [submittingReport, setSubmittingReport] = useState(false);

  const galleryRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        fetch(`/api/listings/${id}/view`, { method: 'POST' }).catch(() => {});
        
        const res = await fetch(`/api/listings/${id}`);
        if (!res.ok) throw new Error('İlan bulunamadı');
        
        const data = await res.json();
        if (!data || !data.id) throw new Error('İlan verisi boş');
        
        setListing(data);

        const reviewsRes = await fetch(`/api/listings/${id}/reviews`);
        const reviewsData = await reviewsRes.json();
        setReviews(Array.isArray(reviewsData) ? reviewsData : []);

        if (data?.seller_id) {
          const ratingRes = await fetch(`/api/users/${data.seller_id}/rating`);
          const ratingData = await ratingRes.json();
          setSellerRating(ratingData);

          const sellerRes = await fetch(`/api/users/${data.seller_id}/listings?exclude_id=${id}&limit=4`);
          const sellerData = await sellerRes.json();
          setSellerOtherListings(Array.isArray(sellerData) ? sellerData : []);
        }

        const similarRes = await fetch(`/api/listings/${id}/similar`);
        const similarData = await similarRes.json();
        setSimilarListings(Array.isArray(similarData) ? similarData : []);

        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setCurrentUser(session.user);
          
          const { data: users } = await supabase
            .from('users')
            .select('id')
            .eq('username', session.user.email.split('@')[0])
            .limit(1);
          
          if (users && users.length > 0) {
            setCurrentUserId(users[0].id);
          }
        }
      } catch (err) {
        console.error('İlan yüklenemedi:', err);
        addToast('İlan bulunamadı veya yüklenemedi', 'error');
        setTimeout(() => navigate('/'), 2000);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchData();
  }, [id, navigate, addToast]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!lightboxOpen) return;
      if (e.key === 'ArrowLeft') prevImage();
      if (e.key === 'ArrowRight') nextImage();
      if (e.key === 'Escape') closeLightbox();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxOpen, listing]);

  const nextImage = () => {
    if (!listing?.images) return;
    setCurrentImageIndex((prev) => (prev + 1) % listing.images.length);
  };

  const prevImage = () => {
    if (!listing?.images) return;
    setCurrentImageIndex((prev) => (prev - 1 + listing.images.length) % listing.images.length);
  };

  const openLightbox = (index) => {
    setCurrentImageIndex(index);
    setLightboxOpen(true);
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    
    if (!currentUser) {
      addToast('Yorum yapmak için giriş yapmalısınız', 'warning');
      return;
    }

    if (!currentUserId) {
      addToast('Kullanıcı bilgisi bulunamadı', 'error');
      return;
    }

    if (!newReview.comment.trim()) {
      addToast('Lütfen yorum yazın', 'warning');
      return;
    }

    setSubmittingReview(true);

    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reviewer_id: currentUserId,
          seller_id: listing.seller_id,
          listing_id: listing.id,
          rating: newReview.rating,
          comment: newReview.comment
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Yorum eklenemedi');

      const { data: reviewer } = await supabase
        .from('users')
        .select('username, avatar')
        .eq('id', currentUserId)
        .single();

      setReviews(prev => [{ ...data, reviewer }, ...prev]);

      const ratingRes = await fetch(`/api/users/${listing.seller_id}/rating`);
      const ratingData = await ratingRes.json();
      setSellerRating(ratingData);

      setNewReview({ rating: 5, comment: '' });
      addToast('Yorumunuz eklendi', 'success');
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleAddToCart = () => {
    if (!currentUser) {
      addToast('Sepete eklemek için giriş yapmalısınız', 'warning');
      navigate('/login');
      return;
    }
    addToCart(listing);
  };

const handleSendMessage = () => {
  if (!currentUser) {
    addToast('Mesaj göndermek için giriş yapmalısınız', 'warning');
    navigate('/login');
    return;
  }

  if (listing?.seller_id) {
    // Kendi ilanına mesaj atamazsın
    if (listing.seller_id === currentUserId) {
      addToast('Kendi ilanınıza mesaj gönderemezsiniz', 'warning');
      return;
    }
    // Satıcı ID'sini URL parametresi olarak gönder
    navigate(`/messages?to=${listing.seller_id}`);
  } else {
    addToast('Satıcı bilgisi bulunamadı', 'error');
  }
};

  const handleReport = async () => {
    if (!reportReason) {
      addToast('Lütfen bir rapor sebebi seçin', 'warning');
      return;
    }

    setSubmittingReport(true);

    try {
      const res = await fetch(`/api/listings/${id}/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reason: reportReason,
          description: reportDescription
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Rapor gönderilemedi');

      addToast('Raporunuz alındı. En kısa sürede incelenecek.', 'success');
      setReportOpen(false);
      setReportReason('');
      setReportDescription('');
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setSubmittingReport(false);
    }
  };

  const handleShare = (platform) => {
    const url = window.location.href;
    const text = `${listing.title} - ₺${listing.price}`;
    
    const shareUrls = {
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      whatsapp: `https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`
    };

    if (platform === 'copy') {
      navigator.clipboard.writeText(url);
      addToast('Link kopyalandı!', 'success', 2000);
      return;
    }

    window.open(shareUrls[platform], '_blank', 'width=600,height=400');
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-text-muted">İlan yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="bg-dark-800 rounded-2xl p-12 border border-dark-700 text-center">
          <h2 className="text-2xl font-bold text-white mb-2">İlan Bulunamadı</h2>
          <p className="text-text-muted mb-6">Bu ilan silinmiş veya bulunamıyor.</p>
          <Link to="/" className="inline-block bg-primary hover:bg-primaryHover text-white px-6 py-3 rounded-xl font-semibold transition-all">
            Ana Sayfaya Dön
          </Link>
        </div>
      </div>
    );
  }

  const images = listing.images || [{ id: 'main', image_url: listing.image, is_main: true }];
  const favorite = isFavorite(listing.id);
  const inCart = isInCart(listing.id);
  
  const details = (listing.details && typeof listing.details === 'object') ? listing.details : {};
  const tags = Array.isArray(listing.tags) ? listing.tags : [];

  const reportReasons = [
    'Sahte veya yanıltıcı ilan',
    'Yasadışı ürün/hizmet',
    'Dolandırıcılık şüphesi',
    'Telif hakkı ihlali',
    'Uygunsuz içerik',
    'Spam veya reklam',
    'Diğer'
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link to="/" className="inline-flex items-center gap-2 text-text-muted hover:text-white mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Ana Sayfaya Dön
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          {/* GALERİ */}
          <div ref={galleryRef} className="rounded-2xl overflow-hidden mb-6 border border-dark-700 bg-dark-800">
            <div className="relative aspect-video bg-dark-900 cursor-pointer group" onClick={() => openLightbox(currentImageIndex)}>
              <img 
                src={images[currentImageIndex]?.image_url} 
                alt={listing.title}
                className="w-full h-full object-cover"
              />
              
              {images.length > 1 && (
                <>
                  <button
                    onClick={(e) => { e.stopPropagation(); prevImage(); }}
                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-dark-900/80 hover:bg-dark-900 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-label="Önceki fotoğraf"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); nextImage(); }}
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-dark-900/80 hover:bg-dark-900 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-label="Sonraki fotoğraf"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                  
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-dark-900/80 text-white px-3 py-1 rounded-full text-sm">
                    {currentImageIndex + 1} / {images.length}
                  </div>
                </>
              )}

              <div className="absolute top-4 right-4 bg-dark-900/80 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                <Eye className="w-5 h-5" />
              </div>

              <div className="absolute top-4 left-4 bg-dark-900/80 text-white px-3 py-1 rounded-full text-xs flex items-center gap-1">
                <Eye className="w-3 h-3" />
                {listing.views || 0} görüntülenme
              </div>
            </div>

            {images.length > 1 && (
              <div className="p-4 bg-dark-800 border-t border-dark-700">
                <div className="flex gap-2 overflow-x-auto scrollbar-hide">
                  {images.map((img, index) => (
                    <button
                      key={img.id || index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`relative flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                        index === currentImageIndex 
                          ? 'border-primary ring-2 ring-primary/30' 
                          : 'border-dark-700 hover:border-dark-600'
                      }`}
                    >
                      <img src={img.image_url} alt={`Thumbnail ${index + 1}`} className="w-full h-full object-cover" />
                      {img.is_main && (
                        <div className="absolute top-0.5 left-0.5 bg-primary text-white text-[10px] px-1 rounded">Ana</div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* BAŞLIK */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-white mb-4">{listing.title}</h1>
            
            <div className="flex items-center gap-3 flex-wrap mb-3">
              <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium">
                {listing.category_slug?.toUpperCase()}
              </span>
              {listing.is_featured && (
                <span className="bg-primary text-white px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1">
                  <Star className="w-3 h-3 fill-white" />
                  Vitrin
                </span>
              )}
              <span className="bg-dark-700 text-text-muted px-3 py-1 rounded-full text-sm flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {new Date(listing.created_at).toLocaleDateString('tr-TR')}
              </span>
            </div>

            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {tags.map(tag => (
                  <span key={tag} className="bg-dark-700 text-text-muted px-2.5 py-1 rounded-full text-xs">
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* BİLGİ KARTLARI */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
            <div className="bg-gradient-to-br from-primary/10 to-purple-900/10 rounded-xl p-4 border border-primary/20">
              <div className="flex items-center gap-2 text-text-muted text-xs mb-1">
                <Clock className="w-3.5 h-3.5" />
                Teslimat Süresi
              </div>
              <div className="text-white font-semibold">{listing.delivery_time || '24 saat'}</div>
            </div>
            <div className="bg-gradient-to-br from-green-500/10 to-emerald-900/10 rounded-xl p-4 border border-green-500/20">
              <div className="flex items-center gap-2 text-text-muted text-xs mb-1">
                <Shield className="w-3.5 h-3.5 text-green-400" />
                Garanti
              </div>
              <div className="text-white font-semibold">
                {listing.guarantee_days > 0 ? `${listing.guarantee_days} Gün` : 'Garanti Yok'}
              </div>
            </div>
            <div className="bg-gradient-to-br from-blue-500/10 to-indigo-900/10 rounded-xl p-4 border border-blue-500/20">
              <div className="flex items-center gap-2 text-text-muted text-xs mb-1">
                <Eye className="w-3.5 h-3.5 text-blue-400" />
                Görüntülenme
              </div>
              <div className="text-white font-semibold">{listing.views || 0} kez</div>
            </div>
          </div>

          {/* TEKNİK DETAYLAR */}
          {Object.keys(details).length > 0 && (
            <div className="bg-dark-800 rounded-xl p-6 border border-dark-700 mb-6">
              <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
                <Package className="w-5 h-5 text-primary" />
                Teknik Detaylar
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(details).map(([key, value]) => {
                  if (!value) return null;
                  const label = key
                    .replace(/_/g, ' ')
                    .replace(/\b\w/g, l => l.toUpperCase());
                  return (
                    <div key={key} className="flex justify-between items-center py-2 border-b border-dark-700 last:border-b-0">
                      <span className="text-text-muted text-sm">{label}</span>
                      <span className="text-white font-medium text-sm">{value}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* AÇIKLAMA */}
          {listing.description && (
            <div className="bg-dark-800 rounded-xl p-6 border border-dark-700 mb-6">
              <h2 className="text-white font-semibold mb-3 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-primary" />
                Açıklama
              </h2>
              <p className="text-text-muted leading-relaxed whitespace-pre-wrap">{listing.description}</p>
            </div>
          )}

          {/* GÜVENLİ ALIŞVERİŞ */}
          <div className="bg-dark-800 rounded-xl p-6 border border-dark-700 mb-6">
            <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              Güvenli Alışveriş Garantisi
            </h2>
            <ul className="space-y-2 text-text-muted text-sm">
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span>%100 Para Koruma Garantisi</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span>Anında teslim veya belirtilen sürede teslim garantisi</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span>{listing.guarantee_days > 0 ? `${listing.guarantee_days} gün boyunca değişim/iade garantisi` : 'Satıcıyla iletişime geçerek destek alabilirsiniz'}</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span>7/24 Müşteri Desteği</span>
              </li>
            </ul>
          </div>

          {/* PAYLAŞ + RAPORLA */}
          <div className="bg-dark-800 rounded-xl p-6 border border-dark-700 mb-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h3 className="text-white font-semibold mb-2 flex items-center gap-2">
                  <Share2 className="w-4 h-4 text-primary" />
                  Paylaş
                </h3>
                <div className="flex gap-2">
                  <button onClick={() => handleShare('twitter')} className="w-10 h-10 bg-dark-700 hover:bg-blue-500/20 hover:text-blue-400 text-text-muted rounded-lg flex items-center justify-center transition-all" aria-label="Twitter'da paylaş">
                    <TwitterIcon className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleShare('facebook')} className="w-10 h-10 bg-dark-700 hover:bg-blue-600/20 hover:text-blue-500 text-text-muted rounded-lg flex items-center justify-center transition-all" aria-label="Facebook'ta paylaş">
                    <FacebookIcon className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleShare('whatsapp')} className="w-10 h-10 bg-dark-700 hover:bg-green-500/20 hover:text-green-400 text-text-muted rounded-lg flex items-center justify-center transition-all" aria-label="WhatsApp'ta paylaş">
                    <MessageSquare className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleShare('copy')} className="w-10 h-10 bg-dark-700 hover:bg-primary/20 hover:text-primary text-text-muted rounded-lg flex items-center justify-center transition-all" aria-label="Linki kopyala">
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              <button
                onClick={() => setReportOpen(true)}
                className="flex items-center gap-2 text-text-muted hover:text-red-400 text-sm transition-colors"
              >
                <Flag className="w-4 h-4" />
                İlanı Raporla
              </button>
            </div>
          </div>

          {/* YORUMLAR */}
          <div className="bg-dark-800 rounded-xl p-6 border border-dark-700 mb-6">
            <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-primary" />
              Yorumlar ({reviews.length})
            </h2>

            {currentUser && (
              <form onSubmit={handleSubmitReview} className="mb-6 pb-6 border-b border-dark-700">
                <div className="mb-3">
                  <label className="block text-white text-sm font-medium mb-2">Puanınız</label>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map(star => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setNewReview(prev => ({ ...prev, rating: star }))}
                        className="transition-transform hover:scale-110"
                      >
                        <Star className={`w-6 h-6 ${star <= newReview.rating ? 'text-yellow-500 fill-yellow-500' : 'text-text-muted'}`} />
                      </button>
                    ))}
                  </div>
                </div>
                <div className="mb-3">
                  <textarea
                    value={newReview.comment}
                    onChange={(e) => setNewReview(prev => ({ ...prev, comment: e.target.value }))}
                    placeholder="Yorumunuzu yazın..."
                    rows="3"
                    className="w-full bg-dark-900 text-white px-4 py-3 rounded-xl border border-dark-700 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all placeholder-text-muted resize-none"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={submittingReview}
                  className="bg-primary hover:bg-primaryHover disabled:bg-dark-700 disabled:cursor-not-allowed text-white px-5 py-2.5 rounded-lg font-medium transition-all flex items-center gap-2"
                >
                  {submittingReview ? (
                    <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> Gönderiliyor...</>
                  ) : (
                    <><Send className="w-4 h-4" /> Yorumu Gönder</>
                  )}
                </button>
              </form>
            )}

            {reviews.length === 0 ? (
              <p className="text-text-muted text-center py-8">Henüz yorum yapılmamış. İlk yorumu sen yap!</p>
            ) : (
              <div className="space-y-4">
                {reviews.map(review => (
                  <div key={review.id} className="bg-dark-900 rounded-xl p-4 border border-dark-700">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-dark-700 overflow-hidden flex-shrink-0">
                        {review.reviewer?.avatar ? (
                          <img src={review.reviewer.avatar} alt={review.reviewer.username} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-sm">👤</div>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-white font-medium text-sm">{review.reviewer?.username || 'Kullanıcı'}</span>
                          <div className="flex gap-0.5">
                            {[1, 2, 3, 4, 5].map(star => (
                              <Star key={star} className={`w-3 h-3 ${star <= review.rating ? 'text-yellow-500 fill-yellow-500' : 'text-text-muted'}`} />
                            ))}
                          </div>
                        </div>
                        <p className="text-text-muted text-sm leading-relaxed">{review.comment}</p>
                        <p className="text-text-muted text-xs mt-2">
                          {new Date(review.created_at).toLocaleDateString('tr-TR')}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* SATICININ DİĞER İLANLARI */}
          {sellerOtherListings.length > 0 && (
            <div className="mb-6">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <User className="w-5 h-5 text-primary" />
                {listing.seller?.username} - Diğer İlanları
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {sellerOtherListings.map(item => (
                  <ListingCard key={item.id} listing={item} />
                ))}
              </div>
            </div>
          )}

          {/* BENZER İLANLAR */}
          {similarListings.length > 0 && (
            <div>
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Package className="w-5 h-5 text-primary" />
                Benzer İlanlar
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {similarListings.map(item => (
                  <ListingCard key={item.id} listing={item} />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* SAĞ */}
        <div className="lg:col-span-1">
          <div className="bg-dark-800 rounded-xl p-6 border border-dark-700 sticky top-24 space-y-6">
            <div>
              <span className="text-text-muted text-sm block mb-1">Fiyat</span>
              <span className="text-4xl font-bold text-white">
                ₺{listing.price?.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
              </span>
            </div>

            <div className="space-y-3">
              <button 
                onClick={handleAddToCart}
                disabled={inCart}
                className={`w-full py-3.5 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${
                  inCart
                    ? 'bg-green-500/10 text-green-400 border border-green-500/30 cursor-default'
                    : 'bg-primary hover:bg-primaryHover text-white hover:shadow-lg hover:shadow-primary/30'
                }`}
              >
                <ShoppingCart className="w-5 h-5" />
                {inCart ? 'Sepette ✓' : 'Sepete Ekle'}
              </button>

              {inCart && (
                <Link
                  to="/cart"
                  className="w-full bg-dark-700 hover:bg-dark-600 text-white py-3.5 rounded-xl font-semibold border border-dark-600 transition-all flex items-center justify-center gap-2"
                >
                  Sepeti Görüntüle
                </Link>
              )}

              <button 
                onClick={handleSendMessage}
                className="w-full bg-dark-700 hover:bg-dark-600 text-white py-3.5 rounded-xl font-semibold border border-dark-600 transition-all flex items-center justify-center gap-2"
              >
                <MessageCircle className="w-4 h-4" />
                Satıcıya Mesaj Gönder
              </button>

              <button
                onClick={() => toggleFavorite(listing)}
                className={`w-full py-3.5 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${
                  favorite 
                    ? 'bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20' 
                    : 'bg-dark-700 hover:bg-dark-600 text-white border border-dark-600'
                }`}
              >
                <Heart className={`w-4 h-4 ${favorite ? 'fill-red-400' : ''}`} />
                {favorite ? 'Favorilerden Çıkar' : 'Favorilere Ekle'}
              </button>
            </div>

            {listing.seller && (
              <div className="pt-6 border-t border-dark-700">
                <span className="text-text-muted text-sm block mb-3">Satıcı</span>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-14 h-14 rounded-full bg-dark-700 overflow-hidden border-2 border-dark-600 flex-shrink-0">
                    {listing.seller.avatar ? (
                      <img src={listing.seller.avatar} alt={listing.seller.username} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xl">👤</div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-white font-semibold flex items-center gap-1 truncate">
                      {listing.seller.username}
                      {listing.seller.verified && <CheckCircle className="w-4 h-4 text-primary flex-shrink-0" />}
                    </div>
                    {sellerRating && sellerRating.reviewCount > 0 ? (
                      <div className="flex items-center gap-1 text-text-muted text-sm">
                        <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500 flex-shrink-0" />
                        <span>{sellerRating.avgRating}</span>
                        <span className="text-xs">({sellerRating.reviewCount} yorum)</span>
                      </div>
                    ) : (
                      <p className="text-text-muted text-xs">Henüz yorum yok</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-4">
                  <div className="bg-dark-900 rounded-lg p-3 text-center">
                    <div className="text-text-muted text-xs mb-1">Üyelik</div>
                    <div className="text-white font-semibold text-sm">
                      {new Date(listing.seller.created_at || Date.now()).getFullYear()}
                    </div>
                  </div>
                  <div className="bg-dark-900 rounded-lg p-3 text-center">
                    <div className="text-text-muted text-xs mb-1">Durum</div>
                    <div className="text-green-400 font-semibold text-sm flex items-center justify-center gap-1">
                      <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                      Aktif
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* LIGHTBOX */}
      {lightboxOpen && (
        <div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center" onClick={closeLightbox}>
          <button onClick={closeLightbox} className="absolute top-4 right-4 text-white hover:text-primary transition-colors z-10">
            <X className="w-8 h-8" />
          </button>

          {images.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); prevImage(); }}
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-dark-900/80 hover:bg-dark-900 text-white p-3 rounded-full z-10"
                aria-label="Önceki fotoğraf"
              >
                <ChevronLeft className="w-8 h-8" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); nextImage(); }}
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-dark-900/80 hover:bg-dark-900 text-white p-3 rounded-full z-10"
                aria-label="Sonraki fotoğraf"
              >
                <ChevronRight className="w-8 h-8" />
              </button>
            </>
          )}

          <img 
            src={images[currentImageIndex]?.image_url} 
            alt={listing.title}
            className="max-w-[90vw] max-h-[90vh] object-contain"
            onClick={(e) => e.stopPropagation()}
          />

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-dark-900/80 text-white px-4 py-2 rounded-full">
            {currentImageIndex + 1} / {images.length}
          </div>

          <div className="absolute bottom-4 right-4 text-text-muted text-xs">
            ← → ok tuşları ile gezinin • ESC ile kapatın
          </div>
        </div>
      )}

      {/* RAPOR MODAL */}
      {reportOpen && (
        <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4" onClick={() => setReportOpen(false)}>
          <div className="bg-dark-800 rounded-2xl max-w-md w-full border border-dark-700" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-dark-700 flex justify-between items-center">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Flag className="w-5 h-5 text-red-400" />
                İlanı Raporla
              </h2>
              <button onClick={() => setReportOpen(false)} className="text-text-muted hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <p className="text-text-muted text-sm mb-4">
                Bu ilanı neden raporlamak istiyorsunuz?
              </p>

              <div className="space-y-2 mb-4">
                {reportReasons.map(reason => (
                  <label
                    key={reason}
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                      reportReason === reason
                        ? 'border-primary bg-primary/5'
                        : 'border-dark-700 hover:border-dark-600'
                    }`}
                  >
                    <input
                      type="radio"
                      name="reportReason"
                      value={reason}
                      checked={reportReason === reason}
                      onChange={(e) => setReportReason(e.target.value)}
                      className="w-4 h-4 text-primary"
                    />
                    <span className="text-white text-sm">{reason}</span>
                  </label>
                ))}
              </div>

              <textarea
                value={reportDescription}
                onChange={(e) => setReportDescription(e.target.value)}
                placeholder="Eklemek istediğiniz detaylar (opsiyonel)"
                rows="3"
                className="w-full bg-dark-900 text-white px-4 py-3 rounded-xl border border-dark-700 focus:outline-none focus:border-primary text-sm resize-none"
              />

              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => setReportOpen(false)}
                  className="flex-1 bg-dark-700 hover:bg-dark-600 text-white py-2.5 rounded-lg font-medium transition-all"
                >
                  İptal
                </button>
                <button
                  onClick={handleReport}
                  disabled={submittingReport || !reportReason}
                  className="flex-1 bg-red-500 hover:bg-red-600 disabled:bg-dark-700 disabled:cursor-not-allowed text-white py-2.5 rounded-lg font-medium transition-all"
                >
                  {submittingReport ? 'Gönderiliyor...' : 'Raporu Gönder'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}