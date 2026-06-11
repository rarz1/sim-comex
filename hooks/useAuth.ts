
import { authService } from '@/lib/services/authService';
import { UserProfile } from '@/types/roles';
import { useEffect, useState } from 'react';

export function useAuth() {
    const [user, setUser] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const initAuth = async () => {
            const currentUser = await authService.getCurrentUser();
            setUser(currentUser);
            setLoading(false);
        };

        initAuth();

        // For Supabase, we still need the listener if not in mock mode
        if (!authService.isMockEnabled()) {
            const { createClient } = require('@/lib/supabase/client');
            const supabase = createClient();
            const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event: any, session: any) => {
                if (session?.user) {
                    const profile = await authService.getCurrentUser();
                    setUser(profile);
                } else {
                    setUser(null);
                }
                setLoading(false);
            });

            return () => subscription.unsubscribe();
        }
    }, []);

    return { user, loading };
}
