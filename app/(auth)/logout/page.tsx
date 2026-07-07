
"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function LogoutPage() {
    const router = useRouter();

    useEffect(() => {
        const logout = async () => {
            localStorage.removeItem('cached_user_profile');
            await fetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
            router.push('/login');
            router.refresh();
        };
        logout();
    }, [router]);

    return <div className="flex h-screen items-center justify-center">Cerrando sesión...</div>;
}
