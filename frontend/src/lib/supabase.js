import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Debug log
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Supabase bilgileri eksik!');
  console.error('URL:', supabaseUrl);
  console.error('Key:', supabaseAnonKey ? 'Var' : 'YOK');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  },
  auth: {
    persistSession: true,
    autoRefreshToken: true
  }
});