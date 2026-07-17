"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useExercises, useExerciseAssignments, useUsers, useExerciseFolders, useGroups, useModules } from "@/hooks/useData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FileText, Eye, BookOpen, UserCheck } from "lucide-react";
import type { CaseItem } from "@/types/exercises";

export default function StudentCasesPage() {
    const { user } = useAuth();
    const [viewingCase, setViewingCase] = useState<CaseItem | null>(null);
    const [isViewPdfOpen, setIsViewPdfOpen] = useState(false);

    const { data: allCases = [] } = useExercises();
    const { data: allAssignments = [] } = useExerciseAssignments();
    const { data: allUsers = [] } = useUsers() as any;
    const { data: allFolders = [] } = useExerciseFolders();
    const { data: allGroups = [] } = useGroups();
    const { data: allModules = [] } = useModules();

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
                return { userId: a.studentId, name: u?.name || u?.fullName || a.studentId };
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
                        const group = allGroups?.find((g: any) => g.id === assignment?.groupId);
                        const mod = group ? allModules?.find((m: any) => m.id === group.moduleId) : null;
                        return (
                            <Card key={c.id} className="hover:shadow-lg transition-all group">
                                <CardHeader className="pb-3">
                                    <div className="flex items-start gap-3">
                                        <div className="h-10 w-10 rounded-xl bg-primary/5 flex items-center justify-center group-hover:bg-primary/20 transition-colors shrink-0">
                                            <FileText className="w-5 h-5 text-primary" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <CardTitle className="text-lg truncate">{c.title}</CardTitle>
                                            {c.description && (
                                                <p className="text-sm text-muted-foreground line-clamp-2">{c.description}</p>
                                            )}
                                            {group && (
                                                <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                                                    <span className="flex items-center gap-1">
                                                        <BookOpen className="h-3 w-3" />
                                                        {mod?.title || '—'}
                                                    </span>
                                                    <span>·</span>
                                                    <span>{group.name}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    {peers.length > 0 && (
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <UserCheck className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                            <span className="text-xs text-muted-foreground">Compañeros:</span>
                                            {peers.map(p => (
                                                <span key={p.userId} className="text-xs font-medium bg-muted px-2 py-0.5 rounded-md">
                                                    {p.name}
                                                </span>
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
                        {viewingCase?.content?.pdfName && (
                            <p className="text-sm text-muted-foreground mt-1">{viewingCase.content.pdfName}</p>
                        )}
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