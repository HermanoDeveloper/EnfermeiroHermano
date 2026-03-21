import { createClient } from '@supabase/supabase-js';

const rawUrl = import.meta.env.VITE_SUPABASE_URL;
const rawKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const normalizeUrl = (url: string | undefined): string | null => {
  if (!url) return null;
  let target = url.trim();
  if (!target.startsWith('http://') && !target.startsWith('https://')) {
    target = `https://${target}`;
  }
  try {
    const parsed = new URL(target);
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      return target;
    }
  } catch {
    return null;
  }
  return null;
};

const normalizedUrl = normalizeUrl(rawUrl);
const supabaseUrl = normalizedUrl || 'https://placeholder.supabase.co';
const supabaseAnonKey = rawKey || 'placeholder';

if (!normalizedUrl) {
  console.warn('Supabase URL is missing or invalid. Please configure it in Settings > Environment Variables.');
}
if (!rawKey) {
  console.warn('Supabase Anon Key is missing. Please configure it in Settings > Environment Variables.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
