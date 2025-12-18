import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient'; // <-- CUKUP MUNDUR 1 LANGKAH (../)

export function useUserRole() {
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getRole = async () => {
      try {
        // 1. Cek User Login
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          // 2. Cek Role dia di tabel profiles
          const { data, error } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();
          
          if (!error && data) {
            setRole(data.role);
          } else {
            setRole('staff'); // Default kalau error/gak ada data
          }
        }
      } catch (error) {
        console.error("Gagal cek role:", error);
        setRole('staff');
      } finally {
        setLoading(false);
      }
    };

    getRole();
  }, []);

  return { 
    role, 
    loading, 
    isAdmin: role === 'admin', // Shortcut cek admin
    isStaff: role === 'staff'  // Shortcut cek staff
  };
}