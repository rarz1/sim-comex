"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useGroups, useUsers, useModules, useExerciseFolders, useCreateOrUpdateExerciseFolder, useDeleteExerciseFolder, useExercises, useCreateOrUpdateExercise, useDeleteExercise, useExerciseAssignments, useCreateOrUpdateExerciseAssignment, useDeleteExerciseAssignment } from "@/hooks/useData";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { FolderPlus, FileText, Users, Folder, Trash2, ArrowLeft, Upload, Eye, ChevronRight, Pencil, Copy, X, Loader2, Download } from "lucide-react";
import type { CaseFolder, CaseItem, CaseAssignment } from "@/types/exercises";
import { storageService } from "@/lib/services/storageService";

type ViewMode = "grid" | "detail";

interface ExerciseBankProps {
    isAdmin?: boolean;
}

function userName(u: any): string {
    return u?.name || u?.fullName || u?.email || 'Usuario';
}

// Metadata helpers — store ownership in existing fields (no DB migration needed)
function embedMeta(description: string, ownerId: string | null, space: string): string {
    return JSON.stringify({ d: description, o: ownerId, s: space });
}
function extractMeta(description: string): { desc: string; ownerId?: string; space?: string } {
    try { const p = JSON.parse(description); if (p && typeof p.d === 'string') return { desc: p.d, ownerId: p.o, space: p.s }; } catch {}
    return { desc: description };
}
function addCaseMeta(content: any, ownerId: string | null, space: string): any {
    return { ...content, _o: ownerId, _s: space };
}
function caseOwner(content: any): { ownerId?: string; space?: string } {
    return { ownerId: content?._o, space: content?._s };
}

