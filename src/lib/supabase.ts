import { createClient } from '@supabase/supabase-js';

const rawUrl = import.meta.env.VITE_SUPABASE_URL;
const rawKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const normalizeUrl = (url: string | undefined): string | null => {
  if (!url || url.trim() === '' || url.includes('placeholder') || url.includes('your-project')) return null;
  let target = url.trim();
  
  // Remove any trailing slashes or /rest/v1/ paths that users might copy
  target = target.replace(/\/+$/, '');
  target = target.replace(/\/rest\/v1\/?$/, '');
  
  if (!target.startsWith('http://') && !target.startsWith('https://')) {
    target = `https://${target}`;
  }
  try {
    const parsed = new URL(target);
    // Ensure it's just the origin
    return parsed.origin;
  } catch {
    return null;
  }
};

const normalizedUrl = normalizeUrl(rawUrl);

export const supabaseUrl = normalizedUrl || 'https://placeholder.supabase.co';
export const supabaseAnonKey = rawKey || 'placeholder';

export const isSupabaseConfigured = !!normalizedUrl && !!rawKey && rawKey !== 'placeholder' && !rawKey.includes('placeholder');

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
