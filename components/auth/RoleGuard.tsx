
"use client";

import { useAuth } from '@/hooks/useAuth';
import { UserRole } from '@/types/roles';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

interface RoleGuardProps {
    children: React.ReactNode;
    allowedRoles: UserRole[];
}

export function RoleGuard({ children, allowedRoles }: RoleGuardProps) {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading) {
            if (!user) {
                router.push('/login');
            } else if (!allowedRoles.includes(user.role)) {
                router.push('/unauthorized'); // Or dashboard based on role
            }
        }
    }, [user, loading, allowedRoles, router]);

    if (loading) {
        return <div className="flex items-center justify-center p-8">Cargando...</div>;
    }

    if (!user || !allowedRoles.includes(user.role)) {
        return null; // Or a spinner/skeleton while redirecting
    }

    return <>{children}</>;
}
