
-- ============================================================
-- TRIA APP - TAMİR VE GÜVENLİK KİTİ (GİRİŞ SORUNU ÇÖZÜMÜ)
-- ============================================================

-- 1. E-POSTA ONAY SORUNUNU ÇÖZ (400 Bad Request Hatası İçin)
-- Kayıt olmuş ama e-postası onaylanmamış gibi görünen herkesi onaylı yap.
UPDATE auth.users
SET email_confirmed_at = now()
WHERE email_confirmed_at IS NULL;

-- 2. PROFILES TABLOSUNU GARANTİYE AL
-- Tablo zaten var (schema'da gördüm), eksik sütun veya politika varsa düzeltelim.

-- Admin sütunu yoksa ekle
do $$
begin
    if not exists (select 1 from information_schema.columns where table_name = 'profiles' and column_name = 'is_admin') then
        alter table public.profiles add column is_admin boolean default false;
    end if;
end $$;

-- 3. EKSİK PROFİLLERİ OLUŞTUR (Backfill)
-- auth.users'da olup profiles tablosunda olmayanları ekle.
INSERT INTO public.profiles (id, username, email, is_admin, is_blocked, updated_at)
SELECT 
    id, 
    COALESCE(raw_user_meta_data->>'username', substring(email from '^[^@]+')), -- Username yoksa emailin başını al
    email,
    false, 
    false,
    now()
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.profiles);

-- 4. TRIGGER: YENİ KULLANICILAR İÇİN OTOMATİK PROFİL
-- Bu fonksiyon her yeni kayıtta çalışır ve profili oluşturur.
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, username, email, avatar_url, is_admin, is_blocked)
  VALUES (
    new.id, 
    COALESCE(new.raw_user_meta_data->>'username', 'Kullanıcı'),
    new.email,
    new.raw_user_meta_data->>'avatar_url', 
    false, 
    false
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger'ı yeniden bağla (Eskisini silip temiz kurulum yapıyoruz)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 5. RLS (GÜVENLİK) POLİTİKALARI
-- Mevcut politikaları temizleyip en güvenli hallerini yazıyoruz.
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

-- Okuma: Herkes profilleri görebilir (Admin kontrolü ve sosyal özellikler için)
CREATE POLICY "Public profiles are viewable by everyone" 
ON public.profiles FOR SELECT 
USING (true);

-- Güncelleme: Sadece kendi profilini güncelleyebilir
CREATE POLICY "Users can update own profile" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = id);

-- Ekleme: Trigger çalışmazsa diye manuel ekleme izni (Sadece kendi ID'si için)
CREATE POLICY "Users can insert own profile" 
ON public.profiles FOR INSERT 
WITH CHECK (auth.uid() = id);

-- 6. REVIEWS VE COLLECTIONS İÇİN RLS TEMİZLİĞİ
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_collections ENABLE ROW LEVEL SECURITY;

-- Reviews: Herkes okuyabilir, sadece sahibi yazabilir/silebilir
DROP POLICY IF EXISTS "Public Read Reviews" ON public.reviews;
DROP POLICY IF EXISTS "Users can insert own reviews" ON public.reviews;
DROP POLICY IF EXISTS "Users can update own reviews" ON public.reviews;
DROP POLICY IF EXISTS "Users can delete own reviews" ON public.reviews;

CREATE POLICY "Public Read Reviews" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "Users can insert own reviews" ON public.reviews FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own reviews" ON public.reviews FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own reviews" ON public.reviews FOR DELETE USING (auth.uid() = user_id);

-- Collections: Public olanları herkes görür, gizlileri sadece sahibi
DROP POLICY IF EXISTS "Read Collections" ON public.user_collections;
DROP POLICY IF EXISTS "Insert Collections" ON public.user_collections;
DROP POLICY IF EXISTS "Update Collections" ON public.user_collections;
DROP POLICY IF EXISTS "Delete Collections" ON public.user_collections;

CREATE POLICY "Read Collections" ON public.user_collections FOR SELECT 
USING (is_public = true OR auth.uid() = user_id);

CREATE POLICY "Insert Collections" ON public.user_collections FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Update Collections" ON public.user_collections FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Delete Collections" ON public.user_collections FOR DELETE 
USING (auth.uid() = user_id);
