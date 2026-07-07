"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useExercises, useExerciseAssignments, useUsers, useExerciseFolders } from "@/hooks/useData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FileText, Eye, Users, Folder, BookOpen, UserCheck } from "lucide-react";
import type { CaseItem } from "@/types/exercises";

export default function StudentCasesPage() {
    const { user } = useAuth();
    const [viewingCase, setViewingCase] = useState<CaseItem | null>(null);
    const [isViewPdfOpen, setIsViewPdfOpen] = useState(false);

    const { data: allCases = [] } = useExercises();
    const { data: allAssignments = [] } = useExerciseAssignments();
    const { data: allUsers = [] } = useUsers() as any;
    const { data: allFolders = [] } = useExerciseFolders();

    const myAssignments = (allAssignments || []).filter(a => a.studentId === user?.id);
    const myCaseIds = new Set(myAssignments.map(a => a.caseId));
    const myCases = (allCases || []).filter(c => myCaseIds.has(c.id));

    const getFolderName = (folderId: string) => allFolders?.find(f => f.id === folderId)?.name || "—";
    const getCaseAssignment = (caseId: string) => myAssignments.find(a => a.caseId === caseId);

    const getPeersOnSameCase = (caseId: string, groupId: string) => {
        return (allAssignments || [])
            .filter(a => a.caseId === caseId && a.groupId === groupId && a.studentId !== user?.id)
            .map(a => {
                const u = allUsers?.find((u: any) => u.id === a.studentId);
                return { userId: a.studentId, name: u?.fullName || a.studentId };
            });
    };

    const viewPdf = (caseItem: CaseItem) => {
        setViewingCase(caseItem);
        setIsViewPdfOpen(true);
    };

    return (
        <div className="space-y-6 pb-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Mis Casos</h1>
                    <p className="text-muted-foreground">Casos prácticos asignados por tus docentes.</p>
                </div>
                <div className="flex items-center gap-2 bg-muted/30 px-4 py-2 rounded-xl border">
                    <FileText className="w-5 h-5 text-primary" />
                    <span className="font-bold text-sm">{myCases.length} Asignados</span>
                </div>
            </div>

            {myCases.length === 0 ? (
                <div className="text-center py-24 border-2 border-dashed rounded-[2rem] bg-muted/10 opacity-60">
                    <FileText className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                    <p className="text-xl font-bold text-muted-foreground">No tienes casos asignados</p>
                    <p className="text-muted-foreground">Cuando un docente te asigne un caso, aparecerá aquí.</p>
                </div>
            ) : (
                <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
                    {myCases.map(c => {
                        const assignment = getCaseAssignment(c.id);
                        const peers = assignment ? getPeersOnSameCase(c.id, assignment.groupId) : [];
                        return (
                            <Card key={c.id} className="hover:shadow-lg transition-all group">
                                <CardHeader className="pb-3">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-xl bg-primary/5 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                                                <FileText className="w-5 h-5 text-primary" />
                                            </div>
                                            <div>
                                                <CardTitle className="text-lg">{c.title}</CardTitle>
                                                {c.description && (
                                                    <p className="text-sm text-muted-foreground">{c.description}</p>
                                                )}
                                            </div>
                                        </div>
                                        <Badge variant={assignment?.status === 'completed' ? 'default' : 'secondary'}>
                                            {assignment?.status === 'completed' ? 'Completado' : 'Pendiente'}
                                        </Badge>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                        <div className="flex items-center gap-1">
                                            <Folder className="h-3.5 w-3.5" />
                                            <span>{getFolderName(c.folderId)}</span>
                                        </div>
                                        {c.content.pdfSize && (
                                            <span className="text-xs">{c.content.pdfSize}</span>
                                        )}
                                    </div>

                                    {peers.length > 0 && (
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <UserCheck className="h-3.5 w-3.5 text-muted-foreground" />
                                            <span className="text-xs text-muted-foreground">Compañeros:</span>
                                            {peers.map(p => (
                                                <Badge key={p.userId} variant="outline" className="text-[10px]">
                                                    {p.name}
                                                </Badge>
                                            ))}
                                        </div>
                                    )}

                                    <Button
                                        className="w-full"
                                        variant="outline"
                                        onClick={() => viewPdf(c)}
                                        disabled={!c.content.pdfUrl}
                                    >
                                        <Eye className="mr-2 h-4 w-4" /> Ver Caso
                                    </Button>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}

            <Dialog open={isViewPdfOpen} onOpenChange={setIsViewPdfOpen}>
                <DialogContent style={{ width: '1200px', maxWidth: '95vw', height: '90vh' }}>
                    <DialogHeader>
                        <DialogTitle>{viewingCase?.title}</DialogTitle>
                    </DialogHeader>
                    <div className="flex-1 h-full min-h-0">
                        {viewingCase?.content.pdfUrl && (
                            <iframe
                                src={viewingCase.content.pdfUrl}
                                className="w-full h-[calc(90vh-100px)] rounded-lg border"
                                title={viewingCase.title}
                            />
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}