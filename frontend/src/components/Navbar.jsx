import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, ShoppingCart, Bell, Mail, User, Plus, Menu, X, ChevronDown, LogOut, Settings, Package, Heart, Gamepad2, Smartphone, CheckCheck } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useToast } from '../context/ToastContext';
import { useFavorites } from '../context/FavoritesContext';
import { useCart } from '../context/CartContext';

export default function Navbar() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const { favorites } = useFavorites();
  const { cartCount } = useCart();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState({ notifications: [], unreadCount: 0 });

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        setCurrentUser(session.user);
        
        const { data: users } = await supabase
          .from('users')
          .select('id')
          .eq('username', session.user.email.split('@')[0])
          .limit(1);
        
        if (users && users.length > 0) {
          setCurrentUserId(users[0].id);
          loadNotifications(users[0].id);
        }
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setCurrentUser(session?.user || null);
      if (!session) {
        setNotifications({ notifications: [], unreadCount: 0 });
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadNotifications = async (userId) => {
    try {
      const res = await fetch(`http://localhost:5000/api/notifications/${userId}`);
      const data = await res.json();
      if (res.ok) setNotifications(data);
    } catch (err) {
      console.error('Notifications load error:', err);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setProfileOpen(false);
    addToast('Başarıyla çıkış yapıldı', 'success');
    navigate('/');
  };

  const markAllRead = async () => {
    if (!currentUserId) return;
    try {
      const res = await fetch(`http://localhost:5000/api/notifications/${currentUserId}/read-all`, {
        method: 'PUT'
      });
      if (res.ok) {
        setNotifications(prev => ({
          ...prev,
          notifications: prev.notifications.map(n => ({ ...n, is_read: true })),
          unreadCount: 0
        }));
        addToast('Tüm bildirimler okundu', 'success', 2000);
      }
    } catch (err) {
      console.error('Mark all read error:', err);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'success': return '✅';
      case 'order': return '📦';
      case 'message': return '💬';
      case 'warning': return '⚠️';
      default: return '';
    }
  };

  const username = currentUser?.email?.split('@')[0] || 'Kullanıcı';

  return (
    <nav className="bg-dark-900 border-b border-dark-700 sticky top-0 z-50 backdrop-blur-sm bg-dark-900/95">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 gap-4">
          
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 flex-shrink-0 group">
            <div className="w-9 h-9 bg-gradient-to-br from-primary to-purple-600 rounded-lg flex items-center justify-center shadow-lg shadow-primary/20 group-hover:shadow-primary/40 transition-shadow">
              <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
              </svg>
            </div>
            <span className="text-xl font-bold text-white tracking-tight hidden sm:block">
              item<span className="text-primary">evim</span>
            </span>
          </Link>

          {/* Arama */}
          <form onSubmit={handleSearch} className="flex-1 max-w-2xl hidden md:block">
            <div className="relative group">
              <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-text-muted w-4 h-4 group-focus-within:text-primary transition-colors" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Ürün, oyun veya kategori ara..."
                className="w-full bg-dark-800 text-white text-sm pl-10 pr-4 py-2.5 rounded-lg border border-dark-700 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all placeholder-text-muted"
              />
            </div>
          </form>

          {/* Sağ Taraf */}
          <div className="hidden md:flex items-center gap-3">
            <Link 
              to="/create-listing"
              className="bg-primary hover:bg-primaryHover text-white px-5 py-2.5 rounded-lg font-semibold text-sm flex items-center gap-2 transition-all hover:shadow-lg hover:shadow-primary/30"
            >
              <Plus className="w-4 h-4" />
              İlan Ver
            </Link>
            
            <div className="flex items-center gap-1 text-text-muted ml-2">
              {/* Sepet */}
              <Link 
                to="/cart"
                className="p-2 hover:text-white hover:bg-dark-800 rounded-lg transition-colors relative"
              >
                <ShoppingCart className="w-5 h-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-primary text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                    {cartCount > 9 ? '9+' : cartCount}
                  </span>
                )}
              </Link>

              {/* Bildirimler */}
              {currentUser && (
                <div className="relative">
                  <button 
                    onClick={() => setNotificationsOpen(!notificationsOpen)}
                    className="p-2 hover:text-white hover:bg-dark-800 rounded-lg transition-colors relative"
                  >
                    <Bell className="w-5 h-5" />
                    {notifications.unreadCount > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center animate-pulse">
                        {notifications.unreadCount > 9 ? '9+' : notifications.unreadCount}
                      </span>
                    )}
                  </button>

                  {notificationsOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setNotificationsOpen(false)} />
                      <div className="absolute right-0 mt-2 w-80 bg-dark-800 rounded-xl border border-dark-700 shadow-2xl overflow-hidden z-50">
                        <div className="p-3 border-b border-dark-700 flex items-center justify-between">
                          <h3 className="text-white font-semibold text-sm">Bildirimler</h3>
                          {notifications.unreadCount > 0 && (
                            <button
                              onClick={markAllRead}
                              className="text-primary hover:text-primaryHover text-xs font-medium flex items-center gap-1"
                            >
                              <CheckCheck className="w-3 h-3" />
                              Tümünü Oku
                            </button>
                          )}
                        </div>

                        <div className="max-h-96 overflow-auto">
                          {notifications.notifications.length === 0 ? (
                            <div className="p-8 text-center">
                              <Bell className="w-10 h-10 text-text-muted mx-auto mb-2 opacity-30" />
                              <p className="text-text-muted text-sm">Henüz bildirim yok</p>
                            </div>
                          ) : (
                            notifications.notifications.map(notif => (
                              <div
                                key={notif.id}
                                className={`p-3 border-b border-dark-700 last:border-b-0 hover:bg-dark-700 transition-colors ${
                                  !notif.is_read ? 'bg-primary/5' : ''
                                }`}
                              >
                                <div className="flex items-start gap-2">
                                  <span className="text-lg flex-shrink-0">{getNotificationIcon(notif.type)}</span>
                                  <div className="flex-1 min-w-0">
                                    <div className="text-white text-sm font-medium">{notif.title}</div>
                                    <div className="text-text-muted text-xs mt-0.5 line-clamp-2">{notif.message}</div>
                                    <div className="text-text-muted text-[10px] mt-1">
                                      {new Date(notif.created_at).toLocaleDateString('tr-TR', {
                                        day: 'numeric',
                                        month: 'short',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                      })}
                                    </div>
                                  </div>
                                  {!notif.is_read && (
                                    <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-1"></div>
                                  )}
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}

              <Link to="/messages" className="p-2 hover:text-white hover:bg-dark-800 rounded-lg transition-colors relative">
  <Mail className="w-5 h-5" />
</Link>
                
              

              {/* Profil Dropdown */}
              {currentUser ? (
                <div className="relative ml-2">
                  <button
                    onClick={() => setProfileOpen(!profileOpen)}
                    className="flex items-center gap-2 hover:bg-dark-800 rounded-lg px-3 py-1.5 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center">
                      <User className="w-4 h-4 text-white" />
                    </div>
                    <div className="text-left hidden lg:block">
                      <div className="text-white text-xs font-medium">{username}</div>
                      <div className="text-text-muted text-[10px]">Hesabım</div>
                    </div>
                    <ChevronDown className={`w-3 h-3 text-text-muted transition-transform ${profileOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {profileOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setProfileOpen(false)} />
                      <div className="absolute right-0 mt-2 w-56 bg-dark-800 rounded-xl border border-dark-700 shadow-2xl overflow-hidden z-50">
                        <div className="p-3 border-b border-dark-700">
                          <div className="text-white text-sm font-medium">{username}</div>
                          <div className="text-text-muted text-xs truncate">{currentUser.email}</div>
                        </div>
                        
                        <div className="py-1">
                          <Link to="/profile" onClick={() => setProfileOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-text-muted hover:text-white hover:bg-dark-700 transition-colors">
                            <User className="w-4 h-4" />
                            Profilim
                          </Link>
                          <Link to="/profile?tab=listings" onClick={() => setProfileOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-text-muted hover:text-white hover:bg-dark-700 transition-colors">
                            <Package className="w-4 h-4" />
                            İlanlarım
                          </Link>
                          <Link to="/orders" onClick={() => setProfileOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-text-muted hover:text-white hover:bg-dark-700 transition-colors">
                            <ShoppingCart className="w-4 h-4" />
                            Siparişlerim
                          </Link>
                          <Link to="/favorites" onClick={() => setProfileOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-text-muted hover:text-white hover:bg-dark-700 transition-colors">
                            <Heart className="w-4 h-4" />
                            Favorilerim
                            {favorites.length > 0 && (
                              <span className="ml-auto bg-primary text-white text-xs px-2 py-0.5 rounded-full">
                                {favorites.length}
                              </span>
                            )}
                          </Link>
                          <Link to="/profile?tab=settings" onClick={() => setProfileOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-text-muted hover:text-white hover:bg-dark-700 transition-colors">
                            <Settings className="w-4 h-4" />
                            Ayarlar
                          </Link>
                        </div>

                        <div className="border-t border-dark-700 py-1">
                          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors">
                            <LogOut className="w-4 h-4" />
                            Çıkış Yap
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <Link to="/login" className="ml-2 flex items-center gap-2 hover:bg-dark-800 rounded-lg px-3 py-1.5 transition-colors">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center">
                    <User className="w-4 h-4 text-white" />
                  </div>
                  <div className="text-left hidden lg:block">
                    <div className="text-white text-xs font-medium">Hesabım</div>
                    <div className="text-text-muted text-[10px]">Giriş Yap / Kayıt Ol</div>
                  </div>
                </Link>
              )}
            </div>
          </div>

          {/* Mobil Menü */}
          <button 
            className="md:hidden text-white p-2 hover:bg-dark-800 rounded-lg transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobil Arama */}
        <form onSubmit={handleSearch} className="md:hidden pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-muted w-4 h-4" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Ara..."
              className="w-full bg-dark-800 text-white text-sm pl-10 pr-4 py-2.5 rounded-lg border border-dark-700 focus:outline-none focus:border-primary"
            />
          </div>
        </form>
      </div>

      {/* Mobil Menü */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-dark-800 border-t border-dark-700 px-4 py-4 space-y-3">
          {currentUser ? (
            <>
              <div className="flex items-center gap-3 p-3 bg-dark-900 rounded-lg">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center">
                  <User className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="text-white text-sm font-medium">{username}</div>
                  <div className="text-text-muted text-xs truncate">{currentUser.email}</div>
                </div>
              </div>
              <Link to="/profile" onClick={() => setMobileMenuOpen(false)} className="block text-white py-2">Profilim</Link>
              <Link to="/orders" onClick={() => setMobileMenuOpen(false)} className="block text-white py-2">Siparişlerim</Link>
              <Link to="/favorites" onClick={() => setMobileMenuOpen(false)} className="block text-white py-2">Favorilerim</Link>
              <Link to="/cart" onClick={() => setMobileMenuOpen(false)} className="block text-white py-2">
                Sepetim {cartCount > 0 && `(${cartCount})`}
              </Link>
              <Link to="/create-listing" onClick={() => setMobileMenuOpen(false)} className="block text-white py-2">İlan Ver</Link>
              <button onClick={handleLogout} className="w-full text-left text-red-400 py-2">Çıkış Yap</button>
            </>
          ) : (
            <>
              <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="block bg-primary text-white text-center py-3 rounded-lg font-semibold">Giriş Yap / Kayıt Ol</Link>
              <Link to="/create-listing" onClick={() => setMobileMenuOpen(false)} className="block text-white text-center py-2">İlan Ver</Link>
            </>
          )}
        </div>
      )}

      {/* Alt Menü */}
      <div className="border-t border-dark-700 bg-dark-900/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 h-11 text-sm overflow-x-auto scrollbar-hide">
            <Link to="/categories?group=game" className="flex items-center gap-2 text-white font-semibold hover:text-primary transition-colors whitespace-nowrap px-4 py-1.5 rounded-md hover:bg-dark-800">
              <Gamepad2 className="w-4 h-4" />
              Oyunlar
            </Link>
            <div className="w-px h-5 bg-dark-700"></div>
            <Link to="/categories?group=social" className="flex items-center gap-2 text-white font-semibold hover:text-pink-400 transition-colors whitespace-nowrap px-4 py-1.5 rounded-md hover:bg-dark-800">
              <Smartphone className="w-4 h-4" />
              Sosyal Medya
            </Link>
            <div className="w-px h-5 bg-dark-700"></div>
            <Link to="/category/valorant" className="text-text-muted hover:text-white transition-colors whitespace-nowrap px-3 py-1.5 rounded-md hover:bg-dark-800">Valorant</Link>
            <Link to="/category/instagram" className="text-text-muted hover:text-white transition-colors whitespace-nowrap px-3 py-1.5 rounded-md hover:bg-dark-800">Instagram</Link>
            <Link to="/category/cs2" className="text-text-muted hover:text-white transition-colors whitespace-nowrap px-3 py-1.5 rounded-md hover:bg-dark-800">CS2</Link>
            <Link to="/category/tiktok" className="text-text-muted hover:text-white transition-colors whitespace-nowrap px-3 py-1.5 rounded-md hover:bg-dark-800">TikTok</Link>
            <Link to="/category/pubg" className="text-text-muted hover:text-white transition-colors whitespace-nowrap px-3 py-1.5 rounded-md hover:bg-dark-800">PUBG</Link>
            <Link to="/category/youtube" className="text-text-muted hover:text-white transition-colors whitespace-nowrap px-3 py-1.5 rounded-md hover:bg-dark-800">YouTube</Link>
            <Link to="/categories" className="ml-auto text-primary hover:text-primaryHover transition-colors whitespace-nowrap px-3 py-1.5 rounded-md hover:bg-dark-800 font-medium">
              Tüm Kategoriler →
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}