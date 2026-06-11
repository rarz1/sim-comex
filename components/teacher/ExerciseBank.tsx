"use client";

import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db/db";
import { dbService } from "@/lib/services/dbService";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FolderPlus, FileText, Users, ChevronRight, ChevronDown, Folder, Plus, Trash2, Database, ArrowLeft, Save, Upload } from "lucide-react";
import type { ExerciseFolder, Exercise, ExerciseAssignment } from "@/types/exercises";

type ViewMode = "bank" | "repository" | "folder-detail";

interface ExerciseBankProps {
    onSuccess?: () => void;
}

export function ExerciseBank({ onSuccess }: ExerciseBankProps) {
    const { user } = useAuth();
    const [viewMode, setViewMode] = useState<ViewMode>("bank");
    const [selectedFolder, setSelectedFolder] = useState<ExerciseFolder | null>(null);
    const [selectedModuleInFolder, setSelectedModuleInFolder] = useState<string | null>(null);
    const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false);
    const [isCreateExerciseOpen, setIsCreateExerciseOpen] = useState(false);
    const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);
    const [isAssignOpen, setIsAssignOpen] = useState(false);
    const [isViewExerciseOpen, setIsViewExerciseOpen] = useState(false);
    const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
    const [editExercise, setEditExercise] = useState({ title: "", content: "" });

    const [newFolder, setNewFolder] = useState({ name: "", description: "", moduleId: "", groupIds: [] as string[] });
    const [newExercise, setNewExercise] = useState({ title: "", description: "", content: "", moduleId: "" });
    const [bulkModuleId, setBulkModuleId] = useState<string>("");
    const [bulkExercises, setBulkExercises] = useState<string>("");
    const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
    const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

    const allGroups = useLiveQuery(() => db.groups.toArray());
    const teachers = useLiveQuery(() => db.users.where("role").equals("teacher").toArray());
    const folders = useLiveQuery(() => user ? db.exerciseFolders.where("teacherId").equals(user.id).toArray() : [], [user]);
    const allModules = useLiveQuery(() => db.modules.toArray(), []);
    const allUsers = useLiveQuery(() => db.users.where("role").equals("student").toArray(), []);

    const myDbUser = teachers?.find(u => u.userId === user?.id || u.email === user?.email || u.name === user?.fullName);
    const teacherGroups = (allGroups || []).filter(g => g.teacherId === myDbUser?.userId || g.teacherId === user?.id || g.teacherId === user?.fullName || g.teacherId === user?.email);

    const teacherModules = (() => {
        const uniqueModuleIds = [...new Set(teacherGroups.map(g => g.moduleId).filter(Boolean))];
        return (allModules || []).filter(m => uniqueModuleIds.includes(m.id));
    })();

    const allExercises = useLiveQuery(() => db.exercises.toArray(), []);
    const allAssignments = useLiveQuery(() => db.exerciseAssignments.toArray(), []);

    const getTeacherModulesForFolder = (folder: ExerciseFolder) => {
        return teacherModules.filter(m => folder.moduleIds.includes(m.id));
    };

    const getTeacherGroupsForModule = (moduleId: string) => {
        if (!teacherGroups) return [];
        return teacherGroups.filter(g => g.moduleId === moduleId);
    };

    const getExercisesByModule = (moduleId: string) => {
        if (!allExercises) return [];
        return allExercises.filter(e => e.moduleId === moduleId);
    };

    const getStudentsForGroup = (groupId: string) => {
        if (!teacherGroups || !allUsers) return [];
        const group = teacherGroups.find(g => g.id === groupId);
        if (!group) return [];
        return allUsers.filter(u => group.members.includes(u.userId || u.email));
    };

    const getExerciseStatus = (exerciseId: string, studentId: string) => {
        if (!allAssignments) return null;
        const assignment = allAssignments.find(a => a.exerciseId === exerciseId && a.studentId === studentId);
        return assignment?.status || null;
    };

    const toggleGroup = (groupId: string) => {
        setExpandedGroups(prev => ({ ...prev, [groupId]: !prev[groupId] }));
    };

    const createFolder = async () => {
        if (!user || !newFolder.name || !newFolder.moduleId) return;
        const folder: ExerciseFolder = {
            id: crypto.randomUUID(),
            name: newFolder.name,
            description: newFolder.description,
            teacherId: user.id,
            moduleIds: [newFolder.moduleId],
            groupIds: newFolder.groupIds,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        await db.exerciseFolders.add(folder);
        await dbService.pushExerciseFolder(folder);
        setIsCreateFolderOpen(false);
        setNewFolder({ name: "", description: "", moduleId: "", groupIds: [] });
    };

    const createExercise = async () => {
        if (!newExercise.title || !newExercise.moduleId) return;
        const exercise: Exercise = {
            id: crypto.randomUUID(),
            folderId: "",
            title: newExercise.title,
            description: newExercise.description,
            content: newExercise.content,
            moduleId: newExercise.moduleId,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        await db.exercises.add(exercise);
        await dbService.pushExercise(exercise);
        setIsCreateExerciseOpen(false);
        setNewExercise({ title: "", description: "", content: "", moduleId: "" });
    };

    const importBulkExercises = async () => {
        if (!bulkModuleId || !bulkExercises) return;
        const lines = bulkExercises.split("\n").filter(line => line.trim());
        const newExercises: Exercise[] = [];

        for (const line of lines) {
            const commaIndex = line.indexOf(",");
            if (commaIndex > 0) {
                const title = line.substring(0, commaIndex).trim();
                const content = line.substring(commaIndex + 1).trim();
                if (title) {
                    newExercises.push({
                        id: crypto.randomUUID(),
                        folderId: "",
                        title,
                        description: "",
                        content,
                        moduleId: bulkModuleId,
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString(),
                    });
                }
            }
        }

        if (newExercises.length > 0) {
            await db.exercises.bulkAdd(newExercises);
            for (const ex of newExercises) await dbService.pushExercise(ex);
        }
        setIsBulkImportOpen(false);
        setBulkExercises("");
        setBulkModuleId("");
    };

    const deleteFolder = async (folderId: string) => {
        const folderExercises = await db.exercises.where("folderId").equals(folderId).toArray();
        for (const ex of folderExercises) {
            const exAssignments = await db.exerciseAssignments.where("exerciseId").equals(ex.id).toArray();
            await db.exerciseAssignments.bulkDelete(exAssignments.map(a => a.id!));
            for (const a of exAssignments) await dbService.deleteExerciseAssignmentCloud(a.id!);
        }
        await db.exercises.bulkDelete(folderExercises.map(e => e.id!));
        for (const e of folderExercises) await dbService.deleteExerciseCloud(e.id!);
        await db.exerciseFolders.delete(folderId);
        await dbService.deleteExerciseFolderCloud(folderId);
        if (selectedFolder?.id === folderId) {
            setSelectedFolder(null);
            setViewMode("bank");
        }
    };

    const assignExerciseToStudents = async () => {
        if (!selectedExercise || !selectedStudents.length || !user) return;
        const moduleId = selectedExercise.moduleId || "";
        const groupId = teacherGroups?.find(g => selectedStudents.some(s => g.members.includes(s)))?.id || "";

        const newAssignments: ExerciseAssignment[] = selectedStudents.map(studentId => ({
            id: crypto.randomUUID(),
            exerciseId: selectedExercise.id,
            studentId,
            groupId,
            moduleId,
            assignedBy: user.id,
            assignedAt: new Date().toISOString(),
            status: "pending" as const,
        }));

        await db.exerciseAssignments.bulkAdd(newAssignments);
        for (const a of newAssignments) await dbService.pushExerciseAssignment(a);
        setIsAssignOpen(false);
        setSelectedStudents([]);
    };

    const openExerciseView = (exercise: Exercise) => {
        setSelectedExercise(exercise);
        setEditExercise({ title: exercise.title, content: exercise.content });
        setIsViewExerciseOpen(true);
    };

    const saveExerciseEdit = async () => {
        if (!selectedExercise) return;
        await db.exercises.update(selectedExercise.id, {
            title: editExercise.title,
            content: editExercise.content,
            updatedAt: new Date().toISOString(),
        });
        const updatedExercise = await db.exercises.get(selectedExercise.id);
        if (updatedExercise) await dbService.pushExercise(updatedExercise);
        setIsViewExerciseOpen(false);
    };

    const deleteExercise = async (exerciseId: string) => {
        const exAssignments = await db.exerciseAssignments.where("exerciseId").equals(exerciseId).toArray();
        await db.exerciseAssignments.bulkDelete(exAssignments.map(a => a.id!));
        for (const a of exAssignments) await dbService.deleteExerciseAssignmentCloud(a.id!);
        await db.exercises.delete(exerciseId);
        await dbService.deleteExerciseCloud(exerciseId);
        setIsViewExerciseOpen(false);
    };

    const openFolderDetail = (folder: ExerciseFolder) => {
        setSelectedFolder(folder);
        setSelectedModuleInFolder(folder.moduleIds[0] || null);
        setViewMode("folder-detail");
    };

    return (
        <div className="space-y-6">
            {viewMode === "bank" && (
                <>
                    <div className="flex justify-between items-center">
                        <div>
                            <h2 className="text-2xl font-bold">Banco de Ejercicios</h2>
                            <p className="text-muted-foreground">Organiza casos prácticos en carpetas y asígnalos a tus estudiantes</p>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" onClick={() => setViewMode("repository")}>
                                <Database className="mr-2 h-4 w-4" /> Repositorio
                            </Button>
                            <Dialog open={isCreateFolderOpen} onOpenChange={setIsCreateFolderOpen}>
                                <DialogTrigger asChild>
                                    <Button><FolderPlus className="mr-2 h-4 w-4" /> Nueva Carpeta</Button>
                                </DialogTrigger>
                                <DialogContent style={{ width: '1400px', maxWidth: '95vw' }}>
                                    <DialogHeader>
                                        <DialogTitle>Crear Carpeta de Ejercicios</DialogTitle>
                                    </DialogHeader>
                                    <div className="space-y-4">
                                        <div>
                                            <Label>Nombre de la carpeta</Label>
                                            <Input
                                                value={newFolder.name}
                                                onChange={(e) => setNewFolder({ ...newFolder, name: e.target.value })}
                                                placeholder="Ej: Casos de Logística"
                                            />
                                        </div>
                                        <div>
                                            <Label>Descripción</Label>
                                            <Textarea
                                                value={newFolder.description}
                                                onChange={(e) => setNewFolder({ ...newFolder, description: e.target.value })}
                                                placeholder="Descripción opcional"
                                            />
                                        </div>
                                        <div>
                                            <Label>Seleccionar módulo</Label>
                                            <Select
                                                value={newFolder.moduleId}
                                                onValueChange={(val) => setNewFolder({ ...newFolder, moduleId: val, groupIds: [] })}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Selecciona un módulo" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {teacherModules?.map(mod => (
                                                        <SelectItem key={mod.id} value={mod.id}>{mod.title}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        {newFolder.moduleId && (
                                            <div>
                                                <Label>Asociar a grupos de este módulo</Label>
                                                <div className="flex flex-wrap gap-2 mt-2">
                                                    {getTeacherGroupsForModule(newFolder.moduleId).map(group => (
                                                        <div key={group.id} className="flex items-center gap-2 border rounded-md px-3 py-1">
                                                            <Checkbox
                                                                checked={newFolder.groupIds.includes(group.id)}
                                                                onCheckedChange={(checked) => {
                                                                    const ids = checked
                                                                        ? [...newFolder.groupIds, group.id]
                                                                        : newFolder.groupIds.filter(id => id !== group.id);
                                                                    setNewFolder({ ...newFolder, groupIds: ids });
                                                                }}
                                                            />
                                                            <span className="text-sm">{group.name}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                        <Button onClick={createFolder} className="w-full" disabled={!newFolder.name || !newFolder.moduleId}>
                                            Crear Carpeta
                                        </Button>
                                    </div>
                                </DialogContent>
                            </Dialog>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div className="md:col-span-1 space-y-2">
                            <h3 className="font-semibold">Carpetas</h3>
                            {folders?.length === 0 ? (
                                <p className="text-sm text-muted-foreground">No hay carpetas. Crea una para empezar.</p>
                            ) : (
                                folders?.map(folder => (
                                    <div
                                        key={folder.id}
                                        className="flex items-center justify-between p-3 rounded-lg cursor-pointer border hover:bg-muted"
                                        onClick={() => openFolderDetail(folder)}
                                    >
                                        <div className="flex items-center gap-2">
                                            <Folder className="h-4 w-4" />
                                            <span className="text-sm font-medium">{folder.name}</span>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6"
                                            onClick={(e) => { e.stopPropagation(); deleteFolder(folder.id); }}
                                        >
                                            <Trash2 className="h-3 w-3" />
                                        </Button>
                                    </div>
                                ))
                            )}
                        </div>

                        <div className="md:col-span-3">
                            <div className="text-center py-12 text-muted-foreground">
                                <Folder className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                <p>Selecciona una carpeta para ver sus ejercicios</p>
                            </div>
                        </div>
                    </div>
                </>
            )}

            {viewMode === "repository" && (
                <>
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-4">
                            <Button variant="ghost" size="icon" onClick={() => setViewMode("bank")}>
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                            <div>
                                <h2 className="text-2xl font-bold">Repositorio de Ejercicios</h2>
                                <p className="text-muted-foreground">Gestiona todos tus ejercicios y asígnalos a módulos</p>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" onClick={() => setIsBulkImportOpen(true)}>
                                <Upload className="mr-2 h-4 w-4" /> Importar Masivo
                            </Button>
                            <Dialog open={isCreateExerciseOpen} onOpenChange={setIsCreateExerciseOpen}>
                                <DialogTrigger asChild>
                                    <Button><Plus className="mr-2 h-4 w-4" /> Nuevo Ejercicio</Button>
                                </DialogTrigger>
                                <DialogContent style={{ width: '1400px', maxWidth: '95vw' }}>
                                    <DialogHeader>
                                        <DialogTitle>Nuevo Ejercicio</DialogTitle>
                                    </DialogHeader>
                                    <div className="space-y-4">
                                        <div>
                                            <Label>Título del ejercicio</Label>
                                            <Input
                                                value={newExercise.title}
                                                onChange={(e) => setNewExercise({ ...newExercise, title: e.target.value })}
                                                placeholder="Ej: Caso de importación FOB"
                                            />
                                        </div>
                                        <div>
                                            <Label>Contenido del ejercicio</Label>
                                            <Textarea
                                                value={newExercise.content}
                                                onChange={(e) => setNewExercise({ ...newExercise, content: e.target.value })}
                                                rows={8}
                                                placeholder="Describe el caso práctico detalladamente..."
                                            />
                                        </div>
                                        <div>
                                            <Label>Asociar a módulo</Label>
                                            {teacherModules && teacherModules.length > 0 ? (
                                                <Select
                                                    value={newExercise.moduleId}
                                                    onValueChange={(val) => setNewExercise({ ...newExercise, moduleId: val })}
                                                >
                                                    <SelectTrigger className="w-full">
                                                        <SelectValue placeholder="Selecciona un módulo" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {teacherModules.map(mod => (
                                                            <SelectItem key={mod.id} value={mod.id}>{mod.title}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            ) : (
                                                <p className="text-sm text-muted-foreground">No hay módulos disponibles. Crea un grupo con módulo primero.</p>
                                            )}
                                        </div>
                                        <div className="flex gap-2 pt-2">
                                            <Button 
                                                variant="outline" 
                                                onClick={() => {
                                                    setIsCreateExerciseOpen(false);
                                                    setNewExercise({ title: "", description: "", content: "", moduleId: "" });
                                                }}
                                            >
                                                Cancelar
                                            </Button>
                                            <Button 
                                                className="ml-auto" 
                                                onClick={createExercise}
                                                disabled={!newExercise.title || !newExercise.moduleId}
                                            >
                                                <Save className="mr-2 h-4 w-4" /> Guardar
                                            </Button>
                                        </div>
                                    </div>
                                </DialogContent>
                            </Dialog>
                        </div>
                    </div>

                    <Dialog open={isBulkImportOpen} onOpenChange={setIsBulkImportOpen}>
<DialogContent style={{ width: '1400px', maxWidth: '95vw', maxHeight: '90vh' }}>
                            <DialogHeader>
                                <DialogTitle>Importar Ejercicios en Masa</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 overflow-y-auto max-h-[70vh] pr-2">
                                <div>
                                    <Label>Seleccionar módulo destino</Label>
                                    {teacherModules && teacherModules.length > 0 ? (
                                        <Select
                                            value={bulkModuleId}
                                            onValueChange={(val) => setBulkModuleId(val)}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Selecciona un módulo" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {teacherModules.map(mod => (
                                                    <SelectItem key={mod.id} value={mod.id}>{mod.title}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    ) : (
                                        <p className="text-sm text-muted-foreground p-2">No hay módulos disponibles. Crea un grupo con módulo primero.</p>
                                    )}
                                </div>
                                <div>
                                    <Label>Ejercicios (dos columnas: Título - Contenido)</Label>
                                    <p className="text-sm text-muted-foreground mb-2">Cada línea es un ejercicio. Separa el título del contenido con coma (,)</p>
                                    <Textarea
                                        value={bulkExercises}
                                        onChange={(e) => setBulkExercises(e.target.value)}
                                        rows={10}
                                        placeholder="Caso de importación FOB,Un exportador de maquinaria necesita importar maquinaria desde China en términos FOB Shanghai...
Caso de logística internacional,Una empresa importa productos electrónicos desde Brasil. Necesita calcular los costos de transporte...
Caso de transporte aéreo,Una compañía farmacéutica necesita enviar vacunas a temperatura controlada..."
                                    />
                                </div>
                                {bulkExercises && (
                                    <div className="text-sm text-muted-foreground">
                                        <p>Vista previa: {bulkExercises.split("\n").filter(l => l.trim()).length} ejercicios a importar</p>
                                    </div>
                                )}
                                <div className="flex gap-2 pt-4">
                                    <Button variant="outline" onClick={() => { setIsBulkImportOpen(false); setBulkExercises(""); setBulkModuleId(""); }}>Cancelar</Button>
                                    <Button className="ml-auto" onClick={importBulkExercises} disabled={!bulkModuleId || !bulkExercises}>
                                        <Save className="mr-2 h-4 w-4" /> Importar {bulkExercises.split("\n").filter(l => l.trim()).length} ejercicios
                                    </Button>
                                </div>
                            </div>
                        </DialogContent>
                    </Dialog>

                    <div className="space-y-6">
                        {teacherModules?.map(module => {
                            const moduleExercises = getExercisesByModule(module.id);
                            if (moduleExercises.length === 0) return null;
                            return (
                                <div key={module.id} className="border rounded-lg p-4">
                                    <div className="flex items-center gap-2 mb-4">
                                        <FileText className="h-5 w-5 text-primary" />
                                        <h3 className="font-semibold text-lg">{module.title}</h3>
                                        <span className="text-sm text-muted-foreground">({moduleExercises.length} ejercicios)</span>
                                    </div>
                                    <div className="space-y-2">
                                        {moduleExercises.map(exercise => (
                                            <div key={exercise.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                                                <div 
                                                    className="flex-1 cursor-pointer hover:text-primary"
                                                    onClick={() => openExerciseView(exercise)}
                                                >
                                                    <p className="font-medium">{exercise.title}</p>
                                                    {exercise.description && <p className="text-sm text-muted-foreground">{exercise.description}</p>}
                                                </div>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={(e) => { e.stopPropagation(); setSelectedExercise(exercise); setIsAssignOpen(true); }}
                                                >
                                                    <Users className="mr-1 h-4 w-4" /> Distribuir
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                        {teacherModules?.every(m => getExercisesByModule(m.id).length === 0) && (
                            <div className="text-center py-8 text-muted-foreground">
                                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                <p>No hay ejercicios en el repositorio. Crea uno nuevo.</p>
                            </div>
                        )}
                    </div>
                </>
            )}

            {viewMode === "folder-detail" && selectedFolder && (
                <>
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-4">
                            <Button variant="ghost" size="icon" onClick={() => { setViewMode("bank"); setSelectedFolder(null); }}>
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                            <div>
                                <h2 className="text-2xl font-bold">{selectedFolder.name}</h2>
                                <p className="text-muted-foreground">{selectedFolder.description}</p>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {getTeacherModulesForFolder(selectedFolder).map(folderModule => {
                            const moduleGroups = getTeacherGroupsForModule(folderModule.id);
                            const moduleExercises = getExercisesByModule(folderModule.id);
                            return (
                                <div key={folderModule.id} className="border rounded-lg overflow-hidden">
                                    <div className="bg-muted/50 p-4 flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Folder className="h-5 w-5 text-primary" />
                                            <h3 className="font-semibold text-lg">{folderModule.title}</h3>
                                        </div>
                                        <div className="text-sm text-muted-foreground">
                                            {moduleGroups.length} grupos | {moduleExercises.length} ejercicios
                                        </div>
                                    </div>

                                    <div className="p-4 space-y-3">
                                        {moduleGroups.map(group => {
                                            const groupExercises = moduleExercises;
                                            const groupStudents = getStudentsForGroup(group.id);
                                            return (
                                                <div key={group.id} className="border rounded-lg">
                                                    <div className="p-3 bg-muted/30 flex items-center justify-between">
                                                        <div className="flex items-center gap-2">
                                                            <Users className="h-4 w-4" />
                                                            <span className="font-medium">{group.name}</span>
                                                            <span className="text-xs text-muted-foreground">({groupStudents.length} estudiantes)</span>
                                                        </div>
                                                    </div>
                                                    {groupExercises.length > 0 && (
                                                        <div className="p-3 space-y-2">
                                                            {groupExercises.map(exercise => (
                                                                <div key={exercise.id} className="flex items-center justify-between p-2 bg-muted/20 rounded">
                                                                    <div className="flex items-center gap-2">
                                                                        <FileText className="h-4 w-4 text-muted-foreground" />
                                                                        <span className="text-sm">{exercise.title}</span>
                                                                    </div>
                                                                    <Button
                                                                        size="sm"
                                                                        variant="outline"
                                                                        onClick={() => { setSelectedExercise(exercise); setIsAssignOpen(true); }}
                                                                    >
                                                                        Repartir
                                                                    </Button>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </>
            )}

            <Dialog open={isAssignOpen} onOpenChange={setIsAssignOpen}>
                <DialogContent className="w-[1400px] max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Distribuir Ejercicio: {selectedExercise?.title}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                            Selecciona los estudiantes a los que deseas enviar este ejercicio.
                        </p>

                        {selectedFolder && getTeacherModulesForFolder(selectedFolder).map(mod => {
                            const modGroups = getTeacherGroupsForModule(mod.id).filter(g => selectedFolder.groupIds.includes(g.id));
                            return (
                                <div key={mod.id} className="border rounded-lg p-4 space-y-3">
                                    <div className="flex items-center gap-2 font-medium">
                                        <span className="bg-primary text-primary-foreground px-2 py-0.5 rounded text-xs">MÓDULO</span>
                                        {mod.title}
                                    </div>

                                    {modGroups.map(group => {
                                        const groupStudents = getStudentsForGroup(group.id);
                                        return (
                                            <div key={group.id} className="ml-4 border-l-2 pl-4 space-y-2">
                                                <div
                                                    className="flex items-center gap-2 cursor-pointer hover:text-primary"
                                                    onClick={() => toggleGroup(group.id)}
                                                >
                                                    {expandedGroups[group.id] ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                                                    <span className="font-medium">{group.name}</span>
                                                    <span className="text-xs text-muted-foreground">({groupStudents.length} estudiantes)</span>
                                                </div>

                                                {expandedGroups[group.id] && (
                                                    <div className="ml-6 space-y-1">
                                                        {groupStudents.map(student => {
                                                            const studentId = student.userId || student.email;
                                                            const status = getExerciseStatus(selectedExercise?.id || "", studentId);
                                                            return (
                                                                <div key={student.id} className="flex items-center justify-between py-1">
                                                                    <div className="flex items-center gap-2">
                                                                        <Checkbox
                                                                            checked={selectedStudents.includes(studentId)}
                                                                            onCheckedChange={(checked) => {
                                                                                setSelectedStudents(
                                                                                    checked
                                                                                        ? [...selectedStudents, studentId]
                                                                                        : selectedStudents.filter(s => s !== studentId)
                                                                                );
                                                                            }}
                                                                        />
                                                                        <span className="text-sm">{student.email.split('@')[0]}</span>
                                                                    </div>
                                                                    {status && (
                                                                        <span className={`text-xs px-2 py-0.5 rounded ${
                                                                            status === 'completed' ? 'bg-green-100 text-green-800' :
                                                                            status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                                                                            'bg-gray-100 text-gray-800'
                                                                        }`}>
                                                                            {status === 'completed' ? 'Completado' : status === 'in_progress' ? 'En progreso' : 'Pendiente'}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            );
                        })}

                        <Button onClick={assignExerciseToStudents} className="w-full" disabled={selectedStudents.length === 0}>
                            Distribuir a {selectedStudents.length} estudiante(s)
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={isViewExerciseOpen} onOpenChange={setIsViewExerciseOpen}>
                <DialogContent style={{ width: '1400px', maxWidth: '95vw', maxHeight: '90vh' }}>
                    <DialogHeader>
                        <DialogTitle>Ver/Editar Ejercicio</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <Label>Título del ejercicio</Label>
                            <Input
                                value={editExercise.title}
                                onChange={(e) => setEditExercise({ ...editExercise, title: e.target.value })}
                            />
                        </div>
                        <div>
                            <Label>Contenido del ejercicio</Label>
                            <Textarea
                                value={editExercise.content}
                                onChange={(e) => setEditExercise({ ...editExercise, content: e.target.value })}
                                rows={8}
                            />
                        </div>
                        <div className="flex gap-2 pt-2">
                            <Button 
                                variant="destructive" 
                                onClick={() => selectedExercise && deleteExercise(selectedExercise.id)}
                            >
                                <Trash2 className="mr-2 h-4 w-4" /> Eliminar
                            </Button>
                            <Button 
                                variant="outline" 
                                onClick={() => setIsViewExerciseOpen(false)}
                            >
                                Cancelar
                            </Button>
                            <Button 
                                className="ml-auto" 
                                onClick={saveExerciseEdit}
                                disabled={!editExercise.title}
                            >
                                <Save className="mr-2 h-4 w-4" /> Guardar cambios
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}