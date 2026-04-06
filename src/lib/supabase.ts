import { createClient } from '@supabase/supabase-js';

const getEnvVar = (key: string, fallback: string | undefined = undefined) => {
  if (typeof window !== 'undefined' && (window as any).__RUNTIME_ENV__) {
    const env = (window as any).__RUNTIME_ENV__;
    if (env[key]) return env[key];
  }
  return import.meta.env[key] || fallback;
};

const rawUrl = getEnvVar('VITE_SUPABASE_URL');
const rawKey = getEnvVar('VITE_SUPABASE_ANON_KEY');

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
