import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface MerchantSuggestion {
  id: string;
  merchant_name: string;
  display_name: string | null;
  category_id: string;
}

export const useMerchantSearch = () => {
  const [allMappings, setAllMappings] = useState<MerchantSuggestion[]>([]);

  useEffect(() => {
    const fetchMappings = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('user_merchant_mappings')
        .select('id, merchant_name, display_name, category_id')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('merchant_name')
        .limit(500);

      setAllMappings(data || []);
    };

    fetchMappings();
  }, []);

  const getSuggestions = useCallback(
    (query: string): MerchantSuggestion[] => {
      if (!query || query.length < 2) return [];
      const q = query.toLowerCase();
      return allMappings
        .filter(m =>
          m.merchant_name.toLowerCase().includes(q) ||
          (m.display_name?.toLowerCase().includes(q) ?? false)
        )
        .slice(0, 6);
    },
    [allMappings]
  );

  return { getSuggestions };
};
