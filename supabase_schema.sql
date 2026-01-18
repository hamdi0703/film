
-- ============================================================
-- GELİŞMİŞ ADMIN DASHBOARD RPC (v2 - FULL ANALYTICS)
-- ============================================================

DROP FUNCTION IF EXISTS public.get_admin_dashboard_data();

CREATE OR REPLACE FUNCTION public.get_admin_dashboard_data()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_is_admin boolean;
  
  -- Temel Sayaçlar
  total_users_int int;
  total_lists_int int;
  total_reviews_int int;
  
  -- Aktivite (DAU/MAU)
  dau_count int;
  mau_count int;
  
  -- Büyüme
  new_users_30d int;
  new_lists_30d int;
  
  -- Liste Analizi
  avg_list_size numeric;
  public_lists int;
  private_lists int;
  
  -- Kullanıcı Sağlığı
  churn_candidates int; -- 60 gündür girmeyenler
  retention_rate numeric; -- Basit tutunma oranı
  
  -- Karmaşık Veriler
  activity_chart json;
  top_curators json;
  
BEGIN
  -- 1. GÜVENLİK KONTROLÜ (RBAC)
  SELECT is_admin INTO current_is_admin
  FROM public.profiles
  WHERE id = auth.uid();

  IF current_is_admin IS NOT TRUE THEN
    RAISE EXCEPTION 'Yetkisiz Erişim: Admin yetkisi gerekli.';
  END IF;

  -- 2. TEMEL SAYAÇLAR
  SELECT count(*) INTO total_users_int FROM public.profiles;
  SELECT count(*) INTO total_lists_int FROM public.user_collections;
  SELECT count(*) INTO total_reviews_int FROM public.reviews;

  -- 3. AKTİVİTE (DAU / MAU)
  -- Not: updated_at alanı, kullanıcı profilini güncellediğinde veya giriş yaptığında tetiklenmelidir.
  SELECT count(*) INTO dau_count FROM public.profiles WHERE updated_at > (now() - interval '24 hours');
  SELECT count(*) INTO mau_count FROM public.profiles WHERE updated_at > (now() - interval '30 days');

  -- 4. BÜYÜME (Son 30 gün)
  SELECT count(*) INTO new_users_30d FROM public.profiles WHERE updated_at > (now() - interval '30 days'); -- created_at olmadığı için updated_at yaklaşık değerdir.
  SELECT count(*) INTO new_lists_30d FROM public.user_collections WHERE updated_at > (now() - interval '30 days');

  -- 5. LİSTE ANALİZİ (Privacy & Size)
  SELECT 
    count(*) FILTER (WHERE is_public), 
    count(*) FILTER (WHERE NOT is_public),
    COALESCE(avg(jsonb_array_length(movies)), 0)
  INTO public_lists, private_lists, avg_list_size
  FROM public.user_collections;

  -- 6. KULLANICI SAĞLIĞI (Churn & Retention)
  -- Churn: 60 gündür güncellenmeyen profiller
  SELECT count(*) INTO churn_candidates FROM public.profiles WHERE updated_at < (now() - interval '60 days');
  
  -- Retention (Basit): Son 30 günde aktif olanlar / Toplam kullanıcı
  IF total_users_int > 0 THEN
    retention_rate := (mau_count::numeric / total_users_int::numeric) * 100;
  ELSE
    retention_rate := 0;
  END IF;

  -- 7. TOP CURATORS (Leaderboard)
  -- En çok liste oluşturan ilk 3 kullanıcı
  SELECT json_agg(t) INTO top_curators
  FROM (
    SELECT 
      p.username,
      p.avatar_url,
      count(c.id) as list_count
    FROM public.profiles p
    JOIN public.user_collections c ON p.id = c.user_id
    GROUP BY p.id, p.username, p.avatar_url
    ORDER BY list_count DESC
    LIMIT 3
  ) t;

  -- 8. GRAFİK VERİSİ (Son 7 Gün)
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

  -- 9. JSON DÖNÜŞÜ
  RETURN json_build_object(
    'total_users', total_users_int,
    'total_lists', total_lists_int,
    'total_reviews', total_reviews_int,
    'dau', dau_count,
    'mau', mau_count,
    'new_users_monthly', new_users_30d,
    'new_lists_monthly', new_lists_30d,
    'public_lists', public_lists,
    'private_lists', private_lists,
    'avg_list_size', round(avg_list_size, 1),
    'churn_candidates', churn_candidates,
    'retention_rate', round(retention_rate, 1),
    'top_curators', COALESCE(top_curators, '[]'::json),
    'chart_data', COALESCE(activity_chart, '[]'::json)
  );
END;
$$;
