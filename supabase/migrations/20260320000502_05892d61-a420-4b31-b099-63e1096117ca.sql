
CREATE OR REPLACE FUNCTION public.fuzzy_match_merchant(p_user_id uuid, p_search_term text, p_limit integer DEFAULT 10, p_threshold numeric DEFAULT 0.3)
 RETURNS TABLE(id uuid, pattern text, normalized_name text, category_id uuid, category_name text, similarity_score numeric, is_global boolean)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public, extensions
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    mp.id,
    mp.pattern,
    mp.normalized_name,
    mp.category_id,
    c.name AS category_name,
    similarity(mp.pattern, p_search_term)::NUMERIC AS similarity_score,
    mp.is_global
  FROM public.merchant_patterns mp
  LEFT JOIN public.categories c ON c.id = mp.category_id
  WHERE (mp.user_id = p_user_id OR mp.is_global = true)
    AND similarity(mp.pattern, p_search_term) > p_threshold
  ORDER BY similarity_score DESC, mp.match_count DESC
  LIMIT p_limit;
END;
$function$;
