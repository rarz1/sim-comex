"use client";

import React, { useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Printer, Eye, X } from "lucide-react";
import { DocumentTemplate } from "@/types/form";

interface FormVisualizerProps {
    template: DocumentTemplate;
    formData: Record<string, any>;
    trigger?: React.ReactNode;
}

export function FormVisualizer({ template, formData, trigger }: FormVisualizerProps) {
    const printRef = useRef<HTMLDivElement>(null);

    const handlePrint = () => {
        const pdfImage = template.pdfUrl;
        if (!pdfImage) {
            alert("No hay imagen de fondo para imprimir.");
            return;
        }

        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        const placedFields = (template.schema?.sections || []).flatMap(s => s.fields || []).filter(f => f.coordinates);

        const fieldsHtml = placedFields.map(field => {
            const value = formData[field.id] || "";
            return `
            <div style="
                position: absolute;
                left: ${field.coordinates!.x * 100}%;
                top: ${field.coordinates!.y * 100}%;
                width: ${field.coordinates!.width * 100}%;
                height: ${field.coordinates!.height * 100}%;
                display: flex;
                align-items: center;
                justify-content: flex-start;
                padding: 2px;
                font-size: 11px;
                font-family: 'Courier New', Courier, monospace;
                font-weight: bold;
                color: #000;
                overflow: hidden;
                box-sizing: border-box;
                pointer-events: none;
            ">
                ${value}
            </div>
        `}).join('');

        printWindow.document.write(`
            <html>
                <head>
                    <title>Impresión: ${template.title}</title>
                    <style>
                        body { margin: 0; padding: 0; background: white; }
                        .print-container {
                            position: relative;
                            width: 100%;
                            height: auto;
                        }
                        img {
                            width: 100%;
                            height: auto;
                            display: block;
                        }
                        @media print {
                            body { -webkit-print-color-adjust: exact; }
                            @page { margin: 0; size: auto; }
                        }
                    </style>
                </head>
                <body>
                    <div class="print-container">
                        <img src="${pdfImage}" />
                        ${fieldsHtml}
                    </div>
                    <script>
                        window.onload = () => {
                            setTimeout(() => {
                                window.print();
                                window.close();
                            }, 800);
                        };
                    </script>
                </body>
            </html>
        `);
        printWindow.document.close();
    };

    const placedFields = template.schema.sections.flatMap(s => s.fields).filter(f => f.coordinates);

    return (
        <Dialog>
            <DialogTrigger asChild>
                {trigger || (
                    <Button variant="outline" size="sm">
                        <Eye className="w-4 h-4 mr-2" /> Vista Preliminar
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="max-w-[1250px] w-[98vw] h-[95vh] flex flex-col p-0 gap-0 bg-slate-100 dark:bg-slate-900 border-none shadow-2xl overflow-hidden rounded-xl sm:max-w-[1250px]">
                <DialogHeader className="flex flex-row items-center justify-between p-4 border-b shrink-0 bg-background/95 backdrop-blur-sm z-30">
                    <DialogTitle className="text-xl font-black uppercase tracking-tighter text-primary max-w-[60%]">
                        Vista Preliminar: {template.title}
                    </DialogTitle>
                    <div className="flex gap-2 mr-6">
                        <Button onClick={handlePrint} className="font-bold bg-primary hover:bg-primary/90 shadow-lg px-6 h-10">
                            <Printer className="w-4 h-4 mr-2" /> Imprimir Documento
                        </Button>
                    </div>
                </DialogHeader>

                <div className="flex-1 overflow-auto bg-muted/20 custom-scrollbar flex flex-col items-center py-4">
                    {template.pdfUrl ? (
                        <div className="relative shadow-2xl bg-white ring-1 ring-black/10 shadow-primary/20 shrink-0" style={{ width: '1200px' }}>
                            <img
                                src={template.pdfUrl}
                                alt="Form Background"
                                className="block h-auto w-full pointer-events-none select-none"
                            />
                            {placedFields.map(field => {
                                const value = formData[field.id] || "";
                                return (
                                    <div
                                        key={field.id}
                                        style={{
                                            position: 'absolute',
                                            left: `${field.coordinates!.x * 100}%`,
                                            top: `${field.coordinates!.y * 100}%`,
                                            width: `${field.coordinates!.width * 100}%`,
                                            height: `${field.coordinates!.height * 100}%`,
                                        }}
                                        className="flex items-center justify-start px-1 pointer-events-none bg-blue-500/5"
                                    >
                                        <span className="text-[14px] font-bold text-black font-mono leading-none w-full tracking-tight overflow-visible">
                                            {value}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-20 opacity-50">
                            <X className="w-12 h-12 mb-4" />
                            <p className="font-bold">No hay imagen de fondo configurada</p>
                        </div>
                    )}
                </div>

                <p className="text-[10px] text-muted-foreground text-center pt-2 font-medium italic">
                    Esta es una vista previa de cómo se verán los datos impresos sobre el formulario original.
                </p>
            </DialogContent>
        </Dialog>
    );
}
