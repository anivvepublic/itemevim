import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Package, ShoppingBag, CheckCircle, Clock, XCircle, Calendar } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function OrdersPage() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [activeTab, setActiveTab] = useState('purchases'); // purchases, sales
  const [purchases, setPurchases] = useState([]);
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);

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
          .select('id')
          .eq('username', session.user.email.split('@')[0])
          .limit(1);

        if (users && users.length > 0) {
          const userId = users[0].id;
          setCurrentUserId(userId);

          // Alışverişleri getir
          const purchasesRes = await fetch(`http://localhost:5000/api/orders/buyer/${userId}`);
          const purchasesData = await purchasesRes.json();
          setPurchases(Array.isArray(purchasesData) ? purchasesData : []);

          // Satışları getir
          const salesRes = await fetch(`http://localhost:5000/api/orders/seller/${userId}`);
          const salesData = await salesRes.json();
          setSales(Array.isArray(salesData) ? salesData : []);
        }
      } catch (err) {
        console.error('Orders load error:', err);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [navigate]);

  const getStatusBadge = (status) => {
    const badges = {
      pending: { label: 'Beklemede', color: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30', icon: <Clock className="w-3 h-3" /> },
      completed: { label: 'Tamamlandı', color: 'bg-green-500/10 text-green-400 border-green-500/30', icon: <CheckCircle className="w-3 h-3" /> },
      cancelled: { label: 'İptal', color: 'bg-red-500/10 text-red-400 border-red-500/30', icon: <XCircle className="w-3 h-3" /> },
      refunded: { label: 'İade', color: 'bg-blue-500/10 text-blue-400 border-blue-500/30', icon: <Clock className="w-3 h-3" /> },
      sold: { label: 'Satıldı', color: 'bg-primary/10 text-primary border-primary/30', icon: <CheckCircle className="w-3 h-3" /> }
    };
    
    const badge = badges[status] || badges.pending;
    
    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${badge.color}`}>
        {badge.icon}
        {badge.label}
      </span>
    );
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!currentUser) {
    return (
      <div className="text-center py-16">
        <div className="inline-block w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="text-text-muted mt-4">Yükleniyor...</p>
      </div>
    );
  }

  const orders = activeTab === 'purchases' ? purchases : sales;

  return (
    <div className="max-w-5xl mx-auto">
      <Link to="/" className="inline-flex items-center gap-2 text-text-muted hover:text-white mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Ana Sayfaya Dön
      </Link>

      <div className="bg-dark-800 rounded-2xl border border-dark-700 overflow-hidden">
        {/* Başlık */}
        <div className="p-6 border-b border-dark-700">
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Package className="w-6 h-6 text-primary" />
            Siparişlerim
          </h1>
          <p className="text-text-muted text-sm mt-1">
            Alışveriş ve satış geçmişinizi buradan takip edebilirsiniz
          </p>
        </div>

        {/* Sekmeler */}
        <div className="flex border-b border-dark-700">
          <button
            onClick={() => setActiveTab('purchases')}
            className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 font-medium transition-all ${
              activeTab === 'purchases'
                ? 'text-primary border-b-2 border-primary bg-primary/5'
                : 'text-text-muted hover:text-white'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            Alışverişlerim ({purchases.length})
          </button>
          <button
            onClick={() => setActiveTab('sales')}
            className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 font-medium transition-all ${
              activeTab === 'sales'
                ? 'text-primary border-b-2 border-primary bg-primary/5'
                : 'text-text-muted hover:text-white'
            }`}
          >
            <Package className="w-4 h-4" />
            Satışlarım ({sales.length})
          </button>
        </div>

        {/* İçerik */}
        <div className="p-6">
          {loading ? (
            <div className="text-center py-16">
              <div className="inline-block w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              <p className="text-text-muted mt-4">Yükleniyor...</p>
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-16">
              {activeTab === 'purchases' ? (
                <>
                  <ShoppingBag className="w-16 h-16 text-text-muted mx-auto mb-4 opacity-30" />
                  <h2 className="text-xl font-bold text-white mb-2">Henüz alışveriş yapmadınız</h2>
                  <p className="text-text-muted mb-6">Beğendiğiniz ilanları satın alın.</p>
                  <Link 
                    to="/"
                    className="inline-block bg-primary hover:bg-primaryHover text-white px-6 py-3 rounded-xl font-semibold transition-all"
                  >
                    İlanlara Göz At
                  </Link>
                </>
              ) : (
                <>
                  <Package className="w-16 h-16 text-text-muted mx-auto mb-4 opacity-30" />
                  <h2 className="text-xl font-bold text-white mb-2">Henüz satışınız yok</h2>
                  <p className="text-text-muted mb-6">İlan vererek satış yapmaya başlayın.</p>
                  <Link 
                    to="/create-listing"
                    className="inline-block bg-primary hover:bg-primaryHover text-white px-6 py-3 rounded-xl font-semibold transition-all"
                  >
                    İlk İlanını Ver
                  </Link>
                </>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map(order => (
                <div 
                  key={order.id}
                  className="bg-dark-900 rounded-xl border border-dark-700 p-5 hover:border-primary/30 transition-all"
                >
                  <div className="flex gap-4">
                    {/* Görsel */}
                    <Link to={`/listing/${order.listing?.id}`} className="flex-shrink-0">
                      <img 
                        src={order.listing?.image}
                        alt={order.listing?.title}
                        className="w-24 h-24 rounded-lg object-cover border border-dark-700 hover:border-primary/50 transition-colors"
                      />
                    </Link>

                    {/* Bilgiler */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <Link to={`/listing/${order.listing?.id}`} className="block">
                          <h3 className="text-white font-semibold hover:text-primary transition-colors line-clamp-2">
                            {order.listing?.title}
                          </h3>
                        </Link>
                        {getStatusBadge(order.status)}
                      </div>

                      <div className="flex items-center gap-4 text-text-muted text-sm mb-3">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {formatDate(order.created_at)}
                        </div>
                        {activeTab === 'purchases' ? (
                          <div>Satıcı: <span className="text-white">{order.seller?.username}</span></div>
                        ) : (
                          <div>Alıcı: <span className="text-white">{order.buyer?.username}</span></div>
                        )}
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-text-muted text-sm">
                          {order.listing?.category_slug?.toUpperCase()}
                        </span>
                        <span className="text-xl font-bold text-white">
                          ₺{parseFloat(order.amount).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}