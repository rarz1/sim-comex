"use client";

import { useMemo, useRef } from "react";
import { DocumentTemplate, FormField, FormSection } from "@/types/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, Layers, Type, CheckSquare, Hash, Calendar, AlignLeft, LayoutGrid, AlertTriangle, Info, ArrowUp, ArrowDown } from "lucide-react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db/db";

const generateTagId = (label: string): string => {
    if (!label) return "";
    return label
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9\s]/g, "")
        .split(/\s+/)
        .filter(word => word.length > 0)
        .map(word => word.substring(0, 3))
        .join("-");
};

interface SidebarProps {
    template: DocumentTemplate;
    setTemplate: (t: DocumentTemplate) => void;
    activeFieldId: string | null;
    setActiveFieldId: (id: string | null) => void;
    onBulkAdd: (sectionId: string, text: string) => void;
}

// Transparent GIF pixel to suppress default drag ghost (init lazily in browser)
let ghostImage: HTMLImageElement | null = null;
const getGhostImage = () => {
    if (typeof window !== 'undefined' && !ghostImage) {
        ghostImage = new Image();
        ghostImage.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
    }
    return ghostImage;
};

export function Sidebar({ template, setTemplate, activeFieldId, setActiveFieldId, onBulkAdd }: SidebarProps) {
    const sectionsEndRef = useRef<HTMLDivElement>(null);
    const fieldsEndRef = useRef<HTMLDivElement>(null);
    const catalogs = useLiveQuery(() => db.catalogs.toArray());
    const templates = useLiveQuery(() => db.templates.toArray());

    const activeField = useMemo(() => {
        if (!activeFieldId) return null;
        for (const section of template.schema.sections) {
            const field = section.fields.find(f => f.id === activeFieldId);
            if (field) return { field, sectionId: section.id };
        }
        return null;
    }, [activeFieldId, template]);

    const duplicatesInfo = useMemo(() => {
        if (!activeField) return null;
        const currentField = activeField.field;
        const currentLabel = currentField.label.trim().toLowerCase();
        const currentTagId = (currentField.tagId || "").trim().toLowerCase();

        // 1. Check current document (same template) for label duplication
        let hasLocalDuplicateLabel = false;
        if (currentLabel) {
            for (const sec of template.schema.sections) {
                for (const f of sec.fields) {
                    if (f.id !== currentField.id && f.label.trim().toLowerCase() === currentLabel) {
                        hasLocalDuplicateLabel = true;
                        break;
                    }
                }
                if (hasLocalDuplicateLabel) break;
            }
        }

        // 2. Check other documents (other templates) for same tagId
        const matchingOtherDocs: string[] = [];
        if (templates && currentTagId) {
            for (const t of templates) {
                if (t.id === template.id) continue;
                let hasFieldWithSameTag = false;
                if (t.schema && t.schema.sections) {
                    for (const sec of t.schema.sections) {
                        for (const f of sec.fields) {
                            if ((f.tagId || "").trim().toLowerCase() === currentTagId) {
                                hasFieldWithSameTag = true;
                                break;
                            }
                        }
                        if (hasFieldWithSameTag) break;
                    }
                }
                if (hasFieldWithSameTag) {
                    matchingOtherDocs.push(t.title);
                }
            }
        }

        return {
            hasLocalDuplicateLabel,
            matchingOtherDocs
        };
    }, [activeField, template, templates]);

    const updateField = (sectionId: string, fieldId: string, updates: Partial<FormField>) => {
        setTemplate({
            ...template,
            schema: {
                sections: template.schema.sections.map(sec =>
                    sec.id === sectionId
                        ? { ...sec, fields: sec.fields.map(f => f.id === fieldId ? { ...f, ...updates } : f) }
                        : sec
                )
            }
        });
    };

    const deleteField = (sectionId: string, fieldId: string) => {
        setTemplate({
            ...template,
            schema: {
                sections: template.schema.sections.map(sec =>
                    sec.id === sectionId
                        ? { ...sec, fields: sec.fields.filter(f => f.id !== fieldId) }
                        : sec
                )
            }
        });
        setActiveFieldId(null);
    };

    const addSection = () => {
        const newSection: FormSection = {
            id: crypto.randomUUID(),
            title: `Sección ${template.schema.sections.length + 1}`,
            fields: []
        };
        setTemplate({
            ...template,
            schema: { sections: [...template.schema.sections, newSection] }
        });

        // Scroll to bottom after state update
        setTimeout(() => {
            sectionsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
    };

    const updateSection = (sectionId: string, updates: Partial<FormSection>) => {
        setTemplate({
            ...template,
            schema: {
                sections: template.schema.sections.map(s =>
                    s.id === sectionId ? { ...s, ...updates } : s
                )
            }
        });
    };

    const deleteSection = (sectionId: string) => {
        if (!confirm("¿Eliminar esta sección y todos sus campos?")) return;
        setTemplate({
            ...template,
            schema: { sections: template.schema.sections.filter(s => s.id !== sectionId) }
        });
        setActiveFieldId(null);
    };

    // --- Drag & Drop (move between sections) & Reorder (within section) ---
    const handleDragStart = (e: React.DragEvent, sectionId: string, fieldId: string) => {
        try {
            const img = getGhostImage();
            if (img) e.dataTransfer.setDragImage(img, 0, 0);
        } catch {}
        e.dataTransfer.setData("fieldId", fieldId);
        e.dataTransfer.setData("sourceSectionId", sectionId);
        e.dataTransfer.effectAllowed = "move";
    };

    const handleDragOverSection = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
    };

    const handleDropBetweenSections = (e: React.DragEvent, targetSectionId: string) => {
        e.preventDefault();
        const fieldId = e.dataTransfer.getData("fieldId");
        const sourceSectionId = e.dataTransfer.getData("sourceSectionId");
        if (!fieldId || !sourceSectionId || sourceSectionId === targetSectionId) return;

        const sourceSection = template.schema.sections.find(s => s.id === sourceSectionId);
        const field = sourceSection?.fields.find(f => f.id === fieldId);
        if (!field) return;

        setTemplate({
            ...template,
            schema: {
                sections: template.schema.sections.map(sec => {
                    if (sec.id === sourceSectionId) return { ...sec, fields: sec.fields.filter(f => f.id !== fieldId) };
                    if (sec.id === targetSectionId) return { ...sec, fields: [...sec.fields, field] };
                    return sec;
                })
            }
        });
    };

    const moveField = (sectionId: string, fieldId: string, direction: -1 | 1) => {
        setTemplate({
            ...template,
            schema: {
                sections: template.schema.sections.map(sec => {
                    if (sec.id !== sectionId) return sec;
                    const idx = sec.fields.findIndex(f => f.id === fieldId);
                    if (idx === -1) return sec;
                    const newIdx = idx + direction;
                    if (newIdx < 0 || newIdx >= sec.fields.length) return sec;
                    const reordered = [...sec.fields];
                    [reordered[idx], reordered[newIdx]] = [reordered[newIdx], reordered[idx]];
                    return { ...sec, fields: reordered };
                })
            }
        });
    };

    const moveFieldUp = (sectionId: string, fieldId: string) => moveField(sectionId, fieldId, -1);
    const moveFieldDown = (sectionId: string, fieldId: string) => moveField(sectionId, fieldId, 1);

    // --- RENDER STATE B: Active Field Properties ---
    if (activeField) {
        const { field, sectionId } = activeField;
        return (
            <div className="h-full flex flex-col bg-card border-r">
                <div className="p-4 border-b flex justify-between items-center bg-muted/40 sticky top-0 z-10 backdrop-blur-sm">
                    <h3 className="font-semibold text-sm">Editar Campo</h3>
                    <Button variant="default" size="sm" onClick={() => setActiveFieldId(null)}>
                        Hecho
                    </Button>
                </div>
                <div className="p-4 space-y-4 overflow-y-auto flex-1">
                    <div className="space-y-2">
                        <Label>Etiqueta (Label)</Label>
                        <Input
                            value={field.label}
                            onChange={(e) => {
                                const newLabel = e.target.value;
                                const newTagId = generateTagId(newLabel);
                                updateField(sectionId, field.id, { label: newLabel, tagId: newTagId });
                            }}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Tipo de Campo</Label>
                        <Select
                            value={field.type}
                            onValueChange={(val: any) => updateField(sectionId, field.id, { type: val, catalogId: undefined })}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="text">Texto</SelectItem>
                                <SelectItem value="number">Número</SelectItem>
                                <SelectItem value="date">Fecha</SelectItem>
                                <SelectItem value="select">Lista Desplegable</SelectItem>
                                <SelectItem value="checkbox">Checkbox</SelectItem>
                                <SelectItem value="textarea">Área de Texto</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>Tag ID (Validación Cruzada)</Label>
                        <Input
                            value={field.tagId || ''}
                            onChange={(e) => updateField(sectionId, field.id, { tagId: e.target.value })}
                            placeholder="Ej: fob_value"
                            className="font-mono text-xs"
                        />
                        <p className="text-[10px] text-muted-foreground">
                            Usado para validar datos entre documentos.
                        </p>
                    </div>

                    {duplicatesInfo && (duplicatesInfo.hasLocalDuplicateLabel || duplicatesInfo.matchingOtherDocs.length > 0) && (
                        <div className="p-3 border rounded-xl bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-900/50 space-y-2.5 text-xs">
                            {duplicatesInfo.hasLocalDuplicateLabel && (
                                <div className="flex items-start gap-2 text-yellow-800 dark:text-yellow-400 leading-normal">
                                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                                    <span>
                                        <strong>Nombre repetido:</strong> Ya existe otro campo llamado <em>"{field.label}"</em> en este documento.
                                    </span>
                                </div>
                            )}
                            {duplicatesInfo.matchingOtherDocs.length > 0 && (
                                <div className="flex items-start gap-2 text-blue-800 dark:text-blue-400 leading-normal">
                                    <Info className="w-4 h-4 shrink-0 mt-0.5" />
                                    <span>
                                        <strong>Tag ID duplicado:</strong> El Tag ID (<em>{field.tagId}</em>) ya existe en otros documentos:
                                        <ul className="list-disc pl-4 mt-1 space-y-0.5">
                                            {duplicatesInfo.matchingOtherDocs.map((docTitle, i) => (
                                                <li key={i}>{docTitle}</li>
                                            ))}
                                        </ul>
                                    </span>
                                </div>
                            )}
                        </div>
                    )}

                    {field.type === 'select' && (
                        <div className="space-y-3 p-3 border rounded-xl bg-primary/5">
                            <Label className="text-xs font-bold uppercase tracking-widest text-primary">Origen de Datos (Catálogo)</Label>
                            <Select
                                value={field.catalogId || "manual"}
                                onValueChange={(val) => updateField(sectionId, field.id, { catalogId: val === "manual" ? undefined : val })}
                            >
                                <SelectTrigger className="bg-background">
                                    <SelectValue placeholder="Seleccionar catálogo..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="manual">Entrada Manual (Diferido)</SelectItem>
                                    {catalogs?.filter(c => c.id && c.id.trim() !== "").map(c => (
                                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            {!field.catalogId && (
                                <div className="space-y-2">
                                    <Label className="text-[10px]">Opciones manuales (separadas por coma)</Label>
                                    <Textarea
                                        value={field.options?.map(o => o.label).join(', ') || ''}
                                        onChange={(e) => {
                                            const opts = e.target.value.split(',').map(s => s.trim()).filter(s => s);
                                            updateField(sectionId, field.id, {
                                                options: opts.map(o => ({ label: o, value: o }))
                                            });
                                        }}
                                        className="text-xs h-20 bg-background"
                                        placeholder="Opción 1, Opción 2..."
                                    />
                                </div>
                            )}
                        </div>
                    )}

                    {field.type === 'checkbox' && (
                        <div className="space-y-2">
                            <Label>Opciones (separadas por coma)</Label>
                            <Textarea
                                value={field.options?.map(o => o.label).join(', ') || ''}
                                onChange={(e) => {
                                    const opts = e.target.value.split(',').map(s => s.trim()).filter(s => s);
                                    updateField(sectionId, field.id, {
                                        options: opts.map(o => ({ label: o, value: o }))
                                    });
                                }}
                                className="text-xs h-24"
                                placeholder="Opción 1, Opción 2..."
                            />
                        </div>
                    )}

                    <div className="pt-4 border-t">
                        <Button
                            variant="destructive"
                            className="w-full"
                            onClick={() => deleteField(sectionId, field.id)}
                        >
                            <Trash2 className="w-4 h-4 mr-2" /> Eliminar Campo
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    // --- RENDER STATE A: Document Structure ---
    return (
        <div className="h-full flex flex-col bg-card border-r">
            <div className="p-4 border-b bg-muted/40 sticky top-0 z-20 backdrop-blur-sm">
                <h3 className="font-semibold text-sm">Propiedades del Documento</h3>
            </div>
            <div className="p-4 space-y-6 overflow-y-auto flex-1">
                {/* Document Meta */}
                <div className="space-y-3">
                    <div className="space-y-1">
                        <Label>Nombre del Documento</Label>
                        <Input
                            value={template.title}
                            onChange={(e) => setTemplate({ ...template, title: e.target.value })}
                        />
                    </div>
                    <div className="space-y-1">
                        <Label>Descripción</Label>
                        <Input
                            value={template.description || ''}
                            onChange={(e) => setTemplate({ ...template, description: e.target.value })}
                        />
                    </div>
                    <div className="space-y-1">
                        <Label>Estado</Label>
                        <Select
                            value={template.status}
                            onValueChange={(val: 'draft' | 'published') => setTemplate({ ...template, status: val })}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="draft">Borrador</SelectItem>
                                <SelectItem value="published">Final (Publicado)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Sections & Fields List */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between sticky top-[-16px] bg-card py-2 z-10 border-b mb-2">
                        <Label className="text-xs font-bold uppercase text-muted-foreground">Estructura</Label>
                        <Button variant="default" size="sm" className="h-7 text-[10px] font-black uppercase tracking-widest px-4 rounded-full" onClick={addSection}>
                            <Plus className="w-3 h-3 mr-1" /> Añadir Sección
                        </Button>
                    </div>

                    <div className="space-y-4">
                        {template.schema.sections.map((section, idx) => (
                            <div 
                                key={section.id} 
                                onDragOver={handleDragOverSection}
                                onDrop={(e) => handleDropBetweenSections(e, section.id)}
                                className="border rounded-xl shadow-sm hover:shadow-md transition-shadow bg-background/40"
                            >
                                <div className="bg-muted p-2 flex items-center justify-between gap-2 border-b">
                                    <div className="flex items-center gap-1 flex-1 min-w-0">
                                        <span className="text-[10px] font-bold text-muted-foreground whitespace-nowrap">Paso {idx + 1}:</span>
                                        <Input
                                            value={section.title}
                                            onChange={(e) => updateSection(section.id, { title: e.target.value })}
                                            className="h-6 text-xs px-1 bg-transparent border-none focus-visible:ring-1 focus-visible:ring-primary font-bold truncate"
                                        />
                                    </div>
                                    <div
                                        className="p-1 hover:bg-destructive/10 rounded cursor-pointer shrink-0"
                                        onClick={(e) => { e.stopPropagation(); deleteSection(section.id); }}
                                        title="Eliminar sección"
                                    >
                                        <Trash2 className="w-3 h-3 text-destructive" />
                                    </div>
                                </div>
                                <div className="p-3 space-y-3 bg-background/50">
                                    <div className="space-y-1">
                                        <Label className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">Añadir Masivo (Nombres)</Label>
                                        <Input
                                            className="h-8 text-xs rounded-lg"
                                            placeholder="Nombre, Edad, Fecha..."
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    onBulkAdd(section.id, e.currentTarget.value);
                                                    e.currentTarget.value = '';
                                                    setTimeout(() => fieldsEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
                                                }
                                            }}
                                        />
                                    </div>

                                    {/* Field List */}
                                    <div className="space-y-1.5 pt-1">
                                        {section.fields.map((f, fieldIdx) => (
                                            <div
                                                key={f.id}
                                                draggable
                                                onDragStart={(e) => handleDragStart(e, section.id, f.id)}
                                                className={`
                                                    text-xs p-2 rounded-lg cursor-grab border flex items-center gap-1 group
                                                    hover:bg-primary/5 hover:border-primary/30 transition-all active:cursor-grabbing
                                                    ${activeFieldId === f.id ? 'ring-2 ring-primary border-primary bg-primary/5' : 'bg-background'}
                                                    ${f.coordinates ? 'border-l-4 border-l-green-500' : 'border-l-4 border-l-orange-400'}
                                                `}
                                                onClick={() => setActiveFieldId(f.id)}
                                            >
                                                {f.type === 'text' && <Type className="w-3.5 h-3.5 text-blue-500 shrink-0" />}
                                                {f.type === 'number' && <Hash className="w-3.5 h-3.5 text-purple-500 shrink-0" />}
                                                {f.type === 'date' && <Calendar className="w-3.5 h-3.5 text-red-500 shrink-0" />}
                                                {f.type === 'textarea' && <AlignLeft className="w-3.5 h-3.5 text-gray-500 shrink-0" />}
                                                {f.type === 'select' && <Layers className="w-3.5 h-3.5 text-orange-500 shrink-0" />}
                                                {f.type === 'checkbox' && <CheckSquare className="w-3.5 h-3.5 text-green-500 shrink-0" />}
                                                <span className="truncate flex-1 font-medium">{f.label}</span>

                                                {/* Reorder buttons */}
                                                <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <div
                                                        className={`p-1 rounded hover:bg-primary/10 ${fieldIdx === 0 ? 'opacity-20 pointer-events-none' : 'cursor-pointer'}`}
                                                        onClick={(e) => { e.stopPropagation(); moveFieldUp(section.id, f.id); }}
                                                        title="Mover arriba"
                                                    >
                                                        <ArrowUp className="w-3 h-3" />
                                                    </div>
                                                    <div
                                                        className={`p-1 rounded hover:bg-primary/10 ${fieldIdx === section.fields.length - 1 ? 'opacity-20 pointer-events-none' : 'cursor-pointer'}`}
                                                        onClick={(e) => { e.stopPropagation(); moveFieldDown(section.id, f.id); }}
                                                        title="Mover abajo"
                                                    >
                                                        <ArrowDown className="w-3 h-3" />
                                                    </div>
                                                </div>

                                                <div
                                                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-destructive/10 rounded"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        deleteField(section.id, f.id);
                                                    }}
                                                    title="Eliminar campo"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5 text-destructive" />
                                                </div>
                                            </div>
                                        ))}
                                        {section.fields.length === 0 && (
                                            <div className="text-center py-4 border border-dashed rounded-lg bg-muted/20">
                                                <p className="text-[9px] text-muted-foreground font-black uppercase tracking-widest">Sin campos</p>
                                            </div>
                                        )}
                                        <div ref={fieldsEndRef} />
                                    </div>
                                </div>
                            </div>
                        ))}
                        <div ref={sectionsEndRef} />
                    </div>
                </div>
            </div>
        </div>
    );
}

