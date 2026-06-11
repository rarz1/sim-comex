
"use client";

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import Link from "next/link";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { useRouter } from "next/navigation"
import { authService } from "@/lib/services/authService"
import { useAppText } from "@/hooks/useAppText"

const formSchema = z.object({
    email: z.string().email({
        message: "Email inválido.",
    }),
    password: z.string().min(6, {
        message: "La contraseña debe tener al menos 6 caracteres.",
    }),
})

export function LoginForm() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const { t } = useAppText()

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            email: "",
            password: "",
        },
    })

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setLoading(true)
        setError(null)

        const { user, error: loginError } = await authService.login(values.email, values.password);

        if (loginError) {
            setError(loginError)
            setLoading(false)
        } else if (user) {
            router.refresh()
            const dashboardPath = `/dashboard/${user.role === 'admin' ? 'admin' : user.role === 'teacher' ? 'teacher' : 'student'}`;
            window.location.href = dashboardPath;
        }
    }

    return (
        <div className="w-full max-w-md space-y-4 p-8 bg-card rounded-lg shadow-lg border border-border">
            <Link href="/" className="text-xs font-black text-primary/60 hover:text-primary transition-colors uppercase tracking-widest flex items-center gap-1 group mb-4">
               <span className="group-hover:-translate-x-1 transition-transform">←</span> Volver a la Landing
            </Link>
            <div className="text-center mb-8">
                <h1 className="text-2xl font-bold text-foreground">
                    {t('common.login.title', 'SIM-COMEX PRO')}
                </h1>
                <p className="text-muted-foreground">
                    {t('common.login.subtitle', 'Inicia sesión para continuar')}
                </p>
            </div>

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t('common.login.label_email', 'Email')}</FormLabel>
                                <FormControl>
                                    <Input placeholder="admin@test.com" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="password"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t('common.login.label_password', 'Contraseña')}</FormLabel>
                                <FormControl>
                                    <Input type="password" placeholder="••••••" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    {error && (
                        <div className="text-destructive text-sm font-medium">{error}</div>
                    )}

                    <Button type="submit" className="w-full" disabled={loading}>
                        {loading ? "..." : t('common.login.btn_submit', 'Ingresar')}
                    </Button>
                </form>
            </Form>
        </div>
    )
}
