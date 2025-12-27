import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type ColorPalette = 'multicolor' | 'blackwhite';

export const useColorPalette = () => {
  const [colorPalette, setColorPalette] = useState<ColorPalette>('multicolor');
  const [loading, setLoading] = useState(true);

  const fetchColorPalette = useCallback(async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setColorPalette('multicolor');
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('user_settings')
        .select('color_palette')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;

      if (data?.color_palette) {
        setColorPalette(data.color_palette as ColorPalette);
      }
    } catch (err) {
      console.error('Error fetching color palette:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchColorPalette();
  }, [fetchColorPalette]);

  const updateColorPalette = async (palette: ColorPalette) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('user_settings')
        .update({ color_palette: palette })
        .eq('user_id', user.id);

      if (error) throw error;

      setColorPalette(palette);
      return true;
    } catch (err) {
      console.error('Error updating color palette:', err);
      throw err;
    }
  };

  return {
    colorPalette,
    loading,
    updateColorPalette,
    refetch: fetchColorPalette,
  };
};
