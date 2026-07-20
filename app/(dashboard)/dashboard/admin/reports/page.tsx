
"use client"

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, RefreshCw, Printer, X, FileCheck, CheckCircle, XCircle, Users, BookOpen, Calendar } from "lucide-react";
import { ValidationReportCard } from "@/components/reports/ValidationReportCard";
import { dataService } from "@/lib/services/dataService";
import { validationService } from "@/lib/services/validationService";
import { Group } from "@/types/group";
import { Module } from "@/types/modules";
import { ValidationReport } from '@/types/validation';
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function AdminReportsPage() {
    // Reusing the same logic as TeacherReportsPage for now
    // In a real scenario, admin might have extra filters or see all groups by default
    const [teachers, setTeachers] = useState<any[]>([]);
    const [selectedTeacher, setSelectedTeacher] = useState<string | null>(null);
    const [groups, setGroups] = useState<Group[]>([]);
    const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
    const [currentModule, setCurrentModule] = useState<Module | null>(null);

    const [loading, setLoading] = useState(false);
    const [generating, setGenerating] = useState(false);

    const [studentSummaries, setStudentSummaries] = useState<any[]>([]);
    const [selectedStudentReport, setSelectedStudentReport] = useState<ValidationReport | null>(null);
    const [selectedStudentName, setSelectedStudentName] = useState<string>("");
    const [modalOpen, setModalOpen] = useState(false);
    const printRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        loadInitialData();
    }, []);

    useEffect(() => {
        if (selectedGroup) {
            loadGroupDetails(selectedGroup);
        } else {
            setCurrentModule(null);
            setStudentSummaries([]);
            setSelectedStudentReport(null);
        }
    }, [selectedGroup]);

    const loadInitialData = async () => {
        try {
            const [allGroups, allTeachers] = await Promise.all([
                dataService.getAll<Group>('groups'),
                dataService.getAll<any>('profiles', { role: 'teacher' })
            ]);
            setGroups(allGroups);
            setTeachers(allTeachers);
        } catch (error) {
            console.error("Error loading data:", error);
            toast.error("Error al cargar datos iniciales");
        }
    };

    // Filter groups based on selected teacher
    const filteredGroups = selectedTeacher
        ? groups.filter(g => g.teacherId === selectedTeacher)
        : groups;


    const loadGroupDetails = async (groupId: string) => {
        setLoading(true);
        try {
            const group = await dataService.getById<Group>('groups', groupId);
            if (!group) return;

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
            const allProfiles = await dataService.getAll<any>('profiles').catch(() => []);

            const reportTasks = group.members.map(async (memberId) => {
                const report = await validationService.generateStudentReport(memberId, moduleId, group.id);
                const profile = allProfiles.find((p: any) => p.id === memberId);
                const studentName = profile?.name || profile?.email || memberId;

                return {
                    studentId: memberId,
                    studentName,
                    score: report.score,
                    lastUpdated: new Date(report.generatedAt).toLocaleDateString(),
                    fullReport: report
                };
            });

            const summaries = await Promise.all(reportTasks);

            summaries.sort((a, b) => a.score - b.score);
            setStudentSummaries(summaries);

        } catch (error) {
            console.error("Error generating reports:", error);
            toast.error("Error al generar reportes");
        } finally {
            setGenerating(false);
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

    const handleSelectStudent = (studentId: string) => {
        const student = studentSummaries.find(s => s.studentId === studentId);
        if (student) {
            setSelectedStudentReport(student.fullReport);
            setSelectedStudentName(student.studentName);
            setModalOpen(true);
        }
    };

    const handlePrint = () => {
        if (!printRef.current || !selectedStudentReport) return;
        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        const group = groups.find(g => g.id === selectedGroup);
        const teacher = teachers.find(t => t.id === group?.teacherId);
        const sc = selectedStudentReport.score >= 90 ? '#16a34a' : selectedStudentReport.score >= 70 ? '#ca8a04' : '#dc2626';
        const rows = selectedStudentReport.details.map(d => `
            <tr class="${d.isConsistent ? '' : 'inconsistent'}">
                <td><strong>${d.tagName}</strong><br><span class="tag-id">${d.tagId}</span></td>
                <td>${d.values.map(v => `<span class="value-chip">${String(v.value)} <span class="doc-ref">${v.docTitle}</span></span>`).join(' ')}</td>
                <td class="status-cell">${d.isConsistent ? '✓ Coincide' : '✗ No coincide'}</td>
            </tr>
        `).join('');

        printWindow.document.write(`
            <html><head><title>Reporte de Validación - ${selectedStudentName}</title>
            <style>
                @page { margin: 20mm 15mm; }
                * { box-sizing: border-box; margin: 0; padding: 0; }
                body { font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; color: #1e293b; font-size: 10pt; line-height: 1.5; }
                .letterhead { background: linear-gradient(135deg, #1e3a5f 0%, #15123a 100%); color: white; padding: 24px 32px; margin: -20mm -15mm 0; padding: 20mm 15mm 16px; }
                .letterhead h1 { font-size: 14pt; font-weight: 700; letter-spacing: 0.5px; margin-bottom: 2px; }
                .letterhead p { font-size: 8pt; opacity: 0.8; }
                .letterhead .gold-accent { color: #c4953c; }
                .section { margin: 16px 0; }
                .section-title { font-size: 9pt; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #1e3a5f; border-bottom: 2px solid #c4953c; padding-bottom: 4px; margin-bottom: 8px; }
                .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6px 24px; font-size: 9pt; }
                .info-grid .label { color: #64748b; font-size: 7pt; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600; }
                .info-grid .value { font-weight: 600; }
                .score-card { background: linear-gradient(135deg, #f8fafc, #f1f5f9); border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; text-align: center; margin: 12px 0; }
                .score-value { font-size: 32pt; font-weight: 800; }
                .score-label { font-size: 7pt; text-transform: uppercase; letter-spacing: 1px; color: #64748b; margin-top: 2px; }
                .badge-row { display: flex; gap: 8px; justify-content: center; margin-top: 8px; }
                .badge { display: inline-block; padding: 3px 10px; border-radius: 12px; font-size: 8pt; font-weight: 600; }
                .badge-outline { border: 1px solid #cbd5e1; color: #475569; }
                .badge-green { background: #dcfce7; color: #166534; }
                .badge-red { background: #fee2e2; color: #991b1b; }
                table { width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 8.5pt; }
                th { background: #1e3a5f; color: white; padding: 7px 8px; text-align: left; font-weight: 600; font-size: 7pt; text-transform: uppercase; letter-spacing: 0.5px; }
                th:first-child { border-radius: 4px 0 0 0; }
                th:last-child { border-radius: 0 4px 0 0; }
                td { padding: 6px 8px; border-bottom: 1px solid #e2e8f0; vertical-align: top; }
                tr:nth-child(even) { background: #f8fafc; }
                tr.inconsistent td { background: #fef2f2; }
                .tag-id { font-size: 7pt; font-family: monospace; color: #94a3b8; }
                .value-chip { display: inline-block; background: white; border: 1px solid #e2e8f0; border-radius: 3px; padding: 1px 5px; margin: 1px 2px; font-size: 8pt; }
                .doc-ref { color: #94a3b8; font-style: italic; font-size: 7pt; }
                .status-cell { font-weight: 600; text-align: center; }
                .footer { margin-top: 20px; text-align: center; font-size: 7pt; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 8px; }
                .footer strong { color: #64748b; }
                @media print { body { padding: 0; } }
            </style></head>
            <body>
                <div class="letterhead">
                    <h1>SIM-COMEX <span class="gold-accent">Cloud</span></h1>
                    <p>Sistema Interactivo de Aprendizaje — Reporte de Validación de Consistencia</p>
                </div>
                <div class="section">
                    <div class="section-title">Información del Estudiante</div>
                    <div class="info-grid">
                        <div><div class="label">Estudiante</div><div class="value">${selectedStudentName}</div></div>
                        <div><div class="label">Grupo</div><div class="value">${group?.name || '—'} ${group?.description ? '— ' + group.description : ''}</div></div>
                        <div><div class="label">Docente</div><div class="value">${teacher?.name || teacher?.fullName || group?.teacherId || '—'}</div></div>
                        <div><div class="label">Módulo</div><div class="value">${currentModule?.title || '—'}</div></div>
                    </div>
                </div>
                <div class="section">
                    <div class="section-title">Resultado de Consistencia</div>
                    <div class="score-card">
                        <div class="score-value" style="color:${sc}">${selectedStudentReport.score}%</div>
                        <div class="score-label">Puntaje de Consistencia</div>
                        <div class="badge-row">
                            <span class="badge badge-outline">${selectedStudentReport.totalTags} Variables</span>
                            <span class="badge badge-green">${selectedStudentReport.matchedTags} Coincidencias</span>
                            <span class="badge badge-red">${selectedStudentReport.totalTags - selectedStudentReport.matchedTags} Errores</span>
                        </div>
                    </div>
                </div>
                <div class="section">
                    <div class="section-title">Desglose por Variable</div>
                    ${selectedStudentReport.details.length === 0
                        ? '<p style="text-align:center;padding:20px;color:#94a3b8;">No hay datos suficientes para validar.</p>'
                        : `<table><thead><tr><th style="width:25%">Variable</th><th>Valores Encontrados</th><th style="width:15%;text-align:center">Estado</th></tr></thead><tbody>${rows}</tbody></table>`
                    }
                </div>
                <div class="footer">
                    <strong>SIM-COMEX Cloud</strong> · Reporte generado el ${new Date().toLocaleDateString("es-CO", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })} · Documento de carácter académico
                </div>
            </body></html>
        `);
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
    };

    const handleGroupReport = () => {
        if (!selectedGroup || !currentModule || studentSummaries.length === 0) return;
        const group = groups.find(g => g.id === selectedGroup);
        if (!group) return;
        const teacher = teachers.find(t => t.id === group.teacherId);

        const scores = studentSummaries.map(s => s.score);
        const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
        const sortedScores = [...scores].sort((a, b) => a - b);
        const median = scores.length % 2 === 0 ? (sortedScores[scores.length / 2 - 1] + sortedScores[scores.length / 2]) / 2 : sortedScores[Math.floor(scores.length / 2)];
        const highest = Math.max(...scores);
        const lowest = Math.min(...scores);
        const stdDev = Math.sqrt(scores.reduce((sum, s) => sum + (s - avg) ** 2, 0) / scores.length);
        const excellent = scores.filter(s => s >= 90).length;
        const warning = scores.filter(s => s >= 70 && s < 90).length;
        const atRisk = scores.filter(s => s < 70).length;
        const sortedSummaries = [...studentSummaries].sort((a, b) => b.score - a.score);
        const rows = sortedSummaries.map((s, i) => {
            const c = s.score >= 90 ? '#16a34a' : s.score >= 70 ? '#ca8a04' : '#dc2626';
            return `<tr><td style="text-align:center;color:#94a3b8;font-size:8pt">${i + 1}</td><td><strong>${s.studentName}</strong></td><td style="text-align:center">${s.fullReport.totalTags}</td><td style="text-align:center">${s.fullReport.matchedTags}</td><td style="text-align:center">${s.fullReport.totalTags - s.fullReport.matchedTags}</td><td style="text-align:center;font-weight:700;color:${c}">${s.score}%</td></tr>`;
        }).join('');

        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        printWindow.document.write(`
            <html><head><title>Reporte Grupal - ${group.name}</title>
            <style>
                @page { margin: 20mm 15mm; }
                * { box-sizing: border-box; margin: 0; padding: 0; }
                body { font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; color: #1e293b; font-size: 10pt; line-height: 1.5; }
                .letterhead { background: linear-gradient(135deg, #1e3a5f 0%, #15123a 100%); color: white; margin: -20mm -15mm 0; padding: 20mm 15mm 16px; }
                .letterhead h1 { font-size: 14pt; font-weight: 700; letter-spacing: 0.5px; margin-bottom: 2px; }
                .letterhead p { font-size: 8pt; opacity: 0.8; }
                .letterhead .gold-accent { color: #c4953c; }
                .section { margin: 16px 0; }
                .section-title { font-size: 9pt; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #1e3a5f; border-bottom: 2px solid #c4953c; padding-bottom: 4px; margin-bottom: 8px; }
                .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6px 24px; font-size: 9pt; }
                .info-grid .label { color: #64748b; font-size: 7pt; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600; }
                .info-grid .value { font-weight: 600; }
                .stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin: 12px 0; }
                .stat-card { background: linear-gradient(135deg, #f8fafc, #f1f5f9); border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px; text-align: center; }
                .stat-value { font-size: 16pt; font-weight: 800; color: #1e3a5f; }
                .stat-label { font-size: 6.5pt; text-transform: uppercase; letter-spacing: 0.5px; color: #64748b; margin-top: 2px; }
                .dist-bar { display: flex; height: 20px; border-radius: 10px; overflow: hidden; margin: 8px 0; font-size: 7pt; font-weight: 600; }
                .dist-bar .segment { display: flex; align-items: center; justify-content: center; color: white; }
                .dist-excellent { background: #16a34a; } .dist-warning { background: #ca8a04; } .dist-risk { background: #dc2626; }
                .dist-legend { display: flex; gap: 16px; justify-content: center; font-size: 7.5pt; color: #64748b; margin-bottom: 8px; }
                .dist-legend span { display: flex; align-items: center; gap: 4px; }
                .dist-legend .dot { width: 8px; height: 8px; border-radius: 50%; display: inline-block; }
                table { width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 8.5pt; }
                th { background: #1e3a5f; color: white; padding: 7px 8px; text-align: left; font-weight: 600; font-size: 7pt; text-transform: uppercase; letter-spacing: 0.5px; }
                th:first-child { border-radius: 4px 0 0 0; }
                th:last-child { border-radius: 0 4px 0 0; }
                td { padding: 6px 8px; border-bottom: 1px solid #e2e8f0; }
                tr:nth-child(even) { background: #f8fafc; }
                .footer { margin-top: 20px; text-align: center; font-size: 7pt; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 8px; }
                .footer strong { color: #64748b; }
                @media print { body { padding: 0; } }
            </style></head>
            <body>
                <div class="letterhead">
                    <h1>SIM-COMEX <span class="gold-accent">Cloud</span></h1>
                    <p>Sistema Interactivo de Aprendizaje — Reporte Grupal de Consistencia</p>
                </div>
                <div class="section">
                    <div class="section-title">Información del Grupo</div>
                    <div class="info-grid">
                        <div><div class="label">Grupo</div><div class="value">${group.name} ${group.description ? '— ' + group.description : ''}</div></div>
                        <div><div class="label">Docente</div><div class="value">${teacher?.name || teacher?.fullName || group.teacherId || '—'}</div></div>
                        <div><div class="label">Módulo</div><div class="value">${currentModule?.title || '—'}</div></div>
                        <div><div class="label">Período</div><div class="value">${formatDate(group.startDate)} — ${formatDate(group.endDate)}</div></div>
                        <div><div class="label">Estudiantes</div><div class="value">${studentSummaries.length}</div></div>
                        <div><div class="label">Generado</div><div class="value">${new Date().toLocaleDateString("es-CO", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}</div></div>
                    </div>
                </div>
                <div class="section">
                    <div class="section-title">Estadísticas del Grupo</div>
                    <div class="stats-grid">
                        <div class="stat-card"><div class="stat-value">${avg.toFixed(1)}%</div><div class="stat-label">Promedio</div></div>
                        <div class="stat-card"><div class="stat-value">${median.toFixed(1)}%</div><div class="stat-label">Mediana</div></div>
                        <div class="stat-card"><div class="stat-value">${highest}%</div><div class="stat-label">Puntaje Más Alto</div></div>
                        <div class="stat-card"><div class="stat-value">${lowest}%</div><div class="stat-label">Puntaje Más Bajo</div></div>
                        <div class="stat-card"><div class="stat-value">${stdDev.toFixed(1)}</div><div class="stat-label">Desviación Estándar</div></div>
                        <div class="stat-card"><div class="stat-value">${studentSummaries.length}</div><div class="stat-label">Total Estudiantes</div></div>
                    </div>
                </div>
                <div class="section">
                    <div class="section-title">Distribución de Consistencia</div>
                    <div class="dist-legend">
                        <span><span class="dot" style="background:#16a34a"></span> Excelente (&ge;90%) — ${excellent} estudiante(s)</span>
                        <span><span class="dot" style="background:#ca8a04"></span> Alerta (&ge;70%) — ${warning} estudiante(s)</span>
                        <span><span class="dot" style="background:#dc2626"></span> En Riesgo (&lt;70%) — ${atRisk} estudiante(s)</span>
                    </div>
                    <div class="dist-bar">
                        ${excellent > 0 ? '<div class="segment dist-excellent" style="width:' + (excellent / studentSummaries.length * 100).toFixed(0) + '%">' + excellent + '</div>' : ''}
                        ${warning > 0 ? '<div class="segment dist-warning" style="width:' + (warning / studentSummaries.length * 100).toFixed(0) + '%">' + warning + '</div>' : ''}
                        ${atRisk > 0 ? '<div class="segment dist-risk" style="width:' + (atRisk / studentSummaries.length * 100).toFixed(0) + '%">' + atRisk + '</div>' : ''}
                    </div>
                </div>
                <div class="section">
                    <div class="section-title">Ranking de Estudiantes</div>
                    <table><thead><tr><th style="text-align:center;width:5%">#</th><th>Estudiante</th><th style="text-align:center">Variables</th><th style="text-align:center">Coincidencias</th><th style="text-align:center">Errores</th><th style="text-align:center">Consistencia</th></tr></thead><tbody>${rows}</tbody></table>
                </div>
                <div class="footer">
                    <strong>SIM-COMEX Cloud</strong> · Reporte generado el ${new Date().toLocaleDateString("es-CO", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })} · Documento de carácter académico
                </div>
                <script>window.onload = function() { window.focus(); window.print(); }</script>
            </body></html>
        `);
        printWindow.document.close();
    };

    const refreshReports = () => {
        if (selectedGroup && currentModule && groups.length > 0) {
            const group = groups.find(g => g.id === selectedGroup);
            if (group) {
                generateReports(group, currentModule.id);
            }
        }
    };

    return (
        <div className="container mx-auto p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Evaluaciones</h1>
                    <p className="text-muted-foreground">Supervisión global de validación de datos.</p>
                </div>
                <Button variant="outline" onClick={refreshReports} disabled={!selectedGroup || generating}>
                    {generating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                    Actualizar
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Filtros</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col md:flex-row gap-4">
                    <div className="w-full md:w-1/3 space-y-2">
                        <label className="text-sm font-medium">Docente</label>
                        <Select value={selectedTeacher || "all"} onValueChange={(val) => {
                            setSelectedTeacher(val === "all" ? null : val);
                            setSelectedGroup(null); // Reset group when teacher changes
                        }}>
                            <SelectTrigger>
                                <SelectValue placeholder="Todos los docentes" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos los docentes</SelectItem>
                                {teachers.map(teacher => (
                                    <SelectItem key={teacher.id} value={teacher.id}>
                                        {teacher.name || teacher.email || teacher.id}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="w-full md:w-1/3 space-y-2">
                        <label className="text-sm font-medium">Grupo</label>
                        <Select value={selectedGroup || ""} onValueChange={setSelectedGroup}>
                            <SelectTrigger>
                                <SelectValue placeholder="Seleccione un grupo" />
                            </SelectTrigger>
                            <SelectContent>
                                {filteredGroups.map(group => (
                                    <SelectItem key={group.id} value={group.id}>
                                        {group.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {loading ? (
                <div className="flex justify-center p-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : selectedGroup && currentModule ? (
                <>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="flex items-center gap-2">
                                    <FileCheck className="w-5 h-5" />
                                    Estudiantes del Grupo
                                </CardTitle>
                                <CardDescription>
                                    {studentSummaries.length} estudiante(s) — Haga clic en un estudiante para ver su reporte de consistencia.
                                </CardDescription>
                            </div>
                            <Button variant="outline" onClick={handleGroupReport} disabled={studentSummaries.length === 0}>
                                <Printer className="mr-2 h-4 w-4" /> Reporte Grupal
                            </Button>
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

                    {/* Individual Report Modal */}
                    {modalOpen && selectedStudentReport && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                            <div className="bg-background rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col border">
                                <div className="flex items-center justify-between p-4 border-b shrink-0">
                                    <div>
                                        <h2 className="text-lg font-bold">Reporte de {selectedStudentName}</h2>
                                        <p className="text-xs text-muted-foreground">{groups.find(g => g.id === selectedGroup)?.name} · {currentModule?.title}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button variant="outline" size="sm" onClick={handlePrint}>
                                            <Printer className="w-4 h-4 mr-1" /> Imprimir
                                        </Button>
                                        <Button variant="ghost" size="icon" onClick={() => setModalOpen(false)}>
                                            <X className="w-5 h-5" />
                                        </Button>
                                    </div>
                                </div>
                                <div className="overflow-y-auto flex-1 p-4">
                                    <div ref={printRef}>
                                        <Card className="w-full shadow-md">
                                            <CardHeader className="pb-2">
                                                <div className="flex justify-between items-center">
                                                    <div>
                                                        <CardTitle className="text-xl">Reporte de Consistencia</CardTitle>
                                                        <CardDescription>Validación cruzada de datos del módulo</CardDescription>
                                                    </div>
                                                    <div className="flex flex-col items-end">
                                                        <span className="text-sm text-gray-500">Puntaje</span>
                                                        <span className={cn("text-3xl font-bold", getScoreColor(selectedStudentReport.score))}>
                                                            {selectedStudentReport.score}%
                                                        </span>
                                                    </div>
                                                </div>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="mb-4 flex gap-4 text-sm text-gray-600">
                                                    <Badge variant="outline">{selectedStudentReport.totalTags} Variables</Badge>
                                                    <Badge className="bg-green-100 text-green-800 hover:bg-green-200">
                                                        {selectedStudentReport.matchedTags} Coincidencias
                                                    </Badge>
                                                    <Badge className="bg-red-100 text-red-800 hover:bg-red-200">
                                                        {selectedStudentReport.totalTags - selectedStudentReport.matchedTags} Errores
                                                    </Badge>
                                                </div>
                                                <div className="border rounded-md">
                                                    <div className="bg-gray-50 px-4 py-2 border-b grid grid-cols-12 text-xs font-semibold text-gray-500 uppercase">
                                                        <div className="col-span-4">Campo / Etiqueta</div>
                                                        <div className="col-span-6">Valores Encontrados</div>
                                                        <div className="col-span-2 text-center">Estado</div>
                                                    </div>
                                                    <div>
                                                        {selectedStudentReport.details.length === 0 ? (
                                                            <div className="p-8 text-center text-gray-500">
                                                                No hay datos suficientes para validar.
                                                            </div>
                                                        ) : (
                                                            selectedStudentReport.details.map((detail, idx) => (
                                                                <div key={idx} className={cn(
                                                                    "px-4 py-3 grid grid-cols-12 text-sm border-b last:border-0 items-center",
                                                                    !detail.isConsistent ? "bg-red-50/50" : ""
                                                                )}>
                                                                    <div className="col-span-4 font-medium text-gray-700 break-words pr-2">
                                                                        {detail.tagName}
                                                                        <div className="text-[10px] text-gray-400 font-mono mt-1 overflow-hidden text-ellipsis whitespace-nowrap">
                                                                            ID: {detail.tagId}
                                                                        </div>
                                                                    </div>
                                                                    <div className="col-span-6 space-y-1">
                                                                        {detail.values.map((val, vIdx) => (
                                                                            <div key={vIdx} className="flex justify-between text-xs bg-white border rounded px-2 py-1">
                                                                                <span className="font-mono truncate max-w-[120px]">
                                                                                    {String(val.value)}
                                                                                </span>
                                                                                <span className="text-gray-400 italic truncate max-w-[100px]">
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
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </>
            ) : selectedGroup ? (
                <div className="text-center p-12 bg-muted/20 rounded-lg border border-dashed">
                    <p className="text-muted-foreground">Este grupo no tiene un módulo asignado.</p>
                </div>
            ) : null}
        </div>
    );
}
