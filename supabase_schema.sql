
-- ==========================================
-- TRIA APP - MIGRATION & SECURITY UPDATE
-- ==========================================

-- 1. MEVCUT TABLOYA SÜTUN EKLEME (MIGRATION)
alter table public.user_collections 
add column if not exists is_public boolean default false;

alter table public.user_collections 
add column if not exists share_token text unique;

alter table public.user_collections 
add column if not exists description text;

-- Token için index (Hızlı sorgulama için)
create index if not exists idx_user_collections_token on public.user_collections(share_token);

-- 2. RLS POLİTİKALARINI GÜNCELLEME
-- Önceki politikaları temizle (Çakışmayı önlemek için)
drop policy if exists "Public Shared Read" on public.shared_lists;
drop policy if exists "Public Read Collections" on public.user_collections;
drop policy if exists "Users can select own collections" on public.user_collections;

-- Politikalar:

-- A. Kullanıcı kendi koleksiyonunu her zaman görür (Gizli olsa bile)
create policy "Users can select own collections" 
on public.user_collections for select 
using (auth.uid() = user_id);

-- B. Herhangi biri, eğer koleksiyon PUBLIC ise okuyabilir (Token ile erişim için)
create policy "Public Read Collections" 
on public.user_collections for select 
using (is_public = true);

-- Not: Update/Insert/Delete politikaları context içinde zaten sadece owner'a izin veriyor.
-- Shared Lists tablosu artık 'Legacy' moduna geçtiği için ona dokunmuyoruz.
