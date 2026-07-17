"use client";

import React, { useState, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useGroup, useModule, useTemplates, useDrafts, useUsers, useExercises, useExerciseAssignments } from "@/hooks/useData";
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
    const { data: group } = useGroup(groupId);
    const { data: currentModule } = useModule(group?.moduleId);
    const { data: allTemplates = [] } = useTemplates();
    const { data: drafts } = useDrafts({ userId: user?.id || '', groupId });
    const { data: allUsers } = useUsers() as any;

    const templates = useMemo(() => {
        if (!currentModule?.id || !allTemplates.length) return [];
        const byModuleId = allTemplates.filter(t => t.moduleId === currentModule.id);
        const attachedIds = currentModule.sections?.flatMap(s => s.attachedDocumentIds || []) || [];
        const byAttachment = allTemplates.filter(t => attachedIds.includes(t.id));
        const unique = new Map();
        byModuleId.forEach(t => unique.set(t.id, t));
        byAttachment.forEach(t => unique.set(t.id, t));
        return Array.from(unique.values());
    }, [currentModule, allTemplates]);

    // Ejercicios asignados al estudiante
    const { data: assignments = [] } = useExerciseAssignments({ groupId, studentId: user?.id || '' });
    const { data: allExercises = [] } = useExercises();

    const exercises = useMemo(() => {
        if (!assignments.length || !allExercises.length) return [];
        const caseIds = assignments.map(a => a.caseId);
        return allExercises.filter(e => caseIds.includes(e.id));
    }, [assignments, allExercises]);

    const [selectedExercise, setSelectedExercise] = useState<{ title: string; content: { text: string; pdfUrl?: string; pdfName?: string; pdfSize?: string } } | null>(null);
    const [isViewExerciseOpen, setIsViewExerciseOpen] = useState(false);

    const openExercise = (title: string, content: { text: string; pdfUrl?: string; pdfName?: string; pdfSize?: string }) => {
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
                                {allUsers?.find((u: any) => u.id === group.teacherId)?.name || group.teacherId}
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
                            currentModule.sections.map((section, idx) => {
                                const sectionTemplates = templates?.filter(t => (section.attachedDocumentIds || []).includes(t.id)) || [];
                                return (
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

                                        {/* RESOURCES: images and video rendered inline */}
                                        {section.resources && section.resources.length > 0 && (
                                            <div className="pt-4 ml-11 space-y-4">
                                                {section.resources.map(res => (
                                                    <div key={res.id}>
                                                        {res.type === 'image' && (
                                                            <div className="flex flex-col items-center gap-1">
                                                                <img
                                                                    src={res.url}
                                                                    alt={res.name}
                                                                    className="max-w-full max-h-96 rounded-xl object-contain border shadow-sm"
                                                                />
                                                                <span className="text-xs text-muted-foreground">{res.name}</span>
                                                            </div>
                                                        )}
                                                        {res.type === 'video' && (
                                                            <div className="flex flex-col items-center gap-1">
                                                                <video
                                                                    src={res.url}
                                                                    controls
                                                                    className="max-w-full max-h-96 rounded-xl border shadow-sm"
                                                                />
                                                                <span className="text-xs text-muted-foreground">{res.name}</span>
                                                            </div>
                                                        )}
                                                        {(res.type !== 'image' && res.type !== 'video') && (
                                                            <a
                                                                href={res.url}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="inline-flex items-center gap-2 px-4 py-2 bg-muted/50 rounded-xl text-xs font-bold hover:bg-primary/10 hover:text-primary transition-all border border-muted-foreground/10 hover:border-primary/20"
                                                            >
                                                                <ExternalLink className="w-3.5 h-3.5" />
                                                                {res.name}
                                                            </a>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {/* DOCUMENTS ATTACHED TO THIS SECTION */}
                                        {sectionTemplates.length > 0 && (
                                            <div className="ml-11 mt-6 space-y-3">
                                                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Documentos de esta sección</p>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    {sectionTemplates.map(template => {
                                                        const draft = drafts?.find(d => d.moduleId === template.id);
                                                        const status = draft?.status || 'pending';
                                                        const progress = calculateDocumentProgress(template, draft?.content);
                                                        return (
                                                            <div
                                                                key={template.id}
                                                                className={cn(
                                                                    "group relative p-4 rounded-2xl border transition-all hover:shadow-md bg-white dark:bg-black/20 flex flex-col gap-3 overflow-hidden",
                                                                    status === 'completed' ? 'border-green-500/20' :
                                                                    status === 'in_progress' ? 'border-yellow-500/20' :
                                                                    'hover:border-primary/50'
                                                                )}
                                                            >
                                                                <div className="flex items-center gap-3">
                                                                    <div className={cn(
                                                                        "h-8 w-8 rounded-lg flex items-center justify-center shrink-0 transition-all shadow-sm",
                                                                        status === 'completed' ? "bg-green-500 text-white" :
                                                                        status === 'in_progress' ? "bg-yellow-500 text-white" :
                                                                        "bg-red-500 text-white"
                                                                    )}>
                                                                        {status === 'completed' ? <CheckCircle2 className="w-4 h-4" /> :
                                                                         status === 'in_progress' ? <Clock className="w-4 h-4" /> :
                                                                         <Circle className="w-4 h-4" />}
                                                                    </div>
                                                                    <div className="flex-1 min-w-0">
                                                                        <span className={cn(
                                                                            "font-bold text-sm tracking-tight truncate block group-hover:text-primary transition-colors",
                                                                            status === 'completed' && 'text-gray-500'
                                                                        )}>
                                                                            {template.title}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                                <div className="flex items-center justify-between gap-2">
                                                                    <Badge
                                                                        className={cn(
                                                                            "text-[9px] uppercase font-black px-2 py-0.5 border-none text-white shadow-sm",
                                                                            status === 'completed' ? "bg-green-500" :
                                                                            status === 'in_progress' ? "bg-yellow-500" :
                                                                            "bg-red-500"
                                                                        )}
                                                                    >
                                                                        {status === 'completed' ? 'Finalizado' : status === 'in_progress' ? 'Iniciado' : 'Sin Iniciar'}
                                                                    </Badge>
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="text-[10px] font-bold text-primary">{progress}%</span>
                                                                        <Progress value={progress} className="h-1.5 w-16 shadow-inner" />
                                                                    </div>
                                                                </div>
                                                                <Link href={`/dashboard/student/documents/${template.id}?groupId=${groupId}`}>
                                                                    <Button
                                                                        size="sm"
                                                                        variant={status === 'completed' ? "outline" : "default"}
                                                                        className="w-full rounded-xl font-bold text-[10px] uppercase tracking-wider h-8 shadow-sm hover:scale-[1.02] transition-all"
                                                                    >
                                                                        {status === 'completed' ? 'Ver Documento' : status === 'in_progress' ? 'Continuar' : 'Iniciar'}
                                                                        <ChevronRight className="ml-1 h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
                                                                    </Button>
                                                                </Link>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })
                        ) : (
                            <p className="text-sm text-muted-foreground italic text-center py-12 bg-white/50 rounded-2xl border-2 border-dashed">El módulo no tiene contenido disponible aún.</p>
                        )}
                    </CardContent>

                    {/* CASOS ASIGNADOS — dentro del mismo card del módulo, debajo de las secciones */}
                    {exercises && exercises.length > 0 && (
                        <div className="p-8 pt-0 border-t">
                            <div className="flex items-center gap-3 text-primary mb-6 pt-6">
                                <ScrollText className="w-6 h-6" />
                                <CardTitle className="text-2xl font-black uppercase tracking-widest">Casos de Estudio</CardTitle>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 pb-4">
                                {exercises.map(exercise => {
                                    const assignment = assignments?.find(a => a.caseId === exercise.id);
                                    const previewText = exercise.content?.text?.substring(0, 150) || 'Caso práctico en PDF';
                                    return (
                                        <div
                                            key={exercise.id}
                                            onClick={() => openExercise(exercise.title, exercise.content)}
                                            className="p-6 rounded-2xl border bg-white dark:bg-black/40 cursor-pointer hover:shadow-xl hover:border-primary/50 transition-all group"
                                        >
                                            <div className="flex items-start gap-3 mb-3">
                                                <FileText className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                                                <div>
                                                    <h4 className="font-black text-base group-hover:text-primary transition-colors line-clamp-2">
                                                        {exercise.title}
                                                    </h4>
                                                    {exercise.content?.pdfSize && (
                                                        <span className="text-xs text-muted-foreground">{exercise.content.pdfSize}</span>
                                                    )}
                                                </div>
                                            </div>
                                            <p className="text-sm text-muted-foreground line-clamp-3">{previewText}</p>
                                            <div className="mt-4 flex items-center justify-between">
                                                <Badge className={cn(
                                                    "text-[10px] uppercase font-black px-3 py-1 border-none text-white",
                                                    assignment?.status === 'completed' ? 'bg-green-500' :
                                                    assignment?.status === 'in_progress' ? 'bg-yellow-500' : 'bg-gray-400'
                                                )}>
                                                    {assignment?.status === 'completed' ? 'Completado' :
                                                     assignment?.status === 'in_progress' ? 'En progreso' : 'Pendiente'}
                                                </Badge>
                                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                                    Ver más <ChevronRight className="h-3 w-3" />
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </Card>

            </div>

        <Dialog open={isViewExerciseOpen} onOpenChange={setIsViewExerciseOpen}>
                <DialogContent style={{ width: '1400px', maxWidth: '95vw', height: '90vh' }}>
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-black">{selectedExercise?.title}</DialogTitle>
                        {selectedExercise?.content?.pdfName && (
                            <p className="text-sm text-muted-foreground">{selectedExercise.content.pdfName}</p>
                        )}
                    </DialogHeader>
                    <div className="flex-1 h-full min-h-0 overflow-y-auto">
                        {selectedExercise?.content?.pdfUrl ? (
                            <iframe
                                src={selectedExercise.content.pdfUrl}
                                className="w-full h-[calc(90vh-100px)] rounded-lg border"
                                title={selectedExercise.title}
                            />
                        ) : (
                            <Textarea
                                value={selectedExercise?.content?.text || ""}
                                readOnly
                                rows={25}
                                className="min-h-[500px] text-base mt-2"
                            />
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
