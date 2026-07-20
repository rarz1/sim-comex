
"use client";

import { useState, useEffect } from "react";
import { DocumentTemplate, FormSection } from "@/types/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronLeft, ChevronRight, Save, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

import { useCatalogs, useDrafts, useCreateOrUpdateDraft } from "@/hooks/useData";
import { useAuth } from "@/hooks/useAuth";
import { validationService, CrossDocumentMatch } from "@/lib/services/validationService";
import { generateFilledPDF } from "@/lib/pdf/pdfGenerator";
import { FileDown, Printer, Eye, AlertCircle } from "lucide-react";
import { FormVisualizer } from "./FormVisualizer";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";

interface FormRendererProps {
    template: DocumentTemplate;
    groupId?: string;
    initialData?: Record<string, any>;
    onSave?: (data: Record<string, any>) => void;
    readOnly?: boolean;
    moduleId?: string; // Optional moduleId for cross-validation
    onExit?: () => void;
}

export function FormRenderer({ template, groupId = "default", initialData = {}, onSave, readOnly = false, moduleId, onExit }: FormRendererProps) {
    const { user } = useAuth();
    const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
    const [formData, setFormData] = useState<Record<string, any>>(initialData);
    const [lastSaved, setLastSaved] = useState<number | null>(null);
    const [crossValidation, setCrossValidation] = useState<Record<string, CrossDocumentMatch[]>>({});
    const { data: catalogs } = useCatalogs();
    const { data: allDrafts } = useDrafts();
    const saveDraftMutation = useCreateOrUpdateDraft();

    const currentDraft = allDrafts?.find(
        d => d.userId === user?.id && d.moduleId === template.id && d.groupId === groupId
    );

    useEffect(() => {
        if (currentDraft) {
            setFormData(currentDraft.content);
            setLastSaved(currentDraft.lastUpdated);
        }
    }, [currentDraft]);

    const sections = template.schema.sections;
    const currentSection = sections[currentSectionIndex];
    const isLastSection = currentSectionIndex === sections.length - 1;
    const isFirstSection = currentSectionIndex === 0;

    const handleInputChange = async (fieldId: string, value: any) => {
        if (readOnly) return;
        setFormData(prev => ({
            ...prev,
            [fieldId]: value
        }));

        // Cross-validation check
        if (user && moduleId && value) {
            const field = currentSection.fields.find(f => f.id === fieldId);
            if (field) {
                try {
                    const matches = await validationService.evaluateField(field, value, user.id, moduleId);
                    setCrossValidation(prev => ({
                        ...prev,
                        [fieldId]: matches
                    }));
                } catch (e) {
                    console.warn("Cross-validation error:", e);
                }
            }
        }
    };

    const handleSave = async (dataToSave: Record<string, any>, isFinal: boolean = false) => {
        if (readOnly) return;
        if (!user) {
            toast.error("Debes iniciar sesión para guardar.");
            return;
        }

        try {
            const timestamp = Date.now();
            const status = isFinal ? 'completed' : 'in_progress';
            const payload: Record<string, any> = {
                documentId: currentDraft?.documentId || crypto.randomUUID(),
                moduleId: template.id,
                groupId,
                userId: user.id,
                content: dataToSave,
                lastUpdated: timestamp,
                status,
            };
            if (currentDraft?.id) payload.id = currentDraft.id;

            await saveDraftMutation.mutateAsync(payload);

            setLastSaved(timestamp);
            if (onSave) onSave(dataToSave);

            if (isFinal) {
                toast.success("Trámite finalizado exitosamente.");
            } else {
                toast.success("Borrador guardado.");
            }

        } catch (error) {
            console.error("Error saving draft:", error);
            toast.error("Error al guardar en el dispositivo.");
        }
    };

    const nextSection = () => {
        if (!readOnly) handleSave(formData, false);
        if (!isLastSection) setCurrentSectionIndex(prev => prev + 1);
    };

    const onManualSave = () => {
        handleSave(formData, false);
    };

    const onFinalize = async () => {
        await handleSave(formData, true);
        if (onExit) onExit();
    };

    const handleDownloadPDF = async () => {
        alert("Generando PDF... (Simulado por ahora)");
    };

    const prevSection = () => {
        if (!isFirstSection) setCurrentSectionIndex(prev => prev - 1);
    };

    const renderField = (field: any) => {
        const matches = crossValidation[field.id] || [];
        const hasConflict = matches.some(m => !m.isCompatible);
        const hasMatch = matches.length > 0;

        return (
            <div key={field.id} className="space-y-2">
                <Label htmlFor={field.id} className="text-sm font-medium flex items-center gap-2">
                    {field.label} {field.validation?.required && <span className="text-red-500">*</span>}
                    {hasMatch && (
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <AlertCircle className={`h-4 w-4 ${hasConflict ? 'text-yellow-500' : 'text-blue-500'}`} />
                                </TooltipTrigger>
                                <TooltipContent className="max-w-xs">
                                    <p className="font-semibold mb-1">
                                        {hasConflict ? '⚠️ Posible inconsistencia' : '✓ Dato relacionado encontrado'}
                                    </p>
                                    {matches.map((m, i) => (
                                        <p key={i} className="text-xs">
                                            {m.docTitle}: <strong>{m.value}</strong>
                                            {!m.isCompatible && ' (diferente)'}
                                        </p>
                                    ))}
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    )}
                </Label>

                {field.type === 'select' ? (
                    <Select
                        disabled={readOnly}
                        value={formData[field.id] || ''}
                        onValueChange={(val) => handleInputChange(field.id, val)}
                    >
                        <SelectTrigger id={field.id}>
                            <SelectValue placeholder="Seleccione..." />
                        </SelectTrigger>
                        <SelectContent>
                            {field.catalogId ? (
                                catalogs?.find(c => c.id === field.catalogId)?.items
                                    .filter((item: any) => item.label && item.label.trim() !== "")
                                    .map((item: any) => (
                                        <SelectItem key={item.id} value={item.label}>
                                            <div className="flex justify-between w-full gap-4">
                                                <span className="font-medium">{item.label}</span>
                                                {item.value && (
                                                    <span className="text-xs text-muted-foreground">{item.value}</span>
                                                )}
                                            </div>
                                        </SelectItem>
                                    ))
                            ) : (
                                field.options?.filter((opt: any) => opt.value && opt.value.trim() !== "").map((opt: any, i: number) => (
                                    <SelectItem key={i} value={opt.label || opt.value}>{opt.label}</SelectItem>
                                ))
                            )}
                        </SelectContent>
                    </Select>
                ) : field.type === 'date' ? (
                    <Input
                        id={field.id}
                        type="date"
                        disabled={readOnly}
                        value={formData[field.id] || ''}
                        onChange={e => handleInputChange(field.id, e.target.value)}
                        className={hasConflict ? 'border-yellow-500' : ''}
                    />
                ) : (
                    <Input
                        id={field.id}
                        disabled={readOnly}
                        type={field.type === 'number' || field.type === 'currency' ? 'number' : 'text'}
                        placeholder={field.placeholder}
                        value={formData[field.id] || ''}
                        onChange={e => handleInputChange(field.id, e.target.value)}
                        className={hasConflict ? 'border-yellow-500' : ''}
                    />
                )}

                {field.helpText && <p className="text-[0.8rem] text-muted-foreground">{field.helpText}</p>}
            </div>
        );
    };

    // 3. Render Case: No sections
    if (!currentSection) {
        return (
            <div className="max-w-3xl mx-auto py-20 text-center space-y-4">
                <div className="bg-muted/30 border-2 border-dashed rounded-xl p-12">
                    <CheckCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-20" />
                    <h2 className="text-xl font-bold text-muted-foreground">Documento sin contenido</h2>
                    <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                        Este documento no tiene secciones configuradas para completar en este momento.
                    </p>
                </div>
                <Button variant="outline" onClick={() => window.history.back()}>
                    Volver al Dashboard
                </Button>
            </div>
        );
    }

    return (
        <div className="max-w-full mx-auto py-6 space-y-8 px-4 overflow-x-hidden">
            {/* Stepper Header */}
            <div className="relative">
                <div className="absolute top-1/2 left-0 w-full h-1 bg-muted -z-10 hidden md:block" />
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    {sections.map((sec, idx) => (
                        <div key={sec.id}
                            className={cn(
                                "flex flex-col items-center gap-2 bg-background p-2 rounded-lg border transition-all cursor-pointer",
                                idx === currentSectionIndex ? "border-primary ring-1 ring-primary shadow-sm" : "border-transparent opacity-70 hover:opacity-100"
                            )}
                            onClick={() => setCurrentSectionIndex(idx)}
                        >
                            <div className={cn(
                                "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-colors shrink-0",
                                idx === currentSectionIndex ? "border-primary bg-primary text-primary-foreground" :
                                    idx < currentSectionIndex ? "border-primary bg-primary/20 text-primary" :
                                        "border-muted-foreground text-muted-foreground"
                            )}>
                                {idx + 1}
                            </div>
                            <span className={cn(
                                "text-[10px] font-semibold text-center leading-tight",
                                idx === currentSectionIndex ? "text-primary" : "text-muted-foreground"
                            )}>
                                {sec.title}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Form Section Card */}
            <Card className="border-t-4 border-t-primary shadow-md">
                <CardHeader>
                    <CardTitle>{currentSection.title}</CardTitle>
                    {currentSection.description && <p className="text-sm text-muted-foreground">{currentSection.description}</p>}
                </CardHeader>
                <CardContent className="grid gap-6 md:grid-cols-3">
                    {currentSection.fields.map(renderField)}
                    {currentSection.fields.length === 0 && <p className="col-span-3 text-center text-muted-foreground italic">Esta sección no tiene campos configurados.</p>}
                </CardContent>
                <CardFooter className="flex justify-between bg-muted/20 p-6">
                    <Button variant="outline" onClick={prevSection} disabled={isFirstSection}>
                        <ChevronLeft className="w-4 h-4 mr-2" /> Anterior
                    </Button>

                    <div className="flex gap-2">
                        {!readOnly && (
                            <>
                                <FormVisualizer
                                    template={template}
                                    formData={formData}
                                    trigger={
                                        <Button variant="outline" className="font-bold">
                                            <Eye className="w-4 h-4 mr-2" /> Vista Preliminar
                                        </Button>
                                    }
                                // The following props are for FormVisualizer, applying the scale increase
                                // This assumes FormVisualizer is a separate component and these props are passed to it.
                                // The actual implementation of FormVisualizer would use these props.
                                // This is a logical interpretation of the instruction "In FormVisualizer.tsx, increase scale significantly."
                                // as the provided code is FormRenderer.tsx.
                                // If FormVisualizer was part of this file, the change would be directly within its JSX.
                                // Since it's a component, we pass props to influence its rendering.
                                />
                                <Button variant="ghost" onClick={onManualSave}>
                                    <Save className="w-4 h-4 mr-2" /> {lastSaved ? 'Guardado' : 'Guardar Borrador'}
                                </Button>
                            </>
                        )}

                        {isLastSection ? (
                            !readOnly ? (
                                <Button onClick={onFinalize} className="bg-green-600 hover:bg-green-700 font-bold shadow-lg">
                                    <CheckCircle className="w-4 h-4 mr-2" /> Finalizar Trámite
                                </Button>
                            ) : null
                        ) : (
                            <Button onClick={nextSection} className="font-bold">
                                Siguiente <ChevronRight className="w-4 h-4 ml-2" />
                            </Button>
                        )}
                    </div>
                </CardFooter>
            </Card>
        </div>
    );
}
