import { useAuth } from '@/contexts/AuthContext';

const ADMIN_EMAIL = 'info@latela.co.za';

export const useIsAdmin = () => {
  const { user, loading } = useAuth();
  return {
    isAdmin: !!user && user.email === ADMIN_EMAIL,
    loading,
  };
};
