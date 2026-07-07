
"use client";

import { useState } from "react"
import { Button } from "@/components/ui/button"
import Link from "next/link";
import { Input } from "@/components/ui/input"

export function LoginForm() {
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true)
        setError(null)

        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            const body = await res.json();

            if (!res.ok) {
                setError(body.error || `Error HTTP ${res.status}`);
                setLoading(false);
                return;
            }

            const lower = email.toLowerCase();
            let role: string;
            if (lower === 'admin@test.com' || lower.includes('admin')) role = 'admin';
            else if (lower.includes('teacher') || lower.includes('docente')) role = 'teacher';
            else role = 'student';

            localStorage.setItem('cached_user_profile', JSON.stringify({
                id: body.user.id, email, role,
                fullName: body.user.user_metadata?.full_name || 'Usuario',
                createdAt: body.user.created_at,
            }));

            window.location.href = `/dashboard/${role}`;
        } catch (e: any) {
            setError(e?.message || 'Error de conexión');
        }
        setLoading(false)
    }

    return (
        <div className="w-full max-w-md space-y-4 p-8 bg-card rounded-lg shadow-lg border border-border">
            <Link href="/" className="text-xs font-black text-primary/60 hover:text-primary transition-colors uppercase tracking-widest flex items-center gap-1 group mb-4">
               <span className="group-hover:-translate-x-1 transition-transform">←</span> Volver a la Landing
            </Link>
            <div className="text-center mb-8">
                <h1 className="text-2xl font-bold text-foreground">
                    SIM-COMEX PRO
                </h1>
                <p className="text-muted-foreground">
                    Inicia sesión para continuar
                </p>
            </div>

            <form onSubmit={onSubmit} className="space-y-6">
                <div className="space-y-2">
                    <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        Email
                    </label>
                    <Input
                        type="email"
                        placeholder="admin@test.com"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        required
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        Contraseña
                    </label>
                    <Input
                        type="password"
                        placeholder="••••••"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        required
                    />
                </div>

                {error && (
                    <div className="text-destructive text-sm font-medium">{error}</div>
                )}

                <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Conectando..." : "Ingresar"}
                </Button>
            </form>
        </div>
    )
}
