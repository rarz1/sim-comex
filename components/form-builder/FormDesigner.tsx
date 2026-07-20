"use client";

import { useState } from "react";
import { DocumentTemplate, FormField } from "@/types/form";
import { Button } from "@/components/ui/button";
import { Save, Printer, Loader2 } from "lucide-react";
import { Sidebar } from "./Sidebar";
import { Canvas } from "./Canvas";
import { useCreateOrUpdateTemplate } from "@/hooks/useData";

const IMAGES_BUCKET = 'template-bg';

interface FormDesignerProps {
    initialTemplate?: DocumentTemplate;
    onClose?: () => void;
}

export function FormDesigner({ initialTemplate, onClose }: FormDesignerProps) {
    const saveMutation = useCreateOrUpdateTemplate();
    const [template, setTemplate] = useState<DocumentTemplate>(initialTemplate || {
        id: "new",
        moduleId: "",
        title: "Nuevo Documento",
        description: "",
        pdfUrl: "",
        schema: { sections: [] },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: "draft"
    });

    const [pdfImage, setPdfImage] = useState<string | null>(initialTemplate?.pdfUrl || null);
    const [activeFieldId, setActiveFieldId] = useState<string | null>(null);
    const [activeSectionId, setActiveSectionId] = useState<string | null>(null);

    const handleSaveTemplate = async () => {
        try {
            const templateToSave = { ...template };
            if (templateToSave.id === 'new') {
                templateToSave.id = crypto.randomUUID();
            }
            templateToSave.updatedAt = new Date().toISOString();

            // If pdfImage is a base64 data URL, upload to Storage first
            if (pdfImage) {
                if (pdfImage.startsWith('data:')) {
                    try {
                        const blob = await fetch(pdfImage).then(r => r.blob());
                        const ext = blob.type.split('/')[1] || 'png';
                        const file = new File([blob], `bg.${ext}`, { type: blob.type });
                        const fd = new FormData();
                        fd.append('file', file);
                        fd.append('path', `template-bg/${templateToSave.id}/background.${ext}`);
                        const uploadRes = await fetch('/api/storage/upload', { method: 'POST', body: fd });
                        const uploadJson = await uploadRes.json();
                        if (!uploadJson.error) {
                            templateToSave.pdfUrl = uploadJson.url;
                        } else {
                            templateToSave.pdfUrl = '';
                        }
                    } catch {
                        templateToSave.pdfUrl = '';
                    }
                } else {
                    templateToSave.pdfUrl = pdfImage;
                }
            } else {
                templateToSave.pdfUrl = '';
            }

            await saveMutation.mutateAsync(templateToSave);

            setTemplate({ ...templateToSave, pdfUrl: templateToSave.pdfUrl });
            alert("Plantilla guardada correctamente.");

        } catch (error: any) {
            console.error("Error saving template:", error);
            alert(`Error al guardar la plantilla: ${error.message || error}`);
        }
    };

    const handlePrint = () => {
        if (!pdfImage) {
            alert("No hay imagen de fondo para imprimir.");
            return;
        }

        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        // Collect all fields with coordinates to render them
        const placedFields = template.schema.sections.flatMap(s => s.fields).filter(f => f.coordinates);

        // Generate HTML for fields
        const fieldsHtml = placedFields.map(field => `
            <div style="
                position: absolute;
                left: ${field.coordinates!.x * 100}%;
                top: ${field.coordinates!.y * 100}%;
                width: ${field.coordinates!.width * 100}%;
                height: ${field.coordinates!.height * 100}%;
                border: 1px solid #000;
                background: rgba(255, 255, 255, 0.5);
                display: flex;
                align-items: center;
                justify-content: flex-start;
                padding: 2px;
                font-size: 10px;
                font-family: sans-serif;
                overflow: hidden;
                box-sizing: border-box;
            ">
                ${field.label}
            </div>
        `).join('');

        printWindow.document.write(`
            <html>
                <head>
                    <title>Imprimir Plantilla: ${template.title}</title>
                    <style>
                        body { margin: 0; padding: 0; }
                        .print-container {
                            position: relative;
                            width: 100%;
                            max-width: 1000px; /* Adjust as needed */
                        }
                        img {
                            width: 100%;
                            height: auto;
                            display: block;
                        }
                        @media print {
                            body { -webkit-print-color-adjust: exact; }
                        }
                    </style>
                </head>
                <body>
                    <div class="print-container">
                        <img src="${pdfImage}" />
                        ${fieldsHtml}
                    </div>
                    <script>
                        // Wait for image to load before printing
                        window.onload = () => {
                            setTimeout(() => {
                                window.print();
                                window.close();
                            }, 500);
                        };
                    </script>
                </body>
            </html>
        `);
        printWindow.document.close();
    };

    // --- Logic for Bulk Add ---
    const handleBulkAdd = (sectionId: string, rawText: string) => {
        const labels = rawText.split(',').map(s => s.trim()).filter(s => s.length > 0);
        // Place new fields in a grid or stack in the middle
        // For simplicity, we just add them without coordinates or with default ones if needed. 
        // Or we can add them to the section list only (no coordinates = not on canvas yet).

        // Strategy: Add them without coordinates so they appear in the list, then user can drag/drop/click to place?
        // OR: Add them to canvas in a default grid. The original prompt said "genera automáticamente esos campos en una cuadrícula sobre el lienzo".
        // Let's implement the grid logic.

        // Determine the starting Y position for new fields to avoid overlap
        // We look for the maximum Y + height among ALL fields currently on the canvas
        const allFields = template.schema.sections.flatMap(s => s.fields);
        const placedFields = allFields.filter(f => f.coordinates);

        const maxY = placedFields.reduce((max, f) => {
            const bottom = (f.coordinates?.y || 0) + (f.coordinates?.height || 0);
            return Math.max(max, bottom);
        }, 0);

        const GRID_START_X = 0.05;
        const GAP = 0.01;
        const FIELD_W = 0.15;
        const FIELD_H = 0.018; // Reduced for 10px font fit

        // Start below the lowest field, or at top if empty
        const GRID_START_Y = placedFields.length > 0 ? maxY + GAP : 0.05;

        const newFields: FormField[] = labels.map((label, idx) => {
            // Grid logic: 3 columns
            const row = Math.floor(idx / 3);
            const col = idx % 3;

            return {
                id: crypto.randomUUID(),
                label: label,
                type: 'text',
                coordinates: {
                    page: 1,
                    x: GRID_START_X + (col * (FIELD_W + GAP)),
                    y: GRID_START_Y + (row * (FIELD_H + GAP)),
                    width: FIELD_W,
                    height: FIELD_H
                }
            };
        });

        setTemplate(prev => ({
            ...prev,
            schema: {
                sections: prev.schema.sections.map(sec =>
                    sec.id === sectionId
                        ? { ...sec, fields: [...sec.fields, ...newFields] }
                        : sec
                )
            }
        }));
    };

    const handleBackgroundChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!file.type.startsWith('image/')) {
            alert('Solo se permiten imágenes.');
            return;
        }
        if (file.size > 10 * 1024 * 1024) {
            alert('La imagen es muy grande (máx 10MB). Usa una imagen más pequeña o comprímela.');
            return;
        }

        const tId = template.id === 'new' ? crypto.randomUUID() : template.id;
        const formData = new FormData();
        formData.append('file', file);
        formData.append('path', `template-bg/${tId}/${file.name}`);

        try {
            const res = await fetch('/api/storage/upload', {
                method: 'POST',
                body: formData,
            });
            const json = await res.json();
            if (json.error) throw new Error(json.error);
            setPdfImage(json.url);
            if (template.id === 'new') {
                setTemplate(prev => ({ ...prev, id: tId }));
            }
        } catch (err: any) {
            console.error('Error uploading image:', err);
            alert('Error al subir la imagen a la nube. Intenta de nuevo.');
        }
    };

    return (
        <div className="flex flex-col h-full bg-background">
            {/* Header Toolbar */}
            <div className="h-14 border-b flex items-center justify-between px-4 bg-muted/20 shrink-0">
                <div className="flex items-center gap-2">
                    <span className="font-semibold text-lg tracking-tight">Editor</span>
                    <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full border">
                        {template.status === 'draft' ? 'Borrador' : 'Publicado'}
                    </span>
                </div>
                <div className="flex gap-2 items-center">
                    <label className="cursor-pointer">
                        <Button variant="outline" size="sm" asChild>
                            <span>Cambiar Fondo</span>
                        </Button>
                        <input type="file" accept="image/*" className="hidden" onChange={handleBackgroundChange} />
                    </label>
                    <div className="w-px h-6 bg-border mx-1" />
                    <Button variant="outline" size="sm" onClick={handlePrint} title="Imprimir Fondo">
                        <Printer className="w-4 h-4 mr-2" /> Imprimir
                    </Button>
                    <Button size="sm" onClick={handleSaveTemplate} disabled={saveMutation.isPending}>
                        {saveMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                        {saveMutation.isPending ? 'Guardando...' : 'Guardar'}
                    </Button>
                    {onClose && (
                        <Button variant="secondary" size="sm" onClick={onClose} className="ml-2">
                            Cerrar
                        </Button>
                    )}
                </div>
            </div>

            {/* Main Layout */}
            <div className="flex-1 flex overflow-hidden">
                {/* Left Sidebar (30%) */}
                <div className="w-[350px] shrink-0 border-r z-10 shadow-sm">
                    <Sidebar
                        template={template}
                        setTemplate={setTemplate}
                        activeFieldId={activeFieldId}
                        setActiveFieldId={setActiveFieldId}
                        onBulkAdd={handleBulkAdd}
                    />
                </div>

                {/* Right Canvas (Remaining%) */}
                <div className="flex-1 bg-slate-50 dark:bg-slate-950 relative">
                    <Canvas
                        template={template}
                        setTemplate={setTemplate}
                        pdfImage={pdfImage}
                        setPdfImage={setPdfImage}
                        activeFieldId={activeFieldId}
                        setActiveFieldId={setActiveFieldId}
                        currentSectionId={template.schema.sections[0]?.id || null} // Default to first section for click-to-add
                    />
                </div>
            </div>
        </div>
    );
}
