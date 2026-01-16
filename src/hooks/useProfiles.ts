import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Profile {
  id: string;
  user_id: string;
  name: string;
  email: string;
  role: string;
}

export function useProfiles() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProfiles() {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .order('name');

        if (error) {
          throw error;
        }

        setProfiles(data || []);
      } catch (err) {
        console.error('Error fetching profiles:', err);
        setError(err instanceof Error ? err.message : 'Erro ao carregar perfis');
      } finally {
        setLoading(false);
      }
    }

    fetchProfiles();
  }, []);

  return { profiles, loading, error };
}
