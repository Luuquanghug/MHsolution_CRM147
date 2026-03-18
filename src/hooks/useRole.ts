import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { DEFAULT_ROLE } from "@/config/app";

export type UserRole = 'admin' | 'sales_person' | null;

export const useRole = () => {
  const { user } = useAuth();
  const [role, setRole] = useState<UserRole>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRole = async () => {
      if (!user) {
        console.log('No user, setting role to null');
        setRole(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        console.log('Fetching role for user:', user.id);
        const { data, error } = await supabase
          .from('profiles')
          .select('user_roles')
          .eq('id', user.id)
          .single();

        console.log('Role query result:', { data, error });

        if (error) {
          console.error('Error fetching user role:', error);
          setRole(DEFAULT_ROLE); // Default role
        } else {
          const userRole = data?.user_roles || DEFAULT_ROLE;
          console.log('Setting role to:', userRole);
          setRole(userRole);
        }
      } catch (error) {
        console.error('Error fetching user role:', error);
        setRole(DEFAULT_ROLE); // Default role
      } finally {
        setLoading(false);
      }
    };

    fetchRole();
  }, [user?.id]);

  const isAdmin = role === 'admin';
  const isSalesPerson = role === 'sales_person';

  console.log('useRole state:', { role, loading, isAdmin, isSalesPerson });

  return {
    role,
    loading,
    isAdmin,
    isSalesPerson,
  };
};