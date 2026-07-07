"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Users, FileText, CheckCircle, BookOpen, ArrowRight, BarChart, Calendar, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useGroups, useModules, useDrafts, useTemplates, useUsers } from "@/hooks/useData";
import { cn } from "@/lib/utils";
import { useAppText } from "@/hooks/useAppText";

export default function TeacherDashboard() {
    const { user } = useAuth();

    const { data: allGroups } = useGroups();
    const { data: allModules } = useModules();
    const { data: allDrafts } = useDrafts();
    const { data: allTemplates } = useTemplates();
    const { data: allUsers } = useUsers();
    const { t } = useAppText();

    // Find my userId from the database (matching by email or id from auth)
    const myDbUser = allUsers?.find(u =>
        u.id === user?.id ||
        u.email === user?.email ||
        u.fullName === user?.fullName
    );

    const myGroups = allGroups?.filter(g =>
        g.teacherId === myDbUser?.id ||
        g.teacherId === user?.id ||
        g.teacherId === user?.fullName ||
        g.teacherId === user?.email
    ) || [];

    const studentCount = myGroups.reduce((acc, g) => acc + (g.members || []).length, 0);

    // Active groups: today falls between startDate and endDate
    const now = new Date();
    const todayActiveGroups = myGroups.filter(g => {
        return now >= new Date(g.startDate) && now <= new Date(g.endDate);
    });
    const activeGroupsCount = todayActiveGroups.length;

    // Document Stats
    const myModuleIds = new Set(myGroups.map(g => g.moduleId));
    const myTemplates = allTemplates?.filter(t => myModuleIds.has(t.moduleId)) || [];
    const myTemplateIds = new Set(myTemplates.map(t => t.id));
    const totalSubmissions = allDrafts?.filter(d => myTemplateIds.has(d.moduleId)) || [];

    // Group Performance (Drafts / Total Expected Docs)
    const groupsWithProgress = myGroups.map(group => {
        const moduleTemplates = myTemplates.filter(t => t.moduleId === group.moduleId);
        const totalExpectedDocs = moduleTemplates.length * (group.members || []).length;
        const groupDrafts = allDrafts?.filter(d =>
            moduleTemplates.some(t => t.id === d.moduleId) &&
            (group.members || []).includes(d.userId)
        ) || [];

        const progress = totalExpectedDocs > 0
            ? Math.round((groupDrafts.length / totalExpectedDocs) * 100)
            : 0;

        return { ...group, progress, docsCount: moduleTemplates.length };
    });

    const formatDate = (dateStr: string) => {
        try { return new Date(dateStr).toLocaleDateString("es-CO", { day: "numeric", month: "short", year: "numeric" }); }
        catch { return dateStr; }
    };

    return (
        <div className="space-y-8 pb-10">
            {/* HEADER SECTION */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-primary/5 to-transparent p-6 rounded-[2rem] border border-primary/10">
                <div className="space-y-1">
                    <h1 className="text-3xl font-black tracking-tighter text-gray-900 dark:text-gray-100 uppercase">
                        {t('teacher.dashboard.title', 'Bienvenido')}, {user?.fullName || 'Docente'}
                    </h1>
                    <p className="text-muted-foreground font-medium max-w-lg">
                        {t('teacher.dashboard.subtitle', 'Aquí tienes un resumen detallado de tus grupos y el progreso de los estudiantes.')}
                    </p>
                </div>
                <div className="flex items-center gap-3 bg-background/50 backdrop-blur-sm p-4 rounded-2xl border shadow-sm">
                    <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                        <Users className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Docencia Activa</p>
                        <p className="font-black text-sm text-primary">SIM-COMEX Cloud v1.0</p>
                    </div>
                </div>
            </div>

            {/* KEY METRICS GRID - 2 Rows */}
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {[
                    { title: "Asignaciones", val: myGroups.length, label: "Grupos simulador", icon: LayoutDashboard, color: "text-blue-600", bg: "bg-blue-600/10" },
                    { title: "Usuarios Asignados", val: studentCount, label: "Estudiantes simulador", icon: Users, color: "text-orange-600", bg: "bg-orange-600/10" },
                    { title: "Módulos Asignados", val: myModuleIds.size, label: "Módulos asignados", icon: BookOpen, color: "text-purple-600", bg: "bg-purple-600/10" },
                    { title: "Actividades", val: totalSubmissions.length, label: "Documentos simulador", icon: FileText, color: "text-green-600", bg: "bg-green-600/10" },
                ].map((stat, i) => (
                    <Card key={i} className="border-none shadow-sm rounded-3xl group hover:shadow-xl transition-all overflow-hidden bg-white dark:bg-muted/20">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{stat.title}</CardTitle>
                            <div className={cn("p-2.5 rounded-xl transition-colors", stat.bg)}>
                                <stat.icon className={cn("h-5 w-5", stat.color)} />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-baseline gap-2">
                                <div className="text-3xl font-black">{stat.val}</div>
                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{stat.label}</p>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* PERFORMANCE BY GROUP - FULL WIDTH LIST */}
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-black flex items-center gap-2 uppercase tracking-tight">
                        <BarChart className="w-6 h-6 text-primary" />
                        {t('teacher.dashboard.card_performance_title', 'Mis Grupos y Rendimiento')}
                    </h2>
                </div>

                <div className="grid gap-6 grid-cols-1">
                    {groupsWithProgress.length === 0 ? (
                        <div className="text-center py-20 italic text-muted-foreground border-2 border-dashed rounded-3xl bg-muted/10 opacity-60">
                            No hay grupos para mostrar rendimiento.
                        </div>
                    ) : (
                        groupsWithProgress.map((group) => {
                            const isGroupActive = now >= new Date(group.startDate) && now <= new Date(group.endDate);
                            const groupModule = allModules?.find(m => m.id === group.moduleId);

                            return (
                                <Card key={group.id} className="border-none shadow-sm rounded-[2rem] bg-white dark:bg-muted/10 hover:shadow-2xl transition-all group overflow-hidden">
                                    <CardContent className="p-0">
                                        {/* ROW 1 */}
                                        <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-dashed border-muted-foreground/20">
                                            <div className="flex flex-wrap items-center gap-x-8 gap-y-4">
                                                <div className="space-y-1">
                                                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Nombre del Grupo</p>
                                                    <p className="font-black text-xl text-gray-900 dark:text-gray-100 group-hover:text-primary transition-colors uppercase tracking-tight">{group.name}</p>
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Fecha Inicio</p>
                                                    <p className="font-bold text-sm bg-muted/50 px-3 py-1 rounded-lg border">{formatDate(group.startDate)}</p>
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Fecha Final</p>
                                                    <p className="font-bold text-sm bg-muted/50 px-3 py-1 rounded-lg border">{formatDate(group.endDate)}</p>
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Estatus</p>
                                                    <Badge className={cn(
                                                        "text-[10px] font-black uppercase px-4 py-1 border-none",
                                                        isGroupActive ? "bg-green-500 hover:bg-green-600 text-white" : "bg-red-500 hover:bg-red-600 text-white"
                                                    )}>
                                                        {isGroupActive ? 'Activo' : 'Inactivo'}
                                                    </Badge>
                                                </div>
                                            </div>
                                            <Link href={`/dashboard/teacher/groups/${group.id}`}>
                                                <Button size="lg" className="rounded-2xl px-10 font-black uppercase text-xs tracking-widest shadow-lg shadow-primary/20 hover:scale-105 transition-transform h-14">
                                                    Ingresar al Módulo <ArrowRight className="ml-2 w-4 h-4" />
                                                </Button>
                                            </Link>
                                        </div>

                                        {/* ROW 2 */}
                                        <div className="p-6 bg-muted/30 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                                            <div className="flex flex-wrap items-center gap-x-10 gap-y-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                                                        <BookOpen className="w-5 h-5 text-primary" />
                                                    </div>
                                                    <div className="space-y-0.5">
                                                        <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Módulo Asignado</p>
                                                        <p className="font-bold text-sm truncate max-w-[200px]">{groupModule?.title || 'Sin Título'}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <div className="h-10 w-10 rounded-xl bg-orange-500/10 flex items-center justify-center">
                                                        <FileText className="w-5 h-5 text-orange-600" />
                                                    </div>
                                                    <div className="space-y-0.5">
                                                        <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Documentos</p>
                                                        <p className="font-bold text-sm">{group.docsCount} Formularios</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                                                        <Users className="w-5 h-5 text-blue-600" />
                                                    </div>
                                                    <div className="space-y-0.5">
                                                        <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Estudiantes</p>
                                                        <p className="font-bold text-sm">{(group.members || []).length} Alumnos</p>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex-1 max-w-md space-y-2">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-[10px] font-black text-primary uppercase tracking-widest">Promedio de Progreso</span>
                                                    <span className="text-xl font-black text-primary">{group.progress}%</span>
                                                </div>
                                                <Progress value={group.progress} className="h-2.5 shadow-inner" />
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
}
