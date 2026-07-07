"use client";

import { useState, useEffect } from "react";
import { Module, ModuleSection, ModuleResource } from "@/types/modules";
import { DocumentTemplate } from "@/types/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Trash2, Save, FileText, Image as ImageIcon, Video, Link as LinkIcon, Upload } from "lucide-react";
import { useTemplates, useModule, useCreateOrUpdateModule } from "@/hooks/useData";
import { RichTextEditor } from "./RichTextEditor";

interface ModuleEditorProps {
    moduleId?: string;
    onSave: () => void;
    onCancel: () => void;
}

export function ModuleEditor({ moduleId, onSave, onCancel }: ModuleEditorProps) {
    // State
    const [module, setModule] = useState<Module>({
        id: crypto.randomUUID(),
        title: "",
        description: "",
        teacherId: "",
        groupIds: [],
        sections: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: 'draft'
    });

    const createOrUpdateModule = useCreateOrUpdateModule();

    // Data Loaders
    const { data: templates } = useTemplates();
    const { data: fetchedModule } = useModule(moduleId);

    useEffect(() => {
        if (fetchedModule) {
            setModule({
                ...fetchedModule,
                sections: fetchedModule.sections || [],
                groupIds: fetchedModule.groupIds || []
            });
        }
    }, [fetchedModule]);

    // Handlers
    const handleSave = async () => {
        if (!module.title) {
            alert("El título es obligatorio");
            return;
        }
        await createOrUpdateModule.mutateAsync(module);
        window.scrollTo({ top: 0, behavior: 'instant' });
        onSave();
    };

    const addSection = () => {
        const newSection: ModuleSection = {
            id: crypto.randomUUID(),
            title: "Nueva Sección",
            content: "",
            resources: [],
            attachedDocumentIds: []
        };
        setModule({ ...module, sections: [...module.sections, newSection] });
    };

    const updateSection = (id: string, updates: Partial<ModuleSection>) => {
        setModule({
            ...module,
            sections: (module.sections || []).map(s => s.id === id ? { ...s, ...updates } : s)
        });
    };

    const removeSection = (id: string) => {
        if (confirm("¿Eliminar esta sección?")) {
            setModule({ ...module, sections: (module.sections || []).filter(s => s.id !== id) });
        }
    };

    const handleFileUpload = (sectionId: string, type: 'pdf' | 'image' | 'video', e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (ev) => {
            const url = ev.target?.result as string;
            const newResource: ModuleResource = {
                id: crypto.randomUUID(),
                name: file.name,
                type: type,
                url: url,
                size: (file.size / 1024).toFixed(1) + ' KB'
            };

            setModule(prev => ({
                ...prev,
                sections: (prev.sections || []).map(s => s.id === sectionId ? {
                    ...s,
                    resources: [...(s.resources || []), newResource]
                } : s)
            }));
        };
        reader.readAsDataURL(file);
    };

    const removeResource = (sectionId: string, resourceId: string) => {
        setModule(prev => ({
            ...prev,
            sections: (prev.sections || []).map(s => s.id === sectionId ? {
                ...s,
                resources: (s.resources || []).filter(r => r.id !== resourceId)
            } : s)
        }));
    };

    return (
        <div className="space-y-6">
            {/* Properties Header */}
            <div className="grid grid-cols-1 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Información del Módulo</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="md:col-span-2 space-y-2">
                                <Label>Título del Módulo</Label>
                                <Input
                                    value={module.title}
                                    onChange={e => setModule({ ...module, title: e.target.value })}
                                    placeholder="Ej: Comercio Exterior I"
                                    className="h-10 text-lg font-bold"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Estado</Label>
                                <Select
                                    value={module.status}
                                    onValueChange={(val: 'draft' | 'published') => setModule({ ...module, status: val })}
                                >
                                    <SelectTrigger className="h-10 font-medium"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="draft">Borrador</SelectItem>
                                        <SelectItem value="published">Publicado</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Descripción</Label>
                            <Textarea
                                value={module.description}
                                onChange={e => setModule({ ...module, description: e.target.value })}
                                className="min-h-[80px] resize-none"
                                placeholder="Danos una breve descripción de los objetivos de este módulo..."
                            />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Content Sections */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold">Contenido del Módulo</h2>
                    <Button onClick={addSection}>
                        <Plus className="w-4 h-4 mr-2" /> Agregar Sección
                    </Button>
                </div>

                {(module.sections || []).map((section, index) => (
                    <Card key={section.id} className="border-l-4 border-l-primary/50">
                        <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                                <Input
                                    value={section.title}
                                    onChange={(e) => updateSection(section.id, { title: e.target.value })}
                                    className="font-bold text-lg border-none shadow-none focus-visible:ring-0 p-0 h-auto"
                                />
                                <Button variant="ghost" size="sm" onClick={() => removeSection(section.id)} className="text-destructive">
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Rich Text Area with TipTap */}
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Contenido (Texto, Explicación)</Label>
                                    <div className="flex gap-2">
                                        <label className="cursor-pointer">
                                            <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(section.id, 'image', e)} />
                                            <div className="inline-flex items-center justify-center rounded-md text-[10px] font-bold border bg-background hover:bg-accent h-7 px-2">
                                                <ImageIcon className="w-3 h-3 mr-1 text-blue-500" /> + Imagen
                                            </div>
                                        </label>
                                        <label className="cursor-pointer">
                                            <input type="file" accept="video/*" className="hidden" onChange={(e) => handleFileUpload(section.id, 'video', e)} />
                                            <div className="inline-flex items-center justify-center rounded-md text-[10px] font-bold border bg-background hover:bg-accent h-7 px-2">
                                                <Video className="w-3 h-3 mr-1 text-red-500" /> + Video
                                            </div>
                                        </label>
                                    </div>
                                </div>
                                <RichTextEditor
                                    value={section.content}
                                    onChange={(html) => updateSection(section.id, { content: html })}
                                    placeholder="Escribe aquí el contenido teórico de la sección..."
                                    minHeight="200px"
                                />

                                {/* Inline media preview — centered */}
                                {section.resources.filter(r => r.type === 'image' || r.type === 'video').length > 0 && (
                                    <div className="mt-3 space-y-3">
                                        {section.resources.filter(r => r.type === 'image' || r.type === 'video').map(res => (
                                            <div key={res.id} className="flex flex-col items-center gap-1">
                                                {res.type === 'image' && (
                                                    <img
                                                        src={res.url}
                                                        alt={res.name}
                                                        className="max-w-full max-h-64 rounded-lg object-contain border shadow-sm"
                                                    />
                                                )}
                                                {res.type === 'video' && (
                                                    <video
                                                        src={res.url}
                                                        controls
                                                        className="max-w-full max-h-64 rounded-lg border shadow-sm"
                                                    />
                                                )}
                                                <span className="text-[10px] text-muted-foreground">{res.name}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Resources & Documents */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Resources */}
                                <div className="space-y-3">
                                    <Label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                        <FileText className="w-3.5 h-3.5" /> Otros Recursos
                                    </Label>

                                    <div className="flex flex-wrap gap-2 mb-2">
                                        <label className="cursor-pointer inline-flex">
                                            <input type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx" className="hidden" onChange={(e) => handleFileUpload(section.id, 'pdf', e)} />
                                            <div className="inline-flex items-center justify-center rounded-md text-[11px] font-semibold border bg-background hover:bg-accent h-8 px-3">
                                                <Upload className="w-3 h-3 mr-1.5" /> Adjuntar PDF/Doc
                                            </div>
                                        </label>
                                    </div>

                                    {/* Resource List */}
                                    <div className="space-y-1">
                                        {section.resources.map(res => (
                                            <div key={res.id} className="flex items-center justify-between text-xs bg-background border p-2 rounded">
                                                <div className="flex items-center gap-2 overflow-hidden">
                                                    {res.type === 'image' && <ImageIcon className="w-3 h-3 text-blue-500" />}
                                                    {res.type === 'video' && <Video className="w-3 h-3 text-red-500" />}
                                                    {res.type === 'pdf' && <FileText className="w-3 h-3 text-orange-500" />}
                                                    <span className="truncate">{res.name}</span>
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-5 w-5 text-destructive"
                                                    onClick={() => removeResource(section.id, res.id)}
                                                >
                                                    <Trash2 className="w-3 h-3" />
                                                </Button>
                                            </div>
                                        ))}
                                        {section.resources.length === 0 && <p className="text-[11px] text-muted-foreground italic">Sin recursos adicionales</p>}
                                    </div>
                                </div>

                                {/* Form Templates */}
                                <div className="space-y-3 border p-3 rounded bg-muted/20">
                                    <Label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                        <FileText className="w-3.5 h-3.5" /> Formularios / Documentos Asignados
                                    </Label>

                                    <Select
                                        onValueChange={(val) => {
                                            if (val && !(section.attachedDocumentIds || []).includes(val)) {
                                                updateSection(section.id, {
                                                    attachedDocumentIds: [...(section.attachedDocumentIds || []), val]
                                                });
                                            }
                                        }}
                                    >
                                        <SelectTrigger className="h-9">
                                            <SelectValue placeholder="Agregar documento..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {templates?.filter(t => t.id && t.id.trim() !== "" && !(section.attachedDocumentIds || []).includes(t.id)).map(t => (
                                                <SelectItem key={t.id} value={t.id}>{t.title}</SelectItem>
                                            ))}
                                            {(!templates || templates?.length === 0) && (
                                                <SelectItem value="none" disabled>No hay formularios disponibles</SelectItem>
                                            )}
                                        </SelectContent>
                                    </Select>

                                    <div className="space-y-1.5">
                                        {(section.attachedDocumentIds || []).map(docId => {
                                            const doc = templates?.find(t => t.id === docId);
                                            return (
                                                <div key={docId} className="flex items-center justify-between text-xs bg-background border p-2 rounded-md group">
                                                    <span className="truncate font-medium">{doc?.title || "Documento Desconocido"}</span>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-5 w-5 text-muted-foreground group-hover:text-destructive"
                                                        onClick={() => {
                                                            updateSection(section.id, {
                                                                attachedDocumentIds: (section.attachedDocumentIds || []).filter(id => id !== docId)
                                                            });
                                                        }}
                                                    >
                                                        <Trash2 className="w-3 h-3" />
                                                    </Button>
                                                </div>
                                            );
                                        })}
                                        {(section.attachedDocumentIds || []).length === 0 && (
                                            <p className="text-[11px] text-muted-foreground italic text-center py-2">No hay documentos seleccionados</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 border-t sticky bottom-0 bg-background/95 backdrop-blur py-1.5 px-6 -mx-6 z-20">
                <Button
                    variant="outline"
                    onClick={() => {
                        window.scrollTo({ top: 0, behavior: 'instant' });
                        onCancel();
                    }}
                    className="h-8 text-xs font-semibold"
                >
                    Cancelar
                </Button>
                <Button onClick={handleSave} className="h-8 px-6 text-xs font-bold">
                    <Save className="w-3.5 h-3.5 mr-1.5" /> Guardar Módulo
                </Button>
            </div>
        </div>
    );
}
