
import { authService } from '@/lib/services/authService';
import { UserProfile } from '@/types/roles';
import { useEffect, useState } from 'react';

export function useAuth() {
    const [user, setUser] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;

        const initAuth = async () => {
            try {
                const currentUser = await authService.getCurrentUser();
                if (!cancelled) setUser(currentUser);
            } catch (e) {
                console.error("useAuth: error getting current user", e);
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        initAuth();

        return () => { cancelled = true; };
    }, []);

    return { user, loading };
}
