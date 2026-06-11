
"use client";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && user) {
            if (user.role === 'admin') router.push('/dashboard/admin');
            else if (user.role === 'teacher') router.push('/dashboard/teacher');
            else if (user.role === 'student') router.push('/dashboard/student');
        }
    }, [user, loading, router]);

    return <div className="p-8">Redirigiendo a su panel...</div>;
}
