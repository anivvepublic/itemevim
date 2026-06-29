import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Stats from './components/Stats';
import Categories from './components/Categories';
import FeaturedListings from './components/FeaturedListings';
import LatestListings from './components/LatestListings';
import HowItWorks from './components/HowItWorks';
import TrustBanner from './components/TrustBanner';
import Footer from './components/Footer';
import ScrollTopButton from './components/ScrollTopButton';
import { ToastProvider } from './context/ToastContext';
import { FavoritesProvider } from './context/FavoritesContext';
import { CartProvider } from './context/CartContext';
import ListingDetail from './pages/ListingDetail';
import CategoryPage from './pages/CategoryPage';
import SearchPage from './pages/SearchPage';
import CreateListing from './pages/CreateListing';
import EditListing from './pages/EditListing';
import LoginPage from './pages/LoginPage';
import ProfilePage from './pages/ProfilePage';
import FavoritesPage from './pages/FavoritesPage';
import AllCategoriesPage from './pages/AllCategoriesPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import OrdersPage from './pages/OrdersPage';
import NotFoundPage from './pages/NotFoundPage';
import PublicProfilePage from './pages/PublicProfilePage';
import MessagesPage from './pages/MessagesPage';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function HomePage() {
  const [featuredListings, setFeaturedListings] = useState([]);
  const [latestListings, setLatestListings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchListings = async () => {
      try {
        const featuredRes = await fetch('/api/listings/featured');
        const featuredData = await featuredRes.json();
        
        if (Array.isArray(featuredData)) {
          setFeaturedListings(featuredData);
        } else if (featuredData.data && Array.isArray(featuredData.data)) {
          setFeaturedListings(featuredData.data);
        }

        const latestRes = await fetch('/api/listings/latest?limit=12');
        const latestData = await latestRes.json();
        
        if (Array.isArray(latestData)) {
          setLatestListings(latestData);
        } else if (latestData.data && Array.isArray(latestData.data)) {
          setLatestListings(latestData.data);
        }
      } catch (err) {
        console.error('İlanlar yüklenemedi:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchListings();
  }, []);

  return (
    <>
      <Hero />
      <Stats />
      <Categories />
      
      {loading ? (
        <div className="text-center py-16">
          <div className="inline-block w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-text-muted mt-4 text-sm">İlanlar yükleniyor...</p>
        </div>
      ) : (
        <>
          {featuredListings.length > 0 && (
            <FeaturedListings listings={featuredListings} title="Vitrin İlanları" />
          )}
          <LatestListings listings={latestListings} />
        </>
      )}

      <TrustBanner />
      <HowItWorks />
    </>
  );
}

function App() {
  return (
    <ToastProvider>
      <FavoritesProvider>
        <CartProvider>
          <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <ScrollToTop />
            <div className="min-h-screen bg-dark-900 flex flex-col">
              <Navbar />
              
              <main className="flex-grow max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/listing/:id" element={<ListingDetail />} />
                  <Route path="/category/:slug" element={<CategoryPage />} />
                  <Route path="/categories" element={<AllCategoriesPage />} />
                  <Route path="/search" element={<SearchPage />} />
                  <Route path="/create-listing" element={<CreateListing />} />
                  <Route path="/edit-listing/:id" element={<EditListing />} />
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/profile" element={<ProfilePage />} />
                  <Route path="/favorites" element={<FavoritesPage />} />
                  <Route path="/cart" element={<CartPage />} />
                  <Route path="/checkout" element={<CheckoutPage />} />
                  <Route path="/orders" element={<OrdersPage />} />
                  <Route path="/messages" element={<MessagesPage />} />
                  <Route path="/404" element={<NotFoundPage />} />
                  <Route path="/u/:username" element={<PublicProfilePage />} />
                  <Route path="*" element={<NotFoundPage />} />
                </Routes>
              </main>

              <Footer />
              <ScrollTopButton />
            </div>
          </Router>
        </CartProvider>
      </FavoritesProvider>
    </ToastProvider>
  );
}

export default App;