"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useGroups, useModules, useUsers, useTemplates, useCreateOrUpdateGroup, useDeleteGroup } from "@/hooks/useData";
import { dataService } from "@/lib/services/dataService";
import { Group } from "@/types/group";
import { Module } from "@/types/modules";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Trash2, Edit, Save, Users, Calendar, BookOpen, ArrowLeft, FileText, Loader2 } from "lucide-react";
import { formatDate } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";

// Teachers will be fetched dynamically from the database


export function GroupManager() {
    const [isEditing, setIsEditing] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    // Form State
    const [formData, setFormData] = useState<Group>({
        id: "",
        name: "",
        description: "",
        teacherId: "",
        moduleId: "",
        members: [],
        startDate: "",
        endDate: "",
        createdAt: ""
    });

    const [memberFilter, setMemberFilter] = useState("");
    const [moduleFilter, setModuleFilter] = useState("all");
    const [teacherFilter, setTeacherFilter] = useState("all");
    const [showStudentDialog, setShowStudentDialog] = useState(false);
    const [studentForm, setStudentForm] = useState({ fullName: "", email: "", documentType: "CC", documentNumber: "" });
    const [studentSyncing, setStudentSyncing] = useState(false);
    const queryClient = useQueryClient();

    const createOrUpdateGroup = useCreateOrUpdateGroup();
    const deleteGroup = useDeleteGroup();

    // Data Loaders
    const { data: groups } = useGroups();
    const { data: modules } = useModules();
    const { data: allUsers } = useUsers() as { data: any[] };
    const { data: allTemplates } = useTemplates();

    // Fetch teachers specifically to ensure we get them even if allUsers is huge or paginated (future proof)
    const dbTeachers = allUsers?.filter(u => u.role === 'teacher');

    // Filtered lists from DB
    const availableStudents = allUsers?.filter(u => u.role === 'student') || [];

    // Fallback: If dbTeachers query returns empty (e.g. index issue), try filtering from allUsers
    const availableTeachers = (dbTeachers && dbTeachers.length > 0)
        ? dbTeachers
        : (allUsers?.filter(u => u.role === 'teacher') || []);

    const filteredGroups = groups?.filter(g => {
        const matchesModule = moduleFilter === "all" || g.moduleId === moduleFilter;
        const matchesTeacher = teacherFilter === "all" || g.teacherId === teacherFilter;
        return matchesModule && matchesTeacher;
    });

    // Handlers
    const handleCreate = () => {
        setFormData({
            id: crypto.randomUUID(),
            name: "",
            description: "",
            teacherId: "",
            moduleId: "",
            members: [],
            startDate: new Date().toISOString().split('T')[0], // Default today
            endDate: "",
            createdAt: new Date().toISOString()
        });
        setEditingId(null);
        setIsEditing(true);
    };

    const handleEdit = (group: Group) => {
        setFormData({
            ...group,
            members: group.members || []
        });
        setEditingId(group.id);
        setIsEditing(true);
    };

    const handleDelete = async (id: string) => {
        if (confirm("⚠️ ¿Estás seguro de eliminar este grupo permanentemente?\nEsta acción no se puede deshacer.")) {
            deleteGroup.mutate(id);
        }
    };

    const handleSave = async () => {
        if (!formData.name || !formData.teacherId) {
            alert("Nombre y Docente son obligatorios");
            return;
        }

        try {
            const payload: Record<string, any> = {
                ...formData,
                createdAt: formData.createdAt || new Date().toISOString(),
            };
            if (!payload.startDate) delete payload.startDate;
            if (!payload.endDate) delete payload.endDate;
            await createOrUpdateGroup.mutateAsync(payload);
            toast.success("Grupo guardado correctamente");
        } catch (err: any) {
            console.error("Error saving group:", err);
            toast.error(`Error al guardar: ${err.message || 'Error desconocido'}`);
        }
        setIsEditing(false);
    };

    const addStudent = (identifier: string) => {
        if (!identifier.trim()) return;

        // Check if student is already in list (either as name or ID)
        const isAlreadyAdded = (formData.members || []).some(m => m === identifier);

        if (!isAlreadyAdded) {
            setFormData(prev => ({
                ...prev,
                members: [...(prev.members || []), identifier]
            }));
        }
    };

    const removeStudent = (name: string) => {
        setFormData(prev => ({
            ...prev,
            members: (prev.members || []).filter(m => m !== name)
        }));
    };

    const generateDeterministicId = (email: string, role: string) => {
        const lower = email.toLowerCase();
        const prefix = lower.split('@')[0].replace(/[^a-z0-9]/g, '');
        return `${role}-${prefix}`;
    };

    const syncToSupabase = async (usersList: { email: string; password?: string; fullName: string; role: string; documentType?: string; documentNumber?: string }[]) => {
        const cached = JSON.parse(localStorage.getItem('cached_user_profile') || '{}');
        const res = await fetch('/api/admin/users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ users: usersList, callerUserId: cached.id }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Error de conexión');
        return data.results as { email: string; success: boolean; error?: string; id?: string }[];
    };

    const handleCreateStudent = async () => {
        const email = (studentForm.email || '').trim().toLowerCase();
        if (!email || !studentForm.fullName) {
            toast.error("Nombre y Email son obligatorios");
            return;
        }
        setStudentSyncing(true);

        try {
            const results = await syncToSupabase([{
                email,
                password: "123456",
                fullName: studentForm.fullName,
                role: 'student',
                documentType: studentForm.documentType,
                documentNumber: studentForm.documentNumber,
            }]);

            const result = results[0];
            let authId: string | undefined;

            if (!result.success && result.error?.includes('ya existe')) {
                toast.warning(`${email}: ${result.error}. Se agregará al grupo igual.`);
            } else if (!result.success) {
                toast.error(`Error en Auth: ${result.error}`);
                setStudentSyncing(false);
                return;
            } else if (result.id) {
                authId = result.id;
            }

            const userId = authId || generateDeterministicId(email, 'student');

            if (authId) {
                await dataService.save('profiles', {
                    id: userId,
                    email,
                    name: studentForm.fullName,
                    role: 'student',
                    documentType: studentForm.documentType,
                    documentNumber: studentForm.documentNumber,
                    createdAt: new Date().toISOString()
                });
            }

            addStudent(userId);

            queryClient.invalidateQueries({ queryKey: ['profiles'] });

            toast.success(`Estudiante ${studentForm.fullName} creado y agregado al grupo`);
            setShowStudentDialog(false);
            setStudentForm({ fullName: "", email: "", documentType: "CC", documentNumber: "" });
        } catch (error: any) {
            console.error(error);
            toast.error(error.message || "Error al crear estudiante");
        } finally {
            setStudentSyncing(false);
        }
    };

    if (isEditing) {
        // Filter DB students
        const filteredStudents = availableStudents.filter(s =>
            s.name.toLowerCase().includes(memberFilter.toLowerCase())
        );

        return (
            <Card className="max-w-5xl mx-auto">
                <CardHeader>
                    <CardTitle>{editingId ? "Editar Grupo" : "Nuevo Grupo"}</CardTitle>
                    <CardDescription>Configure los detalles del grupo y gestione los estudiantes inscritos.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
                    {/* TOP SECTION: Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* LEFT COLUMN */}
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label>Nombre del Grupo</Label>
                                <Input
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="Ej: Comercio Exterior 2024-A"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Módulo Académico</Label>
                                <Select
                                    value={formData.moduleId}
                                    onValueChange={val => setFormData({ ...formData, moduleId: val })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Seleccione contenido" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {modules?.filter(m => m.id && m.id.trim() !== "").map(m => (
                                            <SelectItem key={m.id} value={m.id}>{m.title}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Fecha Inicio</Label>
                                    <Input
                                        type="date"
                                        value={formData.startDate ?? ""}
                                        onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Fecha Fin</Label>
                                    <Input
                                        type="date"
                                        value={formData.endDate ?? ""}
                                        onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* RIGHT COLUMN */}
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label>Docente Responsable</Label>
                                <Select
                                    value={formData.teacherId}
                                    onValueChange={val => setFormData({ ...formData, teacherId: val })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Seleccione un docente" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {availableTeachers.filter(t => t.id).map(t => (
                                            <SelectItem key={t.id} value={t.id}>
                                                {t.name} <span className="text-muted-foreground ml-2 text-xs">({t.id})</span>
                                            </SelectItem>
                                        ))}
                                        {availableTeachers.length === 0 && (
                                            <SelectItem value="none" disabled>No hay docentes registrados</SelectItem>
                                        )}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Descripción</Label>
                                <Textarea
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Descripción detallada del grupo..."
                                    className="min-h-[132px] resize-none"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="w-full h-px bg-border" />

                    {/* BOTTOM SECTION: Students */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold tracking-tight">Gestión de Estudiantes</h3>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* LIST 1: DB Source */}
                            <div className="border rounded-lg flex flex-col h-[350px] bg-muted/10">
                                <div className="p-3 border-b bg-muted/20">
                                    <Label className="text-xs font-semibold uppercase text-muted-foreground">1. Buscar en Base de Datos</Label>
                                    <Input
                                        className="mt-2 h-8 text-sm"
                                        placeholder="Filtrar por nombre..."
                                        value={memberFilter}
                                        onChange={e => setMemberFilter(e.target.value)}
                                    />
                                </div>
                                <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
                                    {filteredStudents.length === 0 && (
                                        <p className="text-xs text-muted-foreground text-center py-4">
                                            {availableStudents.length === 0 ? "No hay usuarios registrados." : "No se encontraron coincidencias."}
                                        </p>
                                    )}
                                    {filteredStudents.map(student => {
                                        const isAdded = (formData.members || []).includes(student.id);
                                        return (
                                            <div
                                                key={student.id}
                                                className={`flex justify-between items-center p-2 rounded text-sm ${isAdded ? 'opacity-50 cursor-not-allowed bg-muted' : 'hover:bg-primary/10 cursor-pointer'}`}
                                                onClick={() => !isAdded && addStudent(student.id)}
                                            >
                                                <span>{student.name}</span>
                                                <Button size="icon" variant="ghost" className="h-6 w-6" disabled={isAdded}>
                                                    <Plus className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* LIST 2: Register New Student */}
                            <div className="border rounded-lg flex flex-col h-[350px] bg-muted/10">
                                <div className="p-3 border-b bg-muted/20">
                                    <Label className="text-xs font-semibold uppercase text-muted-foreground">2. Registrar Nuevo</Label>
                                </div>
                                <div className="p-4 flex flex-col gap-4 items-center justify-center flex-1">
                                    <div className="w-full text-center space-y-2">
                                        <Users className="w-8 h-8 mx-auto text-muted-foreground/50" />
                                        <p className="text-xs text-muted-foreground">Si el estudiante no existe en el sistema, créalo aquí y se agregará automáticamente al grupo.</p>
                                    </div>
                                    <Button className="w-full" onClick={() => setShowStudentDialog(true)}>
                                        <Plus className="mr-2 h-4 w-4" /> Registrar Estudiante
                                    </Button>
                                </div>
                            </div>

                            {/* LIST 3: Selected Members */}
                            <div className="border rounded-lg flex flex-col h-[350px] bg-background shadow-sm">
                                <div className="p-3 border-b bg-primary/5">
                                    <div className="flex justify-between items-center">
                                        <Label className="text-xs font-semibold uppercase text-primary">3. Miembros del Grupo</Label>
                                        <span className="text-xs font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full">{(formData.members || []).length}</span>
                                    </div>
                                </div>
                                <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
                                    {(formData.members || []).length === 0 && (
                                        <p className="text-xs text-muted-foreground text-center py-10">
                                            No hay miembros asignados.<br />Agrega desde las listas de la izquierda.
                                        </p>
                                    )}
                                    {(formData.members || []).map((member, idx) => {
                                        const resolvedName = allUsers?.find(u => u.id === member)?.name || member;
                                        return (
                                            <div key={idx} className="flex justify-between items-center p-2 hover:bg-destructive/5 rounded group text-sm border border-transparent hover:border-destructive/20 transition-colors">
                                                <span className="font-medium">{resolvedName}</span>
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    className="h-6 w-6 text-muted-foreground group-hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                                                    onClick={() => removeStudent(member)}
                                                >
                                                    <Trash2 className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>

                    <Dialog open={showStudentDialog} onOpenChange={setShowStudentDialog}>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Nuevo Estudiante</DialogTitle>
                                <DialogDescription>
                                    Ingrese los datos del estudiante. Se creará en Supabase Auth y se agregará automáticamente al grupo.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label className="text-right">Nombre</Label>
                                    <Input
                                        className="col-span-3"
                                        value={studentForm.fullName}
                                        onChange={e => setStudentForm({ ...studentForm, fullName: e.target.value })}
                                    />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label className="text-right">Email</Label>
                                    <Input
                                        className="col-span-3"
                                        value={studentForm.email}
                                        onChange={e => setStudentForm({ ...studentForm, email: e.target.value })}
                                    />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label className="text-right">Contraseña</Label>
                                    <Input
                                        className="col-span-3"
                                        type="text"
                                        value="123456"
                                        disabled
                                    />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label className="text-right">Rol</Label>
                                    <div className="col-span-3">
                                        <Input value="Estudiante" disabled className="bg-muted" />
                                    </div>
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label className="text-right">Doc. ID</Label>
                                    <div className="col-span-3 flex gap-2">
                                        <Select
                                            value={studentForm.documentType}
                                            onValueChange={v => setStudentForm({ ...studentForm, documentType: v })}
                                        >
                                            <SelectTrigger className="w-[80px]">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="CC">CC</SelectItem>
                                                <SelectItem value="TI">TI</SelectItem>
                                                <SelectItem value="CE">CE</SelectItem>
                                                <SelectItem value="PASSPORT">Pasaporte</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <Input
                                            placeholder="Número"
                                            value={studentForm.documentNumber}
                                            onChange={e => setStudentForm({ ...studentForm, documentNumber: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button onClick={handleCreateStudent} disabled={studentSyncing}>
                                    {studentSyncing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                    {studentSyncing ? "Creando..." : "Guardar"}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                </CardContent>
                {/* Actions */}
                <div className="flex justify-end gap-3 border-t sticky bottom-0 bg-background/95 backdrop-blur py-1.5 px-6 -mx-6 z-20">
                    <Button
                        variant="outline"
                        onClick={() => {
                            window.scrollTo({ top: 0, behavior: 'instant' });
                            setIsEditing(false);
                        }}
                        className="h-8 text-xs font-semibold"
                    >
                        Cancelar
                    </Button>
                    <Button
                        onClick={async () => {
                            await handleSave();
                            window.scrollTo({ top: 0, behavior: 'instant' });
                        }}
                        className="h-8 px-6 text-xs font-bold"
                    >
                        <Save className="mr-2 h-3.5 w-3.5" /> Guardar Grupo
                    </Button>
                </div>
            </Card>
        );
    }



    // --- RENDER: LIST VIEW ---
    return (
        <div className="space-y-6 p-6 max-w-7xl mx-auto overflow-x-hidden">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Gestión de Grupos</h1>
                    <p className="text-muted-foreground">
                        Administra los grupos de estudiantes, docentes y módulos asignados.
                        <span className="ml-2 inline-flex items-center gap-1 text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                            {groups?.length || 0} grupos
                        </span>
                    </p>
                </div>
                <Button onClick={handleCreate}>
                    <Plus className="w-4 h-4 mr-2" /> Nuevo Grupo
                </Button>
            </div>

            <div className="flex items-center gap-3">
                <Select value={moduleFilter} onValueChange={setModuleFilter}>
                    <SelectTrigger className="h-9 w-[200px] text-xs">
                        <SelectValue placeholder="Filtrar por módulo" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Todos los módulos</SelectItem>
                        {modules?.map(m => (
                            <SelectItem key={m.id} value={m.id}>{m.title}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <Select value={teacherFilter} onValueChange={setTeacherFilter}>
                    <SelectTrigger className="h-9 w-[200px] text-xs">
                        <SelectValue placeholder="Filtrar por docente" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Todos los docentes</SelectItem>
                        {availableTeachers.map(t => (
                            <SelectItem key={t.id} value={t.id}>{t.name || t.email}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <Card>
                <CardContent className="p-0">
                    <Table className="table-fixed w-full">
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[25%]">Grupo</TableHead>
                                <TableHead className="w-[15%]">Docente</TableHead>
                                <TableHead className="w-[18%]">Módulo</TableHead>
                                <TableHead className="w-[10%] text-center">Estudiantes</TableHead>
                                <TableHead className="w-[10%] text-center">Documentos</TableHead>
                                <TableHead className="w-[14%]">Fechas</TableHead>
                                <TableHead className="w-[8%] text-right">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {(!filteredGroups || filteredGroups.length === 0) && (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                                        No se encontraron grupos. Crea el primero.
                                    </TableCell>
                                </TableRow>
                            )}

                            {filteredGroups?.map(group => {
                                const module = modules?.find(m => m.id === group.moduleId);
                                const moduleName = module?.title || "Sin Asignar";

                                // Count all documents attached to any section in this module
                                const allAttachedDocIds = module?.sections?.flatMap(s => s.attachedDocumentIds || []) || [];
                                const docCount = allAttachedDocIds.length;

                                return (
                                    <TableRow key={group.id} className="group cursor-pointer hover:bg-muted/50" onClick={() => handleEdit(group)}>
                                        <TableCell className="font-medium">
                                            <div>{group.name}</div>
                                            <div className="text-xs text-muted-foreground whitespace-normal break-words">{group.description}</div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="font-medium text-sm whitespace-normal break-words">
                                                {allUsers?.find(u => u.id === group.teacherId)?.name || group.teacherId}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <span className="text-sm whitespace-normal break-words">{moduleName}</span>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <div className="flex items-center justify-center gap-1">
                                                <Users className="w-3 h-3 text-muted-foreground" />
                                                <span>{(group.members || []).length}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <div className="flex items-center justify-center gap-1">
                                                <FileText className="w-3 h-3 text-muted-foreground" />
                                                <span>{docCount}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-xs">
                                            {group.startDate && (
                                                <div className="flex items-center gap-1 text-muted-foreground">
                                                    <Calendar className="w-3 h-3 shrink-0" />
                                                    <span>{formatDate(new Date(group.startDate), "d MMM", { locale: es })} - {group.endDate ? formatDate(new Date(group.endDate), "d MMM yyyy", { locale: es }) : "..."}</span>
                                                </div>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={(e) => { e.stopPropagation(); handleDelete(group.id); }}>
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
