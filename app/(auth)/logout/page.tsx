
"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function LogoutPage() {
    const router = useRouter();

    useEffect(() => {
        const logout = async () => {
            // Clear mock session
            if (typeof window !== 'undefined') {
                localStorage.removeItem('mock_user_session');
            }

            // Clear supabase session
            const supabase = createClient();
            await supabase.auth.signOut();

            router.push('/login');
            router.refresh();
        };
        logout();
    }, [router]);

    return <div className="flex h-screen items-center justify-center">Cerrando sesión...</div>;
}
