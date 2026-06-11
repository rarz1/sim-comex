
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ArrowRight, FileCheck } from "lucide-react";

interface StudentSummary {
    studentId: string;
    studentName: string; // Se pasará el nombre resuelto
    score: number;
    lastUpdated: string;
}

interface ModuleValidationSummaryProps {
    data: StudentSummary[];
    onSelectStudent: (studentId: string) => void;
    className?: string;
}

export const ModuleValidationSummary: React.FC<ModuleValidationSummaryProps> = ({ data, onSelectStudent, className }) => {
    return (
        <Card className={className}>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <FileCheck className="w-5 h-5" />
                    Resumen de Validación del Grupo
                </CardTitle>
                <CardDescription>
                    Puntajes de consistencia por estudiante en este módulo.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Estudiante</TableHead>
                            <TableHead>Última Actividad</TableHead>
                            <TableHead className="text-right">Consistencia</TableHead>
                            <TableHead></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {data.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center h-24 text-gray-500">
                                    No hay datos de estudiantes registrados para este módulo.
                                </TableCell>
                            </TableRow>
                        ) : (
                            data.map((student) => (
                                <TableRow key={student.studentId} className="cursor-pointer hover:bg-gray-50" onClick={() => onSelectStudent(student.studentId)}>
                                    <TableCell className="font-medium">{student.studentName}</TableCell>
                                    <TableCell className="text-gray-500 text-sm">{student.lastUpdated}</TableCell>
                                    <TableCell className="text-right">
                                        <span className={`font-bold ${student.score >= 90 ? 'text-green-600' :
                                                student.score >= 70 ? 'text-yellow-600' : 'text-red-600'
                                            }`}>
                                            {student.score}%
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="sm" onClick={(e) => {
                                            e.stopPropagation();
                                            onSelectStudent(student.studentId);
                                        }}>
                                            <ArrowRight className="w-4 h-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
};
