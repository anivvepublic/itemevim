import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, User, Mail, Star, Package, CheckCircle, 
  MessageCircle, Calendar, TrendingUp
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useToast } from '../context/ToastContext';
import ListingCard from '../components/ListingCard';

function StyledName({ name, color, size = 'text-3xl' }) {
  return (
    <span className={`${size} font-bold`} style={{ color: color || '#ffffff' }}>
      {name}
    </span>
  );
}

export default function PublicProfilePage() {
  const { username } = useParams();
  const navigate = useNavigate();
  const { addToast } = useToast();
  
  const [profileData, setProfileData] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Public profil verisi
        const res = await fetch(`/api/users/username/${username}`);
        if (!res.ok) throw new Error('KullanÄ±cÄ± bulunamadÄ±');
        const data = await res.json();
        setProfileData(data);

        // Oturum kontrolÃ¼
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
        console.error('Public profile error:', err);
        navigate('/404');
      } finally {
        setLoading(false);
      }
    };

    if (username) fetchData();
  }, [username, navigate]);

  const handleSendMessage = () => {
    if (!currentUser) {
      addToast('Mesaj gÃ¶ndermek iÃ§in giriÅŸ yapmalÄ±sÄ±nÄ±z', 'warning');
      navigate('/login');
      return;
    }
    if (currentUserId === profileData?.user?.id) {
      addToast('Kendinize mesaj gÃ¶nderemezsiniz', 'info');
      return;
    }
    addToast('MesajlaÅŸma Ã¶zelliÄŸi yakÄ±nda eklenecek!', 'info');
  };

  if (loading) {
    return (
      <div className="text-center py-16">
        <div className="inline-block w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="text-text-muted mt-4">Profil yÃ¼kleniyor...</p>
      </div>
    );
  }

  if (!profileData) return null;

  const { user, listings, rating } = profileData;
  const settings = user.profile_settings || {};
  const nameColor = settings.nameColor || '#ffffff';
  const isOwnProfile = currentUserId === user.id;

  const joinDate = new Date(user.created_at).toLocaleDateString('tr-TR', {
    year: 'numeric',
    month: 'long'
  });

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <Link to="/" className="inline-flex items-center gap-2 text-text-muted hover:text-white mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Ana Sayfaya DÃ¶n
      </Link>

      {/* PROFÄ°L KARTI */}
      <div className="rounded-2xl border border-dark-700 bg-dark-800 px-6 pb-6">
        {/* Avatar */}
        <div className="flex justify-center pt-8 pb-4">
          <div className="w-32 h-32 rounded-full overflow-hidden bg-dark-700 border-4 border-dark-600">
            {user.avatar_url || user.avatar ? (
              <img 
                src={user.avatar_url || user.avatar} 
                alt={user.username} 
                className="w-full h-full object-cover" 
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <User className="w-12 h-12 text-text-muted" />
              </div>
            )}
          </div>
        </div>

        {/* Ä°sim + Rozet */}
        <div className="text-center mt-4">
          <StyledName name={user.username} color={nameColor} size="text-3xl md:text-4xl" />
          
          {user.verified && (
            <div className="flex items-center justify-center gap-1 text-primary text-sm mt-2">
              <CheckCircle className="w-4 h-4" />
              <span className="font-medium">OnaylÄ± SatÄ±cÄ±</span>
            </div>
          )}

          {/* Ãœyelik tarihi */}
          <div className="flex items-center justify-center gap-2 text-text-muted mt-2">
            <Calendar className="w-4 h-4" />
            <span className="text-sm">{joinDate} tarihinden beri Ã¼ye</span>
          </div>
        </div>

        {/* Bio */}
        <div className="max-w-2xl mx-auto mt-4">
          {user.bio ? (
            <p className="text-center text-text-muted leading-relaxed whitespace-pre-wrap">
              {user.bio}
            </p>
          ) : (
            <p className="text-center text-text-muted/50 italic text-sm">HenÃ¼z bio eklenmemiÅŸ</p>
          )}
        </div>

        {/* Mesaj GÃ¶nder Butonu (kendi profiline deÄŸilse) */}
        {!isOwnProfile && currentUser && (
          <div className="flex justify-center mt-6">
            <button
              onClick={handleSendMessage}
              className="bg-primary hover:bg-primaryHover text-white px-6 py-2.5 rounded-xl font-medium flex items-center gap-2 transition-all"
            >
              <MessageCircle className="w-4 h-4" />
              Mesaj GÃ¶nder
            </button>
          </div>
        )}
      </div>

      {/* Ä°STATÄ°STÄ°KLER */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-6">
        <div className="bg-dark-800 rounded-xl p-4 border border-dark-700">
          <div className="text-text-muted text-sm mb-1">Toplam Ä°lan</div>
          <div className="text-2xl font-bold text-white">{listings.length}</div>
        </div>
        <div className="bg-dark-800 rounded-xl p-4 border border-dark-700">
          <div className="text-text-muted text-sm mb-1">Puan</div>
          {rating.reviewCount > 0 ? (
            <div className="text-2xl font-bold text-white flex items-center gap-1">
              <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
              {rating.avgRating}
              <span className="text-sm text-text-muted font-normal">({rating.reviewCount})</span>
            </div>
          ) : (
            <div className="text-base font-bold text-text-muted">HenÃ¼z yorum yok</div>
          )}
        </div>
        <div className="bg-dark-800 rounded-xl p-4 border border-dark-700 col-span-2 md:col-span-1">
          <div className="text-text-muted text-sm mb-1">Ãœyelik</div>
          <div className="text-xl font-bold text-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            {joinDate}
          </div>
        </div>
      </div>

      {/* SATICININ Ä°LANLARI */}
      <div className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Package className="w-5 h-5 text-primary" />
            {user.username}'Ä±n Ä°lanlarÄ±
          </h2>
          <span className="text-text-muted text-sm">{listings.length} ilan</span>
        </div>

        {listings.length === 0 ? (
          <div className="bg-dark-800 rounded-xl border border-dark-700 p-12 text-center">
            <Package className="w-12 h-12 text-text-muted mx-auto mb-4" />
            <p className="text-text-muted">Bu satÄ±cÄ±nÄ±n aktif ilanÄ± yok.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {listings.map(listing => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}