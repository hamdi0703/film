
-- ==========================================
-- TRIA APP - SECURITY FIXES & MIGRATION
-- ==========================================

-- 1. Tablo yapısını garantiye al
alter table public.user_collections 
add column if not exists is_public boolean default false;

alter table public.user_collections 
add column if not exists share_token text unique;

alter table public.user_collections 
add column if not exists description text;

create index if not exists idx_user_collections_token on public.user_collections(share_token);

-- 2. RLS POLİTİKALARINI SIFIRLA VE YENİDEN YAZ
-- Mevcut tüm politikaları temizle (Çakışmaları önlemek için)
drop policy if exists "Public Shared Read" on public.shared_lists;
drop policy if exists "Public Read Collections" on public.user_collections;
drop policy if exists "Users can select own collections" on public.user_collections;
drop policy if exists "Users can insert own collections" on public.user_collections;
drop policy if exists "Users can update own collections" on public.user_collections;
drop policy if exists "Users can delete own collections" on public.user_collections;

-- RLS'yi Aktif Et (Emin olmak için)
alter table public.user_collections enable row level security;

-- --- POLİTİKALAR ---

-- A. OKUMA (SELECT)
-- 1. Kullanıcı kendi listesini her zaman görebilir
create policy "Users can select own collections" 
on public.user_collections for select 
using (auth.uid() = user_id);

-- 2. Herkes (Giriş yapmamışlar dahil) PUBLIC olan listeleri görebilir
create policy "Public Read Collections" 
on public.user_collections for select 
using (is_public = true);

-- B. YAZMA (INSERT)
-- Kullanıcı sadece kendi ID'si ile kayıt ekleyebilir
create policy "Users can insert own collections" 
on public.user_collections for insert 
with check (auth.uid() = user_id);

-- C. GÜNCELLEME (UPDATE)
-- Kullanıcı sadece kendi listesini güncelleyebilir
create policy "Users can update own collections" 
on public.user_collections for update 
using (auth.uid() = user_id);

-- D. SİLME (DELETE)
-- Kullanıcı sadece kendi listesini silebilir
create policy "Users can delete own collections" 
on public.user_collections for delete 
using (auth.uid() = user_id);
