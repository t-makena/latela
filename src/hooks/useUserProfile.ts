import { useState, useEffect, useCallback } from 'react';
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

export const useUserProfile = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setProfile(null);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('user_settings')
        .select('avatar_url, avatar_type, default_avatar_id, first_name, last_name, display_name, username, email, mobile')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching user profile:', error);
      }

      setProfile(data || null);

      // Backfill first/last name from auth metadata if missing
      if (data && !data.first_name && user.user_metadata?.username) {
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
            setProfile(prev => prev ? { ...prev, ...fields } : null);
          }
        }
      }
    } catch (error) {
      console.error('Error in fetchProfile:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

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

    // Update local state
    setProfile(prev => prev ? { ...prev, ...updateData } : null);
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

    setProfile(prev => prev ? { ...prev, ...fields } : null);
  };

  return {
    profile,
    loading,
    getInitials,
    getDisplayName,
    updateAvatar,
    updateProfile,
    refetch: fetchProfile,
  };
};
