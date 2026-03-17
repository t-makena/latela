import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export function useIsAdmin() {
  const { user } = useAuth();

  const { data: isAdmin = false, isLoading, error } = useQuery({
    queryKey: ['isAdmin', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('is_current_user_admin');
      if (error) throw error;
      return data as boolean;
    },
    enabled: !!user,
    staleTime: 300000,
  });

  return { isAdmin, isLoading, error };
}

export default useIsAdmin;
