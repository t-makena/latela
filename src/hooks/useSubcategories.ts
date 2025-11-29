import { useState, useEffect } from 'react';
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
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSubcategories();
  }, [parentCategoryId]);

  const fetchSubcategories = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setSubcategories([]);
        return;
      }

      // Fetch system subcategories (categories with parent_id)
      let systemQuery = supabase
        .from('categories')
        .select('id, name, color, parent_id')
        .not('parent_id', 'is', null);

      if (parentCategoryId) {
        systemQuery = systemQuery.eq('parent_id', parentCategoryId);
      }

      const { data: systemCategories, error: systemError } = await systemQuery;

      if (systemError) throw systemError;

      // Fetch user's custom categories
      let customQuery = supabase
        .from('user_custom_categories')
        .select('id, name, color, parent_category_id, replaces_category_id, is_active')
        .eq('user_id', user.id)
        .eq('is_active', true);

      if (parentCategoryId) {
        customQuery = customQuery.eq('parent_category_id', parentCategoryId);
      }

      const { data: customCategories, error: customError } = await customQuery;

      if (customError) throw customError;

      // Create a map of replaced system categories
      const replacementMap = new Map<string, any>();
      customCategories?.forEach(custom => {
        if (custom.replaces_category_id) {
          replacementMap.set(custom.replaces_category_id, custom);
        }
      });

      // Combine system and custom categories
      const combined: Subcategory[] = [];

      // Add system categories (or their replacements)
      systemCategories?.forEach(system => {
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
      customCategories?.forEach(custom => {
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

      setSubcategories(combined);
    } catch (error) {
      console.error('Error fetching subcategories:', error);
      setSubcategories([]);
    } finally {
      setLoading(false);
    }
  };

  return { subcategories, loading, refetch: fetchSubcategories };
};