export function ExerciseBank({ isAdmin }: ExerciseBankProps) {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState<'repository' | 'personal'>('repository');
    const [viewMode, setViewMode] = useState<ViewMode>("grid");
    const [selectedFolder, setSelectedFolder] = useState<CaseFolder | null>(null);
    const [selectedGroupId, setSelectedGroupId] = useState<string>("");
    const [selectedCaseIds, setSelectedCaseIds] = useState<string[]>([]);
    const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
    const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false);
    const [isEditFolderOpen, setIsEditFolderOpen] = useState(false);
    const [isUploadPdfOpen, setIsUploadPdfOpen] = useState(false);
    const [isViewPdfOpen, setIsViewPdfOpen] = useState(false);
    const [isCopyCaseOpen, setIsCopyCaseOpen] = useState(false);
    const [isBulkCopyOpen, setIsBulkCopyOpen] = useState(false);
    const [isRenameOpen, setIsRenameOpen] = useState(false);
    const [viewingCase, setViewingCase] = useState<CaseItem | null>(null);
    const [renameTarget, setRenameTarget] = useState<CaseItem | null>(null);
    const [renameTitle, setRenameTitle] = useState("");
    const [copyTargetCase, setCopyTargetCase] = useState<CaseItem | null>(null);
    const [copyTargetFolderId, setCopyTargetFolderId] = useState<string>("");
    const [newFolder, setNewFolder] = useState({ name: "", description: "" });
    const [editFolderData, setEditFolderData] = useState<CaseFolder | null>(null);
    const [uploadFiles, setUploadFiles] = useState<Array<{ file: File; title: string; description: string }>>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [copyFolderTarget, setCopyFolderTarget] = useState<CaseFolder | null>(null);
    const [isCopyFolderOpen, setIsCopyFolderOpen] = useState(false);
    const [copyFolderDestId, setCopyFolderDestId] = useState("");

    const isTeacher = user?.role === 'teacher';

    const currentTab = isAdmin ? 'repository' : activeTab;
    const canDelete = isAdmin || (isTeacher && currentTab === 'personal');
    const canCreateFolder = isAdmin || (isTeacher && currentTab === 'personal');
    const canUploadCase = isAdmin || (isTeacher && currentTab === 'personal');
    const canRename = isAdmin || (isTeacher && currentTab === 'personal');
    const canAssign = isAdmin || currentTab === 'personal';
    const isReadOnly = isTeacher && currentTab === 'repository';
    const ownerFilter: string | null = currentTab === 'personal' ? (user?.id ?? null) : null;

    const { data: allFolders } = useExerciseFolders();
    const folders = (allFolders || []).filter(f => {
        const m = extractMeta(f.description);
        if (currentTab === 'personal') return m.ownerId === user?.id && m.space === 'personal';
        return m.space !== 'personal';
    });
    const { data: allGroups } = useGroups();
    const { data: allUsers } = useUsers();
    const { data: allModules } = useModules();
    const { data: allCases } = useExercises();
    const { data: allAssignments } = useExerciseAssignments();

    const createOrUpdateFolder = useCreateOrUpdateExerciseFolder();
    const deleteFolderMutation = useDeleteExerciseFolder();
    const createOrUpdateExercise = useCreateOrUpdateExercise();
    const deleteExerciseMutation = useDeleteExercise();
    const createOrUpdateExerciseAssignment = useCreateOrUpdateExerciseAssignment();
    const deleteExerciseAssignmentMutation = useDeleteExerciseAssignment();

    const myDbUser = allUsers?.find(u => u.id === user?.id || u.email === user?.email);
    const teacherGroups = (allGroups || []).filter(g => g.teacherId === myDbUser?.id || g.teacherId === user?.id);
    const selectedGroup = allGroups?.find(g => g.id === selectedGroupId);
    const groupStudents = allUsers?.filter(u =>
        selectedGroup?.members?.includes(u.id || u.email)
    ) || [];

    const personalFolders = (allFolders || []).filter(f => {
        const m = extractMeta(f.description);
        return m.ownerId === user?.id && m.space === 'personal';
    });

    const folderCases = selectedFolder
        ? (allCases || []).filter(c => c.folderId === selectedFolder.id)
        : [];

    const createFolder = async () => {
        if (!newFolder.name) return;
        try {
            await createOrUpdateFolder.mutateAsync({
                id: crypto.randomUUID(),
                name: newFolder.name,
                description: embedMeta(newFolder.description || '', ownerFilter, currentTab),
            });
            setIsCreateFolderOpen(false);
            setNewFolder({ name: "", description: "" });
        } catch (err: any) {
            alert('Error al crear carpeta: ' + (err?.message || 'Desconocido.'));
        }
    };

    const updateFolder = async () => {
        if (!editFolderData || !editFolderData.name) return;
        const original = allFolders?.find(f => f.id === editFolderData.id);
        const meta = original ? extractMeta(original.description) : { desc: '', ownerId: undefined, space: undefined };
        try {
            await createOrUpdateFolder.mutateAsync({
                id: editFolderData.id,
                name: editFolderData.name,
                description: embedMeta(editFolderData.description, meta.ownerId || null, meta.space || 'repository'),
            });
            setIsEditFolderOpen(false);
            setEditFolderData(null);
        } catch (err: any) {
            alert('Error al actualizar carpeta: ' + (err?.message || 'Desconocido.'));
        }
    };

    const deleteFolder = async (folderId: string) => {
        if (!confirm("¿Eliminar carpeta y todos sus casos?")) return;
        const folderCasesList = (allCases || []).filter(c => c.folderId === folderId);
        for (const c of folderCasesList) {
            const assList = (allAssignments || []).filter(a => a.caseId === c.id);
            for (const a of assList) deleteExerciseAssignmentMutation.mutate(a.id);
            if (c.content?.pdfUrl && storageService.isStorageUrl(c.content.pdfUrl)) {
                const storagePath = storageService.extractPathFromUrl(c.content.pdfUrl);
                if (storagePath) storageService.deletePdf(storagePath).catch(() => {});
            }
            deleteExerciseMutation.mutate(c.id);
        }
        deleteFolderMutation.mutate(folderId);
        if (selectedFolder?.id === folderId) {
            setSelectedFolder(null);
            setViewMode("grid");
        }
    };

    const handleFilesSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        const valid = files.filter(f => f.type === 'application/pdf' || f.type === 'image/jpeg');
        if (valid.length === 0) {
            alert("Solo se permiten archivos PDF o JPG");
            return;
        }
        if (valid.length !== files.length) {
            alert(`${files.length - valid.length} archivo(s) omitido(s) (no son PDF ni JPG).`);
        }
        const newFiles = valid.map(f => ({
            file: f,
            title: f.name.replace(/\.(pdf|jpg|jpeg)$/i, ''),
            description: '',
        }));
        setUploadFiles(prev => [...prev, ...newFiles]);
    };

    const removeUploadFile = (index: number) => {
        setUploadFiles(prev => prev.filter((_, i) => i !== index));
    };

    const updateUploadFile = (index: number, field: 'title' | 'description', value: string) => {
        setUploadFiles(prev => prev.map((item, i) => i === index ? { ...item, [field]: value } : item));
    };

    const uploadAllCases = async () => {
        if (!selectedFolder || uploadFiles.length === 0) return;
        setIsUploading(true);
        let success = 0;
        for (const item of uploadFiles) {
            try {
                const caseId = crypto.randomUUID();
                const storagePath = currentTab === 'repository'
                    ? storageService.buildRepoPath(selectedFolder.id, caseId, item.file.name)
                    : storageService.buildPersonalPath(user!.id, selectedFolder.id, caseId, item.file.name);
                const pdfUrl = await storageService.uploadPdf(item.file, storagePath);
                const caseItem = {
                    id: caseId,
                    folderId: selectedFolder.id,
                    title: item.title,
                    description: item.description,
                    content: addCaseMeta({
                        text: "",
                        pdfUrl,
                        pdfName: item.file.name,
                        pdfSize: (item.file.size / 1024).toFixed(1) + ' KB',
                    }, ownerFilter, currentTab),
                };
                createOrUpdateExercise.mutate(caseItem);
                success++;
            } catch {
                // skip individual failure
            }
        }
        setIsUploading(false);
        if (success > 0) {
            setIsUploadPdfOpen(false);
            setUploadFiles([]);
        }
        if (success < uploadFiles.length) {
            alert(`${success} de ${uploadFiles.length} archivos subidos.`);
        }
    };

    const deleteCase = async (caseId: string) => {
        if (!confirm("¿Eliminar este caso?")) return;
        const assList = (allAssignments || []).filter(a => a.caseId === caseId);
        for (const a of assList) deleteExerciseAssignmentMutation.mutate(a.id);
        const c = allCases?.find(c => c.id === caseId);
        if (c?.content?.pdfUrl && storageService.isStorageUrl(c.content.pdfUrl)) {
            const storagePath = storageService.extractPathFromUrl(c.content.pdfUrl);
            if (storagePath) storageService.deletePdf(storagePath).catch(() => {});
        }
        deleteExerciseMutation.mutate(caseId);
    };

    const renameCase = async () => {
        if (!renameTarget || !renameTitle.trim()) return;
        const updated = { ...renameTarget, title: renameTitle.trim(), updatedAt: new Date().toISOString() };
        createOrUpdateExercise.mutate(updated);
        setIsRenameOpen(false);
        setRenameTarget(null);
        setRenameTitle("");
    };

    const copyCaseToPersonal = async () => {
        if (!copyTargetCase || !copyTargetFolderId || !user) return;
        createOrUpdateExercise.mutate({
            id: crypto.randomUUID(),
            folderId: copyTargetFolderId,
            title: copyTargetCase.title,
            description: copyTargetCase.description,
            content: addCaseMeta({ ...(copyTargetCase.content || {}) }, user.id, 'personal'),
        });
        setIsCopyCaseOpen(false);
        setCopyTargetCase(null);
        setCopyTargetFolderId("");
    };

    const bulkCopyToPersonal = async () => {
        if (selectedCaseIds.length === 0 || !copyTargetFolderId || !user) return;
        const repoCases = (allCases || []).filter(c => selectedCaseIds.includes(c.id));
        for (const c of repoCases) {
            createOrUpdateExercise.mutate({
                id: crypto.randomUUID(),
                folderId: copyTargetFolderId,
                title: c.title,
                description: c.description,
                content: addCaseMeta({ ...(c.content || {}) }, user.id, 'personal'),
            });
        }
        setIsBulkCopyOpen(false);
        setSelectedCaseIds([]);
        setCopyTargetFolderId("");
    };

    const copyFolderToPersonal = async () => {
        if (!copyFolderTarget || !user) return;
        setIsCopyFolderOpen(false);
        const newFolderId = crypto.randomUUID();
        const folderName = copyFolderTarget.name + ' (Copia)';
        const cleanDesc = extractMeta(copyFolderTarget.description).desc || copyFolderTarget.description;
        createOrUpdateFolder.mutate({
            id: newFolderId,
            name: folderName,
            description: embedMeta(cleanDesc, user.id, 'personal'),
        });
        const casesToCopy = (allCases || []).filter(c => c.folderId === copyFolderTarget.id);
        for (const c of casesToCopy) {
            createOrUpdateExercise.mutate({
                id: crypto.randomUUID(),
                folderId: newFolderId,
                title: c.title,
                description: c.description,
                content: addCaseMeta({ ...(c.content || {}) }, user.id, 'personal'),
            });
        }
    };

    const folderName = (folderId: string) => {
        const f = (allFolders || []).find(f => f.id === folderId);
        return f ? extractMeta(f.description).desc || f.name : '—';
    };

    const assignCases = async () => {
        if (!selectedFolder || !user || selectedCaseIds.length === 0 || selectedStudentIds.length === 0) return;

        const exactMatches = (allAssignments || []).filter(a =>
            selectedCaseIds.includes(a.caseId) && selectedStudentIds.includes(a.studentId)
        );
        const crossMatches = (allAssignments || []).filter(a =>
            a.groupId === selectedGroupId &&
            selectedStudentIds.includes(a.studentId) &&
            !selectedCaseIds.includes(a.caseId)
        );

        // Cross-case: student already in other cases of this group
        let activeStudents = [...selectedStudentIds];
        if (crossMatches.length > 0) {
            const crossStudentIds = new Set(crossMatches.map(c => c.studentId));
            const crossMap = new Map<string, string[]>();
            for (const c of crossMatches) {
                const student = allUsers?.find((u: any) => u.id === c.studentId);
                const name = userName(student) || c.studentId.slice(0, 8);
                const caseItem = (allCases || []).find(ca => ca.id === c.caseId);
                const fName = caseItem ? folderName(caseItem.folderId) : '—';
                const label = `"${caseItem?.title || c.caseId.slice(0, 8)}" [${fName}]`;
                if (!crossMap.has(name)) crossMap.set(name, []);
                crossMap.get(name)!.push(label);
            }
            let crossMsg = '';
            for (const [name, items] of crossMap) {
                crossMsg += `• ${name}\n`;
                for (const it of items) crossMsg += `    ${it}\n`;
            }
            if (!confirm(`Estudiantes con varios casos del mismo grupo:\n\n${crossMsg}\n¿Asignarlos también a los nuevos casos seleccionados?`)) {
                activeStudents = activeStudents.filter(id => !crossStudentIds.has(id));
                if (activeStudents.length === 0) return;
            }
        }

        // Exact match: same student + same case already assigned
        if (exactMatches.length > 0) {
            const grouped = new Map<string, string[]>();
            for (const c of exactMatches) {
                const student = allUsers?.find((u: any) => u.id === c.studentId);
                const studentName = userName(student) || c.studentId.slice(0, 8);
                const caseItem = (allCases || []).find(ca => ca.id === c.caseId);
                const label = `"${caseItem?.title || c.caseId.slice(0, 8)}"`;
                if (!grouped.has(studentName)) grouped.set(studentName, []);
                grouped.get(studentName)!.push(label);
            }
            let msg = '';
            for (const [name, items] of grouped) {
                msg += `• ${name}\n`;
                for (const it of items) msg += `    ${it}\n`;
            }
            const nuevas = selectedCaseIds.length * activeStudents.length - exactMatches.length;
            if (nuevas === 0) {
                alert(`Estudiantes repitiendo caso en el mismo grupo:\n\n${msg}`);
                return;
            }
            if (!confirm(`Estudiantes repitiendo caso en el mismo grupo:\n\n${msg}¿Asignar las ${nuevas} restantes?`)) return;
        }

        // Create assignments (skip exact duplicates)
        for (const caseId of selectedCaseIds) {
            for (const studentId of activeStudents) {
                if (!exactMatches.some(c => c.caseId === caseId && c.studentId === studentId)) {
                    createOrUpdateExerciseAssignment.mutate({
                        id: crypto.randomUUID(), caseId, studentId,
                        groupId: selectedGroupId, assignedBy: user.id,
                        assignedAt: new Date().toISOString(), status: 'pending',
                    });
                }
            }
        }
        setSelectedCaseIds([]);
        setSelectedStudentIds([]);
    };

    const viewPdf = (caseItem: CaseItem) => {
        setViewingCase(caseItem);
        setIsViewPdfOpen(true);
    };

    const getAssignedStudents = (caseId: string) => {
        const teacherGroupIds = new Set(teacherGroups.map(g => g.id));
        const filtered = isTeacher
            ? (allAssignments || []).filter(a => a.caseId === caseId && teacherGroupIds.has(a.groupId))
            : (allAssignments || []).filter(a => a.caseId === caseId);
        return filtered.map(a => {
            const u = allUsers?.find(u => u.id === a.studentId);
            const g = allGroups?.find(g => g.id === a.groupId);
            return {
                userId: a.studentId,
                name: userName(u) || a.studentId.slice(0, 8),
                groupId: a.groupId,
                groupName: g?.name || a.groupId.slice(0, 8),
                status: a.status,
                assignmentId: a.id,
            };
        });
    };

    const removeAssignment = async (caseId: string, studentId: string) => {
        if (!confirm("¿Eliminar asignación de este estudiante?")) return;
        const assignment = (allAssignments || []).find(a => a.caseId === caseId && a.studentId === studentId);
        if (!assignment) return;
        deleteExerciseAssignmentMutation.mutate(assignment.id);
    };

    const openFolder = (folder: CaseFolder) => {
        setSelectedFolder(folder);
        setViewMode("detail");
        setSelectedGroupId("");
        setSelectedCaseIds([]);
        setSelectedStudentIds([]);
    };

    const goBackToGrid = () => {
        setViewMode("grid");
        setSelectedFolder(null);
        setSelectedGroupId("");
    };

    const openRenameDialog = (c: CaseItem) => {
        setRenameTarget(c);
        setRenameTitle(c.title);
        setIsRenameOpen(true);
    };

    const tabs = (
        <div className="flex gap-1 bg-muted/30 p-1 rounded-lg w-fit mb-4">
            <button
                onClick={() => { setActiveTab('repository'); goBackToGrid(); }}
                className={`px-4 py-1.5 text-sm rounded-md font-medium transition-colors ${currentTab === 'repository' ? 'bg-background shadow-sm' : 'hover:text-foreground/80 text-muted-foreground'}`}
            >
                Repositorio
            </button>
            <button
                onClick={() => { setActiveTab('personal'); goBackToGrid(); }}
                className={`px-4 py-1.5 text-sm rounded-md font-medium transition-colors ${currentTab === 'personal' ? 'bg-background shadow-sm' : 'hover:text-foreground/80 text-muted-foreground'}`}
            >
                Mi Espacio
            </button>
        </div>
    );

    if (viewMode === "detail" && selectedFolder) {
        const selectedGroupUsers = selectedGroupId
            ? allUsers?.filter(u => (selectedGroup?.members || []).filter(Boolean).includes(u.id || u.email)) || []
            : [];

        return (
            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={goBackToGrid}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div className="flex-1">
                        <h2 className="text-2xl font-bold">{selectedFolder.name}</h2>
                        <p className="text-muted-foreground">{extractMeta(selectedFolder.description).desc}</p>
                    </div>
                    <div className="flex gap-2">
                        {canUploadCase && (
                            <Button onClick={() => { setUploadFiles([]); setIsUploadPdfOpen(true); }}>
                                <Upload className="mr-2 h-4 w-4" /> Subir PDFs
                            </Button>
                        )}
                        {canDelete && (
                            <Button variant="outline" size="icon" onClick={() => { setEditFolderData({ ...selectedFolder }); setIsEditFolderOpen(true); }}>
                                <Pencil className="h-4 w-4" />
                            </Button>
                        )}
                    </div>
                </div>

                {isReadOnly && (
                    <div className="bg-muted/30 border rounded-lg p-3 text-sm text-muted-foreground">
                        Vista de solo lectura. Selecciona los casos y cópialos a tu espacio personal.
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {!isReadOnly && (
                        <div className="md:col-span-1 space-y-4">
                            <Label>Seleccionar Grupo</Label>
                            <Select value={selectedGroupId} onValueChange={setSelectedGroupId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Elige un grupo..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {(isAdmin ? allGroups : teacherGroups)?.map(g => (
                                        <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            {selectedGroupId && (
                                <Card>
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                                            <Users className="h-4 w-4" /> Estudiantes ({selectedGroupUsers.length})
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-1">
                                        {selectedGroupUsers.map(u => (
                                            <div key={u.id} className="flex items-center gap-2 py-1">
                                                <Checkbox
                                                    checked={selectedStudentIds.includes(u.id)}
                                                    onCheckedChange={(c) => {
                                                        setSelectedStudentIds(c ? [...selectedStudentIds, u.id] : selectedStudentIds.filter(id => id !== u.id));
                                                    }}
                                                />
                                                <span className="text-sm">{userName(u)}</span>
                                            </div>
                                        ))}
                                        {selectedGroupUsers.length === 0 && (
                                            <p className="text-xs text-muted-foreground italic">Sin estudiantes</p>
                                        )}
                                    </CardContent>
                                </Card>
                            )}
                        </div>
                    )}

                    <div className={isReadOnly ? "md:col-span-3" : "md:col-span-2" + " space-y-4"}>
                        <div className="flex items-center justify-between">
                            <h3 className="font-bold text-lg">Casos ({folderCases.length})</h3>
                            <div className="flex gap-2">
                                {isReadOnly && selectedCaseIds.length > 0 && (
                                    <Button size="sm" onClick={() => { setCopyTargetFolderId(""); setIsBulkCopyOpen(true); }}>
                                        <Download className="mr-2 h-4 w-4" /> Copiar {selectedCaseIds.length} a Mi Espacio
                                    </Button>
                                )}
                                {canAssign && (
                                    <Button
                                        size="sm"
                                        onClick={assignCases}
                                        disabled={selectedCaseIds.length === 0 || selectedStudentIds.length === 0}
                                    >
                                        <Users className="mr-2 h-4 w-4" /> Asignar a {selectedStudentIds.length} estudiante(s)
                                    </Button>
                                )}
                            </div>
                        </div>

                        <div className="space-y-2">
                            {folderCases.map(c => {
                                const assigned = getAssignedStudents(c.id);
                                return (
                                    <div key={c.id} className="border rounded-lg p-3 space-y-2 hover:bg-muted/30 transition-colors">
                                        <div className="flex items-start gap-3">
                                            {(isReadOnly || canAssign) && (
                                                <Checkbox
                                                    checked={selectedCaseIds.includes(c.id)}
                                                    onCheckedChange={(ch) => {
                                                        setSelectedCaseIds(ch ? [...selectedCaseIds, c.id] : selectedCaseIds.filter(id => id !== c.id));
                                                    }}
                                                    className="mt-1"
                                                />
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <FileText className="h-4 w-4 text-primary shrink-0" />
                                                    <span className="font-medium truncate">{c.title}</span>
                                                    {c.content.pdfName && (
                                                        <Badge variant="outline" className="text-[9px] font-mono">PDF</Badge>
                                                    )}
                                                </div>
                                                {c.description && (
                                                    <p className="text-xs text-muted-foreground mt-0.5">{c.description}</p>
                                                )}
                                                {c.content.pdfSize && (
                                                    <p className="text-[10px] text-muted-foreground">{c.content.pdfSize}</p>
                                                )}
                                                {assigned.length > 0 && (
                                                    <div className="space-y-1.5 mt-1.5">
                                                        {Object.entries(
                                                            assigned.reduce((acc: Record<string, typeof assigned>, s) => {
                                                                (acc[s.groupId] ??= []).push(s);
                                                                return acc;
                                                            }, {})
                                                        ).map(([gId, students]) => (
                                                            <div key={gId}>
                                                                <button
                                                                    onClick={() => setSelectedGroupId(gId)}
                                                                    className="text-[10px] font-bold text-primary uppercase tracking-wider hover:underline mb-0.5 flex items-center gap-1"
                                                                >
                                                                    <Users className="w-3 h-3" />
                                                                    {students[0].groupName}
                                                                </button>
                                                                <div className="flex flex-wrap gap-1">
                                                                    {students.map(s => (
                                                                        <Badge key={s.userId} variant="secondary" className="text-[9px] flex items-center gap-1">
                                                                            {s.name}
                                                                            {canAssign && (
                                                                                <button
                                                                                    onClick={(e) => { e.stopPropagation(); removeAssignment(c.id, s.userId); }}
                                                                                    className="hover:text-destructive ml-0.5"
                                                                                >
                                                                                    <X className="h-2.5 w-2.5" />
                                                                                </button>
                                                                            )}
                                                                        </Badge>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex gap-1 shrink-0">
                                                {c.content.pdfUrl && (
                                                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => viewPdf(c)}>
                                                        <Eye className="h-3.5 w-3.5" />
                                                    </Button>
                                                )}
                                                {canRename && (
                                                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openRenameDialog(c)}>
                                                        <Pencil className="h-3.5 w-3.5" />
                                                    </Button>
                                                )}
                                                {canDelete && (
                                                    <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => deleteCase(c.id)}>
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                            {folderCases.length === 0 && (
                                <p className="text-sm text-muted-foreground italic text-center py-8">
                                    {isReadOnly
                                        ? "No hay casos en esta carpeta del repositorio."
                                        : "No hay casos en esta carpeta. Sube un PDF."}
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                <Dialog open={isUploadPdfOpen} onOpenChange={(open) => { if (!open) { setIsUploadPdfOpen(false); setUploadFiles([]); } }}>
                    <DialogContent style={{ width: '800px', maxWidth: '95vw', maxHeight: '90vh' }} className="flex flex-col">
                        <DialogHeader>
                            <DialogTitle>Subir PDFs</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 flex-1 overflow-y-auto">
                            <div className="border-2 border-dashed rounded-lg p-6 text-center hover:bg-muted/30 transition-colors">
                                <Input type="file" accept=".pdf,.jpg,.jpeg" multiple onChange={handleFilesSelect} className="hidden" id="pdf-upload-input" />
                                <Label htmlFor="pdf-upload-input" className="cursor-pointer flex flex-col items-center gap-2">
                                    <Upload className="h-8 w-8 text-muted-foreground" />
                                    <span className="text-sm font-medium">Seleccionar archivos PDF o JPG</span>
                                    <span className="text-xs text-muted-foreground">O arrastra los archivos aquí</span>
                                </Label>
                            </div>
                            {uploadFiles.length > 0 && (
                                <div className="space-y-2">
                                    <p className="text-sm font-medium">{uploadFiles.length} archivo(s) seleccionado(s)</p>
                                    <div className="max-h-[300px] overflow-y-auto space-y-2">
                                        {uploadFiles.map((item, i) => (
                                            <div key={i} className="flex items-start gap-2 border rounded-lg p-2">
                                                <FileText className="h-8 w-8 text-primary shrink-0 mt-1" />
                                                <div className="flex-1 min-w-0 space-y-1">
                                                    <Input value={item.title} onChange={e => updateUploadFile(i, 'title', e.target.value)} placeholder="Título del caso" className="text-sm h-8" />
                                                    <Input value={item.description} onChange={e => updateUploadFile(i, 'description', e.target.value)} placeholder="Descripción (opcional)" className="text-sm h-7 text-muted-foreground" />
                                                    <p className="text-[10px] text-muted-foreground">{item.file.name} ({(item.file.size / 1024).toFixed(1)} KB)</p>
                                                </div>
                                                <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0" onClick={() => removeUploadFile(i)}>
                                                    <X className="h-3.5 w-3.5" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="pt-2 border-t">
                            <Button onClick={uploadAllCases} className="w-full" disabled={uploadFiles.length === 0 || isUploading}>
                                {isUploading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Subiendo...</> : <><Upload className="mr-2 h-4 w-4" /> Subir {uploadFiles.length} archivo(s)</>}
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>

                <Dialog open={isViewPdfOpen} onOpenChange={setIsViewPdfOpen}>
                    <DialogContent style={{ width: '1200px', maxWidth: '95vw', height: '90vh' }}>
                        <DialogHeader>
                            <DialogTitle>{viewingCase?.title}</DialogTitle>
                        </DialogHeader>
                        <div className="flex-1 h-full min-h-0 flex items-center justify-center">
                            {viewingCase?.content.pdfUrl && (
                                viewingCase.content.pdfUrl.match(/\.jpe?g$/i) ? (
                                    <img src={viewingCase.content.pdfUrl} alt={viewingCase.title} className="max-w-full max-h-full rounded-lg border shadow-md object-contain" />
                                ) : (
                                    <iframe src={viewingCase.content.pdfUrl} className="w-full h-[calc(90vh-100px)] rounded-lg border" title={viewingCase.title} />
                                )
                            )}
                        </div>
                    </DialogContent>
                </Dialog>

            <Dialog open={isCopyFolderOpen} onOpenChange={setIsCopyFolderOpen}>
                <DialogContent style={{ width: '450px', maxWidth: '95vw' }}>
                    <DialogHeader><DialogTitle>Copiar Carpeta a Mi Espacio</DialogTitle></DialogHeader>
                    <div className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                            Se copiará la carpeta <strong>{copyFolderTarget?.name}</strong> y todos sus casos a tu espacio personal.
                        </p>
                        <Button onClick={copyFolderToPersonal} className="w-full">
                            <Download className="mr-2 h-4 w-4" /> Copiar Carpeta
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={isEditFolderOpen} onOpenChange={setIsEditFolderOpen}>
                    <DialogContent style={{ width: '500px', maxWidth: '95vw' }}>
                        <DialogHeader><DialogTitle>Editar Carpeta</DialogTitle></DialogHeader>
                        <div className="space-y-4">
                            <div>
                                <Label>Nombre</Label>
                                <Input value={editFolderData?.name || ''} onChange={e => setEditFolderData(prev => prev ? { ...prev, name: e.target.value } : null)} placeholder="Nombre de la carpeta" />
                            </div>
                            <div>
                                <Label>Descripción</Label>
                                <Input value={editFolderData ? extractMeta(editFolderData.description).desc : ''} onChange={e => setEditFolderData(prev => prev ? { ...prev, description: e.target.value } : null)} placeholder="Descripción opcional" />
                            </div>
                            <Button onClick={updateFolder} className="w-full" disabled={!editFolderData?.name}>Guardar Cambios</Button>
                        </div>
                    </DialogContent>
                </Dialog>

                <Dialog open={isCopyCaseOpen} onOpenChange={setIsCopyCaseOpen}>
                    <DialogContent style={{ width: '500px', maxWidth: '95vw' }}>
                        <DialogHeader><DialogTitle>Copiar a Mi Espacio</DialogTitle></DialogHeader>
                        <div className="space-y-4">
                            <p className="text-sm text-muted-foreground">Selecciona la carpeta de tu espacio personal donde copiar este caso.</p>
                            <div>
                                <Label>Carpeta destino</Label>
                                <Select value={copyTargetFolderId} onValueChange={setCopyTargetFolderId}>
                                    <SelectTrigger><SelectValue placeholder="Elige una carpeta..." /></SelectTrigger>
                                    <SelectContent>
                                        {(personalFolders || []).map(f => (<SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>))}
                                        {(!personalFolders || personalFolders.length === 0) && (<SelectItem value="_none" disabled>No hay carpetas. Crea una primero.</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <Button onClick={copyCaseToPersonal} className="w-full" disabled={!copyTargetFolderId}>
                                <Copy className="mr-2 h-4 w-4" /> Copiar a Mi Espacio
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>

                <Dialog open={isBulkCopyOpen} onOpenChange={setIsBulkCopyOpen}>
                    <DialogContent style={{ width: '500px', maxWidth: '95vw' }}>
                        <DialogHeader><DialogTitle>Copiar {selectedCaseIds.length} caso(s) a Mi Espacio</DialogTitle></DialogHeader>
                        <div className="space-y-4">
                            <p className="text-sm text-muted-foreground">Selecciona la carpeta destino en tu espacio personal.</p>
                            <div>
                                <Label>Carpeta destino</Label>
                                <Select value={copyTargetFolderId} onValueChange={setCopyTargetFolderId}>
                                    <SelectTrigger><SelectValue placeholder="Elige una carpeta..." /></SelectTrigger>
                                    <SelectContent>
                                        {(personalFolders || []).map(f => (<SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>))}
                                        {(!personalFolders || personalFolders.length === 0) && (<SelectItem value="_none" disabled>No hay carpetas. Crea una primero.</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <Button onClick={bulkCopyToPersonal} className="w-full" disabled={!copyTargetFolderId}>
                                <Download className="mr-2 h-4 w-4" /> Copiar a Mi Espacio
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>

                <Dialog open={isRenameOpen} onOpenChange={setIsRenameOpen}>
                    <DialogContent style={{ width: '450px', maxWidth: '95vw' }}>
                        <DialogHeader><DialogTitle>Renombrar Caso</DialogTitle></DialogHeader>
                        <div className="space-y-4">
                            <div>
                                <Label>Nuevo nombre</Label>
                                <Input value={renameTitle} onChange={e => setRenameTitle(e.target.value)} placeholder="Nombre del caso" autoFocus />
                            </div>
                            <Button onClick={renameCase} className="w-full" disabled={!renameTitle.trim()}>
                                <Pencil className="mr-2 h-4 w-4" /> Guardar
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>

                <Dialog open={isCopyFolderOpen} onOpenChange={setIsCopyFolderOpen}>
                    <DialogContent style={{ width: '450px', maxWidth: '95vw' }}>
                        <DialogHeader><DialogTitle>Copiar Carpeta a Mi Espacio</DialogTitle></DialogHeader>
                        <div className="space-y-4">
                            <p className="text-sm text-muted-foreground">
                                Se copiará la carpeta <strong>{copyFolderTarget?.name}</strong> y todos sus casos a tu espacio personal.
                            </p>
                            <Button onClick={copyFolderToPersonal} className="w-full">
                                <Download className="mr-2 h-4 w-4" /> Copiar Carpeta
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {!isAdmin && tabs}

            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold">
                        {isAdmin ? 'Banco de Ejercicios' : currentTab === 'repository' ? 'Repositorio' : 'Mi Espacio'}
                    </h2>
                    <p className="text-muted-foreground">
                        {isAdmin ? 'Repositorio compartido de casos prácticos en PDF'
                            : currentTab === 'repository' ? 'Explora el repositorio institucional de casos'
                            : 'Tus casos personales y asignaciones'}
                    </p>
                </div>
                {canCreateFolder && (
                    <Dialog open={isCreateFolderOpen} onOpenChange={setIsCreateFolderOpen}>
                        <DialogTrigger asChild>
                            <Button><FolderPlus className="mr-2 h-4 w-4" /> Nueva Carpeta</Button>
                        </DialogTrigger>
                        <DialogContent style={{ width: '500px', maxWidth: '95vw' }}>
                            <DialogHeader><DialogTitle>Nueva Carpeta</DialogTitle></DialogHeader>
                            <div className="space-y-4">
                                <div>
                                    <Label>Nombre</Label>
                                    <Input value={newFolder.name} onChange={e => setNewFolder({ ...newFolder, name: e.target.value })} placeholder="Ej: Casos Aduaneros" />
                                </div>
                                <div>
                                    <Label>Descripción</Label>
                                    <Input value={newFolder.description} onChange={e => setNewFolder({ ...newFolder, description: e.target.value })} placeholder="Descripción opcional" />
                                </div>
                                <Button onClick={createFolder} className="w-full" disabled={!newFolder.name}>
                                    <FolderPlus className="mr-2 h-4 w-4" /> Crear Carpeta
                                </Button>
                            </div>
                        </DialogContent>
                    </Dialog>
                )}
            </div>

            {isReadOnly && (
                <div className="bg-muted/30 border rounded-lg p-3 text-sm text-muted-foreground">
                    Vista de solo lectura. Puedes explorar las carpetas y copiar casos a tu espacio personal.
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {folders?.map(folder => {
                    const caseCount = (allCases || []).filter(c => c.folderId === folder.id).length;
                    return (
                        <Card key={folder.id} className="hover:shadow-lg transition-all cursor-pointer group" onClick={() => openFolder(folder)}>
                            <CardHeader className="pb-2">
                                <div className="flex items-start justify-between">
                                    <Folder className="h-8 w-8 text-primary/60" />
                                    <div className="flex gap-1">
                                        {isReadOnly && (
                                            <Button size="sm" variant="outline" className="h-7 text-[10px] gap-1 px-2" onClick={(e) => { e.stopPropagation(); setCopyFolderTarget(folder); setCopyFolderDestId(""); setIsCopyFolderOpen(true); }}>
                                                <Download className="h-3 w-3" /> Copiar
                                            </Button>
                                        )}
                                        {canDelete && (
                                            <>
                                                <Button size="icon" variant="ghost" className="h-6 w-6 opacity-0 group-hover:opacity-100" onClick={(e) => { e.stopPropagation(); setEditFolderData({ ...folder }); setIsEditFolderOpen(true); }}>
                                                    <Pencil className="h-3 w-3" />
                                                </Button>
                                                <Button size="icon" variant="ghost" className="h-6 w-6 opacity-0 group-hover:opacity-100 text-destructive" onClick={(e) => { e.stopPropagation(); deleteFolder(folder.id); }}>
                                                    <Trash2 className="h-3 w-3" />
                                                </Button>
                                            </>
                                        )}
                                    </div>
                                </div>
                                <CardTitle className="text-base mt-2">{folder.name}</CardTitle>
                                {(() => { const d = extractMeta(folder.description).desc; return d ? <p className="text-xs text-muted-foreground line-clamp-2">{d}</p> : null; })()}
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <FileText className="h-3 w-3" />
                                    <span>{caseCount} caso(s)</span>
                                    <ChevronRight className="h-3 w-3 ml-auto group-hover:translate-x-0.5 transition-transform" />
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
                {(!folders || folders.length === 0) && (
                    <div className="md:col-span-3 lg:col-span-4 text-center py-16 text-muted-foreground">
                        <Folder className="h-12 w-12 mx-auto mb-4 opacity-30" />
                        <p className="text-lg font-medium">
                            {currentTab === 'repository' ? 'No hay carpetas en el repositorio' : 'Tu espacio personal está vacío'}
                        </p>
                        <p className="text-sm">
                            {currentTab === 'repository'
                                ? (isAdmin ? 'Crea una carpeta para empezar a organizar casos.' : 'El administrador aún no ha añadido contenido.')
                                : 'Crea carpetas y copia casos desde el repositorio.'}
                        </p>
                    </div>
                )}
            </div>

            <Dialog open={isCopyFolderOpen} onOpenChange={setIsCopyFolderOpen}>
                <DialogContent style={{ width: '450px', maxWidth: '95vw' }}>
                    <DialogHeader><DialogTitle>Copiar Carpeta a Mi Espacio</DialogTitle></DialogHeader>
                    <div className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                            Se copiará la carpeta <strong>{copyFolderTarget?.name}</strong> y todos sus casos a tu espacio personal.
                        </p>
                        <Button onClick={copyFolderToPersonal} className="w-full">
                            <Download className="mr-2 h-4 w-4" /> Copiar Carpeta
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={isEditFolderOpen} onOpenChange={setIsEditFolderOpen}>
                <DialogContent style={{ width: '500px', maxWidth: '95vw' }}>
                    <DialogHeader><DialogTitle>Editar Carpeta</DialogTitle></DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <Label>Nombre</Label>
                            <Input value={editFolderData?.name || ''} onChange={e => setEditFolderData(prev => prev ? { ...prev, name: e.target.value } : null)} placeholder="Nombre de la carpeta" />
                        </div>
                        <div>
                                <Label>Descripción</Label>
                                <Input value={editFolderData ? extractMeta(editFolderData.description).desc : ''} onChange={e => setEditFolderData(prev => prev ? { ...prev, description: e.target.value } : null)} placeholder="Descripción opcional" />
                            </div>
                            <Button onClick={updateFolder} className="w-full" disabled={!editFolderData?.name}>Guardar Cambios</Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
        );
    }
