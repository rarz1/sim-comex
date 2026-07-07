"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useGroups, useModules, useUsers } from "@/hooks/useData";
import { validationService } from "@/lib/services/validationService";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertCircle, BarChart, BookOpen, Calendar, Users, X, Printer, CheckCircle, XCircle, Settings, LogOut, Download } from "lucide-react";
import { toast } from "sonner";
import { useAppText } from "@/hooks/useAppText";
import { cn } from "@/lib/utils";

export default function StudentReportsPage() {
    const { user } = useAuth();
    const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
    const [report, setReport] = useState<any | null>(null);
    const [generating, setGenerating] = useState(false);
    const printRef = useRef<HTMLDivElement>(null);

    const { data: allModules } = useModules();
    const { data: allGroupsData = [], isLoading: groupsLoading } = useGroups();
    const { data: allUsers = [] } = useUsers();
    const { t } = useAppText();

    const myGroups = useMemo(() => {
        if (!user) return [];
        return allGroupsData.filter(g => {
            const members = g.members || [];
            const normalizedMembers = members.map(m => String(m).toLowerCase().trim());
            return (
                (user.id && normalizedMembers.includes(user.id.toLowerCase().trim())) ||
                (user.email && normalizedMembers.includes(user.email.toLowerCase().trim())) ||
                (user.fullName && normalizedMembers.includes(user.fullName.toLowerCase().trim()))
            );
        });
    }, [user, allGroupsData]);

    const teacherName = useMemo(() => {
        if (!selectedGroupId) return "";
        const group = allGroupsData.find(g => g.id === selectedGroupId);
        if (!group?.teacherId) return "";
        const teacher = allUsers.find(u => u.id === group.teacherId);
        return teacher?.fullName || "";
    }, [selectedGroupId, allGroupsData, allUsers]);

    if (groupsLoading && !allGroupsData.length) return <div className="p-8">{t('common.loading', 'Cargando...')}</div>;

    // Generate Report when Group is selected
    useEffect(() => {
        let isCancelled = false;
        const generateReport = async () => {
            if (!user || !selectedGroupId) {
                setReport(null);
                return;
            }

            setGenerating(true);
            try {
                const group = myGroups.find(g => g.id === selectedGroupId);
                if (!group || !group.moduleId) {
                    if (!isCancelled) setReport(null);
                    return;
                }

                const studentReport = await validationService.generateStudentReport(user.id, group.moduleId, selectedGroupId);

                if (!isCancelled) {
                    setReport(studentReport);
                }
            } catch (error) {
                console.error("Error generating report:", error);
                if (!isCancelled) toast.error(t('student.reports.toast_error_generating', "Error al generar el reporte"));
            } finally {
                if (!isCancelled) setGenerating(false);
            }
        };

        generateReport();
        return () => { isCancelled = true; };
    }, [selectedGroupId, user, myGroups, t]);

    const selectedGroup = myGroups.find(g => g.id === selectedGroupId);
    const selectedModule = allModules?.find(m => m.id === selectedGroup?.moduleId);

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
                <title>${t('student.reports.print_title', 'Reporte de Validación')} - ${user?.fullName || t('common.student', "Estudiante")}</title>
                <style>
                    body { font-family: system-ui, -apple-system, sans-serif; padding: 20px; color: #1a1a1a; }
                    .header { border-bottom: 2px solid #2563eb; padding-bottom: 16px; margin-bottom: 16px; }
                    .header h1 { font-size: 20px; color: #2563eb; margin: 0 0 4px 0; }
                    .header p { font-size: 12px; color: #666; margin: 2px 0; }
                    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 16px; font-size: 13px; }
                    .info-item { padding: 6px 10px; background: #f5f5f5; border-radius: 4px; }
                    .info-label { font-weight: 600; color: #444; }
                    .stats-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; margin-bottom: 20px; text-align: center; }
                    .stat-item { padding: 10px; border: 1px solid #e5e5e5; border-radius: 6px; }
                    .stat-label { font-size: 10px; font-weight: 700; text-transform: uppercase; color: #666; margin-bottom: 4px; }
                    .stat-value { font-size: 18px; font-weight: 900; color: #2563eb; }
                    .stat-success { color: #16a34a; } .stat-error { color: #dc2626; }
                    .score-section { text-align: center; padding: 12px; background: #f0f9ff; border-radius: 8px; margin-bottom: 16px; border: 1px solid #bae6fd; }
                    .score-value { font-size: 32px; font-weight: 800; }
                    .score-green { color: #16a34a; } .score-yellow { color: #ca8a04; } .score-red { color: #dc2626; }
                    .cards-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
                    .card { border: 1px solid #e5e5e5; border-radius: 8px; overflow: hidden; display: flex; flex-direction: column; break-inside: avoid; }
                    .card-header { padding: 6px 10px; border-bottom: 1px solid #e5e5e5; display: flex; justify-content: space-between; align-items: center; }
                    .card-header h4 { margin: 0; font-size: 11px; font-weight: 700; }
                    .card-header .id { font-size: 8px; color: #999; font-family: monospace; }
                    .card-body { padding: 8px; flex: 1; background: #fafafa; }
                    .value-item { border: 1px solid #e5e5e5; background: white; padding: 4px 8px; border-radius: 4px; margin-bottom: 4px; font-size: 10px; display: flex; justify-content: space-between; }
                    .doc-tag { font-size: 8px; color: #777; font-style: italic; }
                    .footer { margin-top: 24px; text-align: center; font-size: 10px; color: #999; border-top: 1px solid #eee; padding-top: 8px; }
                    .ui-only { display: none !important; }
                    .print-only { display: block !important; }
                    @media print { 
                        body { padding: 0; }
                        .no-print { display: none !important; }
                        .card { border: 1px solid #ddd !important; }
                    }
                </style>
            </head>
            <body>
                ${printRef.current.innerHTML}
                <div class="footer">
                    SIM-COMEX Cloud · ${t('student.reports.generated_on', 'Reporte generado el')} ${new Date().toLocaleDateString("es-CO", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                </div>
            </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
    };



    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold flex items-center gap-2">
                    <BarChart className="w-8 h-8 text-primary" />
                    {t('student.reports.title', 'Mis Reportes de Validación')}
                </h1>
                <p className="text-muted-foreground">{t('student.reports.subtitle', 'Consulta la consistencia de los datos en tus simulaciones.')}</p>
            </div>

            {myGroups.length === 0 ? (
                <Card>
                    <CardContent className="p-8 text-center text-muted-foreground">
                        <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>{t('student.reports.no_groups_message', 'No estás inscrito en ningún grupo activo actualmente.')}</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-6">
                    {/* Optimized Configuration */}
                    <Card className="bg-muted/10 border-none shadow-none">
                        <CardContent className="p-0 flex flex-col md:flex-row items-end gap-4">
                            <div className="flex-1 w-full space-y-1.5">
                                <label className="text-[10px] font-bold uppercase text-muted-foreground ml-1">{t('student.reports.academic_group_label', 'Grupo Académico')}</label>
                                <Select onValueChange={setSelectedGroupId} value={selectedGroupId || ""}>
                                    <SelectTrigger className="h-9 bg-background">
                                        <SelectValue placeholder={t('student.reports.select_group_placeholder', 'Seleccionar grupo...')} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {myGroups.map(g => (
                                            <SelectItem key={g.id} value={g.id}>
                                                {g.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Report Display */}
                    {!selectedGroupId && (
                        <div className="h-full flex flex-col items-center justify-center p-12 border-2 border-dashed rounded-xl bg-muted/20 text-muted-foreground">
                            <BarChart className="w-16 h-16 mb-4 opacity-20" />
                            <p className="text-lg font-medium">{t('student.reports.select_group_to_start', 'Selecciona un grupo para comenzar')}</p>
                        </div>
                    )}

                    {generating && (
                        <div className="flex items-center justify-center p-12">
                            <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin mr-3" />
                            <span className="text-muted-foreground">{t('student.reports.analyzing_consistency', 'Analizando consistencia de datos...')}</span>
                        </div>
                    )}

                    {!generating && report && report.details.length > 0 && (
                        <Card className="w-full shadow-md">
                            <CardHeader className="pb-2">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <CardTitle className="text-xl">{t('student.reports.consistency_report_title', 'Reporte de Consistencia')}</CardTitle>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="flex flex-col items-end mr-4">
                                            <span className="text-sm text-muted-foreground">{t('common.score', 'Puntaje')}</span>
                                            <span className={cn("text-3xl font-bold", getScoreColor(report.score))}>
                                                {report.score}%
                                            </span>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button variant="outline" size="sm" onClick={handlePrint} className="h-8 gap-2 font-bold uppercase text-[10px] tracking-widest">
                                                <Download className="w-3.5 h-3.5" /> {t('student.reports.btn_print', 'Imprimir PDF')}
                                            </Button>
                                            <Button variant="ghost" size="sm" onClick={() => { setSelectedGroupId(null); setReport(null); }} className="h-8 gap-2 font-bold uppercase text-[10px] tracking-widest">
                                                <LogOut className="w-3.5 h-3.5" /> {t('student.reports.btn_exit', 'Salir')}
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4" ref={printRef}>
                                {/* Group/Student Info integrated here */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 no-print">
                                    <div className="grid grid-cols-2 gap-2 p-3 bg-muted/20 rounded-lg border text-xs">
                                        <div className="space-y-1">
                                            <p className="font-bold text-muted-foreground uppercase text-[9px]">{t('common.student', 'Estudiante')}</p>
                                            <p className="font-medium truncate">{user?.fullName}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="font-bold text-muted-foreground uppercase text-[9px]">{t('common.group', 'Grupo')}</p>
                                            <p className="font-medium truncate">{selectedGroup?.name}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="font-bold text-muted-foreground uppercase text-[9px]">{t('common.teacher', 'Docente')}</p>
                                            <p className="font-medium truncate">{teacherName || "—"}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="font-bold text-muted-foreground uppercase text-[9px]">{t('common.module', 'Módulo')}</p>
                                            <p className="font-medium truncate underline decoration-primary/30 underline-offset-2">{selectedModule?.title}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="font-bold text-muted-foreground uppercase text-[9px]">{t('common.start_date', 'Fecha Inicial')}</p>
                                            <p className="font-medium truncate">{selectedGroup ? formatDate(selectedGroup.startDate) : "—"}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="font-bold text-muted-foreground uppercase text-[9px]">{t('common.end_date', 'Fecha Final')}</p>
                                            <p className="font-medium truncate">{selectedGroup ? formatDate(selectedGroup.endDate) : "—"}</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-3 gap-2 p-3 bg-primary/5 rounded-lg border border-primary/10 text-center items-center">
                                        <div className="space-y-0.5">
                                            <p className="text-[9px] font-bold uppercase text-muted-foreground">Variables</p>
                                            <p className="text-lg font-black text-primary">{report.totalTags}</p>
                                        </div>
                                        <div className="space-y-0.5">
                                            <p className="text-[9px] font-bold uppercase text-green-600">Correctas</p>
                                            <p className="text-lg font-black text-green-600">{report.matchedTags}</p>
                                        </div>
                                        <div className="space-y-0.5">
                                            <p className="text-[9px] font-bold uppercase text-red-600">Errores</p>
                                            <p className="text-lg font-black text-red-600">{report.totalTags - report.matchedTags}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Scrollable content for UI, printable content wraps everything */}
                                <div>
                                    <div className="print-only" style={{ display: 'none' }}>
                                        <div className="header">
                                            <h1>Reporte de Validación de Consistencia</h1>
                                            <div className="info-grid">
                                                <div className="info-item"><span className="info-label">Estudiante:</span> {user?.fullName}</div>
                                                <div className="info-item"><span className="info-label">Docente:</span> {teacherName || "—"}</div>
                                                <div className="info-item"><span className="info-label">Grupo:</span> {selectedGroup?.name}</div>
                                                <div className="info-item"><span className="info-label">Módulo:</span> {selectedModule?.title}</div>
                                                <div className="info-item"><span className="info-label">Fecha Inicial:</span> {selectedGroup ? formatDate(selectedGroup.startDate) : "—"}</div>
                                                <div className="info-item"><span className="info-label">Fecha Final:</span> {selectedGroup ? formatDate(selectedGroup.endDate) : "—"}</div>
                                                <div className="info-item"><span className="info-label">Fecha Generación:</span> {new Date().toLocaleDateString()}</div>
                                                <div className="info-item"><span className="info-label">Puntaje:</span> {report.score}%</div>
                                            </div>
                                        </div>

                                        <div className="stats-grid">
                                            <div className="stat-item">
                                                <div className="stat-label">Variables</div>
                                                <div className="stat-value">{report.totalTags}</div>
                                            </div>
                                            <div className="stat-item">
                                                <div className="stat-label">Correctas</div>
                                                <div className="stat-value stat-success">{report.matchedTags}</div>
                                            </div>
                                            <div className="stat-item">
                                                <div className="stat-label">Errores</div>
                                                <div className="stat-value stat-error">{report.totalTags - report.matchedTags}</div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="no-print">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {report.details.map((detail: any, idx: number) => (
                                                <div key={idx} className={cn(
                                                    "border rounded-lg overflow-hidden flex flex-col",
                                                    !detail.isConsistent ? "bg-red-50/30 border-red-100" : "bg-card shadow-sm border-muted"
                                                )}>
                                                    <div className={cn(
                                                        "px-3 py-2 flex justify-between items-center border-b",
                                                        detail.isConsistent ? "bg-green-500/5" : "bg-red-500/5"
                                                    )}>
                                                        <div className="overflow-hidden mr-2">
                                                            <h4 className="font-bold text-xs truncate" title={detail.tagName}>{detail.tagName}</h4>
                                                            <p className="text-[9px] text-muted-foreground font-mono truncate">ID: {detail.tagId}</p>
                                                        </div>
                                                        <div className="flex-shrink-0">
                                                            {detail.isConsistent ? (
                                                                <CheckCircle className="w-4 h-4 text-green-500" />
                                                            ) : (
                                                                <XCircle className="w-4 h-4 text-red-500" />
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="p-2 space-y-1.5 flex-1 bg-background/50">
                                                        {detail.values.map((val: any, vIdx: number) => (
                                                            <div key={vIdx} className="flex flex-col gap-0.5 border rounded p-1.5 bg-background relative overflow-hidden group">
                                                                <div className="flex justify-between items-start gap-2">
                                                                    <span className="text-[11px] font-bold text-foreground break-all leading-tight">
                                                                        {String(val.value)}
                                                                    </span>
                                                                    <Badge variant="outline" className="text-[9px] h-4 px-1 shrink-0 font-normal bg-muted/50">
                                                                        {val.docTitle}
                                                                    </Badge>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="cards-grid print-only" style={{ display: 'none' }}>
                                        {report.details.map((detail: any, idx: number) => (
                                            <div key={idx} className="card">
                                                <div className="card-header" style={{ background: detail.isConsistent ? '#f0fdf4' : '#fef2f2' }}>
                                                    <h4>{detail.tagName}</h4>
                                                    <span className="id">ID: {detail.tagId}</span>
                                                    {detail.isConsistent ?
                                                        <span style={{ color: '#16a34a', fontWeight: 'bold' }}>✓</span> :
                                                        <span style={{ color: '#dc2626', fontWeight: 'bold' }}>✗</span>
                                                    }
                                                </div>
                                                <div className="card-body">
                                                    {detail.values.map((val: any, vIdx: number) => (
                                                        <div key={vIdx} className="value-item">
                                                            <span>{String(val.value)}</span>
                                                            <span className="doc-tag">{val.docTitle}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {!generating && report && report.details.length === 0 && (
                        <div className="p-6 bg-blue-50 text-blue-800 rounded-xl border border-blue-200 flex flex-col items-center text-center">
                            <AlertCircle className="w-10 h-10 mb-2 opacity-50" />
                            <h3 className="font-bold text-lg">Sin coincidencias detectadas</h3>
                            <p className="max-w-md">
                                Se analizaron {report.totalTags} campos en tus documentos, pero no se encontraron datos relacionados entre sí para comparar.
                            </p>
                            <p className="text-sm mt-2 opacity-75">
                                Asegúrate de completar varios documentos que compartan información (ej. &quot;Número de Factura&quot;).
                            </p>
                        </div>
                    )}

                    {!generating && selectedGroupId && !report && (
                        <div className="p-4 bg-yellow-50 text-yellow-800 rounded-md border border-yellow-200">
                            No se encontraron datos para evaluar en este grupo. Asegúrate de haber guardado borradores.
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
