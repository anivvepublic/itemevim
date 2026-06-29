import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, User, Mail, Star, Package, LogOut, Settings, 
  Trash2, Edit3, CheckCircle, Paintbrush, X, Upload, 
  Type, Sparkles
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useToast } from '../context/ToastContext';

// Ä°SÄ°M RENKLERÄ°
const NAME_COLORS = [
  { id: 'white', value: '#ffffff', label: 'Beyaz' },
  { id: 'red', value: '#ef4444', label: 'KÄ±rmÄ±zÄ±' },
  { id: 'orange', value: '#f97316', label: 'Turuncu' },
  { id: 'yellow', value: '#eab308', label: 'SarÄ±' },
  { id: 'green', value: '#22c55e', label: 'YeÅŸil' },
  { id: 'cyan', value: '#06b6d4', label: 'Cyan' },
  { id: 'blue', value: '#3b82f6', label: 'Mavi' },
  { id: 'purple', value: '#a855f7', label: 'Mor' },
  { id: 'pink', value: '#ec4899', label: 'Pembe' }
];

// Ä°SÄ°M RENDERER
function StyledName({ name, color, size = 'text-3xl' }) {
  return (
    <span className={`${size} font-bold`} style={{ color: color || '#ffffff' }}>
      {name}
    </span>
  );
}

