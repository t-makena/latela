import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';

export interface CustomCategory {
  id: string;
  name: string;
  color: string;
  parent_category_id: string;
  parent_category_name?: string;
  replaces_category_id?: string;
  replaces_category_name?: string;
  is_active: boolean;
  created_at: string;
}

export const useCustomCategories = () => {
  const [customCategories, setCustomCategories] = useState<CustomCategory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCustomCategories();
  }, []);

  const fetchCustomCategories = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setCustomCategories([]);
        return;
      }

      const { data, error } = await supabase
        .from('user_custom_categories')
        .select(`
          id,
          name,
          color,
          parent_category_id,
          replaces_category_id,
          is_active,
          created_at
        `)
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch parent category names
      const parentIds = [...new Set(data?.map(c => c.parent_category_id))];
      const { data: parents } = await supabase
        .from('categories')
        .select('id, name')
        .in('id', parentIds);

      // Fetch replaced category names
      const replacedIds = data?.filter(c => c.replaces_category_id).map(c => c.replaces_category_id);
      const { data: replaced } = replacedIds && replacedIds.length > 0
        ? await supabase
            .from('categories')
            .select('id, name')
            .in('id', replacedIds)
        : { data: [] };

      const parentMap = new Map<string, string>();
      parents?.forEach(p => parentMap.set(p.id, p.name));

      const replacedMap = new Map<string, string>();
      replaced?.forEach(r => replacedMap.set(r.id, r.name));

      const enrichedData: CustomCategory[] = data?.map(cat => ({
        ...cat,
        parent_category_name: parentMap.get(cat.parent_category_id) || '',
        replaces_category_name: cat.replaces_category_id 
          ? (replacedMap.get(cat.replaces_category_id) || '')
          : undefined
      })) || [];

      setCustomCategories(enrichedData);
    } catch (error) {
      console.error('Error fetching custom categories:', error);
      toast.error('Failed to load custom categories');
    } finally {
      setLoading(false);
    }
  };

  const createCustomCategory = async (
    name: string,
    parentCategoryId: string,
    color: string,
    replacesCategoryId?: string
  ) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Check if this system category is already replaced by this user
      if (replacesCategoryId) {
        const { data: existing } = await supabase
          .from('user_custom_categories')
          .select('id')
          .eq('user_id', user.id)
          .eq('replaces_category_id', replacesCategoryId)
          .eq('is_active', true)
          .single();

        if (existing) {
          throw new Error('This category is already replaced. Please edit or delete the existing replacement.');
        }
      }

      const { error } = await supabase
        .from('user_custom_categories')
        .insert({
          user_id: user.id,
          name,
          parent_category_id: parentCategoryId,
          color,
          replaces_category_id: replacesCategoryId || null,
          is_active: true
        });

      if (error) throw error;

      toast.success(replacesCategoryId ? 'Category replaced successfully' : 'Custom category created');
      await fetchCustomCategories();
    } catch (error: any) {
      console.error('Error creating custom category:', error);
      toast.error(error.message || 'Failed to create custom category');
      throw error;
    }
  };

  const updateCustomCategory = async (
    id: string,
    updates: { name?: string; color?: string }
  ) => {
    try {
      const { error } = await supabase
        .from('user_custom_categories')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      toast.success('Category updated successfully');
      await fetchCustomCategories();
    } catch (error: any) {
      console.error('Error updating custom category:', error);
      toast.error('Failed to update category');
      throw error;
    }
  };

  const deleteCustomCategory = async (id: string, replacesCategoryId?: string) => {
    try {
      // Check if there are merchant mappings using this custom category
      const { data: mappings } = await supabase
        .from('user_merchant_mappings')
        .select('id')
        .eq('custom_subcategory_id', id)
        .eq('is_active', true);

      if (mappings && mappings.length > 0) {
        const confirmed = window.confirm(
          `This category is used in ${mappings.length} merchant mapping(s). ` +
          (replacesCategoryId 
            ? 'Deleting it will restore the original system category for those merchants.' 
            : 'Deleting it will leave those merchants without a subcategory.') +
          ' Continue?'
        );
        
        if (!confirmed) return;
      }

      // Soft delete
      const { error } = await supabase
        .from('user_custom_categories')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;

      toast.success(replacesCategoryId ? 'Replacement removed. System category restored.' : 'Custom category deleted');
      await fetchCustomCategories();
    } catch (error: any) {
      console.error('Error deleting custom category:', error);
      toast.error('Failed to delete category');
      throw error;
    }
  };

  return {
    customCategories,
    loading,
    refetch: fetchCustomCategories,
    createCustomCategory,
    updateCustomCategory,
    deleteCustomCategory
  };
};
