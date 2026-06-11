"use client";

import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db/db";
import { dbService } from "@/lib/services/dbService";
import { Module } from "@/types/modules";
import { ModuleEditor } from "@/components/admin/ModuleEditor";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, BookOpen, Trash2, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function ModulesPage() {
    const [isEditing, setIsEditing] = useState(false);
    const [selectedModuleId, setSelectedModuleId] = useState<string | undefined>(undefined);

    const modules = useLiveQuery(() => db.modules.toArray());
    const allUsers = useLiveQuery(() => db.users.toArray());

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
            await db.modules.delete(id);
            await dbService.deleteModuleCloud(id);
        }
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
                    <p className="text-muted-foreground">Administra los módulos educativos, sus contenidos y asignaciones.</p>
                </div>
                <Button onClick={handleCreate}>
                    <Plus className="w-4 h-4 mr-2" /> Nuevo Módulo
                </Button>
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
                            {(!modules || modules.length === 0) && (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                                        <div className="flex flex-col items-center gap-2">
                                            <BookOpen className="w-8 h-8 opacity-50" />
                                            <p>No hay módulos creados. Crea el primero.</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )}

                            {modules?.map(module => (
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
