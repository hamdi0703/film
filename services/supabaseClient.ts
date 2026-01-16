import { createClient } from '@supabase/supabase-js';

// Environment variables hardcoded for Vercel stability
const SUPABASE_URL = 'https://nhdyctkrxsaaxarimcrj.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5oZHljdGtyeHNhYXhhcmltY3JqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg1NzY2NjEsImV4cCI6MjA4NDE1MjY2MX0.lmGKlsQEULWE3IG6Pob2XhO9Aya9sBdnpRgT_CEryf4';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn('Supabase configuration missing.');
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);