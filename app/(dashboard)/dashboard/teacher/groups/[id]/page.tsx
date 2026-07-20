"use client";

import { useGroup, useUsers, useTemplates, useModule } from "@/hooks/useData";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, Mail, BookOpen, Search, Calendar, FileText, Eye } from "lucide-react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import React, { useState } from "react";
import { TeacherDocumentViewer } from "@/components/teacher/TeacherDocumentViewer";
import { FormVisualizer } from "@/components/form-builder/FormVisualizer";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";

export default function TeacherGroupDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id: groupId } = React.use(params);
    const { data: group } = useGroup(groupId);
    const { data: allUsers } = useUsers();
    const { data: allTemplates } = useTemplates();
    const [searchTerm, setSearchTerm] = useState("");

    const { data: module } = useModule(group?.moduleId);

    if (!group) return <div>Cargando...</div>;

    const groupStudents = allUsers?.filter(u =>
        group.members.some((m: string) => m === u.id || m === u.fullName)
    ) || [];

    const filteredStudents = groupStudents.filter(s =>
        (s.fullName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (s.id?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    );

    const formatDate = (dateStr: string) => {
        try { return new Date(dateStr).toLocaleDateString("es-CO", { day: "numeric", month: "short", year: "numeric" }); }
        catch { return dateStr; }
    };

    // Get template names for attached document IDs
    const getTemplateName = (docId: string) => {
        return allTemplates?.find(t => t.id === docId)?.title || docId;
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Link href="/dashboard/teacher/groups">
                    <Button variant="ghost" size="icon"><ArrowLeft className="w-5 h-5" /></Button>
                </Link>
                <div>
                    <h1 className="text-2xl font-bold">{group.name}</h1>
                    <p className="text-muted-foreground">{group.description}</p>
                </div>
            </div>

            {/* MODULE CONTENT SECTION */}
            <Card>
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                            <BookOpen className="w-5 h-5 text-primary" />
                            {module?.title || "Cargando módulo..."}
                        </CardTitle>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                                <Calendar className="w-3.5 h-3.5 text-green-500" />
                                Fecha Inicial: {formatDate(group.startDate)}
                            </span>
                            <span className="flex items-center gap-1">
                                <Calendar className="w-3.5 h-3.5 text-red-500" />
                                Fecha Final: {formatDate(group.endDate)}
                            </span>
                        </div>
                    </div>
                    <CardDescription>
                        Docente: {allUsers?.find(u => u.id === group.teacherId)?.fullName || group.teacherId} · {(group.members || []).length} estudiantes
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {module?.sections?.map((section: any, sIdx: number) => (
                        <div key={section.id || sIdx} className="border rounded-lg overflow-hidden">
                            <div className="bg-muted/50 px-4 py-2 font-semibold text-sm">
                                Sección {sIdx + 1}: {section.title}
                            </div>
                            <div className="p-4 space-y-3">
                                {/* Text content */}
                                {section.content && (
                                    <div className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground" dangerouslySetInnerHTML={{ __html: section.content }} />
                                )}

                                {/* Images and videos — centered */}
                                {section.resources?.filter((r: any) => r.type === 'image' || r.type === 'video').length > 0 && (
                                    <div className="space-y-3">
                                        {section.resources.filter((r: any) => r.type === 'image' || r.type === 'video').map((res: any) => (
                                            <div key={res.id} className="flex flex-col items-center gap-1">
                                                {res.type === 'image' && (
                                                    <img src={res.url} alt={res.name} className="max-w-full max-h-72 rounded-lg object-contain border shadow-sm" />
                                                )}
                                                {res.type === 'video' && (
                                                    <video src={res.url} controls className="max-w-full max-h-72 rounded-lg border shadow-sm" />
                                                )}
                                                <span className="text-[10px] text-muted-foreground">{res.name}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* PDF resources */}
                                {section.resources?.filter((r: any) => r.type === 'pdf').length > 0 && (
                                    <div className="space-y-1">
                                        {section.resources.filter((r: any) => r.type === 'pdf').map((res: any) => (
                                            <a key={res.id} href={res.url} target="_blank" rel="noopener noreferrer"
                                                className="flex items-center gap-2 text-xs text-primary hover:underline p-1.5 bg-primary/5 rounded">
                                                <FileText className="w-3.5 h-3.5" />
                                                {res.name}
                                            </a>
                                        ))}
                                    </div>
                                )}

                                {/* Attached document templates — clickable preview */}
                                {section.attachedDocumentIds?.length > 0 && (
                                    <div className="space-y-2 pt-2 border-t">
                                        <p className="text-xs font-semibold text-muted-foreground">Documentos adjuntos:</p>
                                        <div className="flex flex-wrap gap-2">
                                            {section.attachedDocumentIds.map((docId: string) => {
                                                const tmpl = allTemplates?.find(t => t.id === docId);
                                                if (!tmpl) return (
                                                    <span key={docId} className="text-xs text-muted-foreground italic">{docId}</span>
                                                );
                                                return (
                                                    <FormVisualizer
                                                        key={docId}
                                                        template={tmpl}
                                                        formData={{}}
                                                        trigger={
                                                            <Button variant="outline" size="sm" className="gap-1.5 text-xs h-8 cursor-pointer">
                                                                <FileText className="w-3.5 h-3.5 text-primary shrink-0" />
                                                                <span className="truncate max-w-[180px]">{tmpl?.title || docId}</span>
                                                                <Eye className="w-3 h-3 ml-1 text-muted-foreground" />
                                                            </Button>
                                                        }
                                                    />
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}

                    {(!module?.sections || module.sections.length === 0) && (
                        <p className="text-center text-sm text-muted-foreground py-4 italic">Este módulo no tiene secciones de contenido.</p>
                    )}
                </CardContent>
            </Card>

            {/* STUDENTS LIST */}
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <CardTitle>Estudiantes ({group.members.length})</CardTitle>
                        <div className="relative w-[200px]">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Buscar..."
                                className="pl-8 h-9"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                    <CardDescription>Lista de estudiantes matriculados y sus progresos.</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Estudiante</TableHead>
                                <TableHead>Estado</TableHead>
                                <TableHead className="text-right">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredStudents.map((student, idx) => (
                                <TableRow key={idx}>
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-8 w-8">
                                                <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${student.id}`} />
                                                <AvatarFallback>{(student.name || student.fullName || '??').substring(0, 2).toUpperCase()}</AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <span className="font-medium">{student.name || student.fullName || student.email || 'Usuario'}</span>
                                                {student.email && (student.name || student.fullName) && (
                                                    <span className="text-xs text-muted-foreground ml-2">({student.email})</span>
                                                )}
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                                            Activo
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Sheet>
                                            <SheetTrigger asChild>
                                                <Button variant="outline" size="sm">
                                                    Ver Documentos
                                                </Button>
                                            </SheetTrigger>
                                            <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
                                                <SheetHeader className="mb-6">
                                                    <SheetTitle>Documentos de {student.name || student.fullName || student.email || 'Usuario'}</SheetTitle>
                                                    <SheetDescription>
                                                        Revisa los borradores y entregas asociadas al módulo <strong>{module?.title}</strong>.
                                                    </SheetDescription>
                                                </SheetHeader>

                                                {module ? (
                                                    <TeacherDocumentViewer
                                                        studentId={student.id}
                                                        studentName={student.name || student.fullName || student.email || 'Usuario'}
                                                        moduleId={module?.id}
                                                        groupId={groupId}
                                                    />
                                                ) : <p>Cargando módulo...</p>}
                                            </SheetContent>
                                        </Sheet>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {filteredStudents.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                                        No se encontraron estudiantes.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
