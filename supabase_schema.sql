
-- ============================================================
-- TRIA APP - TAMİR, GÜVENLİK VE ADMIN KURULUMU
-- ============================================================

-- 1. PROFILES TABLOSUNU OLUŞTUR / GÜNCELLE
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  username text,
  avatar_url text,
  is_blocked boolean default false,
  is_admin boolean default false,
  updated_at timestamp with time zone default now()
);

-- Eksik kolonları ekle (Hata almamak için)
do $$
begin
    if not exists (select 1 from information_schema.columns where table_name = 'profiles' and column_name = 'is_admin') then
        alter table public.profiles add column is_admin boolean default false;
    end if;
    if not exists (select 1 from information_schema.columns where table_name = 'profiles' and column_name = 'username') then
        alter table public.profiles add column username text;
    end if;
    if not exists (select 1 from information_schema.columns where table_name = 'profiles' and column_name = 'is_blocked') then
        alter table public.profiles add column is_blocked boolean default false;
    end if;
end $$;

-- 2. RLS (GÜVENLİK) POLİTİKALARI
alter table public.profiles enable row level security;

-- Eski politikaları temizle
drop policy if exists "Public profiles are viewable by everyone" on public.profiles;
drop policy if exists "Users can insert their own profile" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;

-- Yeni politikalar
create policy "Public profiles are viewable by everyone" 
on public.profiles for select using (true);

create policy "Users can update own profile" 
on public.profiles for update using (auth.uid() = id);

create policy "Users can insert own profile" 
on public.profiles for insert with check (auth.uid() = id);

-- 3. KRİTİK DÜZELTME: KULLANICILARI ONAR (Giriş Sorunu Çözümü)

-- A. E-postaları Otomatik Onayla (Bad Request 400 Çözümü)
-- NOT: Supabase ayarlarından "Enable Email Confirmations" kapalı değilse bu gereklidir.
UPDATE auth.users
SET email_confirmed_at = now()
WHERE email_confirmed_at IS NULL;

-- B. Eksik Profilleri Oluştur (Profil Gelmeme Sorunu Çözümü)
INSERT INTO public.profiles (id, username, is_admin, is_blocked)
SELECT 
    id, 
    COALESCE(raw_user_meta_data->>'username', email), 
    false, 
    false
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.profiles);

-- 4. TRIGGER (Yeni Kayıtlar İçin Otomatik Profil)
create or replace function public.handle_new_user() 
returns trigger as $$
begin
  insert into public.profiles (id, username, avatar_url, is_admin, is_blocked)
  values (
    new.id, 
    new.raw_user_meta_data->>'username', 
    new.raw_user_meta_data->>'avatar_url', 
    false, 
    false
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- ÖNEMLİ: KENDİNİ ADMIN YAPMA KOMUTU
-- Aşağıdaki satırın başındaki '--' işaretini kaldır ve
-- 'senin_mail_adresin@gmail.com' kısmına kendi emailini yaz.
-- Sonra RUN butonuna bas.
-- ============================================================

-- UPDATE public.profiles SET is_admin = true 
-- WHERE id IN (SELECT id FROM auth.users WHERE email = 'senin_mail_adresin@gmail.com');

