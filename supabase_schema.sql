
-- ============================================================
-- GELİŞMİŞ ADMIN DASHBOARD RPC (GÜVENLİK VE GRAFİK VERİSİ)
-- ============================================================

DROP FUNCTION IF EXISTS public.get_admin_stats();

CREATE OR REPLACE FUNCTION public.get_admin_dashboard_data()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_is_admin boolean;
  
  -- Sayaçlar
  total_users_int int;
  total_lists_int int;
  total_reviews_int int;
  
  -- Büyüme (Son 30 gün)
  new_users_30d int;
  new_lists_30d int;
  
  -- Grafik Verisi (Son 7 gün aktivitesi)
  activity_chart json;
BEGIN
  -- 1. GÜVENLİK KONTROLÜ (RBAC)
  SELECT is_admin INTO current_is_admin
  FROM public.profiles
  WHERE id = auth.uid();

  IF current_is_admin IS NOT TRUE THEN
    RAISE EXCEPTION 'Yetkisiz Erişim: Admin yetkisi gerekli.';
  END IF;

  -- 2. TEMEL METRİKLER
  SELECT count(*) INTO total_users_int FROM public.profiles;
  SELECT count(*) INTO total_lists_int FROM public.user_collections;
  SELECT count(*) INTO total_reviews_int FROM public.reviews;

  -- 3. BÜYÜME METRİKLERİ (Son 30 gün)
  SELECT count(*) INTO new_users_30d FROM public.profiles 
  WHERE updated_at > (now() - interval '30 days'); -- profiles created_at olmadığı için updated_at veya auth.users kullanılabilir, burada updated_at güvenli liman.

  SELECT count(*) INTO new_lists_30d FROM public.user_collections 
  WHERE updated_at > (now() - interval '30 days');

  -- 4. GRAFİK VERİSİ (Son 7 Günlük Liste Oluşturma Aktivitesi)
  -- SQL tarafında gruplama yaparak frontend'e hazır JSON dizisi dönüyoruz.
  SELECT json_agg(t) INTO activity_chart
  FROM (
    SELECT 
      to_char(updated_at, 'Mon DD') as date,
      count(*) as count
    FROM public.user_collections
    WHERE updated_at > (now() - interval '7 days')
    GROUP BY to_char(updated_at, 'Mon DD')
    ORDER BY min(updated_at)
  ) t;

  -- 5. HEPSİNİ TEK JSON OLARAK DÖNDÜR
  RETURN json_build_object(
    'total_users', total_users_int,
    'total_lists', total_lists_int,
    'total_reviews', total_reviews_int,
    'new_users_monthly', new_users_30d,
    'new_lists_monthly', new_lists_30d,
    'chart_data', COALESCE(activity_chart, '[]'::json)
  );
END;
$$;
