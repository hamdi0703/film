import { createClient } from '@supabase/supabase-js';

// Environment variables from Vercel
const SUPABASE_URL = (import.meta as any).env.VITE_SUPABASE_URL || ''; 
const SUPABASE_ANON_KEY = (import.meta as any).env.VITE_SUPABASE_ANON_KEY || '';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn('Supabase URL or Anon Key is missing. Check your environment variables.');
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);