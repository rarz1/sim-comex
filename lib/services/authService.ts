
import { createClient } from '../supabase/client';
import { UserProfile } from '@/types/roles';

const MOCK_SESSION_KEY = 'mock_user_session';
const PROFILE_CACHE_KEY = 'cached_user_profile';

export const authService = {
    isMockEnabled(): boolean {
        const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
        return !url || url.includes('your-project');
    },

    async hasValidSession(): Promise<boolean> {
        if (this.isMockEnabled()) return false;
        try {
            const supabase = createClient();
            const res = await supabase.auth.getSession();
            if (res.data?.session) return true;
        } catch { /* fallback to cached */ }
        // Si hay perfil cacheado, consideramos sesión válida
        return !!this.getCachedProfile();
    },

    async getConnectionStatus(): Promise<'cloud' | 'local' | 'mock'> {
        if (this.isMockEnabled()) return 'mock';
        if (await this.hasValidSession()) return 'cloud';
        return 'local';
    },

    async getCurrentUser(): Promise<UserProfile | null> {
        if (this.isMockEnabled()) {
            try {
                const stored = localStorage.getItem(MOCK_SESSION_KEY);
                return stored ? JSON.parse(stored) : null;
            } catch (e) {
                console.error("Failed to parse mock session", e);
                localStorage.removeItem(MOCK_SESSION_KEY);
                return null;
            }
        }

        const supabase = createClient();

        // Race against timeout to prevent hanging
        const sessionResult = await Promise.race([
            supabase.auth.getSession(),
            new Promise<null>((_, reject) => setTimeout(() => reject(new Error('timeout')), 5000))
        ]).catch(() => null);

        const session = sessionResult?.data?.session ?? null;
        const cached = this.getCachedProfile();

        if (!session?.user) {
            // Try to refresh session silently before falling back to local-only mode
            try {
                const refreshRes = await supabase.auth.refreshSession();
                const refreshed = refreshRes.data?.session;
                if (refreshed?.user) {
                    const profile = await this.resolveUserRole(refreshed.user, supabase);
                    this.cacheProfile(profile);
                    return profile;
                }
            } catch { /* refresh failed, continue with cached */ }
            return cached || null;
        }

        const user = session.user;

        // Return cached immediately, refresh in background
        if (cached && cached.email === user.email) {
            this.resolveAndCacheProfile(user, supabase);
            return cached;
        }

        // First time: resolve role synchronously
        const profile = await this.resolveUserRole(user, supabase);
        this.cacheProfile(profile);
        return profile;
    },

    getCachedProfile(): UserProfile | null {
        try {
            const stored = localStorage.getItem(PROFILE_CACHE_KEY);
            return stored ? JSON.parse(stored) : null;
        } catch { return null; }
    },

    cacheProfile(profile: UserProfile) {
        try { localStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(profile)); }
        catch { /* quota exceeded */ }
    },

    async resolveUserRole(user: any, supabase?: any): Promise<UserProfile> {
        const client = supabase || createClient();
        let role = user.user_metadata?.role as UserProfile['role'] | undefined;

        if (!role) {
            try {
                const { data: profile } = await client
                    .from('profiles')
                    .select('role')
                    .eq('id', user.id)
                    .maybeSingle();
                if (profile?.role) role = profile.role as UserProfile['role'];
            } catch { /* profile not found */ }
        }

        if (!role) {
            const lower = (user.email || '').toLowerCase();
            if (lower === 'admin@test.com' || lower.includes('admin')) role = 'admin';
            else if (lower.includes('teacher') || lower.includes('docente') || lower.includes('prof')) role = 'teacher';
            else role = 'student';
        }

        return {
            id: user.id,
            email: user.email!,
            role,
            fullName: user.user_metadata?.full_name || 'Usuario',
            createdAt: user.created_at,
            avatarUrl: user.user_metadata?.avatar_url
        };
    },

    async resolveAndCacheProfile(user: any, supabase?: any) {
        const profile = await this.resolveUserRole(user, supabase);
        this.cacheProfile(profile);
    },

    async login(email: string, password?: string): Promise<{ user?: UserProfile; error?: string }> {
        if (this.isMockEnabled()) {
            // Simulated delay
            await new Promise(r => setTimeout(r, 800));

            // Basic mock logic based on email
            const lowerEmail = email.toLowerCase();
            let role: UserProfile['role'] = 'student';
            let name = 'Usuario';
            let id = `mock-${Date.now()}`;
            let avatarSeed = 'user';

            // Deterministic ID generation for ALL users to ensure data persistence
            // Standardize: role-name-hash or similar.
            // Simplified: role-emailprefix (assuming unique emails)

            const emailPrefix = lowerEmail.split('@')[0].replace(/[^a-z0-9]/g, '');

            if (lowerEmail === 'admin@test.com' || lowerEmail.includes('admin')) {
                role = 'admin'; name = 'Administrador'; id = 'admin-1';
            } else if (lowerEmail === 'teacher@test.com') {
                role = 'teacher'; name = 'Docente Principal'; id = 'teacher';
            } else if (lowerEmail === 'student@test.com') {
                role = 'student'; name = 'Estudiante Modelo'; id = 'student';
            } else if (lowerEmail === 'student2@test.com') {
                role = 'student'; name = 'Estudiante Comparativo'; id = 'student-2';
            } else {
                if (lowerEmail.includes('teacher') || lowerEmail.includes('docente') || lowerEmail.includes('prof')) {
                    role = 'teacher';
                } else if (['maria.gonzales@test.com', 'carlos.ruis@test.com', 'juan.perez@test.com'].includes(lowerEmail)) {
                    role = 'teacher';
                }

                name = lowerEmail.split('@')[0].replace('.', ' ').replace(/\b\w/g, l => l.toUpperCase());
                id = `${role}-${emailPrefix}`;
            }

            const mockUser: UserProfile = {
                id,
                email,
                role,
                fullName: name,
                createdAt: new Date().toISOString(),
                avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${avatarSeed}`
            };

            localStorage.setItem(MOCK_SESSION_KEY, JSON.stringify(mockUser));
            return { user: mockUser };
        }

        // Login via proxy API route (same-origin → sin bloqueos CSP/CORS)
        let user: any;
        let accessToken: string | undefined;
        let refreshToken: string | undefined;

        try {
            const loginResPromise = fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password: password || '' }),
            });

            const loginRes: any = await Promise.race([
                loginResPromise,
                new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('Timeout: El servidor no responde')), 20000)
                )
            ]);

            const body = await loginRes.json();
            if (!loginRes.ok) {
                return { error: body.error || `Error HTTP ${loginRes.status}` };
            }
            user = body.user;
            accessToken = body.access_token;
            refreshToken = body.refresh_token;
        } catch (fetchErr: any) {
            return { error: fetchErr?.message || 'Error de conexión con el servidor.' };
        }

        if (!user) return { error: 'No se pudo autenticar. Respuesta inesperada.' };

        // Inyectar sesión en el cliente Supabase para REST calls
        const supabase = createClient();
        if (accessToken && refreshToken) {
            try {
                await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
            } catch { /* fallback: REST calls seguirán funcionando con el token directamente */ }
        }

        // 1. Try role from user_metadata first
        let role = user.user_metadata?.role as UserProfile['role'] | undefined;

        // 2. Infer from email pattern (stronger signal than trigger default 'student')
        if (!role) {
            const lower = email.toLowerCase();
            if (lower === 'admin@test.com' || lower.includes('admin')) role = 'admin';
            else if (lower.includes('teacher') || lower.includes('docente') || lower.includes('prof')) role = 'teacher';
            else role = 'student';
        }

        // 4. Check profiles table and correct if trigger gave wrong role
        try {
            const { data: profile } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', user.id)
                .single();
            if (profile?.role && profile.role !== role) {
                await supabase.from('profiles').update({ role }).eq('id', user.id);
            }
        } catch { /* profile not found, upsert handles it */ }

        const userProfile: UserProfile = {
            id: user.id,
            email: user.email!,
            role,
            fullName: user.user_metadata?.full_name || 'Usuario',
            createdAt: user.created_at,
            avatarUrl: user.user_metadata?.avatar_url
        };

        // Sync with Supabase 'profiles' table (ensure correct role)
        try {
            await supabase.from('profiles').upsert({
                id: userProfile.id,
                email: userProfile.email,
                name: userProfile.fullName,
                role: userProfile.role,
                document_type: user.user_metadata?.document_type || null,
                document_number: user.user_metadata?.document_number || null,
            });
        } catch (syncError) {
            console.error('Failed to sync profile to Supabase:', syncError);
        }

        // Cache profile to localStorage for fast subsequent loads
        this.cacheProfile(userProfile);

        return { user: userProfile };
    },

    async changePassword(password: string): Promise<{ success: boolean; error?: string }> {
        try {
            const res = await fetch('/api/auth/change-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password }),
            })
            const json = await res.json()
            if (!res.ok || json.error) {
                return { success: false, error: json.error || `Error HTTP ${res.status}` }
            }
            return { success: true }
        } catch (err: any) {
            return { success: false, error: err.message || 'Error de conexión' }
        }
    },

    async logout() {
        if (this.isMockEnabled()) {
            localStorage.removeItem(MOCK_SESSION_KEY);
            return;
        }
        const supabase = createClient();
        await supabase.auth.signOut();
    }
};
