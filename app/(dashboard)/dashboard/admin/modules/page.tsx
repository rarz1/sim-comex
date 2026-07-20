"use client";

import { useState } from "react";
import { useModules, useUsers, useCreateOrUpdateModule, useDeleteModule } from "@/hooks/useData";
import { Module } from "@/types/modules";
import { ModuleEditor } from "@/components/admin/ModuleEditor";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, BookOpen, Trash2, FileText, Copy, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

export default function ModulesPage() {
    const [isEditing, setIsEditing] = useState(false);
    const [selectedModuleId, setSelectedModuleId] = useState<string | undefined>(undefined);
    const [moduleSearch, setModuleSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState<"all" | "published" | "draft">("all");
    const [teacherFilter, setTeacherFilter] = useState("all");

    const { data: modules } = useModules();
    const { data: allUsers } = useUsers();
    const createOrUpdateModule = useCreateOrUpdateModule();
    const deleteModule = useDeleteModule();

    const filteredModules = modules?.filter(m => {
        const q = moduleSearch.toLowerCase();
        const matchesSearch = m.title.toLowerCase().includes(q) || (m.description || "").toLowerCase().includes(q);
        const matchesStatus = statusFilter === "all" || m.status === statusFilter;
        const matchesTeacher = teacherFilter === "all" || m.teacherId === teacherFilter;
        return matchesSearch && matchesStatus && matchesTeacher;
    });

    const handleCreate = () => {
        setSelectedModuleId(undefined);
        setIsEditing(true);
    };

    const handleEdit = (id: string) => {
        setSelectedModuleId(id);
        setIsEditing(true);
    };

    const handleDelete = async (id: string) => {
        if (confirm("¿Estás seguro de eliminar este módulo?")) {
            deleteModule.mutate(id);
        }
    };

    const handleDuplicate = async (original: Module) => {
        const copy: Module = {
            ...original,
            id: crypto.randomUUID(),
            title: `${original.title} (Copia)`,
            teacherId: "",
            groupIds: [],
            sections: original.sections.map(s => ({
                ...s,
                id: crypto.randomUUID(),
            })),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            status: 'draft',
        };
        await createOrUpdateModule.mutateAsync(copy);
        toast.success(`Módulo duplicado como "${copy.title}"`);
    };

    if (isEditing) {
        return (
            <div className="p-6 max-w-5xl mx-auto pb-20">
                <div className="mb-6 flex items-center justify-between">
                    <h1 className="text-2xl font-bold">
                        {selectedModuleId ? "Editar Módulo" : "Nuevo Módulo"}
                    </h1>
                    <Button variant="ghost" onClick={() => setIsEditing(false)}>Volver a la lista</Button>
                </div>
                <ModuleEditor
                    moduleId={selectedModuleId}
                    onSave={() => setIsEditing(false)}
                    onCancel={() => setIsEditing(false)}
                />
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6 max-w-7xl mx-auto overflow-x-hidden">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Gestión de Módulos</h1>
                    <p className="text-muted-foreground">
                        Administra los módulos educativos, sus contenidos y asignaciones.
                        <span className="ml-2 inline-flex items-center gap-1 text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                            {modules?.length || 0} módulos
                        </span>
                    </p>
                </div>
                <Button onClick={handleCreate}>
                    <Plus className="w-4 h-4 mr-2" /> Nuevo Módulo
                </Button>
            </div>

            <div className="flex items-center gap-3">
                <div className="relative flex-1 max-w-xs">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar módulo..."
                        className="pl-8 h-9 text-xs"
                        value={moduleSearch}
                        onChange={e => setModuleSearch(e.target.value)}
                    />
                </div>
                <Select value={statusFilter} onValueChange={(v: any) => setStatusFilter(v)}>
                    <SelectTrigger className="h-9 w-[140px] text-xs">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        <SelectItem value="published">Publicados</SelectItem>
                        <SelectItem value="draft">Borradores</SelectItem>
                    </SelectContent>
                </Select>
                <Select value={teacherFilter} onValueChange={setTeacherFilter}>
                    <SelectTrigger className="h-9 w-[180px] text-xs">
                        <SelectValue placeholder="Docente" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Todos los docentes</SelectItem>
                        {allUsers?.filter(u => u.role === 'teacher').map(t => (
                            <SelectItem key={t.id} value={t.id}>{t.name || t.email}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <Card>
                <CardContent className="p-0">
                    <Table className="table-fixed w-full">
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[45%]">Módulo</TableHead>
                                <TableHead className="w-[20%]">Documentos</TableHead>
                                <TableHead className="w-[15%]">Estado</TableHead>
                                <TableHead className="w-[20%] text-right">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {(!filteredModules || filteredModules.length === 0) && (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                                        <div className="flex flex-col items-center gap-2">
                                            <BookOpen className="w-8 h-8 opacity-50" />
                                            <p>No hay módulos creados. Crea el primero.</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )}

                            {filteredModules?.map(module => (
                                <TableRow key={module.id} className="group cursor-pointer hover:bg-muted/50" onClick={() => handleEdit(module.id)}>
                                    <TableCell className="font-medium">
                                        <div className="text-sm font-bold text-gray-900 dark:text-gray-100 group-hover:text-primary transition-colors">{module.title}</div>
                                        <div className="text-[11px] text-muted-foreground whitespace-normal break-words font-medium">{module.description || "Sin descripción"}</div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground bg-muted/30 w-fit px-2 py-1 rounded-md">
                                            <FileText className="w-3.5 h-3.5 text-primary" />
                                            <span>{(module.sections || []).reduce((acc, s) => acc + (s.attachedDocumentIds?.length || 0), 0)} docs</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={module.status === 'published' ? 'default' : 'secondary'} className="text-[10px]">
                                            {module.status === 'published' ? 'Publicado' : 'Borrador'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={(e) => { e.stopPropagation(); handleDuplicate(module); }}
                                            className="h-8 w-8 text-muted-foreground hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity"
                                            title="Duplicar módulo"
                                        >
                                            <Copy className="w-4 h-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={(e) => { e.stopPropagation(); handleDelete(module.id); }}
                                            className="h-8 w-8 text-destructive hover:bg-destructive/10"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
