"use client";

import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
    User, 
    Mail, 
    Calendar, 
    BookOpen, 
    Award, 
    Clock, 
    Camera, 
    Edit,
    FileText,
    TrendingUp,
    ShieldCheck,
    PenTool
} from "lucide-react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db/db";
import { useMemo } from "react";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

export default function ProfilePage() {
    const { user } = useAuth();
    
    // Fetch user-specific stats
    const allGroups = useLiveQuery(() => db.groups.toArray()) || [];
    const myDrafts = useLiveQuery(() => user ? db.drafts.where({ userId: user.id }).toArray() : []) || [];
    
    const myGroups = useMemo(() => {
        if (!user) return [];
        return allGroups.filter(g => (g.members || []).includes(user.id));
    }, [allGroups, user]);

    const stats = [
        { label: "Grupos Inscritos", val: myGroups.length, icon: User, color: "text-blue-500", bg: "bg-blue-500/10" },
        { label: "Documentos Finalizados", val: myDrafts.filter(d => (d as any).status === 'completed').length, icon: FileText, color: "text-green-500", bg: "bg-green-500/10" },
        { label: "Borradores", val: myDrafts.filter(d => (d as any).status !== 'completed').length, icon: PenTool, color: "text-orange-500", bg: "bg-orange-500/10" },
    ];

    return (
        <div className="max-w-6xl mx-auto space-y-8 pb-20">
            {/* HERO SECTION / IDENTITY */}
            <div className="relative h-64 rounded-[2.5rem] overflow-hidden shadow-2xl group">
                <div className="absolute inset-0 bg-gradient-to-r from-primary via-primary/80 to-blue-600 animate-gradient-x" />
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10" />
                
                <div className="absolute bottom-0 left-0 right-0 p-8 flex flex-col md:flex-row md:items-end gap-6 translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                    <div className="relative group/avatar">
                        <Avatar className="h-32 w-32 border-4 border-white shadow-2xl rounded-3xl overflow-hidden">
                            <AvatarImage src={user?.avatarUrl} />
                            <AvatarFallback className="bg-primary text-white text-4xl font-black">
                                {user?.fullName?.charAt(0) || "U"}
                            </AvatarFallback>
                        </Avatar>
                        <Button size="icon" variant="secondary" className="absolute -bottom-2 -right-2 h-10 w-10 rounded-xl shadow-lg opacity-0 group-hover/avatar:opacity-100 transition-opacity">
                            <Camera className="h-5 w-5" />
                        </Button>
                    </div>
                    
                    <div className="flex-1 space-y-1 mb-2">
                        <div className="flex items-center gap-3">
                            <h1 className="text-4xl font-black text-white tracking-tighter">{user?.fullName}</h1>
                            <Badge className="bg-white/20 hover:bg-white/30 text-white border-none backdrop-blur-md uppercase font-black text-[10px] tracking-widest px-3 py-1">
                                {user?.role === 'student' ? 'Estudiante' : 'Usuario'}
                            </Badge>
                        </div>
                        <p className="text-white/80 font-medium flex items-center gap-2">
                            <Mail className="h-4 w-4" /> {user?.email}
                        </p>
                    </div>
                    
                    <div className="flex gap-3 mb-2">
                        <Button className="rounded-2xl font-black uppercase text-[10px] tracking-widest px-8 h-12 bg-white text-primary hover:bg-gray-100 transition-all shadow-xl">
                            <Edit className="mr-2 h-4 w-4" /> Editar Perfil
                        </Button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* LEFT COLUMN: INFO & STATS */}
                <div className="space-y-8">
                    {/* STATS GRID */}
                    <div className="grid grid-cols-1 gap-4">
                        {stats.map((stat, i) => (
                            <Card key={i} className="border-none shadow-sm bg-white dark:bg-black/20 rounded-3xl group hover:shadow-xl transition-all">
                                <CardContent className="p-6 flex items-center gap-5">
                                    <div className={cn("h-14 w-14 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110", stat.bg)}>
                                        <stat.icon className={cn("h-7 w-7", stat.color)} />
                                    </div>
                                    <div>
                                        <p className="text-2xl font-black text-gray-900 dark:text-gray-100">{stat.val}</p>
                                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{stat.label}</p>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    {/* ACADEMIC INFO */}
                    <Card className="rounded-[2rem] border-none shadow-sm bg-muted/30">
                        <CardHeader>
                            <CardTitle className="text-lg font-black flex items-center gap-2">
                                <ShieldCheck className="w-5 h-5 text-primary" />
                                INFORMACIÓN ACADÉMICA
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-1">
                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Institución</p>
                                <p className="font-bold text-gray-800 dark:text-gray-200">Universidad de Comercio Exterior</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Programa</p>
                                <p className="font-bold text-gray-800 dark:text-gray-200">Logística y Operaciones Internacionales</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Estado de Sincronización</p>
                                <div className="flex items-center gap-2 text-green-600 font-bold text-sm">
                                    <Clock className="w-4 h-4" /> Cloud Sync Activo
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* RIGHT COLUMN: RECENT ACTIVITY & PROGRESS */}
                <div className="lg:col-span-2 space-y-8">
                    {/* OVERALL PROGRESS */}
                    <Card className="rounded-[2.5rem] border-none shadow-xl bg-white dark:bg-black/40 overflow-hidden relative">
                        <div className="absolute top-0 left-0 w-2 h-full bg-primary" />
                        <CardHeader className="p-8">
                            <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                    <CardTitle className="text-2xl font-black tracking-tighter">Progreso General</CardTitle>
                                    <CardDescription className="text-base font-medium">Resumen de tu avance en todos los módulos asignados.</CardDescription>
                                </div>
                                <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                                    <TrendingUp className="h-8 w-8 text-primary" />
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-8 pt-0 space-y-8">
                            <div className="space-y-3">
                                <div className="flex justify-between items-center px-1">
                                    <span className="text-sm font-black uppercase tracking-widest text-primary">Avance Total</span>
                                    <span className="text-4xl font-black tracking-tighter">75%</span>
                                </div>
                                <Progress value={75} className="h-4 rounded-full shadow-inner" />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="p-6 rounded-3xl bg-muted/50 border border-muted-foreground/10 space-y-2">
                                    <div className="flex items-center gap-2 text-primary">
                                        <Award className="w-5 h-5" />
                                        <span className="text-xs font-black uppercase tracking-widest">Próximo Logro</span>
                                    </div>
                                    <p className="font-bold text-lg">Maestro de Aduanas</p>
                                    <p className="text-xs text-muted-foreground italic">Completa 5 documentos de importación para desbloquear.</p>
                                </div>
                                <div className="p-6 rounded-3xl bg-muted/50 border border-muted-foreground/10 space-y-2">
                                    <div className="flex items-center gap-2 text-blue-500">
                                        <BookOpen className="w-5 h-5" />
                                        <span className="text-xs font-black uppercase tracking-widest">Módulo Actual</span>
                                    </div>
                                    <p className="font-bold text-lg">Simulación COMEX III</p>
                                    <p className="text-xs text-muted-foreground italic">Grupo B - Docente: Dr. Ramírez</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* ACTIVITY TIMELINE (MOCK) */}
                    <Card className="rounded-[2.5rem] border-none shadow-sm bg-white dark:bg-black/20">
                        <CardHeader className="p-8">
                            <CardTitle className="text-xl font-black flex items-center gap-2">
                                <Clock className="w-6 h-6 text-primary" />
                                ACTIVIDAD RECIENTE
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-8 pt-0 space-y-6">
                            {[1, 2, 3].map((_, i) => (
                                <div key={i} className="flex gap-6 items-start relative group">
                                    {i < 2 && <div className="absolute left-[23px] top-12 bottom-0 w-px bg-muted-foreground/20" />}
                                    <div className="h-12 w-12 rounded-2xl bg-muted flex items-center justify-center shrink-0 z-10 group-hover:bg-primary group-hover:text-white transition-all">
                                        <FileText className="w-6 h-6" />
                                    </div>
                                    <div className="space-y-1 flex-1">
                                        <p className="font-bold text-lg group-hover:text-primary transition-colors">Diligenció Factura Proforma</p>
                                        <p className="text-sm text-muted-foreground">En el grupo <span className="font-bold text-gray-700 dark:text-gray-300">Simulación Comex - Sección A</span></p>
                                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pt-1 flex items-center gap-1.5">
                                            <Calendar className="w-3 h-3" /> Hace 2 horas
                                        </p>
                                    </div>
                                    <Button variant="ghost" size="sm" className="rounded-xl font-bold opacity-0 group-hover:opacity-100 transition-opacity">Ver</Button>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
