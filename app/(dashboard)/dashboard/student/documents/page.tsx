"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Play, BookOpen, Clock, CheckCircle, ArrowRight, PenTool, Users } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useGroups, useModules, useTemplates, useUsers, useDrafts } from "@/hooks/useData";
import { useAppText } from "@/hooks/useAppText";
import { cn, calculateDocumentProgress } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { useMemo } from "react";

export default function StudentDocumentsPage() {
    const { user } = useAuth();

    // 1. Fetch live data
    const { data: allGroups } = useGroups();
    const { data: allModules } = useModules();
    const { data: allTemplates } = useTemplates();
    const { data: allUsers } = useUsers() as any;
    const { data: myDrafts } = useDrafts({ userId: user?.id || '' });
    const { t } = useAppText();

    // Find my userId from the database (matching by email or id from auth)
    const myDbUser = allUsers?.find((u: any) =>
        u.id === user?.id ||
        u.email === user?.email ||
        u.fullName === user?.fullName
    );

    // 2. Identify my groups (Check both ID and Name for compatibility)
    const myGroups = allGroups?.filter(g =>
        (g.members || []).includes(myDbUser?.id || "") ||
        (g.members || []).includes(user?.id || "") ||
        (g.members || []).includes(user?.fullName || "")
    ) || [];

    // 3. Map everything together: Expanded list by Group + Template
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

    return (
        <div className="space-y-6 pb-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">{t('student.docs.title', 'Mis Documentos')}</h1>
                    <p className="text-muted-foreground">{t('student.docs.subtitle', 'Gestiona y diligencia los formularios asignados a tus módulos.')}</p>
                </div>
                <div className="flex items-center gap-2 bg-muted/30 px-4 py-2 rounded-xl border">
                    <FileText className="w-5 h-5 text-primary" />
                    <span className="font-bold text-sm">{allStudentDocs.length} Asignados</span>
                </div>
            </div>
            {allStudentDocs.length === 0 ? (
                <div className="text-center py-24 border-2 border-dashed rounded-[2rem] bg-muted/10 opacity-60">
                    <PenTool className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                    <p className="text-xl font-bold text-muted-foreground">{t('student.docs.no_docs_title', 'No tienes documentos asignados')}</p>
                    <p className="text-muted-foreground">Cuando se te asigne un módulo o grupo, verás tus formularios aquí.</p>
                </div>
            ) : (
                <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
                    {allStudentDocs.map((doc, idx) => (
                        <div key={`${doc.id}-${doc.groupId}-${idx}`} className="flex flex-col p-6 rounded-3xl bg-white dark:bg-muted/20 border hover:border-primary/50 hover:shadow-2xl transition-all group gap-5 relative overflow-hidden">
                            {/* ROW 1: TITLE */}
                            <div className="flex items-center gap-4 relative z-10">
                                <div className="h-12 w-12 rounded-2xl bg-primary/5 flex items-center justify-center group-hover:bg-primary/20 transition-all shrink-0 shadow-sm">
                                    <FileText className="w-6 h-6 text-primary" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-black text-gray-900 dark:text-gray-100 group-hover:text-primary transition-colors text-xl truncate leading-tight">
                                        {doc.title || "Documento"}
                                    </p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">ID:</span>
                                        <span className="text-[10px] font-black text-primary/70">{doc.id}</span>
                                    </div>
                                </div>
                            </div>

                            {/* ROW 2: STATUS, PROGRESS, BUTTON */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative z-10 bg-muted/40 p-5 rounded-2xl border border-muted-foreground/10">
                                <div className="flex items-center gap-8 flex-1">
                                    <div className="space-y-1">
                                        <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Estado</p>
                                        <Badge 
                                            className={cn(
                                                "text-[10px] uppercase font-black px-3 py-1 border-none text-white shadow-sm",
                                                doc.status === 'completed' ? "bg-green-500" : 
                                                doc.status === 'in_progress' ? "bg-yellow-500" : 
                                                "bg-red-500"
                                            )}
                                        >
                                            {doc.status === 'completed' ? 'Finalizado' : doc.status === 'in_progress' ? 'Iniciado' : 'Sin Iniciar'}
                                        </Badge>
                                    </div>
                                    
                                    <div className="flex-1 max-w-[250px] space-y-1.5">
                                        <div className="flex justify-between items-center">
                                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Progreso</span>
                                            <span className="text-[11px] font-black text-primary">{doc.progress}%</span>
                                        </div>
                                        <Progress value={doc.progress} className="h-2.5 shadow-inner" />
                                    </div>
                                </div>

                                <Link href={`/dashboard/student/documents/${doc.id}?groupId=${doc.groupId}`}>
                                    <Button 
                                        size="lg" 
                                        variant="outline"
                                        className="rounded-2xl px-8 font-black text-xs uppercase tracking-widest shadow-md hover:bg-primary hover:text-white transition-all bg-white h-12 w-full sm:w-auto"
                                    >
                                        {doc.status === 'in_progress' ? 'Continuar' : doc.status === 'completed' ? 'Ver' : 'Iniciar'} <ArrowRight className="ml-2 w-4 h-4" />
                                    </Button>
                                </Link>
                            </div>

                            {/* ROW 3: MODULE & GROUP DETAILS */}
                            <div className="flex items-center justify-between pt-3 border-t border-dashed border-muted-foreground/30 relative z-10">
                                <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                                    <div className="flex items-center gap-2">
                                        <BookOpen className="w-3.5 h-3.5 text-muted-foreground" />
                                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-tighter">Módulo:</span>
                                        <span className="px-2 py-0.5 bg-primary/10 text-primary rounded-md text-[10px] font-black tracking-widest uppercase">{doc.groupModuleId}</span>
                                    </div>
                                    <div className="flex items-center gap-2 border-l border-muted-foreground/20 pl-6">
                                        <Users className="w-3.5 h-3.5 text-muted-foreground" />
                                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-tighter">Grupo:</span>
                                        <span className="text-[11px] font-black text-gray-700 dark:text-gray-300 uppercase truncate max-w-[180px]">{doc.groupName}</span>
                                    </div>
                                </div>
                                {doc.lastUpdated && (
                                    <div className="flex items-center gap-1 text-muted-foreground opacity-50">
                                        <Clock className="w-3 h-3" />
                                        <span className="text-[9px] font-bold">{new Date(doc.lastUpdated).toLocaleDateString()}</span>
                                    </div>
                                )}
                            </div>

                            {/* Decorative background element */}
                            <div className="absolute right-0 bottom-0 opacity-[0.02] group-hover:opacity-[0.06] transition-opacity">
                                <FileText className="w-40 h-40 translate-x-1/4 translate-y-1/4" />
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
