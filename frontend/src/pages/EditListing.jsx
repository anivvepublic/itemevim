import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ArrowLeft, Save, Trash2 } from 'lucide-react';
import { useToast } from '../context/ToastContext';

export default function EditListing() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState([]);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    category_slug: '',
    image: '',
    is_featured: false
  });

  useEffect(() => {
    // Kategorileri yükle
    fetch('http://localhost:5000/api/categories')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setCategories(data);
      })
      .catch(() => {});

    // İlanı yükle
    fetch(`http://localhost:5000/api/listings/${id}`)
      .then(res => res.json())
      .then(data => {
        if (data && data.id) {
          setFormData({
            title: data.title || '',
            description: data.description || '',
            price: data.price || '',
            category_slug: data.category_slug || '',
            image: data.image || '',
            is_featured: data.is_featured || false
          });
        }
      })
      .catch(err => {
        console.error('İlan yüklenemedi:', err);
        addToast('İlan yüklenemedi', 'error');
      })
      .finally(() => setLoading(false));
  }, [id, addToast]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    
    if (!formData.title || !formData.price || !formData.category_slug) {
      addToast('Lütfen zorunlu alanları doldurun', 'warning');
      return;
    }

    setSaving(true);

    try {
      const res = await fetch(`http://localhost:5000/api/listings/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Güncelleme başarısız');

      addToast('İlan başarıyla güncellendi', 'success');
      setTimeout(() => navigate('/profile'), 1000);
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Bu ilanı silmek istediğinize emin misiniz?')) return;

    try {
      const res = await fetch(`http://localhost:5000/api/listings/${id}`, {
        method: 'DELETE'
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Silme başarısız');

      addToast('İlan silindi', 'success');
      setTimeout(() => navigate('/profile'), 1000);
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  if (loading) {
    return (
      <div className="text-center py-16">
        <div className="inline-block w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="text-text-muted mt-4">Yükleniyor...</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <Link to="/profile" className="inline-flex items-center gap-2 text-text-muted hover:text-white mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Profile Dön
      </Link>

      <div className="bg-dark-800 rounded-2xl p-8 border border-dark-700">
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">İlanı Düzenle</h1>
            <p className="text-text-muted">İlan bilgilerini güncelle</p>
          </div>
          <button
            onClick={handleDelete}
            className="bg-red-500/10 hover:bg-red-500/20 text-red-400 px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-all border border-red-500/30"
          >
            <Trash2 className="w-4 h-4" />
            İlanı Sil
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          {/* Başlık */}
          <div>
            <label className="block text-white font-medium mb-2">
              İlan Başlığı <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="w-full bg-dark-900 text-white px-4 py-3 rounded-xl border border-dark-700 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
              required
            />
          </div>

          {/* Açıklama */}
          <div>
            <label className="block text-white font-medium mb-2">Açıklama</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="4"
              className="w-full bg-dark-900 text-white px-4 py-3 rounded-xl border border-dark-700 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all resize-none"
            />
          </div>

          {/* Fiyat + Kategori */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-white font-medium mb-2">
                Fiyat (₺) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleChange}
                step="0.01"
                min="0"
                className="w-full bg-dark-900 text-white px-4 py-3 rounded-xl border border-dark-700 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                required
              />
            </div>

            <div>
              <label className="block text-white font-medium mb-2">
                Kategori <span className="text-red-500">*</span>
              </label>
              <select
                name="category_slug"
                value={formData.category_slug}
                onChange={handleChange}
                className="w-full bg-dark-900 text-white px-4 py-3 rounded-xl border border-dark-700 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                required
              >
                <option value="">Kategori Seçin</option>
                {categories.map(cat => (
                  <option key={cat.slug} value={cat.slug}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Görsel URL */}
          <div>
            <label className="block text-white font-medium mb-2">Görsel URL</label>
            <input
              type="url"
              name="image"
              value={formData.image}
              onChange={handleChange}
              placeholder="https://example.com/image.jpg"
              className="w-full bg-dark-900 text-white px-4 py-3 rounded-xl border border-dark-700 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>

          {/* Vitrin */}
          <div className="flex items-center gap-3 bg-dark-900 rounded-xl p-4 border border-dark-700">
            <input
              type="checkbox"
              name="is_featured"
              id="is_featured"
              checked={formData.is_featured}
              onChange={handleChange}
              className="w-5 h-5 rounded bg-dark-800 border-dark-700 text-primary focus:ring-primary"
            />
            <label htmlFor="is_featured" className="text-white cursor-pointer">
              <span className="font-medium">Vitrin ilanı olarak işaretle</span>
            </label>
          </div>

          {/* Butonlar */}
          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-primary hover:bg-primaryHover disabled:bg-dark-700 disabled:cursor-not-allowed text-white py-3.5 rounded-xl font-semibold transition-all hover:shadow-lg hover:shadow-primary/30 flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Kaydediliyor...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Değişiklikleri Kaydet
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}