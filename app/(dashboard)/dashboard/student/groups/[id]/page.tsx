"use client";

import React, { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db/db";
import { cn, calculateDocumentProgress } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
    ArrowLeft,
    BookOpen,
    FileText,
    Users,
    Clock,
    CheckCircle2,
    Circle,
    ChevronRight,
    ExternalLink,
    Play,
    ScrollText
} from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

export default function StudentGroupDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id: groupId } = React.use(params);
    const { user } = useAuth();

    // 1. Fetch live data
    const group = useLiveQuery(() => db.groups.get(groupId));
    const currentModule = useLiveQuery(() => group?.moduleId ? db.modules.get(group.moduleId) : undefined, [group]);
    const templates = useLiveQuery(async () => {
        if (!currentModule?.id) return [];

        // 1. Fetch by Module ID (Ownership)
        const byModuleId = await db.templates.where({ moduleId: currentModule.id }).toArray();

        // 2. Fetch by Attachment (Reference)
        const attachedIds: string[] = [];
        currentModule.sections?.forEach(s => {
            s.attachedDocumentIds?.forEach(id => attachedIds.push(id));
        });

        const byAttachment = attachedIds.length > 0
            ? await db.templates.where('id').anyOf(attachedIds).toArray()
            : [];

        // 3. Merge and Deduplicate
        const uniqueTemplates = new Map();
        byModuleId.forEach(t => uniqueTemplates.set(t.id, t));
        byAttachment.forEach(t => uniqueTemplates.set(t.id, t));

        return Array.from(uniqueTemplates.values());
    }, [currentModule]);
    const drafts = useLiveQuery(() => user ? db.drafts.where({ userId: user.id, groupId: groupId }).toArray() : [], [user, groupId]);
    const allUsers = useLiveQuery(() => db.users.toArray());

    // Ejercicios asignados al estudiante
    const studentId = user?.id || user?.email || "";
    const assignments = useLiveQuery(async () => {
        if (!currentModule?.id || !studentId) return [];
        return db.exerciseAssignments
            .where("moduleId")
            .equals(currentModule.id)
            .and(a => a.studentId === studentId)
            .toArray();
    }, [currentModule, studentId]);

    const exercises = useLiveQuery(async () => {
        if (!assignments?.length) return [];
        const exerciseIds = assignments.map(a => a.exerciseId);
        return db.exercises.where("id").anyOf(exerciseIds).toArray();
    }, [assignments]);

    const [selectedExercise, setSelectedExercise] = useState<{ title: string; content: string } | null>(null);
    const [isViewExerciseOpen, setIsViewExerciseOpen] = useState(false);

    const openExercise = (title: string, content: string) => {
        setSelectedExercise({ title, content });
        setIsViewExerciseOpen(true);
    };

    if (!group) return <div className="p-8 text-center italic text-muted-foreground">Cargando grupo...</div>;

    return (
        <div className="space-y-6 pb-20">
            {/* HEADER / MODULE INFO CONTAINER */}
            <div className="flex flex-col gap-6 bg-white dark:bg-black/20 p-8 rounded-3xl border shadow-sm relative overflow-hidden">
                <Link href="/dashboard/student/groups">
                    <Button variant="ghost" size="sm" className="w-fit -ml-2 text-muted-foreground hover:bg-primary/5 transition-colors">
                        <ArrowLeft className="mr-2 h-4 w-4" /> Volver a Mis Grupos
                    </Button>
                </Link>

                <div className="space-y-6 relative z-10">
                    {/* ROW 1: MODULE TITLE & DATES & STATUS */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-dashed pb-6">
                        <div className="space-y-1">
                            <h1 className="text-4xl font-black tracking-tighter text-primary">{currentModule?.title || "Cargando Módulo..."}</h1>
                            <p className="text-muted-foreground font-medium text-lg italic">{currentModule?.description}</p>
                        </div>
                        <div className="flex flex-wrap items-center gap-4 bg-muted/40 p-4 rounded-2xl border border-muted-foreground/10">
                            <div className="space-y-0.5">
                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Fecha Inicio</p>
                                <p className="text-sm font-black text-green-600">{new Date(group.startDate).toLocaleDateString()}</p>
                            </div>
                            <div className="h-8 w-px bg-muted-foreground/20 mx-2 hidden sm:block" />
                            <div className="space-y-0.5">
                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Fecha Final</p>
                                <p className="text-sm font-black text-red-600">{new Date(group.endDate).toLocaleDateString()}</p>
                            </div>
                            <div className="h-8 w-px bg-muted-foreground/20 mx-2 hidden sm:block" />
                            <Badge 
                                className={cn(
                                    "text-[10px] uppercase font-black px-4 py-1.5 border-none text-white shadow-sm",
                                    (new Date() >= new Date(group.startDate) && new Date() <= new Date(group.endDate)) ? "bg-green-500" : "bg-red-500"
                                )}
                            >
                                {(new Date() >= new Date(group.startDate) && new Date() <= new Date(group.endDate)) ? 'Activo' : 'Inactivo'}
                            </Badge>
                        </div>
                    </div>

                    {/* ROW 2: GROUP DETAILS */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                        <div className="space-y-1">
                            <p className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1.5 tracking-widest">
                                <Users className="w-3.5 h-3.5" /> Grupo
                            </p>
                            <p className="text-lg font-black text-gray-900 dark:text-gray-100">{group.name}</p>
                        </div>
                        <div className="space-y-1 border-l border-muted-foreground/10 pl-6">
                            <p className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1.5 tracking-widest">
                                <Users className="w-3.5 h-3.5" /> Docente
                            </p>
                            <p className="text-lg font-black text-gray-900 dark:text-gray-100">
                                {allUsers?.find(u => u.userId === group.teacherId)?.name || group.teacherId}
                            </p>
                        </div>
                        <div className="space-y-1 border-l border-muted-foreground/10 pl-6">
                            <p className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1.5 tracking-widest">
                                <FileText className="w-3.5 h-3.5" /> Documentos
                            </p>
                            <p className="text-lg font-black text-gray-900 dark:text-gray-100">{templates?.length || 0} Asignados</p>
                        </div>
                        <div className="space-y-1 border-l border-muted-foreground/10 pl-6">
                            <p className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1.5 tracking-widest">
                                <Users className="w-3.5 h-3.5" /> Estudiantes
                            </p>
                            <p className="text-lg font-black text-gray-900 dark:text-gray-100">{group.members?.length || 0} Inscritos</p>
                        </div>
                    </div>
                </div>

                {/* Stylized background accent */}
                <div className="absolute right-[-2%] top-[-10%] opacity-[0.03] rotate-12">
                    <BookOpen className="w-64 h-64" />
                </div>
            </div>

            <div className="flex flex-col gap-8">
                {/* MODULE CONTENT SECTIONS */}
                <Card className="border-none shadow-none bg-muted/10 rounded-3xl overflow-hidden">
                    <CardHeader className="p-8 pb-4">
                        <div className="flex items-center gap-3 text-primary">
                            <BookOpen className="w-6 h-6" />
                            <CardTitle className="text-2xl font-black uppercase tracking-widest">Secciones del Módulo</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="p-8 pt-0 space-y-6">
                        {currentModule?.sections && currentModule.sections.length > 0 ? (
                            currentModule.sections.map((section, idx) => (
                                <div key={section.id} className="space-y-4 bg-white dark:bg-black/40 p-6 rounded-2xl border shadow-sm group hover:border-primary/30 transition-all">
                                    <div className="flex items-center gap-3">
                                        <Badge className="h-8 w-8 rounded-full p-0 flex items-center justify-center bg-primary text-white border-none text-sm font-black shadow-lg">
                                            {idx + 1}
                                        </Badge>
                                        <h3 className="font-black text-xl text-gray-800 dark:text-gray-100">{section.title}</h3>
                                    </div>
                                    <div
                                        className="text-gray-600 dark:text-gray-300 prose prose-sm dark:prose-invert max-w-none ml-11"
                                        dangerouslySetInnerHTML={{ __html: section.content }}
                                    />

                                    {/* RESOURCES */}
                                    {section.resources && section.resources.length > 0 && (
                                        <div className="pt-4 ml-11 flex flex-wrap gap-2">
                                            {section.resources.map(res => (
                                                <a
                                                    key={res.id}
                                                    href={res.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-2 px-4 py-2 bg-muted/50 rounded-xl text-xs font-bold hover:bg-primary/10 hover:text-primary transition-all border border-muted-foreground/10 hover:border-primary/20"
                                                >
                                                    <ExternalLink className="w-3.5 h-3.5" />
                                                    {res.name}
                                                </a>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))
                        ) : (
                            <p className="text-sm text-muted-foreground italic text-center py-12 bg-white/50 rounded-2xl border-2 border-dashed">El módulo no tiene contenido disponible aún.</p>
                        )}
                    </CardContent>
                </Card>

                {/* EJERCICIOS ASIGNADOS */}
                {exercises && exercises.length > 0 && (
                    <Card className="border-none shadow-none bg-muted/10 rounded-3xl overflow-hidden">
                        <CardHeader className="p-8 pb-4">
                            <div className="flex items-center gap-3 text-primary">
                                <ScrollText className="w-6 h-6" />
                                <CardTitle className="text-2xl font-black uppercase tracking-widest">Casos de Estudio</CardTitle>
                            </div>
                            <CardDescription className="text-muted-foreground font-medium text-base ml-9">
                                Ejercicios asignados para este módulo.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-8 pt-0">
                            <div className="flex gap-6 overflow-x-auto pb-4">
                                {exercises.map(exercise => {
                                    const assignment = assignments?.find(a => a.exerciseId === exercise.id);
                                    return (
                                        <div
                                            key={exercise.id}
                                            onClick={() => openExercise(exercise.title, exercise.content)}
                                            className="flex-1 min-w-[400px] p-6 rounded-2xl border bg-white dark:bg-black/40 cursor-pointer hover:shadow-xl hover:border-primary/50 transition-all group"
                                        >
                                            <div className="flex items-start gap-3 mb-3">
                                                <FileText className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                                                <div>
                                                    <h4 className="font-black text-base group-hover:text-primary transition-colors line-clamp-2">
                                                        {exercise.title}
                                                    </h4>
                                                </div>
                                            </div>
                                            <p className="text-sm text-muted-foreground line-clamp-3">
                                                {exercise.content?.substring(0, 150)}...
                                            </p>
                                            <div className="mt-4 flex items-center justify-between">
                                                <Badge className={cn(
                                                    "text-[10px] uppercase font-black px-3 py-1 border-none text-white",
                                                    assignment?.status === 'completed' ? 'bg-green-500' :
                                                    assignment?.status === 'in_progress' ? 'bg-yellow-500' :
                                                    'bg-gray-400'
                                                )}>
                                                    {assignment?.status === 'completed' ? 'Completado' :
                                                     assignment?.status === 'in_progress' ? 'En progreso' :
                                                     'Pendiente'}
                                                </Badge>
                                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                                    Ver más <ChevronRight className="h-3 w-3" />
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* DOCUMENTS LIST */}
                <Card className="border-none shadow-none bg-muted/10 rounded-3xl overflow-hidden">
                    <CardHeader className="p-8 pb-4">
                        <div className="flex items-center gap-3 text-primary">
                            <FileText className="w-6 h-6" />
                            <CardTitle className="text-2xl font-black uppercase tracking-widest">Contenido del Módulo</CardTitle>
                        </div>
                        <CardDescription className="text-muted-foreground font-medium text-base ml-9">
                            Gestiona y completa los documentos asignados a esta simulación.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-8 pt-0 grid grid-cols-1 md:grid-cols-2 gap-6">
                        {!templates || templates.length === 0 ? (
                            <div className="col-span-full py-20 text-center bg-white/50 rounded-2xl border-2 border-dashed">
                                <FileText className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" />
                                <p className="text-lg font-medium text-muted-foreground italic">No hay documentos asignados.</p>
                            </div>
                        ) : (
                            templates.map(template => {
                                const draft = drafts?.find(d => d.moduleId === template.id);
                                const status = draft?.status || 'pending';
                                const progress = calculateDocumentProgress(template, draft?.content);

                                return (
                                    <div
                                        key={template.id}
                                        className={cn(
                                            "group relative p-6 rounded-3xl border transition-all hover:shadow-2xl bg-white dark:bg-black/40 flex flex-col gap-6 overflow-hidden",
                                            status === 'completed' ? 'border-green-500/20 shadow-green-500/5' : 
                                            status === 'in_progress' ? 'border-yellow-500/20 shadow-yellow-500/5' : 
                                            'hover:border-primary/50'
                                        )}
                                    >
                                        {/* ROW 1: TITLE */}
                                        <div className="flex items-center gap-4 relative z-10">
                                            <div className={cn(
                                                "h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 transition-all shadow-sm",
                                                status === 'completed' ? "bg-green-500 text-white" : 
                                                status === 'in_progress' ? "bg-yellow-500 text-white" : 
                                                "bg-red-500 text-white"
                                            )}>
                                                {status === 'completed' ? <CheckCircle2 className="w-6 h-6" /> : 
                                                 status === 'in_progress' ? <Clock className="w-6 h-6" /> : 
                                                 <Circle className="w-6 h-6" />}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <span className={cn(
                                                    "font-black text-lg tracking-tight truncate block group-hover:text-primary transition-colors",
                                                    status === 'completed' && 'text-gray-500'
                                                )}>
                                                    {template.title}
                                                </span>
                                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">Referencia: Módulo {template.moduleId}</p>
                                            </div>
                                        </div>

                                        {/* ROW 2: STATUS & PROGRESS */}
                                        <div className="space-y-4 bg-muted/50 p-5 rounded-2xl border border-muted-foreground/10 relative z-10">
                                            <div className="flex items-center justify-between">
                                                <Badge 
                                                    className={cn(
                                                        "text-[10px] uppercase font-black px-3 py-1 border-none text-white shadow-sm",
                                                        status === 'completed' ? "bg-green-500" : 
                                                        status === 'in_progress' ? "bg-yellow-500" : 
                                                        "bg-red-500"
                                                    )}
                                                >
                                                    {status === 'completed' ? 'Finalizado' : status === 'in_progress' ? 'Iniciado' : 'Sin Iniciar'}
                                                </Badge>
                                                <div className="text-right">
                                                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-0.5">Avance</span>
                                                    <span className="text-sm font-black text-primary">{progress}%</span>
                                                </div>
                                            </div>
                                            <Progress value={progress} className="h-2 shadow-inner" />
                                        </div>

                                        {/* ROW 3: ACTION BUTTON */}
                                        <Link href={`/dashboard/student/documents/${template.id}?groupId=${groupId}`} className="relative z-10">
                                            <Button 
                                                size="lg" 
                                                variant={status === 'completed' ? "outline" : "default"} 
                                                className="w-full rounded-2xl font-black text-xs uppercase tracking-widest h-12 shadow-md hover:scale-[1.02] transition-all"
                                            >
                                                {status === 'completed' ? 'Ver Documento' : status === 'in_progress' ? 'Continuar Simulacion' : 'Iniciar Simulacion'} 
                                                <ChevronRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                            </Button>
                                        </Link>
                                    </div>
                                );
                            })
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* DIALOG VER EJERCICIO */}
            <Dialog open={isViewExerciseOpen} onOpenChange={setIsViewExerciseOpen}>
                <DialogContent style={{ width: '1400px', maxWidth: '95vw' }} className="max-h-[90vh]">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-black">{selectedExercise?.title}</DialogTitle>
                    </DialogHeader>
                    <div className="overflow-y-auto max-h-[70vh] pr-2">
                        <div className="space-y-4">
                            <div>
                                <Label className="text-base font-semibold">Contenido del caso de estudio</Label>
                                <Textarea
                                    value={selectedExercise?.content || ""}
                                    readOnly
                                    rows={25}
                                    className="min-h-[500px] text-base mt-2"
                                />
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
