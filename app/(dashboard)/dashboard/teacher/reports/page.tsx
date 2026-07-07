
"use client"

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, RefreshCw, X, Printer, Users, BookOpen, Calendar, CheckCircle, XCircle, FileCheck, AlertCircle } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { dataService } from "@/lib/services/dataService";
import { validationService } from "@/lib/services/validationService";
import { Group } from "@/types/group";
import { Module } from "@/types/modules";
import { ValidationReport, ValidationDetail } from '@/types/validation';
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

export default function TeacherReportsPage() {
    const [groups, setGroups] = useState<Group[]>([]);
    const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
    const [currentGroup, setCurrentGroup] = useState<Group | null>(null);
    const [currentModule, setCurrentModule] = useState<Module | null>(null);

    const [loading, setLoading] = useState(false);
    const [generating, setGenerating] = useState(false);

    const [studentSummaries, setStudentSummaries] = useState<any[]>([]);
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedStudentReport, setSelectedStudentReport] = useState<ValidationReport | null>(null);
    const [selectedStudentName, setSelectedStudentName] = useState<string>("");

    const printRef = useRef<HTMLDivElement>(null);
    const { user } = useAuth();

    const loadGroups = async () => {
        if (!user) return;
        try {
            const allGroups = await dataService.getAll<Group>('groups');
            if (user.role === 'teacher') {
                setGroups(allGroups.filter(g => g.teacherId === user.id));
            } else if (user.role === 'admin') {
                setGroups(allGroups);
            } else {
                setGroups([]);
            }
        } catch (error) {
            console.error("Error loading groups:", error);
            toast.error("Error al cargar los grupos");
        }
    };

    useEffect(() => {
        if (user) {
            loadGroups();
        }
    }, [user]);

    useEffect(() => {
        if (selectedGroup) {
            loadGroupDetails(selectedGroup);
        } else {
            setCurrentGroup(null);
            setCurrentModule(null);
            setStudentSummaries([]);
            setSelectedStudentReport(null);
        }
    }, [selectedGroup]);

    const loadGroupDetails = async (groupId: string) => {
        setLoading(true);
        try {
            const group = await dataService.getById<Group>('groups', groupId);
            if (!group) return;
            setCurrentGroup(group);

            if (group.moduleId) {
                const moduleData = await dataService.getById<Module>('modules', group.moduleId);
                setCurrentModule(moduleData || null);

                if (moduleData) {
                    await generateReports(group, moduleData.id);
                }
            } else {
                setCurrentModule(null);
                setStudentSummaries([]);
            }
        } catch (error) {
            console.error("Error loading details:", error);
            toast.error("Error al cargar detalles del grupo");
        } finally {
            setLoading(false);
        }
    };

    const generateReports = async (group: Group, moduleId: string) => {
        setGenerating(true);
        try {
            const summaries = [];

            for (const memberId of group.members) {
                const report = await validationService.generateStudentReport(memberId, moduleId, group.id);

                let studentName = memberId;
                try {
                    const profile = await dataService.getById<any>('profiles', memberId);
                    if (profile?.fullName) studentName = profile.fullName;
                } catch {}

                summaries.push({
                    studentId: memberId,
                    studentName: studentName,
                    score: report.score,
                    lastUpdated: new Date(report.generatedAt).toLocaleDateString("es-CO", { day: "numeric", month: "short", year: "numeric" }),
                    fullReport: report
                });
            }

            summaries.sort((a, b) => a.score - b.score);
            setStudentSummaries(summaries);

        } catch (error) {
            console.error("Error generating reports:", error);
            toast.error("Error al generar reportes");
        } finally {
            setGenerating(false);
        }
    };

    const handleSelectStudent = (studentId: string) => {
        const student = studentSummaries.find(s => s.studentId === studentId);
        if (student) {
            setSelectedStudentReport(student.fullReport);
            setSelectedStudentName(student.studentName);
            setModalOpen(true);
        }
    };

    const refreshReports = () => {
        if (selectedGroup && currentModule && groups.length > 0) {
            const group = groups.find(g => g.id === selectedGroup);
            if (group) {
                generateReports(group, currentModule.id);
            }
        }
    };

    const formatDate = (dateStr: string) => {
        try { return new Date(dateStr).toLocaleDateString("es-CO", { day: "numeric", month: "short", year: "numeric" }); }
        catch { return dateStr; }
    };

    const getScoreColor = (score: number) => {
        if (score >= 90) return "text-green-600";
        if (score >= 70) return "text-yellow-600";
        return "text-red-600";
    };

    const handlePrint = () => {
        if (!printRef.current) return;
        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        printWindow.document.write(`
            <html>
            <head>
                <title>Reporte de Validación - ${selectedStudentName}</title>
                <style>
                    body { font-family: system-ui, -apple-system, sans-serif; padding: 20px; color: #1a1a1a; }
                    .header { border-bottom: 2px solid #2563eb; padding-bottom: 16px; margin-bottom: 16px; }
                    .header h1 { font-size: 20px; color: #2563eb; margin: 0 0 4px 0; }
                    .header p { font-size: 12px; color: #666; margin: 2px 0; }
                    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 16px; font-size: 13px; }
                    .info-item { padding: 6px 10px; background: #f5f5f5; border-radius: 4px; }
                    .info-label { font-weight: 600; color: #444; }
                    .score-section { text-align: center; padding: 12px; background: #f0f9ff; border-radius: 8px; margin-bottom: 16px; }
                    .score-value { font-size: 36px; font-weight: 800; }
                    .score-green { color: #16a34a; } .score-yellow { color: #ca8a04; } .score-red { color: #dc2626; }
                    .badges { display: flex; gap: 8px; justify-content: center; margin-top: 8px; font-size: 11px; }
                    .badge { padding: 3px 8px; border-radius: 12px; font-weight: 600; }
                    .badge-outline { border: 1px solid #ccc; } .badge-green { background: #dcfce7; color: #166534; }
                    .badge-red { background: #fee2e2; color: #991b1b; }
                    table { width: 100%; border-collapse: collapse; margin-top: 12px; font-size: 12px; }
                    th { background: #f5f5f5; padding: 8px; text-align: left; font-weight: 600; text-transform: uppercase; font-size: 10px; color: #666; border-bottom: 2px solid #e5e5e5; }
                    td { padding: 8px; border-bottom: 1px solid #eee; vertical-align: top; }
                    .consistent { color: #16a34a; } .inconsistent { color: #dc2626; background: #fff5f5; }
                    .value-chip { background: #f5f5f5; padding: 2px 6px; border-radius: 3px; margin: 1px 0; display: inline-block; font-size: 11px; }
                    .footer { margin-top: 24px; text-align: center; font-size: 10px; color: #999; border-top: 1px solid #eee; padding-top: 8px; }
                    @media print { body { padding: 10px; } }
                </style>
            </head>
            <body>
                ${printRef.current.innerHTML}
                <div class="footer">
                    SIM-COMEX Cloud · Reporte generado el ${new Date().toLocaleDateString("es-CO", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                </div>
            </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
    };

    return (
        <div className="container mx-auto p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Reportes de Validación</h1>
                    <p className="text-muted-foreground">Analiza la consistencia de los datos de los estudiantes.</p>
                </div>
                <Button variant="outline" onClick={refreshReports} disabled={!selectedGroup || generating}>
                    {generating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                    Actualizar
                </Button>
            </div>

            {/* Configuration + Group Info */}
            <Card>
                <CardHeader>
                    <CardTitle>Configuración</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="w-full md:w-1/3 space-y-2">
                        <label className="text-sm font-medium">Seleccionar Grupo</label>
                        <Select value={selectedGroup || ""} onValueChange={setSelectedGroup}>
                            <SelectTrigger>
                                <SelectValue placeholder="Seleccione un grupo" />
                            </SelectTrigger>
                            <SelectContent>
                                {groups.map(group => (
                                    <SelectItem key={group.id} value={group.id}>
                                        {group.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Group Info Banner */}
                    {currentGroup && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-3 bg-muted/30 rounded-lg border">
                            <div className="flex items-center gap-2">
                                <Users className="w-4 h-4 text-blue-500" />
                                <div>
                                    <p className="text-[10px] font-bold uppercase text-muted-foreground">Estudiantes</p>
                                    <p className="text-sm font-bold">{(currentGroup.members || []).length}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <BookOpen className="w-4 h-4 text-purple-500" />
                                <div>
                                    <p className="text-[10px] font-bold uppercase text-muted-foreground">Módulo</p>
                                    <p className="text-sm font-bold truncate">{currentModule?.title || "—"}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-green-500" />
                                <div>
                                    <p className="text-[10px] font-bold uppercase text-muted-foreground">Inicio</p>
                                    <p className="text-sm font-bold">{formatDate(currentGroup.startDate)}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-red-500" />
                                <div>
                                    <p className="text-[10px] font-bold uppercase text-muted-foreground">Fin</p>
                                    <p className="text-sm font-bold">{formatDate(currentGroup.endDate)}</p>
                                </div>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Full-width validation summary */}
            {loading ? (
                <div className="flex justify-center p-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : selectedGroup && currentModule ? (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <FileCheck className="w-5 h-5" />
                            Resumen de Validación del Grupo
                        </CardTitle>
                        <CardDescription>
                            Puntajes de consistencia por estudiante. Haga clic en un estudiante para ver su reporte completo.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Estudiante</TableHead>
                                    <TableHead>Última Actividad</TableHead>
                                    <TableHead className="text-right">Consistencia</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {studentSummaries.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={3} className="text-center h-24 text-muted-foreground">
                                            No hay datos de estudiantes registrados para este módulo.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    studentSummaries.map((student) => (
                                        <TableRow
                                            key={student.studentId}
                                            className="cursor-pointer hover:bg-muted/50"
                                            onClick={() => handleSelectStudent(student.studentId)}
                                        >
                                            <TableCell className="font-medium">{student.studentName}</TableCell>
                                            <TableCell className="text-muted-foreground text-sm">{student.lastUpdated}</TableCell>
                                            <TableCell className="text-right">
                                                <span className={cn("font-bold", getScoreColor(student.score))}>
                                                    {student.score}%
                                                </span>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            ) : selectedGroup ? (
                <div className="text-center p-12 bg-muted/20 rounded-lg border border-dashed">
                    <p className="text-muted-foreground">Este grupo no tiene un módulo asignado o no se encontraron datos.</p>
                </div>
            ) : null}

            {/* Student Report Modal */}
            {modalOpen && selectedStudentReport && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-background rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col border">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between p-4 border-b shrink-0">
                            <div>
                                <h2 className="text-lg font-bold">Reporte de {selectedStudentName}</h2>
                                <p className="text-xs text-muted-foreground">{currentGroup?.name} · {currentModule?.title}</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button variant="outline" size="sm" onClick={handlePrint}>
                                    <Printer className="w-4 h-4 mr-1" /> Imprimir PDF
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => setModalOpen(false)}>
                                    <X className="w-5 h-5" />
                                </Button>
                            </div>
                        </div>

                        {/* Modal Body — scrollable */}
                        <div className="overflow-y-auto flex-1 p-4">
                            {/* Printable content (hidden structure for PDF) */}
                            <div ref={printRef}>
                                <div className="header">
                                    <h1>Reporte de Validación de Consistencia</h1>
                                    <p><strong>Estudiante:</strong> {selectedStudentName}</p>
                                    <p><strong>Grupo:</strong> {currentGroup?.name} — {currentGroup?.description}</p>
                                    <p><strong>Módulo:</strong> {currentModule?.title}</p>
                                </div>
                                <div className="info-grid">
                                    <div className="info-item"><span className="info-label">Fecha Inicio:</span> {currentGroup ? formatDate(currentGroup.startDate) : "—"}</div>
                                    <div className="info-item"><span className="info-label">Fecha Fin:</span> {currentGroup ? formatDate(currentGroup.endDate) : "—"}</div>
                                    <div className="info-item"><span className="info-label">Estudiantes en grupo:</span> {(currentGroup?.members || []).length}</div>
                                    <div className="info-item"><span className="info-label">Generado:</span> {new Date(selectedStudentReport.generatedAt).toLocaleDateString("es-CO", { day: "numeric", month: "long", year: "numeric" })}</div>
                                </div>

                                {/* Score */}
                                <div className="score-section">
                                    <p style={{ fontSize: "12px", color: "#666", marginBottom: "4px" }}>Puntaje de Consistencia</p>
                                    <div className={cn(
                                        "score-value",
                                        selectedStudentReport.score >= 90 ? "score-green" :
                                            selectedStudentReport.score >= 70 ? "score-yellow" : "score-red"
                                    )}>
                                        {selectedStudentReport.score}%
                                    </div>
                                    <div className="badges">
                                        <span className="badge badge-outline">{selectedStudentReport.totalTags} Variables</span>
                                        <span className="badge badge-green">{selectedStudentReport.matchedTags} Coincidencias</span>
                                        <span className="badge badge-red">{selectedStudentReport.totalTags - selectedStudentReport.matchedTags} Errores</span>
                                    </div>
                                </div>

                                {/* Detail Table */}
                                <table>
                                    <thead>
                                        <tr>
                                            <th style={{ width: "30%" }}>Campo / Etiqueta</th>
                                            <th style={{ width: "50%" }}>Valores Encontrados</th>
                                            <th style={{ width: "20%", textAlign: "center" }}>Estado</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {selectedStudentReport.details.length === 0 ? (
                                            <tr>
                                                <td colSpan={3} style={{ textAlign: "center", padding: "24px", color: "#999" }}>
                                                    No hay datos suficientes para validar.
                                                </td>
                                            </tr>
                                        ) : (
                                            selectedStudentReport.details.map((detail, idx) => (
                                                <tr key={idx} className={!detail.isConsistent ? "inconsistent" : ""}>
                                                    <td>
                                                        <strong>{detail.tagName}</strong>
                                                        <div style={{ fontSize: "9px", color: "#999", fontFamily: "monospace" }}>ID: {detail.tagId}</div>
                                                    </td>
                                                    <td>
                                                        {detail.values.map((val, vIdx) => (
                                                            <div key={vIdx} className="value-chip">
                                                                <strong>{String(val.value)}</strong>
                                                                <span style={{ color: "#999", marginLeft: "6px", fontSize: "10px" }}>({val.docTitle})</span>
                                                            </div>
                                                        ))}
                                                    </td>
                                                    <td style={{ textAlign: "center" }}>
                                                        {detail.isConsistent ? (
                                                            <span className="consistent">✓ Consistente</span>
                                                        ) : (
                                                            <span className="inconsistent">✗ Inconsistente</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
