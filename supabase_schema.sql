-- ==========================================
-- TRIA APP - GÜVENLİK VE RLS SIFIRLAMA (KESİN ÇÖZÜM)
-- ==========================================

-- 1. TABLOLARIN VARLIĞINI KONTROL ET VE OLUŞTUR
create table if not exists public.shared_lists (
  id text primary key,
  user_id uuid references auth.users not null,
  name text not null,
  movies jsonb not null, 
  top_favorite_movies jsonb default '[null, null, null, null, null]'::jsonb,
  top_favorite_shows jsonb default '[null, null, null, null, null]'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists public.user_collections (
  id text primary key,
  user_id uuid references auth.users not null,
  name text not null,
  movies jsonb default '[]'::jsonb,
  top_favorite_movies jsonb default '[null, null, null, null, null]'::jsonb,
  top_favorite_shows jsonb default '[null, null, null, null, null]'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- 2. TÜM RLS POLİTİKALARINI SIFIRLA (Temiz Başlangıç)
alter table public.shared_lists enable row level security;
alter table public.user_collections enable row level security;

-- Önce eskileri sil (Hata vermemesi için IF EXISTS)
drop policy if exists "Public Shared Read" on public.shared_lists;
drop policy if exists "User Shared Insert" on public.shared_lists;
drop policy if exists "Public shared lists access" on public.shared_lists;
drop policy if exists "Auth insert shared lists" on public.shared_lists;
drop policy if exists "Owner delete shared lists" on public.shared_lists;
drop policy if exists "Users can manage their own collections" on public.user_collections;
drop policy if exists "User Select Own" on public.user_collections;
drop policy if exists "User Insert Own" on public.user_collections;
drop policy if exists "User Update Own" on public.user_collections;
drop policy if exists "User Delete Own" on public.user_collections;

-- 3. YENİ VE GÜVENLİ POLİTİKALAR

-- Shared Lists: Herkes okuyabilir, sadece sahibi ekleyebilir/silebilir.
create policy "Anyone can read shared lists" 
on public.shared_lists for select 
using (true);

create policy "Users can insert shared lists" 
on public.shared_lists for insert 
with check (auth.uid() = user_id);

create policy "Users can delete own shared lists" 
on public.shared_lists for delete 
using (auth.uid() = user_id);

-- User Collections: Sadece sahibi her şeyi yapabilir.
create policy "Users can select own collections" 
on public.user_collections for select 
using (auth.uid() = user_id);

create policy "Users can insert own collections" 
on public.user_collections for insert 
with check (auth.uid() = user_id);

create policy "Users can update own collections" 
on public.user_collections for update 
using (auth.uid() = user_id);

create policy "Users can delete own collections" 
on public.user_collections for delete 
using (auth.uid() = user_id);

-- 4. PERFORMANS İÇİN INDEX (Opsiyonel ama önerilir)
create index if not exists idx_shared_lists_user_id on public.shared_lists(user_id);
create index if not exists idx_user_collections_user_id on public.user_collections(user_id);
