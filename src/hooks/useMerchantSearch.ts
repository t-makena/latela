import { useDeferredValue } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface MerchantSuggestion {
  description: string;
  categoryId?: string;
  categoryName?: string;
  similarityScore: number;
}

export const useMerchantSearch = (searchTerm: string) => {
  const { user } = useAuth();
  const userId = user?.id;
  const deferredSearch = useDeferredValue(searchTerm);

  const { data: suggestions = [], isLoading: isSearching } = useQuery({
    queryKey: ['merchant-search', userId, deferredSearch],
    queryFn: async (): Promise<MerchantSuggestion[]> => {
      const [patternsRes, descriptionsRes] = await Promise.all([
        supabase.rpc('fuzzy_match_merchant', {
          p_user_id: userId!,
          p_search_term: deferredSearch,
          p_limit: 10,
          p_threshold: 0.3,
        }),
        supabase.rpc('search_transaction_descriptions', {
          p_user_id: userId!,
          p_search_term: deferredSearch,
          p_limit: 10,
        }),
      ]);

      const combined: MerchantSuggestion[] = [
        ...(patternsRes.data || []).map((p: any) => ({
          description: p.normalized_name,
          categoryId: p.category_id,
          categoryName: p.category_name,
          similarityScore: Number(p.similarity_score),
        })),
        ...(descriptionsRes.data || []).map((d: any) => ({
          description: d.description,
          categoryId: d.category_id,
          categoryName: d.category_name,
          similarityScore: Number(d.similarity_score),
        })),
      ];

      // Deduplicate by description, keep highest similarity
      const seen = new Map<string, MerchantSuggestion>();
      combined.forEach((item) => {
        const key = item.description?.toUpperCase();
        if (!key) return;
        const existing = seen.get(key);
        if (!existing || item.similarityScore > existing.similarityScore) {
          seen.set(key, item);
        }
      });

      return Array.from(seen.values()).sort((a, b) => b.similarityScore - a.similarityScore);
    },
    enabled: !!userId && deferredSearch.length >= 2,
    staleTime: 30000,
  });

  return { suggestions, isSearching };
};

