import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Subcategory {
  id: string;
  name: string;
  color: string;
  parent_category_id: string;
  is_custom: boolean;
  replaces_category_id?: string;
  custom_category_id?: string;
  original_name?: string;
}

export const useSubcategories = (parentCategoryId?: string) => {
  const { data: subcategories = [], isLoading: loading, refetch } = useQuery({
    queryKey: ['subcategories', parentCategoryId],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return [];

      // Fetch system and custom categories in parallel
      let systemQuery = supabase
        .from('categories')
        .select('id, name, color, parent_id')
        .not('parent_id', 'is', null);

      if (parentCategoryId) {
        systemQuery = systemQuery.eq('parent_id', parentCategoryId);
      }

      let customQuery = supabase
        .from('user_custom_categories')
        .select('id, name, color, parent_category_id, replaces_category_id, is_active')
        .eq('user_id', user.id)
        .eq('is_active', true);

      if (parentCategoryId) {
        customQuery = customQuery.eq('parent_category_id', parentCategoryId);
      }

      // Execute both queries in parallel
      const [systemResult, customResult] = await Promise.all([
        systemQuery,
        customQuery
      ]);

      if (systemResult.error) throw systemResult.error;
      if (customResult.error) throw customResult.error;

      const systemCategories = systemResult.data || [];
      const customCategories = customResult.data || [];

      // Create a map of replaced system categories
      const replacementMap = new Map<string, any>();
      customCategories.forEach(custom => {
        if (custom.replaces_category_id) {
          replacementMap.set(custom.replaces_category_id, custom);
        }
      });

      // Combine system and custom categories
      const combined: Subcategory[] = [];

      // Add system categories (or their replacements)
      systemCategories.forEach(system => {
        const replacement = replacementMap.get(system.id);
        if (replacement) {
          // Use custom replacement instead
          combined.push({
            id: system.id, // Keep original ID for database references
            name: replacement.name,
            color: replacement.color,
            parent_category_id: system.parent_id,
            is_custom: true,
            replaces_category_id: system.id,
            custom_category_id: replacement.id,
            original_name: system.name // Store original system name for lookup
          });
        } else {
          // Use system category as-is
          combined.push({
            id: system.id,
            name: system.name,
            color: system.color || '#6B7280',
            parent_category_id: system.parent_id,
            is_custom: false
          });
        }
      });

      // Add custom categories that are not replacements (new subcategories)
      customCategories.forEach(custom => {
        if (!custom.replaces_category_id) {
          combined.push({
            id: custom.id,
            name: custom.name,
            color: custom.color,
            parent_category_id: custom.parent_category_id,
            is_custom: true,
            custom_category_id: custom.id
          });
        }
      });

      return combined;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  return { subcategories, loading, refetch };
};
