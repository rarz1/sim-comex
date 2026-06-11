"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Play, Clock, CheckCircle, BookOpen, Users, ArrowRight, PenTool, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/useAuth";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db/db";
import { cn, calculateDocumentProgress } from "@/lib/utils";
import { useAppText } from "@/hooks/useAppText";
import { useMemo } from "react";

export default function StudentDashboard() {
    const { user } = useAuth();

    // 1. Fetch live data
    const allGroups = useLiveQuery(() => db.groups.toArray());
    const allModules = useLiveQuery(() => db.modules.toArray());
    const allTemplates = useLiveQuery(() => db.templates.toArray());
    const allUsers = useLiveQuery(() => db.users.toArray());
    const myDrafts = useLiveQuery(() => user ? db.drafts.where({ userId: user.id }).toArray() : [], [user]);
    const { t } = useAppText();

    // Find my userId from the database (matching by email or id from auth)
    const myDbUser = allUsers?.find(u =>
        u.userId === user?.id ||
        u.email === user?.email ||
        u.name === user?.fullName
    );

    // 2. Identify my groups (Check both ID and Name for compatibility)
    const myGroups = allGroups?.filter(g =>
        (g.members || []).includes(myDbUser?.userId || "") ||
        (g.members || []).includes(user?.id || "") ||
        (g.members || []).includes(user?.fullName || "")
    ) || [];

    // 3. Identify all documents assigned to my groups
    const myGroupModuleIds = myGroups.map(g => g.moduleId);

    // Get Attached IDs from these modules
    const myModules = allModules?.filter(m => myGroupModuleIds.includes(m.id)) || [];
    const attachedIds = new Set<string>();
    myModules.forEach(m => {
        m.sections?.forEach(s => {
            s.attachedDocumentIds?.forEach(id => attachedIds.add(id));
        });
    });

    const myAssignedTemplates = allTemplates?.filter(t =>
        (myGroupModuleIds.includes(t.moduleId) || attachedIds.has(t.id)) &&
        t.status === 'published'
    ) || [];
    // 4. Map everything together: Expanded list by Group + Template
    const allStudentDocs = useMemo(() => {
        const docs: any[] = [];
        if (!myGroups || !allModules || !allTemplates) return docs;

        myGroups.forEach(group => {
            const groupModule = allModules.find(m => m.id === group.moduleId);
            if (!groupModule) return;

            // Get templates for this group (owned + attached)
            const attachedDocIds = groupModule.sections?.flatMap(s => s.attachedDocumentIds || []) || [];
            const groupTemplates = allTemplates.filter(t => 
                (t.moduleId === groupModule.id || attachedDocIds.includes(t.id)) && t.status === 'published'
            );

            groupTemplates.forEach(template => {
                const draft = myDrafts?.find(d => d.moduleId === template.id && d.groupId === group.id);
                const status = (draft as any)?.status || 'pending';
                const progress = calculateDocumentProgress(template, draft?.content);

                docs.push({
                    ...template,
                    status,
                    groupId: group.id,
                    groupName: group.name,
                    groupModuleId: group.moduleId,
                    progress,
                    lastUpdated: draft?.lastUpdated,
                    isDraft: !!draft && status !== 'completed'
                });
            });
        });
        return docs;
    }, [myGroups, allModules, allTemplates, myDrafts]);

    const inProgressCount = useMemo(() => allStudentDocs.filter(d => d.status === 'in_progress').length, [allStudentDocs]);
    const completedCount = useMemo(() => allStudentDocs.filter(d => d.status === 'completed').length, [allStudentDocs]);
    const assignedCount = allStudentDocs.length;

    const progressPercent = useMemo(() => assignedCount > 0
        ? Math.round(completedCount / assignedCount * 100)
        : 0, [assignedCount, completedCount]);

    return (
        <div className="space-y-8 pb-10">
            {/* HEADER SECTION */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-gradient-to-br from-primary/10 via-background to-transparent p-8 rounded-3xl border border-primary/10 shadow-sm relative overflow-hidden">
                <div className="space-y-2 relative z-10">
                    <h1 className="text-4xl font-black tracking-tighter text-gray-900 dark:text-gray-100">{t('student.dashboard.title', 'Mi Espacio Académico')}</h1>
                    <p className="text-muted-foreground font-medium max-w-lg">
                        {t('student.dashboard.subtitle', '¡Hola, {name}! Tienes {count} trámites en proceso.').replace('{name}', user?.fullName || "Estudiante").replace('{count}', String(inProgressCount))}
                    </p>
                </div>
                <div className="flex items-center gap-6 relative z-10 bg-white/40 dark:bg-black/20 backdrop-blur-md p-4 rounded-2xl border shadow-lg group hover:scale-105 transition-transform cursor-default">
                    <div className="text-right">
                        <p className="text-[10px] font-bold text-primary uppercase tracking-widest">{t('student.dashboard.card_progress_title', 'Tu Progreso')}</p>
                        <p className="text-3xl font-black">{progressPercent}%</p>
                    </div>
                    <div className="h-14 w-14 rounded-full border-4 border-primary/20 flex items-center justify-center relative">
                        <CheckCircle className="w-8 h-8 text-primary" />
                        <svg className="absolute inset-0 w-full h-full -rotate-90">
                            <circle
                                cx="28" cy="28" r="24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="4"
                                className="text-primary"
                                strokeDasharray="150"
                                strokeDashoffset={150 - (150 * progressPercent / 100)}
                            />
                        </svg>
                    </div>
                </div>
                {/* Decorative background element */}
                <div className="absolute right-[-5%] top-[-20%] w-64 h-64 bg-primary/5 rounded-full blur-3xl animate-pulse" />
            </div>

            {/* QUICK STATS */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[
                    { title: "Inscrito en", val: myGroups.length, label: "grupos activos", icon: Users, color: "text-blue-500", bg: "bg-blue-500/10" },
                    { title: "Simulaciones", val: assignedCount, label: "documentos asignados", icon: FileText, color: "text-purple-500", bg: "bg-purple-500/10" },
                    { title: "Borradores", val: inProgressCount, label: "documentos en proceso", icon: Clock, color: "text-orange-500", bg: "bg-orange-500/10" },
                    { title: "Entregas", val: completedCount, label: "documentos finalizados", icon: CheckCircle, color: "text-green-500", bg: "bg-green-500/10" },
                ].map((stat, i) => (
                    <Card key={i} className="hover:shadow-md transition-shadow border-none bg-muted/30">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-[10px] font-bold uppercase tracking-tighter text-muted-foreground">{stat.title}</CardTitle>
                            <div className={cn("p-1.5 rounded-lg", stat.bg)}>
                                <stat.icon className={cn("h-3.5 w-3.5", stat.color)} />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-baseline gap-2">
                                <div className="text-2xl font-black">{stat.val}</div>
                                <p className="text-[10px] text-muted-foreground font-semibold uppercase">{stat.label}</p>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-7">
                {/* RECENT DOCUMENTS SECTON */}
                <Card className="col-span-4 border-none shadow-none bg-transparent">
                    <CardHeader className="px-0 pt-0">
                        <CardTitle className="text-xl font-bold flex items-center gap-2">
                            <FileText className="w-6 h-6 text-primary" />
                            {t('student.dashboard.section_documents_title', 'Trámites Documentales')}
                        </CardTitle>
                        <CardDescription>Visualiza y gestiona todos tus documentos asignados.</CardDescription>
                    </CardHeader>
                    <CardContent className="px-0 space-y-4 pt-2">
                        {allStudentDocs.length === 0 ? (
                            <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed rounded-3xl bg-muted/10 opacity-60">
                                <PenTool className="w-12 h-12 mb-4 text-muted-foreground" />
                                <p className="text-lg font-medium">No hay trámites asignados</p>
                                <p className="text-sm text-muted-foreground">Comunícate con tu docente si crees que esto es un error.</p>
                            </div>
                        ) : (
                            allStudentDocs.slice(0, 3).map((doc, idx) => {
                                return (
                                    <div key={`${doc.id}-${doc.groupId}-${idx}`} className="flex flex-col p-5 rounded-2xl bg-white dark:bg-muted/20 border hover:border-primary/50 hover:shadow-xl transition-all group gap-4 relative overflow-hidden">
                                        {/* ROW 1: TITLE */}
                                        <div className="flex items-center gap-3 relative z-10">
                                            <div className="h-10 w-10 rounded-xl bg-primary/5 flex items-center justify-center group-hover:bg-primary/20 transition-colors shrink-0">
                                                <FileText className="w-5 h-5 text-primary" />
                                            </div>
                                            <p className="font-bold text-gray-900 dark:text-gray-100 group-hover:text-primary transition-colors text-lg truncate flex-1">{doc.title || "Documento"}</p>
                                        </div>

                                        {/* ROW 2: STATUS, PROGRESS, BUTTON */}
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10 bg-muted/30 p-4 rounded-xl border border-muted-foreground/10">
                                            <div className="flex items-center gap-6 flex-1">
                                                <Badge 
                                                    className={cn(
                                                        "text-[10px] uppercase font-black px-2 py-0.5 border-none text-white shrink-0",
                                                        doc.status === 'completed' ? "bg-green-500 hover:bg-green-600" : 
                                                        doc.status === 'in_progress' ? "bg-yellow-500 hover:bg-yellow-600" : 
                                                        "bg-red-500 hover:bg-red-600"
                                                    )}
                                                >
                                                    {doc.status === 'completed' ? 'Finalizado' : doc.status === 'in_progress' ? 'Iniciado' : 'Sin Iniciar'}
                                                </Badge>
                                                
                                                <div className="flex-1 max-w-[200px]">
                                                    <div className="flex justify-between items-center mb-1.5">
                                                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Progreso</span>
                                                        <span className="text-[10px] font-black text-primary">{doc.progress}%</span>
                                                    </div>
                                                    <Progress value={doc.progress} className="h-2" />
                                                </div>
                                            </div>

                                            <Link href={`/dashboard/student/documents/${doc.id}?groupId=${doc.groupId}`}>
                                                <Button 
                                                    size="sm" 
                                                    variant="outline"
                                                    className="rounded-full px-6 font-bold shadow-sm hover:bg-primary hover:text-white transition-all w-full sm:w-auto bg-white"
                                                >
                                                    {doc.status === 'in_progress' ? 'Continuar' : doc.status === 'completed' ? 'Ver' : 'Iniciar'} <ArrowRight className="ml-2 w-4 h-4" />
                                                </Button>
                                            </Link>
                                        </div>

                                        {/* ROW 3: MODULE & GROUP */}
                                        <div className="flex items-center justify-between pt-2 border-t border-dashed border-muted-foreground/20 relative z-10">
                                            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-tighter">Módulo:</span>
                                                    <span className="px-2 py-0.5 bg-primary/10 text-primary rounded-md text-[10px] font-black tracking-widest uppercase">{doc.groupModuleId}</span>
                                                </div>
                                                <div className="flex items-center gap-2 border-l border-muted-foreground/20 pl-4">
                                                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-tighter">Grupo:</span>
                                                    <span className="text-[10px] font-black text-gray-700 dark:text-gray-300 uppercase truncate max-w-[150px]">{doc.groupName}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Decorative background element */}
                                        <div className="absolute right-0 bottom-0 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity">
                                            <FileText className="w-32 h-32 translate-x-1/4 translate-y-1/4" />
                                        </div>
                                    </div>
                                );
                            })
                        )}
                        <div className="pt-2 text-center">
                            <Link href="/dashboard/student/documents">
                                <Button variant="ghost" className="text-primary hover:bg-primary/5 font-black uppercase tracking-widest text-xs">Ver Todo el Listado &rarr;</Button>
                            </Link>
                        </div>
                    </CardContent>
                </Card>

                {/* MY GROUPS SECTION */}
                <Card className="col-span-3 border-none bg-muted/20 rounded-3xl h-fit">
                    <CardHeader>
                        <CardTitle className="text-xl font-bold flex items-center gap-2">
                            <Users className="w-6 h-6 text-primary" />
                            {t('student.dashboard.section_groups_title', 'Mis Grupos')}
                        </CardTitle>
                        <CardDescription>Tu contexto académico actual.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {myGroups.length === 0 ? (
                            <p className="text-center py-12 text-muted-foreground italic text-sm">No tienes grupos asignados.</p>
                        ) : (
                            myGroups.map(group => {
                                const mod = allModules?.find(m => m.id === group.moduleId);
                                return (
                                    <div key={group.id} className="p-5 rounded-2xl bg-white dark:bg-black/20 border shadow-sm space-y-4 relative overflow-hidden group hover:shadow-xl transition-all">
                                        <div className="space-y-1 relative z-10">
                                            <h4 className="font-black text-lg text-primary leading-tight">{group.name}</h4>
                                            <div className="flex flex-col gap-1">
                                                <p className="text-xs font-bold text-muted-foreground flex items-center gap-1.5 uppercase font-mono tracking-wider">
                                                    <Users className="w-3.5 h-3.5" /> Prof. {allUsers?.find(u => u.userId === group.teacherId)?.name || group.teacherId}
                                                </p>
                                                <p className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
                                                    <BookOpen className="w-3.5 h-3.5" /> {mod?.title || "Módulo Académico"}
                                                </p>
                                            </div>
                                        </div>

                                        <Link href={`/dashboard/student/groups/${group.id}`} className="block pt-2 relative z-10">
                                            <Button variant="outline" size="sm" className="w-full text-xs font-black uppercase tracking-widest rounded-xl hover:bg-primary hover:text-white transition-all bg-white">
                                                Ver Detalles del Módulo
                                            </Button>
                                        </Link>
                                        {/* Stylized background accent */}
                                        <div className="absolute right-0 bottom-0 opacity-5 group-hover:opacity-10 transition-opacity">
                                            <Users className="w-24 h-24 translate-x-1/4 translate-y-1/4" />
                                        </div>
                                    </div>
                                );
                            })
                        )}
                        <Link href="/dashboard/student/groups" className="block text-center pt-2">
                            <p className="text-xs font-bold text-muted-foreground hover:text-primary flex items-center justify-center gap-2 cursor-pointer transition-colors uppercase tracking-widest">
                                Gestionar todos mis grupos <ChevronRight className="w-4 h-4" />
                            </p>
                        </Link>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
