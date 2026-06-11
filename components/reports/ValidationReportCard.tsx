
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertCircle, CheckCircle, XCircle } from "lucide-react";
import { ValidationReport, ValidationDetail } from '@/types/validation';
import { cn } from "@/lib/utils";

interface ValidationReportCardProps {
    report: ValidationReport;
    className?: string;
}

export const ValidationReportCard: React.FC<ValidationReportCardProps> = ({ report, className }) => {

    // Función para obtener color según el score
    const getScoreColor = (score: number) => {
        if (score >= 90) return "text-green-600";
        if (score >= 70) return "text-yellow-600";
        return "text-red-600";
    };

    return (
        <Card className={cn("w-full shadow-md", className)}>
            <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                    <div>
                        <CardTitle className="text-xl">Reporte de Consistencia</CardTitle>
                        <CardDescription>Validación cruzada de datos del módulo</CardDescription>
                    </div>
                    <div className="flex flex-col items-end">
                        <span className="text-sm text-gray-500">Puntaje</span>
                        <span className={cn("text-3xl font-bold", getScoreColor(report.score))}>
                            {report.score}%
                        </span>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="mb-4 flex gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                        <Badge variant="outline">{report.totalTags} Variables</Badge>
                    </div>
                    <div className="flex items-center gap-1">
                        <Badge className="bg-green-100 text-green-800 hover:bg-green-200">
                            {report.matchedTags} Coincidencias
                        </Badge>
                    </div>
                    <div className="flex items-center gap-1">
                        <Badge className="bg-red-100 text-red-800 hover:bg-red-200">
                            {report.totalTags - report.matchedTags} Errores
                        </Badge>
                    </div>
                </div>

                <div className="border rounded-md">
                    <div className="bg-gray-50 px-4 py-2 border-b grid grid-cols-12 text-xs font-semibold text-gray-500 uppercase">
                        <div className="col-span-4">Campo / Etiqueta</div>
                        <div className="col-span-6">Valores Encontrados</div>
                        <div className="col-span-2 text-center">Estado</div>
                    </div>
                    <ScrollArea className="h-[300px]">
                        {report.details.length === 0 ? (
                            <div className="p-8 text-center text-gray-500">
                                No hay datos suficientes para validar.
                            </div>
                        ) : (
                            report.details.map((detail, idx) => (
                                <div key={idx} className={cn(
                                    "px-4 py-3 grid grid-cols-12 text-sm border-b last:border-0 items-center",
                                    !detail.isConsistent ? "bg-red-50/50" : ""
                                )}>
                                    <div className="col-span-4 font-medium text-gray-700 break-words pr-2">
                                        {detail.tagName}
                                        <div className="text-[10px] text-gray-400 font-mono mt-1 w-full overflow-hidden text-ellipsis whitespace-nowrap" title={detail.tagId}>
                                            ID: {detail.tagId}
                                        </div>
                                    </div>
                                    <div className="col-span-6 space-y-1">
                                        {detail.values.map((val, vIdx) => (
                                            <div key={vIdx} className="flex justify-between text-xs bg-white border rounded px-2 py-1">
                                                <span className="font-mono truncate max-w-[120px]" title={String(val.value)}>
                                                    {String(val.value)}
                                                </span>
                                                <span className="text-gray-400 italic truncate max-w-[100px]" title={val.docTitle}>
                                                    {val.docTitle}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="col-span-2 flex justify-center">
                                        {detail.isConsistent ? (
                                            <CheckCircle className="w-5 h-5 text-green-500" />
                                        ) : (
                                            <XCircle className="w-5 h-5 text-red-500" />
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </ScrollArea>
                </div>
            </CardContent>
        </Card>
    );
};
