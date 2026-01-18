
import { createClient } from '@supabase/supabase-js';

// ADIM 4: Supabase panelinden aldığın URL ve ANON KEY'i buraya yapıştır.
const SUPABASE_URL = 'https://nhdyctkrxsaaxarimcrj.supabase.co'; 
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5oZHljdGtyeHNhYXhhcmltY3JqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg1NzY2NjEsImV4cCI6MjA4NDE1MjY2MX0.lmGKlsQEULWE3IG6Pob2XhO9Aya9sBdnpRgT_CEryf4';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true, // Oturumu tarayıcıda (localStorage) sakla
    autoRefreshToken: true, // Token süresi dolunca otomatik yenile
    detectSessionInUrl: true, // OAuth veya şifre sıfırlama linklerini algıla
    storage: window.localStorage, // Açıkça localStorage kullan
  },
});
