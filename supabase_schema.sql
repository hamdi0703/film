
-- ... (Mevcut kodların devamına ekle)

-- ============================================================
-- ADMIN İSTATİSTİK FONKSİYONU (SECURE RPC)
-- ============================================================

-- Bu fonksiyonu sadece "is_admin = true" olan kullanıcılar çalıştırabilir.
-- SECURITY DEFINER: Fonksiyonu oluşturanın yetkileriyle çalışır (RLS'yi aşar),
-- ancak içinde manuel yetki kontrolü (IF check) yaparak güvenliği sağlarız.

CREATE OR REPLACE FUNCTION public.get_admin_stats()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_is_admin boolean;
  total_users_count int;
  total_lists_count int;
  total_reviews_count int;
BEGIN
  -- 1. GÜVENLİK KONTROLÜ: Çağıran kişi admin mi?
  SELECT is_admin INTO current_is_admin
  FROM public.profiles
  WHERE id = auth.uid();

  IF current_is_admin IS NOT TRUE THEN
    RAISE EXCEPTION 'Yetkisiz Erişim: Bu veriyi görme yetkiniz yok.';
  END IF;

  -- 2. VERİLERİ TOPLA
  SELECT count(*) INTO total_users_count FROM public.profiles;
  SELECT count(*) INTO total_lists_count FROM public.user_collections;
  SELECT count(*) INTO total_reviews_count FROM public.reviews;

  -- 3. JSON OLARAK DÖNDÜR
  RETURN json_build_object(
    'total_users', total_users_count,
    'total_lists', total_lists_count,
    'total_reviews', total_reviews_count
  );
END;
$$;
