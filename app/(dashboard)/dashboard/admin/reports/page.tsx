
"use client"

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw } from "lucide-react";
import { ModuleValidationSummary } from "@/components/reports/ModuleValidationSummary";
import { ValidationReportCard } from "@/components/reports/ValidationReportCard";
import { dbService } from "@/lib/services/dbService";
import { validationService } from "@/lib/services/validationService";
import { Group } from "@/types/group";
import { Module } from "@/types/modules";
import { ValidationReport } from '@/types/validation';
import { toast } from "sonner";

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
                dbService.getGroups(),
                dbService.getTeachers()
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
            const group = await dbService.getGroupById(groupId);
            if (!group) return;

            if (group.moduleId) {
                const moduleData = await dbService.getModuleById(group.moduleId);
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
                const user = await dbService.getUserByUserId(memberId);
                if (user && user.name) {
                    studentName = user.name;
                }

                summaries.push({
                    studentId: memberId,
                    studentName: studentName,
                    score: report.score,
                    lastUpdated: new Date(report.generatedAt).toLocaleDateString(),
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

    return (
        <div className="container mx-auto p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Reportes Administrativos</h1>
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
                                    <SelectItem key={teacher.userId} value={teacher.userId}>
                                        {teacher.name}
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
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-1">
                        <ModuleValidationSummary
                            data={studentSummaries}
                            onSelectStudent={handleSelectStudent}
                            className="h-full"
                        />
                    </div>
                    <div className="md:col-span-2">
                        {selectedStudentReport ? (
                            <ValidationReportCard report={selectedStudentReport} />
                        ) : (
                            <Card className="h-full flex items-center justify-center min-h-[400px] bg-gray-50 border-dashed">
                                <div className="text-center text-gray-500">
                                    <p>Seleccione un estudiante para auditar</p>
                                </div>
                            </Card>
                        )}
                    </div>
                </div>
            ) : selectedGroup ? (
                <div className="text-center p-12 bg-gray-50 rounded-lg border border-dashed">
                    <p className="text-gray-500">Sin datos de módulo.</p>
                </div>
            ) : null}
        </div>
    );
}
