
import { createClient } from '../supabase/client';
import { UserProfile } from '@/types/roles';

const MOCK_SESSION_KEY = 'mock_user_session';
const PROFILE_CACHE_KEY = 'cached_user_profile';

export const authService = {
    isMockEnabled(): boolean {
        const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
        return !url || url.includes('your-project');
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
            try {
                const { db } = await import('@/lib/db/db');
                const existing = await db.users.where('email').equals(user.email!).first();
                if (existing?.role) role = existing.role as UserProfile['role'];
            } catch { /* dexie error */ }
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
                // Dynamic but DETERMINISTIC
                // Check if it's likely a teacher or student based on email/conventions or just default to student
                // User said "maria gonzales" (teacher).
                // Let's assume if it contains 'docente' or 'teacher' or 'prof' it's a teacher, otherwise check explicit list?
                // Or better: In mock mode, maybe we default to student UNLESS specified?
                // The user is "testing with real data", implying they might be creating users in the Admin panel.
                // If they created users in Admin panel, those are stored in DB.
                // WE SHOULD CHECK DB FIRST in mock mode login!

                // This part of authService is "Login".
                // If I log in as "maria@test.com", I expect to match the "maria" user in DB.

                // Logic:
                // 1. Try to find user in DB by email.
                // 2. If found, use that ID and Role.
                // 3. If not found, generate deterministic ID.

                // We'll leave the generation here but we need to look up in DB inside the login function if possible, 
                // OR ensure the generation matches how the Admin Panel created them.

                // Admin Panel (GroupManager) creates users? No, usually Seed or Registration.
                // If "Real Data" means they manually added them? 
                // Let's make the ID deterministic so it persists across logins at least.

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

            // Save or Update in IndexedDB
            const { db } = await import('@/lib/db/db');
            try {
                // 1. Check if user already exists by EMAIL (prevent duplicates)
                const existingByEmail = await db.users.where('email').equals(email).first();

                if (existingByEmail && existingByEmail.id) {
                    // Update existing user to ensure latest name/role
                    // STOP OVERWRITING ROLE: Trust the database role if it exists.
                    // This allows Admins to manually change a user's role (e.g. Student -> Teacher)
                    // and have it persist even if they log in again.

                    // We only update if strictly necessary, but better to just Respect DB.
                    role = existingByEmail.role as UserProfile['role'];
                    name = existingByEmail.name;
                    id = existingByEmail.userId;

                    // Optional: Update timestamp or name if missing
                    /*
                   await db.users.update(existingByEmail.id, {
                       // lastLogin: ...
                   });
                   */

                    mockUser.id = existingByEmail.userId;
                    mockUser.role = existingByEmail.role as UserProfile['role'];
                    mockUser.fullName = existingByEmail.name;

                } else {
                    // 2. If not exists, insert new with Deterministic ID
                    await db.users.put({
                        userId: id, // The deterministic one computed above
                        email: email,
                        name: name,
                        role: role,
                        createdAt: new Date().toISOString()
                    });
                }
            } catch (error) {
                console.error('Failed to save user to IndexedDB:', error);
            }

            localStorage.setItem(MOCK_SESSION_KEY, JSON.stringify(mockUser));
            return { user: mockUser };
        }

        const supabase = createClient();
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password: password || '',
        });

        if (error) return { error: error.message };

        const user = data.user;

        // 1. Try role from user_metadata first
        let role = user.user_metadata?.role as UserProfile['role'] | undefined;

        // 2. Check IndexedDB (migration from mock mode - user previously existed)
        if (!role) {
            try {
                const { db } = await import('@/lib/db/db');
                const existing = await db.users.where('email').equals(email).first();
                if (existing?.role) role = existing.role as UserProfile['role'];
            } catch { /* dexie error */ }
        }

        // 3. Infer from email pattern (stronger signal than trigger default 'student')
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
                role: userProfile.role
            });
        } catch (syncError) {
            console.error('Failed to sync profile to Supabase:', syncError);
        }

        // Save to IndexedDB for offline access and admin panel (upsert by userId)
        const { db } = await import('@/lib/db/db');
        try {
            const existing = await db.users.where('userId').equals(user.id).first();
            if (existing?.id) {
                await db.users.update(existing.id, {
                    email: user.email!,
                    name: userProfile.fullName,
                    role: userProfile.role
                });
            } else {
                await db.users.add({
                    userId: user.id,
                    email: user.email!,
                    name: userProfile.fullName,
                    role: userProfile.role
                });
            }
        } catch (error) {
            console.error('Failed to save user to IndexedDB:', error);
        }

        // Cache profile to localStorage for fast subsequent loads
        this.cacheProfile(userProfile);

        return { user: userProfile };
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