export default function ProfilePage() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  
  const [currentUser, setCurrentUser] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [userData, setUserData] = useState(null);
  const [userListings, setUserListings] = useState([]);
  const [sellerRating, setSellerRating] = useState(null);
  const [userBalance, setUserBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('listings');
  
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editTab, setEditTab] = useState('name');
  
  const [tempSettings, setTempSettings] = useState({
    nameColor: '#ffffff',
    avatarUrl: '',
    bio: ''
  });
  
  const avatarInputRef = useRef(null);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate('/login');
        return;
      }

      setCurrentUser(session.user);

      try {
        const { data: users } = await supabase
          .from('users')
          .select('id, username, verified, balance, avatar, avatar_url, bio, profile_settings')
          .eq('username', session.user.email.split('@')[0])
          .limit(1);

        if (users && users.length > 0) {
          const user = users[0];
          setCurrentUserId(user.id);
          setUserData(user);
          setUserBalance(user.balance || 0);
          
          // Profil ayarlarÄ±nÄ± gÃ¼venli ÅŸekilde yÃ¼kle
          let settings = {};
          try {
            if (typeof user.profile_settings === 'string') {
              settings = JSON.parse(user.profile_settings);
            } else if (typeof user.profile_settings === 'object') {
              settings = user.profile_settings;
            }
          } catch (e) {
            console.error('Settings parse error:', e);
          }

          setTempSettings({
            nameColor: settings.nameColor || '#ffffff',
            avatarUrl: user.avatar_url || '',
            bio: user.bio || ''
          });

          const res = await fetch(`/api/listings?seller_id=${user.id}&limit=50`);
          const data = await res.json();
          
          if (data.data && Array.isArray(data.data)) {
            setUserListings(data.data);
          } else if (Array.isArray(data)) {
            setUserListings(data);
          }

          const ratingRes = await fetch(`/api/users/${user.id}/rating`);
          const ratingData = await ratingRes.json();
          setSellerRating(ratingData);
        }
      } catch (err) {
        console.error('Profile load error:', err);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const handleDeleteListing = async (listingId) => {
    if (!window.confirm('Bu ilanÄ± silmek istediÄŸinize emin misiniz?')) return;

    try {
      const res = await fetch(`/api/listings/${listingId}`, {
        method: 'DELETE'
      });

      if (!res.ok) throw new Error('Silme baÅŸarÄ±sÄ±z');

      setUserListings(prev => prev.filter(l => l.id !== listingId));
      addToast('Ä°lan silindi', 'success');
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (file.size > 2 * 1024 * 1024) {
      addToast('Avatar 2MB\'dan kÃ¼Ã§Ã¼k olmalÄ±', 'error');
      return;
    }

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `avatar-${currentUserId}-${Date.now()}.${fileExt}`;
      
      const { error } = await supabase.storage
        .from('listing-images')
        .upload(fileName, file, { cacheControl: '3600', upsert: true });

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('listing-images')
        .getPublicUrl(fileName);

      setTempSettings(prev => ({ ...prev, avatarUrl: publicUrl }));
      addToast('Avatar yÃ¼klendi', 'success', 2000);
    } catch (err) {
      addToast('Avatar yÃ¼kleme hatasÄ±: ' + err.message, 'error');
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/users/${currentUserId}/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bio: tempSettings.bio,
          avatar_url: tempSettings.avatarUrl,
          profile_settings: {
            nameColor: tempSettings.nameColor
          }
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Kaydetme baÅŸarÄ±sÄ±z');

      setUserData(prev => ({
        ...prev,
        bio: tempSettings.bio,
        avatar_url: tempSettings.avatarUrl,
        profile_settings: {
          nameColor: tempSettings.nameColor
        }
      }));

      addToast('Profil gÃ¼ncellendi!', 'success');
      setEditing(false);
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  if (!currentUser || !userData) {
    return (
      <div className="text-center py-16">
        <div className="inline-block w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="text-text-muted mt-4">YÃ¼kleniyor...</p>
      </div>
    );
  }

  const username = userData.username || currentUser.email.split('@')[0];
  const isVerifiedSeller = userData.verified;

  const tabs = [
    { id: 'listings', label: 'Ä°lanlarÄ±m', icon: <Package className="w-4 h-4" /> },
    { id: 'settings', label: 'Ayarlar', icon: <Settings className="w-4 h-4" /> },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <Link to="/" className="inline-flex items-center gap-2 text-text-muted hover:text-white mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Ana Sayfaya DÃ¶n
      </Link>

      {/* PROFÄ°L KARTI */}
      <div className="relative rounded-2xl border border-dark-700 bg-dark-800 px-6 pb-6">
        {/* Avatar */}
        <div className="flex justify-center pt-8 pb-4">
          <div className="w-32 h-32 rounded-full overflow-hidden bg-dark-700 border-4 border-dark-600">
            {tempSettings.avatarUrl || userData.avatar_url || userData.avatar ? (
              <img 
                src={tempSettings.avatarUrl || userData.avatar_url || userData.avatar} 
                alt="Avatar" 
                className="w-full h-full object-cover" 
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <User className="w-12 h-12 text-text-muted" />
              </div>
            )}
          </div>
        </div>

        {/* Ä°sim */}
        <div className="text-center mt-4">
          <StyledName name={username} color={tempSettings.nameColor} size="text-3xl md:text-4xl" />
          
          {isVerifiedSeller && (
            <div className="flex items-center justify-center gap-1 text-primary text-sm mt-2">
              <CheckCircle className="w-4 h-4" />
              <span className="font-medium">OnaylÄ± SatÄ±cÄ±</span>
            </div>
          )}

          <div className="flex items-center justify-center gap-2 text-text-muted mt-2">
            <Mail className="w-4 h-4" />
            <span className="text-sm">{currentUser.email}</span>
          </div>
        </div>

        {/* Bio */}
        <div className="max-w-2xl mx-auto mt-4">
          {tempSettings.bio ? (
            <p className="text-center text-text-muted leading-relaxed whitespace-pre-wrap">
              {tempSettings.bio}
            </p>
          ) : (
            <p className="text-center text-text-muted/50 italic text-sm">HenÃ¼z bio eklenmemiÅŸ</p>
          )}
        </div>

        {/* Ã–zelleÅŸtir Butonu */}
        <div className="flex justify-center mt-6">
          <button
            onClick={() => setEditing(true)}
            className="bg-primary hover:bg-primaryHover text-white px-6 py-2.5 rounded-xl font-medium flex items-center gap-2 transition-all"
          >
            <Paintbrush className="w-4 h-4" />
            Profili Ã–zelleÅŸtir
          </button>
        </div>
      </div>

      {/* Ä°STATÄ°STÄ°KLER */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
        <div className="bg-dark-800 rounded-xl p-4 border border-dark-700">
          <div className="text-text-muted text-sm mb-1">Toplam Ä°lan</div>
          <div className="text-2xl font-bold text-white">{userListings.length}</div>
        </div>
        <div className="bg-dark-800 rounded-xl p-4 border border-dark-700">
          <div className="text-text-muted text-sm mb-1">Aktif Ä°lan</div>
          <div className="text-2xl font-bold text-white">
            {userListings.filter(l => l.status === 'active').length}
          </div>
        </div>
        <div className="bg-dark-800 rounded-xl p-4 border border-dark-700">
          <div className="text-text-muted text-sm mb-1">Puan</div>
          {sellerRating && sellerRating.reviewCount > 0 ? (
            <div className="text-2xl font-bold text-white flex items-center gap-1">
              <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
              {sellerRating.avgRating}
            </div>
          ) : (
            <div className="text-base font-bold text-text-muted">HenÃ¼z yok</div>
          )}
        </div>
        <div className="bg-dark-800 rounded-xl p-4 border border-dark-700">
          <div className="text-text-muted text-sm mb-1">Bakiye</div>
          <div className="text-2xl font-bold text-primary">â‚º{userBalance.toFixed(2)}</div>
        </div>
      </div>

      {/* SEKME Ä°Ã‡ERÄ°KLERÄ° */}
      <div className="flex gap-2 mt-6 border-b border-dark-700">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-5 py-3 font-medium transition-all ${
              activeTab === tab.id
                ? 'text-primary border-b-2 border-primary'
                : 'text-text-muted hover:text-white'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {activeTab === 'listings' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-white">Ä°lanlarÄ±m</h2>
              <Link 
                to="/create-listing"
                className="bg-primary hover:bg-primaryHover text-white px-4 py-2 rounded-lg text-sm font-medium transition-all"
              >
                + Yeni Ä°lan
              </Link>
            </div>

            {loading ? (
              <div className="text-center py-16">
                <div className="inline-block w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : userListings.length === 0 ? (
              <div className="bg-dark-800 rounded-xl border border-dark-700 p-12 text-center">
                <Package className="w-12 h-12 text-text-muted mx-auto mb-4" />
                <p className="text-text-muted mb-4">HenÃ¼z ilanÄ±nÄ±z yok.</p>
                <Link 
                  to="/create-listing"
                  className="inline-block bg-primary hover:bg-primaryHover text-white px-6 py-2.5 rounded-lg font-medium transition-all"
                >
                  Ä°lk Ä°lanÄ±nÄ± Ver
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {userListings.map(listing => (
                  <div 
                    key={listing.id}
                    className="bg-dark-800 rounded-xl border border-dark-700 p-4 flex items-center gap-4 hover:border-primary/30 transition-all"
                  >
                    <img 
                      src={listing.image}
                      alt={listing.title}
                      className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
                    />
                    
                    <div className="flex-1 min-w-0">
                      <Link to={`/listing/${listing.id}`} className="text-white font-semibold hover:text-primary transition-colors block truncate">
                        {listing.title}
                      </Link>
                      <p className="text-text-muted text-sm mt-1">
                        {listing.category_slug?.toUpperCase()} â€¢ â‚º{listing.price?.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                      </p>
                    </div>

                    <div className="flex gap-2 flex-shrink-0">
                      <Link
                        to={`/edit-listing/${listing.id}`}
                        className="bg-dark-700 hover:bg-primary/20 hover:text-primary text-white px-3 py-2 rounded-lg text-sm transition-all flex items-center gap-1"
                      >
                        <Edit3 className="w-4 h-4" />
                        DÃ¼zenle
                      </Link>
                      <button
                        onClick={() => handleDeleteListing(listing.id)}
                        className="bg-dark-700 hover:bg-red-500/20 hover:text-red-400 text-white px-3 py-2 rounded-lg text-sm transition-all flex items-center gap-1"
                      >
                        <Trash2 className="w-4 h-4" />
                        Sil
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="bg-dark-800 rounded-xl border border-dark-700 p-8">
            <h2 className="text-xl font-bold text-white mb-6">Hesap AyarlarÄ±</h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-white font-medium mb-2">KullanÄ±cÄ± AdÄ±</label>
                <input type="text" value={username} disabled className="w-full bg-dark-900 text-white px-4 py-3 rounded-xl border border-dark-700 opacity-60" />
              </div>

              <div>
                <label className="block text-white font-medium mb-2">E-posta</label>
                <input type="email" value={currentUser.email} disabled className="w-full bg-dark-900 text-white px-4 py-3 rounded-xl border border-dark-700 opacity-60" />
              </div>

              <div className="pt-4 border-t border-dark-700">
                <button onClick={handleLogout} className="bg-red-500/10 hover:bg-red-500/20 text-red-400 px-6 py-2.5 rounded-xl font-medium transition-all flex items-center gap-2">
                  <LogOut className="w-4 h-4" />
                  Ã‡Ä±kÄ±ÅŸ Yap
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Ã–ZELLEÅžTÄ°RME MODAL */}
      {editing && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setEditing(false)}>
          <div className="bg-dark-800 rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden border border-dark-700 shadow-2xl flex flex-col" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="p-4 border-b border-dark-700 flex items-center justify-between bg-dark-900">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center">
                  <Paintbrush className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Profili Ã–zelleÅŸtir</h2>
                  <p className="text-text-muted text-xs">Kendi tarzÄ±nÄ± oluÅŸtur</p>
                </div>
              </div>
              <button onClick={() => setEditing(false)} className="text-text-muted hover:text-white transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-2">
              {/* Sol: Ã–nizleme */}
              <div className="p-6 border-r border-dark-700 bg-dark-900 overflow-auto">
                <div className="text-text-muted text-xs uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Sparkles className="w-3 h-3" />
                  CanlÄ± Ã–nizleme
                </div>
                
                <div className="rounded-xl overflow-hidden border border-dark-700 shadow-xl bg-dark-800">
                  <div className="px-4 pb-4 pt-8">
                    <div className="flex justify-center">
                      <div className="w-20 h-20 rounded-full overflow-hidden bg-dark-700 border-4 border-dark-600">
                        {tempSettings.avatarUrl || userData.avatar_url || userData.avatar ? (
                          <img src={tempSettings.avatarUrl || userData.avatar_url || userData.avatar} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <User className="w-8 h-8 text-text-muted" />
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="text-center mt-2">
                      <StyledName name={username} color={tempSettings.nameColor} size="text-xl" />
                    </div>

                    {tempSettings.bio && (
                      <p className="text-text-muted text-xs text-center mt-2 line-clamp-2">{tempSettings.bio}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* SaÄŸ: Kontrol */}
              <div className="flex flex-col overflow-hidden">
                <div className="border-b border-dark-700 bg-dark-900 overflow-x-auto">
                  <div className="flex min-w-max">
                    {[
                      { id: 'name', icon: Type, label: 'Ä°sim Rengi' },
                      { id: 'avatar', icon: User, label: 'Avatar' },
                      { id: 'bio', icon: Edit3, label: 'Bio' }
                    ].map(tab => {
                      const Icon = tab.icon;
                      return (
                        <button
                          key={tab.id}
                          onClick={() => setEditTab(tab.id)}
                          className={`px-4 py-3 text-sm font-medium flex items-center gap-2 whitespace-nowrap transition-all border-b-2 ${
                            editTab === tab.id ? 'text-primary border-primary bg-primary/5' : 'text-text-muted border-transparent hover:text-white hover:bg-dark-800'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                          {tab.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex-1 overflow-auto p-6">
                  {editTab === 'name' && (
                    <div>
                      <h3 className="text-white font-semibold mb-3">Ä°sim Rengi</h3>
                      <div className="grid grid-cols-5 sm:grid-cols-9 gap-2">
                        {NAME_COLORS.map(color => (
                          <button
                            key={color.id}
                            onClick={() => setTempSettings(prev => ({ ...prev, nameColor: color.value }))}
                            className={`aspect-square rounded-lg border-2 transition-all hover:scale-110 ${
                              tempSettings.nameColor === color.value ? 'border-primary ring-2 ring-primary/30' : 'border-dark-700'
                            }`}
                            style={{ backgroundColor: color.value }}
                            title={color.label}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {editTab === 'avatar' && (
                    <div>
                      <h3 className="text-white font-semibold mb-3">Avatar YÃ¼kle</h3>
                      <button onClick={() => avatarInputRef.current?.click()} className="w-full h-32 rounded-xl border-2 border-dashed border-dark-700 hover:border-primary bg-dark-900 flex flex-col items-center justify-center gap-2 text-text-muted hover:text-primary transition-all">
                        <Upload className="w-8 h-8" />
                        <span className="text-sm font-medium">Avatar YÃ¼kle</span>
                        <span className="text-xs">PNG, JPG (Max 2MB)</span>
                      </button>
                      
                      {tempSettings.avatarUrl && (
                        <div className="mt-3 flex items-center gap-3 bg-dark-900 p-3 rounded-xl">
                          <img src={tempSettings.avatarUrl} alt="Avatar" className="w-16 h-16 rounded-full object-cover border-2 border-primary" />
                          <div className="flex-1">
                            <p className="text-white text-sm">Mevcut avatar</p>
                            <button onClick={() => setTempSettings(prev => ({ ...prev, avatarUrl: '' }))} className="text-red-400 text-xs hover:underline">KaldÄ±r</button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {editTab === 'bio' && (
                    <div>
                      <h3 className="text-white font-semibold mb-3">Bio</h3>
                      <textarea
                        value={tempSettings.bio}
                        onChange={(e) => setTempSettings(prev => ({ ...prev, bio: e.target.value }))}
                        placeholder="Kendini tanÄ±t..."
                        rows="6"
                        maxLength={300}
                        className="w-full bg-dark-900 text-white px-4 py-3 rounded-xl border border-dark-700 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all placeholder-text-muted resize-none"
                      />
                      <div className="text-text-muted text-xs mt-2 text-right">{tempSettings.bio.length}/300</div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-dark-700 bg-dark-900 flex items-center justify-between gap-3">
              <button onClick={() => setEditing(false)} className="px-6 py-2.5 bg-dark-700 hover:bg-dark-600 text-white rounded-xl font-medium transition-all">Ä°ptal</button>
              <button onClick={handleSaveProfile} disabled={saving} className="px-6 py-2.5 bg-primary hover:bg-primaryHover disabled:bg-dark-700 disabled:cursor-not-allowed text-white rounded-xl font-semibold transition-all flex items-center gap-2">
                {saving ? (
                  <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> Kaydediliyor...</>
                ) : (
                  <><CheckCircle className="w-4 h-4" /> Kaydet</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hidden inputs */}
      <input ref={avatarInputRef} type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
    </div>
  );
}