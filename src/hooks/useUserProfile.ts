import { useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface UserProfile {
  avatar_url: string | null;
  avatar_type: string | null;
  default_avatar_id: string | null;
  first_name: string | null;
  last_name: string | null;
  display_name: string | null;
  username: string | null;
  email: string | null;
  mobile: string | null;
}

const PROFILE_QUERY_KEY = ['user-profile'];

async function fetchProfileFromSupabase(): Promise<UserProfile | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('user_settings')
    .select('avatar_url, avatar_type, default_avatar_id, first_name, last_name, display_name, username, email, mobile')
    .eq('user_id', user.id)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching user profile:', error);
  }

  const profile = data || null;

  // Backfill first/last name from auth metadata if missing
  if (profile && !profile.first_name && user.user_metadata?.username) {
    const userName = user.user_metadata.username as string;
    const parts = userName.split(' ');
    const parsedFirst = parts[0];
    const parsedLast = parts.length > 1 ? parts.slice(1).join(' ') : null;

    if (parsedFirst) {
      const fields: { first_name: string; last_name?: string } = { first_name: parsedFirst };
      if (parsedLast) fields.last_name = parsedLast;

      const { error: updateError } = await supabase
        .from('user_settings')
        .update(fields)
        .eq('user_id', user.id);

      if (!updateError) {
        return { ...profile, ...fields };
      }
    }
  }

  return profile;
}

export const useUserProfile = () => {
  const queryClient = useQueryClient();

  const { data: profile = null, isLoading: loading } = useQuery({
    queryKey: PROFILE_QUERY_KEY,
    queryFn: fetchProfileFromSupabase,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: PROFILE_QUERY_KEY });
  }, [queryClient]);

  const updateAvatar = async (
    avatarType: 'default' | 'custom' | 'initials',
    defaultAvatarId?: string,
    avatarUrl?: string
  ) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const updateData: Record<string, any> = {
      avatar_type: avatarType,
    };

    if (avatarType === 'default' && defaultAvatarId) {
      updateData.default_avatar_id = defaultAvatarId;
      updateData.avatar_url = null;
    } else if (avatarType === 'custom' && avatarUrl) {
      updateData.avatar_url = avatarUrl;
      updateData.default_avatar_id = null;
    } else {
      updateData.avatar_url = null;
      updateData.default_avatar_id = null;
    }

    const { error } = await supabase
      .from('user_settings')
      .update(updateData)
      .eq('user_id', user.id);

    if (error) throw error;

    queryClient.setQueryData(PROFILE_QUERY_KEY, (old: UserProfile | null) =>
      old ? { ...old, ...updateData } : null
    );
  };

  const getInitials = (): string => {
    if (!profile) return '?';

    if (profile.first_name && profile.last_name) {
      return `${profile.first_name[0]}${profile.last_name[0]}`.toUpperCase();
    }

    if (profile.display_name) {
      const parts = profile.display_name.split(' ');
      if (parts.length >= 2) {
        return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
      }
      return profile.display_name.substring(0, 2).toUpperCase();
    }

    if (profile.username) {
      return profile.username.substring(0, 2).toUpperCase();
    }

    return '?';
  };

  const getDisplayName = (): string => {
    if (!profile) return '';

    if (profile.first_name && profile.last_name) {
      return `${profile.first_name} ${profile.last_name}`;
    }

    if (profile.display_name) {
      return profile.display_name;
    }

    if (profile.username) {
      return profile.username;
    }

    return '';
  };

  const updateProfile = async (fields: { first_name?: string; last_name?: string; email?: string; mobile?: string }) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('user_settings')
      .update(fields)
      .eq('user_id', user.id);

    if (error) throw error;

    queryClient.setQueryData(PROFILE_QUERY_KEY, (old: UserProfile | null) =>
      old ? { ...old, ...fields } : null
    );
  };

  return {
    profile,
    loading,
    getInitials,
    getDisplayName,
    updateAvatar,
    updateProfile,
    refetch: invalidate,
  };
};
