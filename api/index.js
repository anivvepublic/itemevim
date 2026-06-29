import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';

const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.get('/api/categories', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('listing_count', { ascending: false });
    res.json(data || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/categories/popular', async (req, res) => {
  try {
    const { limit = 8 } = req.query;
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('listing_count', { ascending: false })
      .limit(parseInt(limit));
    res.json(data || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/categories/all', async (req, res) => {
  try {
    const { data } = await supabase
      .from('categories')
      .select('*')
      .order('listing_count', { ascending: false });
    res.json(data || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/listings/search', async (req, res) => {
  try {
    const { q, limit = 50 } = req.query;
    if (!q) return res.json([]);
    const { data } = await supabase
      .from('listings')
      .select('*, seller:seller_id (username, avatar, rating, verified)')
      .or(`title.ilike.%${q}%,description.ilike.%${q}%`)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(parseInt(limit));
    res.json(data || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/listings/featured', async (req, res) => {
  try {
    const { data } = await supabase
      .from('listings')
      .select('*, seller:seller_id (username, avatar, rating, verified)')
      .eq('is_featured', true)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(8);
    res.json(data || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/listings/latest', async (req, res) => {
  try {
    const { limit = 12 } = req.query;
    const { data } = await supabase
      .from('listings')
      .select('*, seller:seller_id (username, avatar, rating, verified)')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(parseInt(limit));
    res.json(data || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/listings', async (req, res) => {
  try {
    const { category, seller_id, limit = 20, page = 1 } = req.query;
    let query = supabase
      .from('listings')
      .select('*, seller:seller_id (username, avatar, rating, verified)', { count: 'exact' })
      .eq('status', 'active')
      .order('created_at', { ascending: false });
    if (category) query = query.eq('category_slug', category);
    if (seller_id) query = query.eq('seller_id', seller_id);
    const from = (page - 1) * limit;
    query = query.range(from, from + limit - 1);
    const { data, error, count } = await query;
    res.json({ data: data || [], total: count, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/listings/:id', async (req, res) => {
  try {
    const { data: listing, error } = await supabase
      .from('listings')
      .select('*, seller:seller_id (username, avatar, rating, verified)')
      .eq('id', req.params.id)
      .single();
    if (error || !listing) return res.status(404).json({ error: 'İlan bulunamadı' });
    const { data: images } = await supabase
      .from('listing_images')
      .select('*')
      .eq('listing_id', req.params.id)
      .order('display_order', { ascending: true });
    const allImages = [
      { id: 'main', image_url: listing.image, display_order: 0, is_main: true },
      ...(images || []).map(img => ({ ...img, is_main: false }))
    ];
    res.json({ ...listing, images: allImages });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/listings/:id/view', async (req, res) => {
  try {
    const { data: current } = await supabase.from('listings').select('views').eq('id', req.params.id).single();
    await supabase.from('listings').update({ views: (current?.views || 0) + 1 }).eq('id', req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/listings/:id/report', async (req, res) => {
  try {
    const { reason, description } = req.body;
    await supabase.from('listing_reports').insert([{ listing_id: req.params.id, reason, description: description || '', status: 'pending' }]);
    res.json({ success: true, message: 'Raporunuz alındı' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/listings/:id/reviews', async (req, res) => {
  try {
    const { data } = await supabase
      .from('reviews')
      .select('*, reviewer:reviewer_id (username, avatar)')
      .eq('listing_id', req.params.id)
      .order('created_at', { ascending: false });
    res.json(data || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/listings/:id/similar', async (req, res) => {
  try {
    const { data: currentListing } = await supabase.from('listings').select('category_slug').eq('id', req.params.id).single();
    if (!currentListing) return res.json([]);
    const { data } = await supabase
      .from('listings')
      .select('*, seller:seller_id (username, avatar, rating, verified)')
      .eq('category_slug', currentListing.category_slug)
      .eq('status', 'active')
      .neq('id', req.params.id)
      .limit(4);
    res.json(data || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/users/:id/listings', async (req, res) => {
  try {
    const { exclude_id, limit = 4 } = req.query;
    let query = supabase
      .from('listings')
      .select('*, seller:seller_id (username, avatar, rating, verified)')
      .eq('seller_id', req.params.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(parseInt(limit));
    if (exclude_id) query = query.neq('id', exclude_id);
    const { data } = await query;
    res.json(data || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/listings', async (req, res) => {
  try {
    const { title, description, price, category_slug, seller_id, image, images, is_featured, delivery_time, guarantee_days, details, tags } = req.body;
    if (!title || !price || !category_slug || !seller_id) return res.status(400).json({ error: 'Eksik alanlar var' });
    const { data: listing, error } = await supabase
      .from('listings')
      .insert([{
        title, description: description || '', price: parseFloat(price), category_slug, seller_id,
        image: image || 'https://via.placeholder.com/600x400/1a1d2d/7c3aed?text=Oyun+Gorseli',
        is_featured: is_featured || false, delivery_time: delivery_time || '24 saat',
        guarantee_days: guarantee_days || 0, details: details || {}, tags: tags || [], status: 'active'
      }])
      .select()
      .single();
    if (error) throw error;
    if (images && images.length > 1) {
      const additionalImages = images.slice(1).map((url, index) => ({ listing_id: listing.id, image_url: url, display_order: index + 1 }));
      await supabase.from('listing_images').insert(additionalImages);
    }
    res.json(listing);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/listings/:id', async (req, res) => {
  try {
    const { title, description, price, category_slug, image, is_featured, delivery_time, guarantee_days, details, tags } = req.body;
    const { data } = await supabase
      .from('listings')
      .update({
        title, description: description || '', price: parseFloat(price), category_slug,
        image: image || undefined, is_featured: is_featured || false,
        delivery_time: delivery_time || '24 saat', guarantee_days: guarantee_days || 0,
        details: details || {}, tags: tags || [], updated_at: new Date().toISOString()
      })
      .eq('id', req.params.id)
      .select()
      .single();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/listings/:id', async (req, res) => {
  try {
    await supabase.from('listings').delete().eq('id', req.params.id);
    res.json({ success: true, message: 'İlan silindi' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/reviews', async (req, res) => {
  try {
    const { reviewer_id, seller_id, listing_id, rating, comment } = req.body;
    if (rating < 1 || rating > 5) return res.status(400).json({ error: 'Puan 1-5 arası olmalı' });
    const { data } = await supabase
      .from('reviews')
      .insert([{ reviewer_id, seller_id, listing_id, rating, comment: comment || '' }])
      .select()
      .single();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/users/:id/rating', async (req, res) => {
  try {
    const { data: reviews } = await supabase.from('reviews').select('rating').eq('seller_id', req.params.id);
    const reviewCount = reviews?.length || 0;
    const avgRating = reviewCount > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount : 0;
    res.json({ reviewCount, avgRating: Math.round(avgRating * 10) / 10, rating: reviewCount > 0 ? avgRating.toFixed(1) : null });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/users/:id/balance', async (req, res) => {
  try {
    const { data } = await supabase.from('users').select('balance').eq('id', req.params.id).single();
    res.json({ balance: data?.balance || 0 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/users/:id/profile', async (req, res) => {
  try {
    const { data } = await supabase
      .from('users')
      .select('id, username, avatar, avatar_url, bio, rating, verified, balance, created_at')
      .eq('id', req.params.id)
      .single();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/users/:id/last-seen', async (req, res) => {
  try {
    await supabase.from('users').update({ last_seen: new Date().toISOString() }).eq('id', req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/users/:id/info', async (req, res) => {
  try {
    const { data } = await supabase
      .from('users')
      .select('id, username, avatar, avatar_url, last_seen')
      .eq('id', req.params.id)
      .single();
    if (!data) return res.status(404).json({ error: 'Kullanıcı bulunamadı' });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/users/username/:username', async (req, res) => {
  try {
    const { data: user } = await supabase
      .from('users')
      .select('id, username, avatar, avatar_url, bio, profile_settings, verified, created_at')
      .eq('username', req.params.username)
      .single();
    if (!user) return res.status(404).json({ error: 'Kullanıcı bulunamadı' });
    const { data: listings } = await supabase
      .from('listings')
      .select('*, seller:seller_id (username, avatar, rating, verified)')
      .eq('seller_id', user.id)
      .eq('status', 'active')
      .limit(12);
    const { data: reviews } = await supabase.from('reviews').select('rating').eq('seller_id', user.id);
    const reviewCount = reviews?.length || 0;
    const avgRating = reviewCount > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount : 0;
    res.json({ user, listings: listings || [], rating: { reviewCount, avgRating: Math.round(avgRating * 10) / 10 } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/users/:id/profile', async (req, res) => {
  try {
    const { bio, avatar_url, profile_settings } = req.body;
    const updateData = { updated_at: new Date().toISOString() };
    if (bio !== undefined) updateData.bio = bio;
    if (avatar_url !== undefined) updateData.avatar_url = avatar_url;
    if (profile_settings !== undefined) updateData.profile_settings = profile_settings;
    const { data } = await supabase.from('users').update(updateData).eq('id', req.params.id).select().single();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/balance/deposit', async (req, res) => {
  try {
    const { user_id, amount } = req.body;
    if (!user_id || !amount || amount <= 0) return res.status(400).json({ error: 'Geçerli tutar girin' });
    await supabase.rpc('add_balance', { user_id, amount });
    await supabase.from('balance_history').insert([{ user_id, amount, type: 'deposit', description: 'Bakiye yükleme' }]);
    const { data } = await supabase.from('users').select('balance').eq('id', user_id).single();
    res.json({ success: true, balance: data?.balance || 0 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/orders', async (req, res) => {
  try {
    const { buyer_id, listing_id, delivery_email } = req.body;
    const { data: listing } = await supabase.from('listings').select('id, price, seller_id, status, title').eq('id', listing_id).single();
    if (!listing) return res.status(404).json({ error: 'İlan bulunamadı' });
    if (listing.status !== 'active') return res.status(400).json({ error: 'Bu ilan artık aktif değil' });
    if (listing.seller_id === buyer_id) return res.status(400).json({ error: 'Kendi ilanınızı satın alamazsınız' });
    const { data: orderId, error } = await supabase.rpc('create_order', {
      p_buyer_id: buyer_id, p_seller_id: listing.seller_id, p_listing_id: listing_id, p_amount: listing.price
    });
    if (error) throw error;
    if (delivery_email) await supabase.from('orders').update({ delivery_email }).eq('id', orderId);
    res.json({ success: true, orderId, message: 'Satın alma başarılı!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/orders/buyer/:userId', async (req, res) => {
  try {
    const { data } = await supabase
      .from('orders')
      .select('*, listing:listing_id (id, title, image, category_slug), seller:seller_id (username, avatar)')
      .eq('buyer_id', req.params.userId)
      .order('created_at', { ascending: false });
    res.json(data || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/orders/seller/:userId', async (req, res) => {
  try {
    const { data } = await supabase
      .from('orders')
      .select('*, listing:listing_id (id, title, image, category_slug), buyer:buyer_id (username, avatar)')
      .eq('seller_id', req.params.userId)
      .order('created_at', { ascending: false });
    res.json(data || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/messages', async (req, res) => {
  try {
    const { sender_id, receiver_id, listing_id, content } = req.body;
    if (!sender_id || !receiver_id || !content) return res.status(400).json({ error: 'Eksik alanlar var' });
    const { data } = await supabase
      .from('messages')
      .insert([{ sender_id, receiver_id, listing_id: listing_id || null, content }])
      .select()
      .single();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/messages/conversations/:userId', async (req, res) => {
  try {
    const { data: allMessages } = await supabase
      .from('messages')
      .select('*, sender:sender_id (id, username, avatar), receiver:receiver_id (id, username, avatar), listing:listing_id (id, title, image)')
      .or(`sender_id.eq.${req.params.userId},receiver_id.eq.${req.params.userId}`)
      .order('created_at', { ascending: false });
    const conversationsMap = new Map();
    (allMessages || []).forEach(msg => {
      const otherUserId = msg.sender_id === req.params.userId ? msg.receiver_id : msg.sender_id;
      const otherUser = msg.sender_id === req.params.userId ? msg.receiver : msg.sender;
      if (!conversationsMap.has(otherUserId)) {
        conversationsMap.set(otherUserId, {
          user: otherUser, lastMessage: msg.content, lastMessageTime: msg.created_at,
          listing: msg.listing, unreadCount: 0
        });
      }
      if (msg.receiver_id === req.params.userId && !msg.is_read) conversationsMap.get(otherUserId).unreadCount++;
    });
    res.json(Array.from(conversationsMap.values()));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/messages/:user1/:user2', async (req, res) => {
  try {
    const { user1, user2 } = req.params;
    const { data } = await supabase
      .from('messages')
      .select('*, sender:sender_id (id, username, avatar), receiver:receiver_id (id, username, avatar)')
      .or(`and(sender_id.eq.${user1},receiver_id.eq.${user2}),and(sender_id.eq.${user2},receiver_id.eq.${user1})`)
      .order('created_at', { ascending: true });
    await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('receiver_id', user1)
      .eq('sender_id', user2)
      .eq('is_read', false);
    res.json(data || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/notifications/:userId', async (req, res) => {
  try {
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', req.params.userId)
      .order('created_at', { ascending: false })
      .limit(20);
    const unreadCount = data?.filter(n => !n.is_read).length || 0;
    res.json({ notifications: data || [], unreadCount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/notifications/:id/read', async (req, res) => {
  try {
    await supabase.from('notifications').update({ is_read: true }).eq('id', req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/notifications/:userId/read-all', async (req, res) => {
  try {
    await supabase.from('notifications').update({ is_read: true }).eq('user_id', req.params.userId).eq('is_read', false);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/stats', async (req, res) => {
  try {
    const { count: totalListings } = await supabase.from('listings').select('*', { count: 'exact', head: true }).eq('status', 'active');
    const { count: totalUsers } = await supabase.from('users').select('*', { count: 'exact', head: true });
    const { count: totalOrders } = await supabase.from('orders').select('*', { count: 'exact', head: true });
    res.json({ totalListings: totalListings || 0, totalUsers: totalUsers || 0, totalOrders: totalOrders || 300000, trustRate: 100 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default app;