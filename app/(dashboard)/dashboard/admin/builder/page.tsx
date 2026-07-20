"use client";

import { useState, useEffect } from "react";
import { FormDesigner } from "@/components/form-builder/FormDesigner";
import { DocumentTemplate } from "@/types/form";
import { useTemplates, useTemplate, useDeleteTemplate } from "@/hooks/useData";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, PenTool, LayoutTemplate, Trash2, Calendar, FileText, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatDate } from "date-fns";
import { es } from "date-fns/locale";

export default function BuilderPage() {
    const [isEditing, setIsEditing] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [templateSearch, setTemplateSearch] = useState("");
    const [templateStatusFilter, setTemplateStatusFilter] = useState<"all" | "published" | "draft">("all");

    const { data: templates } = useTemplates();
    const { data: fullTemplate } = useTemplate(editingId || undefined);
    const deleteTemplate = useDeleteTemplate();

    const filteredTemplates = templates?.filter(t => {
        const q = templateSearch.toLowerCase();
        const matchesSearch = t.title.toLowerCase().includes(q) || (t.description || "").toLowerCase().includes(q);
        const matchesStatus = templateStatusFilter === "all" || t.status === templateStatusFilter;
        return matchesSearch && matchesStatus;
    });

    const handleCreateNew = () => {
        setEditingId(null);
        setIsEditing(true);
    };

    const handleEdit = (template: DocumentTemplate) => {
        setEditingId(template.id);
        setIsEditing(true);
    };

    const handleDelete = async (id: string) => {
        if (confirm("¿Estás seguro de eliminar esta plantilla?")) {
            deleteTemplate.mutate(id);
        }
    };

    const handleCloseEditor = () => {
        setIsEditing(false);
        setEditingId(null);
    };

    if (isEditing) {
        if (editingId && !fullTemplate) {
            return <div className="flex h-screen items-center justify-center text-muted-foreground">Cargando plantilla...</div>;
        }
        return (
            <div className="fixed inset-0 z-50 bg-background flex flex-col">
                <div className="flex-1 overflow-hidden">
                    <FormDesigner
                        key={editingId || 'new'}
                        initialTemplate={editingId ? (fullTemplate ?? undefined) : undefined}
                        onClose={handleCloseEditor}
                    />
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6 max-w-7xl mx-auto">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Constructor de Documentos</h1>
                    <p className="text-muted-foreground">
                        Administra y diseña las plantillas de formularios.
                        <span className="ml-2 inline-flex items-center gap-1 text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                            {templates?.length || 0} plantillas
                        </span>
                    </p>
                </div>
                <Button onClick={handleCreateNew}>
                    <Plus className="w-4 h-4 mr-2" /> Crear Nuevo
                </Button>
            </div>

            <div className="flex items-center gap-3">
                <div className="relative flex-1 max-w-xs">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar plantilla..."
                        className="pl-8 h-9 text-xs"
                        value={templateSearch}
                        onChange={e => setTemplateSearch(e.target.value)}
                    />
                </div>
                <Select value={templateStatusFilter} onValueChange={(v: any) => setTemplateStatusFilter(v)}>
                    <SelectTrigger className="h-9 w-[140px] text-xs">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        <SelectItem value="published">Final</SelectItem>
                        <SelectItem value="draft">Borrador</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Empty State */}
            {templates && templates.length > 0 && filteredTemplates?.length === 0 && (
                <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed rounded-lg text-muted-foreground bg-muted/10">
                    <Search className="w-12 h-12 mb-4 opacity-50" />
                    <h3 className="text-lg font-medium">Sin resultados</h3>
                    <p className="mb-4 text-sm">No hay plantillas que coincidan con los filtros.</p>
                </div>
            )}

            {templates?.length === 0 && (
                <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed rounded-lg text-muted-foreground bg-muted/10">
                    <FileText className="w-12 h-12 mb-4 opacity-50" />
                    <h3 className="text-lg font-medium">No hay plantillas creadas</h3>
                    <p className="mb-4 text-sm">Comienza creando tu primera plantilla de documento.</p>
                    <Button variant="outline" onClick={handleCreateNew}>Crear Plantilla</Button>
                </div>
            )}

            {/* Template List Table */}
            {templates && templates.length > 0 && (
                <Card>
                    <CardContent className="p-0">
                        <Table className="table-fixed w-full">
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[40%]">Plantilla</TableHead>
                                    <TableHead className="w-[12%]">Estado</TableHead>
                                    <TableHead className="w-[12%]">Campos</TableHead>
                                    <TableHead className="w-[20%]">Última Actualización</TableHead>
                                    <TableHead className="w-[16%] text-right">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredTemplates?.map(template => (
                                    <TableRow key={template.id} className="group cursor-pointer hover:bg-muted/50" onClick={() => handleEdit(template)}>
                                        <TableCell className="font-medium">
                                            <div>{template.title}</div>
                                            <div className="text-xs text-muted-foreground whitespace-normal break-words">{template.description || "Sin descripción"}</div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={template.status === 'published' ? 'default' : 'secondary'} className="text-[10px]">
                                                {template.status === 'published' ? 'Final' : 'Borrador'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="text-xs text-muted-foreground">
                                                {template.schema.sections.reduce((acc, s) => acc + s.fields.length, 0)} campos
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                                <Calendar className="w-3 h-3" />
                                                <span>{template.updatedAt ? formatDate(new Date(template.updatedAt), "d MMM yyyy", { locale: es }) : '-'}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={(e) => { e.stopPropagation(); handleDelete(template.id); }}
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
            )}
        </div>
    );
}
