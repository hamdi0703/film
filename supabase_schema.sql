-- ==========================================
-- TRIA APP - TAM GÜVENLİK VE ŞEMA KURULUMU
-- ==========================================

-- NOT: Bu scripti çalıştırmadan önce, eğer production veriniz varsa yedek almanızı öneririm.
-- Bu script tabloları oluşturur, eksik sütunları tamamlar ve güvenlik ayarlarını (RLS) yeniler.

-- 1. PROFILES TABLOSU (Kullanıcı Profilleri)
-- Amaç: Kullanıcı adı, avatar ve engellenme durumunu tutar.
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  email text,
  username text,
  avatar_url text,
  is_blocked boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Eksik sütun kontrolü (Eski tablolarda sütun yoksa ekler)
do $$
begin
  if not exists (select 1 from information_schema.columns where table_name = 'profiles' and column_name = 'is_blocked') then
    alter table public.profiles add column is_blocked boolean default false;
  end if;
  if not exists (select 1 from information_schema.columns where table_name = 'profiles' and column_name = 'email') then
    alter table public.profiles add column email text;
  end if;
  if not exists (select 1 from information_schema.columns where table_name = 'profiles' and column_name = 'avatar_url') then
    alter table public.profiles add column avatar_url text;
  end if;
end $$;

-- Profiles Güvenlik Ayarları (RLS)
alter table public.profiles enable row level security;

-- MEVCUT POLİTİKALARI TEMİZLE (Çakışmayı önlemek için)
drop policy if exists "Profilleri herkes görebilir" on public.profiles;
drop policy if exists "Kullanıcılar kendi profilini güncelleyebilir" on public.profiles;
drop policy if exists "Public profiles access" on public.profiles;
drop policy if exists "Self update access" on public.profiles;

-- YENİ POLİTİKALAR
-- ÖNEMLİ: using (true) sayesinde giriş yapmamış kişiler de "Listeyi Kim Paylaştı?" bilgisini görebilir.
create policy "Public profiles access" on public.profiles for select using (true);
create policy "Self update access" on public.profiles for update using (auth.uid() = id);

-- 2. USER COLLECTIONS (Kişisel Listeler)
-- Amaç: Kullanıcının kendi dashboard'unda gördüğü özel listeler.
create table if not exists public.user_collections (
  id text not null primary key,
  user_id uuid references auth.users not null,
  name text not null,
  movies jsonb default '[]'::jsonb,
  top_favorite_movies jsonb default '[null, null, null, null, null]'::jsonb,
  top_favorite_shows jsonb default '[null, null, null, null, null]'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- User Collections Güvenlik (Sadece Sahibi Görebilir)
alter table public.user_collections enable row level security;

drop policy if exists "Koleksiyon CRUD" on public.user_collections;
drop policy if exists "Own collections access" on public.user_collections;

create policy "Own collections access" on public.user_collections for all using (auth.uid() = user_id);

-- 3. SHARED LISTS (Paylaşılan Listeler)
-- Amaç: Link ile paylaşılan, statik ve herkese açık listeler.
-- NOT: Eğer tablo önceden UUID id ile oluşturulduysa, TEXT id ile değiştirmek için tabloyu yeniden oluşturuyoruz.
create table if not exists public.shared_lists (
  id text primary key, -- Özel ID formatı (XXXX-XXXX) için TEXT olmalı
  user_id uuid references auth.users not null,
  name text not null,
  movies jsonb not null, -- Optimize edilmiş film verisi
  top_favorite_movies jsonb,
  top_favorite_shows jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Sütun eksikse ekle (Eski versiyon uyumluluğu)
do $$
begin
  if not exists (select 1 from information_schema.columns where table_name = 'shared_lists' and column_name = 'top_favorite_movies') then
    alter table public.shared_lists add column top_favorite_movies jsonb;
  end if;
  if not exists (select 1 from information_schema.columns where table_name = 'shared_lists' and column_name = 'top_favorite_shows') then
    alter table public.shared_lists add column top_favorite_shows jsonb;
  end if;
end $$;

-- Shared Lists Güvenlik (RLS)
alter table public.shared_lists enable row level security;

drop policy if exists "Public Read Shared" on public.shared_lists;
drop policy if exists "User Insert Shared" on public.shared_lists;
drop policy if exists "Public shared lists access" on public.shared_lists;
drop policy if exists "Auth insert shared lists" on public.shared_lists;

-- ÖNEMLİ: using (true) ile herkesin (anonim dahil) listeyi okumasını sağlıyoruz.
create policy "Public shared lists access" on public.shared_lists for select using (true);
-- Sadece giriş yapmış kullanıcılar paylaşım yapabilir.
create policy "Auth insert shared lists" on public.shared_lists for insert with check (auth.uid() = user_id);
-- Kullanıcı kendi paylaştığı listeyi silebilir (Opsiyonel)
create policy "Owner delete shared lists" on public.shared_lists for delete using (auth.uid() = user_id);

-- 4. REVIEWS (İncelemeler)
create table if not exists public.reviews (
  id bigint generated by default as identity primary key,
  user_id uuid references auth.users not null,
  movie_id bigint not null,
  rating integer check (rating >= 1 and rating <= 10),
  comment text,
  has_spoiler boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, movie_id) -- Bir kullanıcı bir filme tek yorum yapabilir
);

-- Reviews Güvenlik (RLS)
alter table public.reviews enable row level security;

drop policy if exists "Herkes yorumları okuyabilir" on public.reviews;
drop policy if exists "Reviews public read" on public.reviews;
drop policy if exists "Reviews owner modify" on public.reviews;

-- Herkes okuyabilir
create policy "Reviews public read" on public.reviews for select using (true);
-- Sadece sahibi ekleyebilir/düzenleyebilir/silebilir
create policy "Reviews owner insert" on public.reviews for insert with check (auth.uid() = user_id);
create policy "Reviews owner update" on public.reviews for update using (auth.uid() = user_id);
create policy "Reviews owner delete" on public.reviews for delete using (auth.uid() = user_id);

-- 5. TRIGGER: Yeni Kullanıcı Kaydolunca Profil Oluştur
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, username, avatar_url)
  values (
      new.id,
      new.email,
      coalesce(new.raw_user_meta_data->>'username', new.email), -- Metadata yoksa email'i kullan
      new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing; -- Zaten varsa hata verme
  return new;
end;
$$ language plpgsql security definer;

-- Trigger'ı güvenli şekilde yeniden oluştur
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 6. RPC: Hesabı Silme Fonksiyonu
-- Kullanıcının kendi hesabını silebilmesi için güvenli fonksiyon
create or replace function public.delete_own_account()
returns void
language plpgsql
security definer
as $$
begin
  delete from auth.users where id = auth.uid();
end;
$$;