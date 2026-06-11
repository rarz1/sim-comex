"use client";

import { useAuth } from "@/hooks/useAuth";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, BookOpen, Calendar, FileText, ArrowRight } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { useAppText } from "@/hooks/useAppText";
import { cn, calculateDocumentProgress } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useMemo } from "react";

export default function StudentGroupsPage() {
    const { user } = useAuth();

    // 1. Fetch live data
    const allGroups = useLiveQuery(() => db.groups.toArray());
    const allModules = useLiveQuery(() => db.modules.toArray());
    const allTemplates = useLiveQuery(() => db.templates.toArray());
    const myDrafts = useLiveQuery(() => user ? db.drafts.where({ userId: user.id }).toArray() : [], [user]);
    const allUsers = useLiveQuery(() => db.users.toArray());
    const { t } = useAppText();

    // Find my userId from the database (matching by email or id from auth)
    const myDbUser = allUsers?.find(u =>
        (u.userId && user?.id && u.userId === user.id) ||
        (u.email && user?.email && u.email.toLowerCase().trim() === user.email.toLowerCase().trim()) ||
        (u.name && user?.fullName && u.name.toLowerCase().trim() === user.fullName.toLowerCase().trim())
    );

    // 2. Filter my groups (Check both ID and Name, being more resilient)
    const myGroups = allGroups?.filter(g => {
        const members = g.members || [];
        const normalizedMembers = members.map(m => String(m).toLowerCase().trim());

        return (
            (myDbUser?.userId && normalizedMembers.includes(myDbUser.userId.toLowerCase().trim())) ||
            (user?.id && normalizedMembers.includes(user.id.toLowerCase().trim())) ||
            (user?.email && normalizedMembers.includes(user.email.toLowerCase().trim())) ||
            (user?.fullName && normalizedMembers.includes(user.fullName.toLowerCase().trim()))
        );
    }) || [];

    const formatDate = (dateStr: string) => {
        try { return new Date(dateStr).toLocaleDateString("es-CO", { day: "numeric", month: "short", year: "numeric" }); }
        catch { return dateStr; }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">{t('student.groups.title', 'Mis Grupos')}</h1>
                <p className="text-muted-foreground">{t('student.groups.subtitle', 'Lista de grupos en los que estás matriculado.')}</p>
            </div>

            {myGroups.length === 0 ? (
                <div className="text-center py-20 border rounded-lg bg-muted/20">
                    <Users className="w-12 h-12 mx-auto text-muted-foreground opacity-50 mb-4" />
                    <h3 className="text-lg font-medium">No estás inscrito en ningún grupo todavía.</h3>
                </div>
            ) : (
                <div className="grid gap-6 grid-cols-1">
                    {myGroups.map(group => {
                        const mod = allModules?.find(m => m.id === group.moduleId);
                        const teacher = allUsers?.find(u => u.userId === group.teacherId);
                        
                        // Calculate progress for this group
                        const attachedIds = new Set(mod?.sections?.flatMap(s => s.attachedDocumentIds || []) || []);
                        const groupTemplates = allTemplates?.filter(t => 
                            (t.moduleId === group.moduleId || attachedIds.has(t.id)) && t.status === 'published'
                        ) || [];
                        
                        const groupDocs = groupTemplates.map(template => {
                            const draft = myDrafts?.find(d => d.moduleId === template.id && d.groupId === group.id);
                            const progress = calculateDocumentProgress(template, draft?.content);
                            return { progress };
                        });

                        const groupProgress = groupDocs.length > 0 
                            ? Math.round(groupDocs.reduce((acc, d) => acc + d.progress, 0) / groupDocs.length)
                            : 0;
                        const simulationsCount = groupDocs.length;
                        
                        const now = new Date();
                        const start = new Date(group.startDate);
                        const end = new Date(group.endDate);
                        const isActive = now >= start && now <= end;

                        return (
                            <div key={group.id} className="p-6 rounded-3xl bg-white dark:bg-black/20 border shadow-sm flex flex-col gap-6 relative overflow-hidden group hover:shadow-xl transition-all">
                                {/* ROW 1: HEADER & STATUS */}
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
                                    <div className="flex flex-wrap items-center gap-8">
                                        <div>
                                            <h4 className="font-black text-2xl text-primary leading-tight">{group.name}</h4>
                                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">ID: {group.id}</p>
                                        </div>
                                        <div className="flex items-center gap-6 border-l border-muted-foreground/20 pl-8">
                                            <div className="space-y-1">
                                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Fecha Inicio</p>
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="w-4 h-4 text-green-500" />
                                                    <p className="text-sm font-black">{formatDate(group.startDate)}</p>
                                                </div>
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Fecha Final</p>
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="w-4 h-4 text-red-500" />
                                                    <p className="text-sm font-black">{formatDate(group.endDate)}</p>
                                                </div>
                                            </div>
                                        </div>
                                        <Badge 
                                            className={cn(
                                                "text-[10px] uppercase font-black px-4 py-1.5 border-none text-white shadow-sm",
                                                isActive ? "bg-green-500" : "bg-red-500"
                                            )}
                                        >
                                            {isActive ? 'Activo' : 'Inactivo'}
                                        </Badge>
                                    </div>

                                    <Link href={`/dashboard/student/groups/${group.id}`}>
                                        <Button 
                                            size="lg" 
                                            variant="outline"
                                            className="rounded-full px-10 font-bold shadow-sm hover:bg-primary hover:text-white transition-all bg-white"
                                        >
                                            Ingresar al Módulo <ArrowRight className="ml-2 w-5 h-5" />
                                        </Button>
                                    </Link>
                                </div>

                                {/* ROW 2: DETAILS & PROGRESS */}
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-8 p-6 bg-muted/30 rounded-2xl border border-muted-foreground/10 relative z-10">
                                    <div className="space-y-1.5">
                                        <p className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1.5 tracking-widest">
                                            <Users className="w-3.5 h-3.5" /> Docente
                                        </p>
                                        <p className="text-base font-black text-gray-800 dark:text-gray-200">
                                            {teacher?.name || group.teacherId}
                                        </p>
                                    </div>
                                    <div className="space-y-1.5">
                                        <p className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1.5 tracking-widest">
                                            <BookOpen className="w-3.5 h-3.5" /> Módulo Académico
                                        </p>
                                        <p className="text-base font-black text-gray-800 dark:text-gray-200 truncate">
                                            {mod?.title || "Cargando..."}
                                        </p>
                                    </div>
                                    <div className="space-y-1.5">
                                        <p className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1.5 tracking-widest">
                                            <FileText className="w-3.5 h-3.5" /> Simulaciones
                                        </p>
                                        <p className="text-base font-black text-gray-800 dark:text-gray-200">
                                            {simulationsCount} Documentos Asignados
                                        </p>
                                    </div>
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center">
                                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Progreso del Estudiante</p>
                                            <p className="text-sm font-black text-primary">{groupProgress}%</p>
                                        </div>
                                        <Progress value={groupProgress} className="h-2.5 shadow-inner" />
                                    </div>
                                </div>

                                {/* Background Decoration */}
                                <div className="absolute right-0 top-0 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity">
                                    <Users className="w-48 h-48 translate-x-1/4 -translate-y-1/4" />
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
