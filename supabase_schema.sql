-- ==========================================
-- TRIA APP - GÜVENLİK VE TABLO ONARIM SCRİPTİ
-- ==========================================

-- 1. SHARED LISTS TABLOSUNU GÜNCELLE
-- Eğer tablo yoksa oluşturur. Varsa eksik sütunları kontrol eder.
create table if not exists public.shared_lists (
  id text primary key,
  user_id uuid references auth.users not null,
  name text not null,
  movies jsonb not null, -- Oyuncular ve Yönetmenler bu JSON içinde saklanır
  top_favorite_movies jsonb default '[null, null, null, null, null]'::jsonb,
  top_favorite_shows jsonb default '[null, null, null, null, null]'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. GÜVENLİK POLİTİKALARINI (RLS) SIFIRLA VE YENİDEN KUR
-- Bu işlem, "Listeler gelmiyor" sorununun ana kaynağı olan erişim yetkilerini düzeltir.

alter table public.shared_lists enable row level security;

-- Mevcut politikaları temizle (Çakışma olmaması için)
drop policy if exists "Public Shared Read" on public.shared_lists;
drop policy if exists "User Shared Insert" on public.shared_lists;
drop policy if exists "Public shared lists access" on public.shared_lists;
drop policy if exists "Auth insert shared lists" on public.shared_lists;
drop policy if exists "Owner delete shared lists" on public.shared_lists;

-- YENİ POLİTİKALAR:

-- Kural 1: HERKES (Giriş yapmamış kişiler dahil) paylaşılan listeleri okuyabilir.
create policy "Public shared lists access" 
on public.shared_lists for select 
using (true);

-- Kural 2: Sadece giriş yapmış kullanıcılar YENİ liste paylaşabilir.
create policy "Auth insert shared lists" 
on public.shared_lists for insert 
with check (auth.uid() = user_id);

-- Kural 3: Kullanıcı sadece KENDİ paylaştığı listeyi silebilir.
create policy "Owner delete shared lists" 
on public.shared_lists for delete 
using (auth.uid() = user_id);

-- 3. JSONB SÜTUNLARINI GARANTİ ALTINA AL
-- Eğer eski veritabanında bu sütunlar eksikse ekler.
do $$
begin
  if not exists (select 1 from information_schema.columns where table_name = 'shared_lists' and column_name = 'top_favorite_movies') then
    alter table public.shared_lists add column top_favorite_movies jsonb default '[null, null, null, null, null]'::jsonb;
  end if;
  if not exists (select 1 from information_schema.columns where table_name = 'shared_lists' and column_name = 'top_favorite_shows') then
    alter table public.shared_lists add column top_favorite_shows jsonb default '[null, null, null, null, null]'::jsonb;
  end if;
end $$;

-- 4. VERİ BÜTÜNLÜĞÜ (Opsiyonel Kontrol)
-- Movies kolonunun boş olmamasını garanti altına alan bir constraint (Eğer yoksa)
-- alter table public.shared_lists add constraint check_movies_not_null check (movies is not null);
