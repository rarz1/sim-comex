"use client";

import { Dispatch, SetStateAction, useRef, useState, useEffect } from "react";
import { DocumentTemplate, FormField, FormSection } from "@/types/form";
import { Button } from "@/components/ui/button";
import { Upload, X, Type, Hash, Calendar, List, CheckSquare } from "lucide-react";

interface CanvasProps {
    template: DocumentTemplate;
    setTemplate: Dispatch<SetStateAction<DocumentTemplate>>;
    pdfImage: string | null;
    setPdfImage: (img: string | null) => void;
    activeFieldId: string | null;
    setActiveFieldId: (id: string | null) => void;
    currentSectionId: string | null; // ID of the section where new fields should be added
}

export function Canvas({
    template,
    setTemplate,
    pdfImage,
    setPdfImage,
    activeFieldId,
    setActiveFieldId,
    currentSectionId
}: CanvasProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const imageContainerRef = useRef<HTMLDivElement>(null);

    // Initial width/height for new fields (AS PERCENTAGE of container)
    const DEFAULT_WIDTH_PCT = 0.15;
    const DEFAULT_HEIGHT_PCT = 0.018; // Matches font size (10px approx)

    // Interaction State
    const [draggingId, setDraggingId] = useState<string | null>(null);
    const [resizingId, setResizingId] = useState<string | null>(null);
    const [interactionStart, setInteractionStart] = useState<{
        x: number; y: number;
        initialX: number; initialY: number;
        initialW: number; initialH: number;
    } | null>(null);

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.type === 'application/pdf') {
            alert("Por favor, sube una imagen (JPG/PNG) para este prototipo.");
            return;
        }

        const reader = new FileReader();
        reader.onload = (ev) => {
            setPdfImage(ev.target?.result as string);
        };
        reader.readAsDataURL(file);
    };

    // --- Keyboard Navigation Logic ---
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!activeFieldId) return;

            // Prevent scrolling with arrows when moving fields
            const keysToHandle = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];
            if (keysToHandle.includes(e.key)) {
                e.preventDefault();
            }

            const step = 0.002; // 0.2% movement per press

            // Find current field coordinates
            let currentField: FormField | undefined;
            for (const sec of template.schema.sections) {
                currentField = sec.fields.find(f => f.id === activeFieldId);
                if (currentField) break;
            }

            if (!currentField?.coordinates) return;

            switch (e.key) {
                case 'ArrowUp':
                    updateCoordinates(activeFieldId, { y: currentField.coordinates.y - step });
                    break;
                case 'ArrowDown':
                    updateCoordinates(activeFieldId, { y: currentField.coordinates.y + step });
                    break;
                case 'ArrowLeft':
                    updateCoordinates(activeFieldId, { x: currentField.coordinates.x - step });
                    break;
                case 'ArrowRight':
                    updateCoordinates(activeFieldId, { x: currentField.coordinates.x + step });
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [activeFieldId, template]); // Re-run when activeField changes or template (for latest coords)

    const handleCanvasDoubleClick = (e: React.MouseEvent) => {
        // Only create field if we are double clicking on the image container directly
        if (draggingId || resizingId || !pdfImage || !imageContainerRef.current) return;

        const rect = imageContainerRef.current.getBoundingClientRect();
        const xPct = (e.clientX - rect.left) / rect.width;
        const yPct = (e.clientY - rect.top) / rect.height;

        // Ensure within bounds
        if (xPct < 0 || xPct > 1 || yPct < 0 || yPct > 1) return;

        // Create new field
        const newFieldId = crypto.randomUUID();
        const sectionIdToUse = currentSectionId || template.schema.sections[0]?.id;

        if (!sectionIdToUse) {
            alert("Primero crea una sección en la barra lateral.");
            return;
        }

        const newField: FormField = {
            id: newFieldId,
            label: "Nuevo Campo",
            type: "text",
            coordinates: {
                page: 1,
                x: xPct,
                y: yPct,
                width: DEFAULT_WIDTH_PCT,
                height: DEFAULT_HEIGHT_PCT
            }
        };

        setTemplate(prev => ({
            ...prev,
            schema: {
                sections: prev.schema.sections.map((sec: FormSection) =>
                    sec.id === sectionIdToUse
                        ? { ...sec, fields: [...sec.fields, newField] }
                        : sec
                )
            }
        }));
        setActiveFieldId(newFieldId);
    };

    // --- Drag & Resize Logic ---

    // Modified updateCoordinates to handle relative updates or absolute ones
    const updateCoordinates = (fieldId: string, updates: Partial<{ x: number, y: number, width: number, height: number }>) => {
        setTemplate(prev => ({
            ...prev,
            schema: {
                sections: prev.schema.sections.map((sec: FormSection) => ({
                    ...sec,
                    fields: sec.fields.map((f: FormField) =>
                        f.id === fieldId && f.coordinates
                            ? { ...f, coordinates: { ...f.coordinates, ...updates } }
                            : f
                    )
                }))
            }
        }));
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!interactionStart || !imageContainerRef.current) return;

        const rect = imageContainerRef.current.getBoundingClientRect();

        // Delta in pixels
        const dxPx = e.clientX - interactionStart.x;
        const dyPx = e.clientY - interactionStart.y;

        // Delta in percent
        const dx = dxPx / rect.width;
        const dy = dyPx / rect.height;

        if (draggingId) {
            const newX = interactionStart.initialX + dx;
            const newY = interactionStart.initialY + dy;
            updateCoordinates(draggingId, { x: newX, y: newY });
        } else if (resizingId) {
            const newW = Math.max(0.02, interactionStart.initialW + dx);

            // Quantize height resizing to "rows"
            const rawH = interactionStart.initialH + dy;
            const rows = Math.round(rawH / DEFAULT_HEIGHT_PCT);
            const newH = Math.max(DEFAULT_HEIGHT_PCT, rows * DEFAULT_HEIGHT_PCT);

            updateCoordinates(resizingId, { width: newW, height: newH });
        }
    };

    const handleMouseUp = () => {
        setDraggingId(null);
        setResizingId(null);
        setInteractionStart(null);
    };

    const startDragging = (e: React.MouseEvent, field: FormField) => {
        e.stopPropagation();
        e.preventDefault();
        if (!field.coordinates) return;

        setActiveFieldId(field.id);
        setDraggingId(field.id);
        setInteractionStart({
            x: e.clientX,
            y: e.clientY,
            initialX: field.coordinates.x,
            initialY: field.coordinates.y,
            initialW: field.coordinates.width,
            initialH: field.coordinates.height
        });
    };

    const startResizing = (e: React.MouseEvent, field: FormField) => {
        e.stopPropagation();
        e.preventDefault();
        if (!field.coordinates) return;

        setActiveFieldId(field.id);
        setResizingId(field.id);
        setInteractionStart({
            x: e.clientX,
            y: e.clientY,
            initialX: field.coordinates.x,
            initialY: field.coordinates.y,
            initialW: field.coordinates.width,
            initialH: field.coordinates.height
        });
    };

    // Collect all fields that have coordinates
    const placedFields = template.schema.sections.flatMap(s => s.fields).filter(f => f.coordinates);

    return (
        <div
            className="h-full w-full bg-slate-100 dark:bg-slate-900 overflow-auto relative flex items-start justify-center p-8 select-none"
            ref={containerRef}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onClick={() => setActiveFieldId(null)} // Click outside to deselect
        >
            {!pdfImage ? (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                    <Upload className="w-16 h-16 mb-4 opacity-30" />
                    <p className="mb-4 text-lg font-medium">Sube una imagen de fondo</p>
                    <p className="text-sm mb-6 max-w-sm text-center">Para comenzar a diseñar el formulario, necesitas una imagen base (Factura, Formulario Escaneado, etc.)</p>
                    <label className="cursor-pointer">
                        <div className="bg-primary hover:bg-primary/90 text-primary-foreground h-10 px-6 py-2 rounded-md text-sm font-medium transition-colors shadow-sm">
                            Subir Imagen
                        </div>
                        <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                    </label>
                </div>
            ) : (
                <div
                    ref={imageContainerRef}
                    className="relative shadow-2xl bg-white inline-block ring-1 ring-slate-900/10"
                    style={{ minHeight: '400px', minWidth: '300px' }}
                    onDoubleClick={(e) => {
                        e.stopPropagation(); // Stop bubbling to parent
                        handleCanvasDoubleClick(e);
                    }}
                >
                    <img
                        src={pdfImage}
                        alt="Form Background"
                        className="block h-auto pointer-events-none select-none max-w-[1000px]" // Limit max width for usability
                        style={{ maxWidth: '100%' }}
                        draggable={false}
                    />

                    {/* Close/Remove Image Button */}
                    <Button
                        variant="destructive"
                        size="icon"
                        className="absolute -top-4 -right-4 z-50 h-8 w-8 rounded-full shadow-lg"
                        onClick={(e) => {
                            e.stopPropagation();
                            if (confirm("¿Estás seguro de quitar la imagen de fondo?")) {
                                setPdfImage(null);
                            }
                        }}
                    >
                        <X className="w-4 h-4" />
                    </Button>

                    {/* Placed Fields */}
                    {placedFields.map(field => (
                        <div
                            key={field.id}
                            onMouseDown={(e) => startDragging(e, field)}
                            style={{
                                position: 'absolute',
                                left: `${field.coordinates!.x * 100}% `,
                                top: `${field.coordinates!.y * 100}% `,
                                width: `${field.coordinates!.width * 100}% `,
                                height: `${field.coordinates!.height * 100}% `,
                                cursor: 'move'
                            }}
                            className={`
                                group absolute flex items - center justify - center rounded transition - shadow
                                ${activeFieldId === field.id
                                    ? 'z-40 ring-2 ring-primary bg-primary/10 border-primary'
                                    : 'z-10 bg-yellow-400/20 border border-yellow-500/50 hover:bg-yellow-400/30'
                                }
`}
                            onClick={(e) => {
                                e.stopPropagation();
                                setActiveFieldId(field.id);
                            }}
                        >
                            {/* Label */}
                            <div className="px-1 w-full overflow-hidden flex items-center gap-1">
                                {field.type === 'text' && <Type className="w-3 h-3 opacity-50 shrink-0" />}
                                {field.type === 'number' && <Hash className="w-3 h-3 opacity-50 shrink-0" />}
                                {field.type === 'date' && <Calendar className="w-3 h-3 opacity-50 shrink-0" />}
                                {field.type === 'select' && <List className="w-3 h-3 opacity-50 shrink-0" />}

                                {field.type === 'checkbox' && <CheckSquare className="w-3 h-3 opacity-50 shrink-0" />}
                                <span className={`
text - [10px] font - bold px - 1 rounded truncate block w - full
                                    ${activeFieldId === field.id ? 'bg-primary text-primary-foreground' : 'bg-white/80 text-black'}
`}>
                                    {field.label}
                                </span>
                            </div>

                            {/* Resize Handle */}
                            <div
                                className={`
                                    absolute bottom - 0 right - 0 w - 4 h - 4 cursor - se - resize z - 50
                                    flex items - end justify - end p - 0.5
                                    ${activeFieldId === field.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}
`}
                                onMouseDown={(e) => startResizing(e, field)}
                            >
                                <div className="w-2 h-2 bg-primary rounded-xs shadow-sm" />
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
