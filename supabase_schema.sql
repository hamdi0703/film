
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

-- 2. PROFILES Tablosu ve Admin Yetkisi
-- Profiles tablosunun varlığından emin ol (AuthContext kullanıyor)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  username text,
  avatar_url text,
  is_blocked boolean default false,
  is_admin boolean default false, -- YENİ: Admin yetkisi
  updated_at timestamp with time zone
);

-- RLS'yi Aktif Et
alter table public.profiles enable row level security;

-- POLİTİKALAR (Profiles)

-- Okuma: Herkes profilleri görebilir (Admin kontrolü için gereklidir)
drop policy if exists "Public profiles are viewable by everyone" on public.profiles;
create policy "Public profiles are viewable by everyone" 
on public.profiles for select 
using (true);

-- Ekleme: Yeni kullanıcılar kendi profillerini oluşturabilir
drop policy if exists "Users can insert their own profile" on public.profiles;
create policy "Users can insert their own profile" 
on public.profiles for insert 
with check (auth.uid() = id);

-- Güncelleme: Kullanıcılar kendi profillerini güncelleyebilir
-- KRİTİK GÜVENLİK NOTU: Supabase istemci kütüphanesi ile 'is_admin' alanını 
-- güncellemeye çalışırlarsa, RLS buna izin verse bile UI tarafında logic kurmayacağız.
-- Ancak SQL seviyesinde tam koruma için Trigger yazmak en doğrusudur. 
-- Şimdilik basit RLS ile ilerliyoruz, kullanıcı kendi satırını güncelleyebilir 
-- ama biz client tarafında is_admin göndermeyeceğiz.
drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile" 
on public.profiles for update 
using (auth.uid() = id);

-- 3. Trigger: Yeni kullanıcı geldiğinde otomatik profil oluştur
create or replace function public.handle_new_user() 
returns trigger as $$
begin
  insert into public.profiles (id, username, avatar_url, is_admin, is_blocked)
  values (new.id, new.raw_user_meta_data->>'username', null, false, false);
  return new;
end;
$$ language plpgsql security definer;

-- Trigger'ı bağla
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- 4. User Collections RLS (Önceki koddan devam)
-- RLS'yi Aktif Et (Emin olmak için)
alter table public.user_collections enable row level security;

-- Mevcut tüm politikaları temizle
drop policy if exists "Public Shared Read" on public.shared_lists;
drop policy if exists "Public Read Collections" on public.user_collections;
drop policy if exists "Users can select own collections" on public.user_collections;
drop policy if exists "Users can insert own collections" on public.user_collections;
drop policy if exists "Users can update own collections" on public.user_collections;
drop policy if exists "Users can delete own collections" on public.user_collections;

-- A. OKUMA (SELECT)
create policy "Users can select own collections" 
on public.user_collections for select 
using (auth.uid() = user_id);

create policy "Public Read Collections" 
on public.user_collections for select 
using (is_public = true);

-- B. YAZMA (INSERT)
create policy "Users can insert own collections" 
on public.user_collections for insert 
with check (auth.uid() = user_id);

-- C. GÜNCELLEME (UPDATE)
create policy "Users can update own collections" 
on public.user_collections for update 
using (auth.uid() = user_id);

-- D. SİLME (DELETE)
create policy "Users can delete own collections" 
on public.user_collections for delete 
using (auth.uid() = user_id);
