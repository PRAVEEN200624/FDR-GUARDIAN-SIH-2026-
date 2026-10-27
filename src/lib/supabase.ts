import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl !== 'https://your-project.supabase.co' &&
  !supabaseUrl.includes('placeholder')
);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export function getBackendStatus(): {
  mode: 'SUPABASE' | 'OFFLINE_PERSISTENCE';
  description: string;
  isConfigured: boolean;
} {
  if (isSupabaseConfigured) {
    return {
      mode: 'SUPABASE',
      description: 'Connected to Supabase PostgreSQL backend',
      isConfigured: true,
    };
  }
  return {
    mode: 'OFFLINE_PERSISTENCE',
    description: 'Local Persistent Storage (Demo Mode — Fully Reactive & Persisted)',
    isConfigured: false,
  };
}
