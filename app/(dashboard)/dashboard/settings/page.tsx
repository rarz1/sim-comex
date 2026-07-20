"use client";

import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
    Settings, 
    Lock, 
    Bell, 
    Palette, 
    Database, 
    Globe, 
    LogOut,
    Eye,
    EyeOff,
    Check,
    RefreshCw,
    Clock,
    Trash2,
    Monitor,
    Sun,
    Moon,
    Loader2,
    AlertCircle
} from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import { authService } from "@/lib/services/authService";
import { toast } from "sonner";

export default function SettingsPage() {
    const { user } = useAuth();
    const { setTheme, theme } = useTheme();
    const [showPassword, setShowPassword] = useState(false);
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [changingPassword, setChangingPassword] = useState(false);

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-20">
            <div className="flex flex-col gap-2">
                <h1 className="text-4xl font-black tracking-tighter text-primary flex items-center gap-3">
                    <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                        <Settings className="h-7 w-7 text-primary" />
                    </div>
                    Configuración
                </h1>
                <p className="text-muted-foreground font-medium text-lg">Administra tus preferencias de cuenta y ajustes de la plataforma.</p>
            </div>

            <Tabs defaultValue="account" className="space-y-8">
                <TabsList className="grid grid-cols-4 h-16 p-1.5 rounded-3xl bg-muted/40 border border-muted-foreground/10">
                    <TabsTrigger value="account" className="rounded-2xl font-black uppercase text-[10px] tracking-widest gap-2 data-[state=active]:bg-white data-[state=active]:shadow-lg transition-all">
                        <Lock className="w-4 h-4" /> Cuenta
                    </TabsTrigger>
                    <TabsTrigger value="ui" className="rounded-2xl font-black uppercase text-[10px] tracking-widest gap-2 data-[state=active]:bg-white data-[state=active]:shadow-lg transition-all">
                        <Palette className="w-4 h-4" /> Interfaz
                    </TabsTrigger>
                    <TabsTrigger value="notifications" className="rounded-2xl font-black uppercase text-[10px] tracking-widest gap-2 data-[state=active]:bg-white data-[state=active]:shadow-lg transition-all">
                        <Bell className="w-4 h-4" /> Notificaciones
                    </TabsTrigger>
                    <TabsTrigger value="data" className="rounded-2xl font-black uppercase text-[10px] tracking-widest gap-2 data-[state=active]:bg-white data-[state=active]:shadow-lg transition-all">
                        <Database className="w-4 h-4" /> Datos
                    </TabsTrigger>
                </TabsList>

                {/* ACCOUNT SECURITY */}
                <TabsContent value="account">
                    <Card className="rounded-[2.5rem] border-none shadow-xl bg-white dark:bg-black/40 overflow-hidden">
                        <CardHeader className="p-8 border-b border-dashed border-muted-foreground/10">
                            <CardTitle className="text-xl font-black">Seguridad de la Cuenta</CardTitle>
                            <CardDescription>Actualiza tu contraseña y gestiona la seguridad de tu acceso.</CardDescription>
                        </CardHeader>
                        <CardContent className="p-8 space-y-8">
                            <div className="grid gap-6">
                            <div className="space-y-2">
                                <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Contraseña Actual</Label>
                                <div className="relative">
                                    <Input 
                                        type={showPassword ? "text" : "password"} 
                                        className="h-12 rounded-2xl border-muted-foreground/20 focus:border-primary/50 transition-all pl-10 pr-10"
                                        value={currentPassword}
                                        onChange={e => setCurrentPassword(e.target.value)}
                                    />
                                    <Lock className="absolute left-3 top-3.5 h-5 w-5 text-muted-foreground/40" />
                                    <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className="absolute right-2 top-1.5 hover:bg-transparent"
                                        onClick={() => setShowPassword(!showPassword)}
                                    >
                                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </Button>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Nueva Contraseña</Label>
                                    <Input type="password" className="h-12 rounded-2xl border-muted-foreground/20"
                                        value={newPassword}
                                        onChange={e => setNewPassword(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Confirmar Contraseña</Label>
                                    <Input type="password" className="h-12 rounded-2xl border-muted-foreground/20"
                                        value={confirmPassword}
                                        onChange={e => setConfirmPassword(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="pt-4 flex justify-end">
                            <Button className="rounded-2xl font-black uppercase text-[10px] tracking-widest px-10 h-12 shadow-lg shadow-primary/20"
                                disabled={changingPassword || !newPassword || !confirmPassword}
                                onClick={async () => {
                                    if (newPassword !== confirmPassword) {
                                        toast.error("Las contraseñas no coinciden");
                                        return;
                                    }
                                    if (newPassword.length < 6) {
                                        toast.error("La contraseña debe tener al menos 6 caracteres");
                                        return;
                                    }
                                    setChangingPassword(true);
                                    const result = await authService.changePassword(newPassword);
                                    setChangingPassword(false);
                                    if (result.success) {
                                        toast.success("Contraseña actualizada correctamente");
                                        setCurrentPassword("");
                                        setNewPassword("");
                                        setConfirmPassword("");
                                    } else {
                                        toast.error(result.error || "Error al cambiar la contraseña");
                                    }
                                }}>
                                {changingPassword ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                Actualizar Contraseña
                            </Button>
                        </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* UI PREFERENCES */}
                <TabsContent value="ui">
                    <Card className="rounded-[2.5rem] border-none shadow-xl bg-white dark:bg-black/40">
                        <CardHeader className="p-8">
                            <CardTitle className="text-xl font-black">Personalización Visual</CardTitle>
                            <CardDescription>Ajusta la apariencia de la plataforma a tu gusto.</CardDescription>
                        </CardHeader>
                        <CardContent className="p-8 pt-0 space-y-10">
                            <div className="space-y-6">
                                <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Modo de Visualización</Label>
                                <div className="grid grid-cols-3 gap-4">
                                    {[
                                        { id: 'light', label: 'Claro', icon: Sun },
                                        { id: 'dark', label: 'Oscuro', icon: Moon },
                                        { id: 'system', label: 'Sistema', icon: Monitor },
                                    ].map((mode) => (
                                        <button
                                            key={mode.id}
                                            onClick={() => setTheme(mode.id)}
                                            className={cn(
                                                "flex flex-col items-center gap-3 p-6 rounded-3xl border-2 transition-all group",
                                                theme === mode.id ? "border-primary bg-primary/5" : "border-muted-foreground/10 hover:border-primary/30"
                                            )}
                                        >
                                            <mode.icon className={cn("h-8 w-8 transition-transform group-hover:scale-110", theme === mode.id ? "text-primary" : "text-muted-foreground")} />
                                            <span className={cn("text-[10px] font-black uppercase tracking-widest", theme === mode.id ? "text-primary" : "text-muted-foreground")}>{mode.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="flex items-center justify-between p-6 rounded-3xl bg-muted/30 border border-muted-foreground/10">
                                <div className="space-y-1">
                                    <p className="font-bold">Animaciones de Interfaz</p>
                                    <p className="text-sm text-muted-foreground">Habilita efectos visuales y transiciones suaves.</p>
                                </div>
                                <Switch defaultChecked />
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* NOTIFICATIONS */}
                <TabsContent value="notifications">
                    <Card className="rounded-[2.5rem] border-none shadow-xl bg-white dark:bg-black/40">
                        <CardHeader className="p-8">
                            <CardTitle className="text-xl font-black">Notificaciones y Alertas</CardTitle>
                            <CardDescription>Elige qué tipo de avisos deseas recibir por correo electrónico.</CardDescription>
                        </CardHeader>
                        <CardContent className="p-8 pt-0 space-y-6">
                            {[
                                { title: "Nuevos Documentos", desc: "Avisar cuando un docente me asigne un nuevo formulario.", icon: Bell },
                                { title: "Fechas de Cierre", desc: "Recordatorios 24 horas antes de que venza un módulo.", icon: Clock },
                                { title: "Retroalimentación", desc: "Notificar cuando un docente califique o comente mi borrador.", icon: Check },
                                { title: "Mensajes del Sistema", desc: "Avisos sobre mantenimiento o nuevas funciones.", icon: Globe },
                            ].map((item, i) => (
                                <div key={i} className="flex items-center justify-between p-6 rounded-3xl bg-muted/20 border border-muted-foreground/5 hover:bg-muted/40 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className="h-10 w-10 rounded-xl bg-white dark:bg-black/20 flex items-center justify-center shadow-sm">
                                            <item.icon className="h-5 w-5 text-primary" />
                                        </div>
                                        <div className="space-y-0.5">
                                            <p className="font-bold">{item.title}</p>
                                            <p className="text-xs text-muted-foreground">{item.desc}</p>
                                        </div>
                                    </div>
                                    <Switch defaultChecked={i < 3} />
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* DATA MANAGEMENT */}
                <TabsContent value="data">
                    <Card className="rounded-[2.5rem] border-none shadow-xl bg-white dark:bg-black/40 overflow-hidden relative">
                        <CardHeader className="p-8">
                            <CardTitle className="text-xl font-black">Gestión de Datos Locales</CardTitle>
                            <CardDescription>Controla el almacenamiento offline y la sincronización con la nube.</CardDescription>
                        </CardHeader>
                        <CardContent className="p-8 pt-0 space-y-8">
                            <div className="p-6 rounded-3xl bg-blue-500/5 border border-blue-500/10 flex items-start gap-4">
                                <RefreshCw className="h-6 w-6 text-blue-500 mt-1" />
                                <div className="space-y-2">
                                    <p className="font-black text-blue-600 uppercase text-[10px] tracking-widest">Estado de Sincronización</p>
                                    <p className="text-sm font-medium">Tus borradores se están guardando automáticamente en la base de datos local (IndexedDB) y se sincronizan con el servidor en tiempo real.</p>
                                    <Button variant="outline" className="rounded-xl font-bold text-xs h-9 border-blue-500/20 text-blue-600 hover:bg-blue-500/10">
                                        Forzar Sincronización
                                    </Button>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Acciones Críticas</Label>
                                <div className="flex items-center justify-between p-6 rounded-3xl bg-red-500/5 border border-red-500/10">
                                    <div className="space-y-1">
                                        <p className="font-bold text-red-600">Limpiar Caché Local</p>
                                        <p className="text-xs text-red-600/70">Elimina los borradores locales guardados en este navegador. No afecta los datos en el servidor.</p>
                                    </div>
                                    <Button variant="ghost" className="rounded-xl text-red-600 hover:bg-red-500/10 gap-2">
                                        <Trash2 className="h-4 w-4" /> Limpiar
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            <div className="flex justify-center pt-10">
                <Button variant="ghost" className="text-red-500 font-black uppercase text-[10px] tracking-widest gap-2 hover:bg-red-500/5 px-8 rounded-2xl h-12">
                    <LogOut className="w-4 h-4" /> Cerrar Sesión en todos los dispositivos
                </Button>
            </div>
        </div>
    );
}
