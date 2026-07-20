"use client";

import { useState, useEffect, useMemo } from "react";
import { useUsers, useGroups, useModules } from "@/hooks/useData";
import { dataService } from "@/lib/services/dataService";
import { useQueryClient } from "@tanstack/react-query";
import { UserProfile, UserRole } from "@/types/roles";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Trash2, Save, Search, Upload, FileSpreadsheet, CheckCircle, AlertCircle, Loader2, Cloud, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/useAuth";

export function UserManager() {
    const { user: currentUser } = useAuth();
    const isAdmin = currentUser?.role === 'admin';

    const [searchTerm, setSearchTerm] = useState("");
    const [roleFilter, setRoleFilter] = useState<UserRole | "all">("all");
    const [moduleUserFilter, setModuleUserFilter] = useState("all");

    const [isEditing, setIsEditing] = useState(false);
    const [syncing, setSyncing] = useState(false);

    const [formData, setFormData] = useState<Partial<UserProfile> & { password?: string; canCreateUsers?: boolean }>({
        email: "",
        fullName: "",
        role: "student",
        documentType: "CC",
        documentNumber: "",
        password: "",
        canCreateUsers: false,
    });

    const [bulkText, setBulkText] = useState("");
    const [bulkPreview, setBulkPreview] = useState<any[]>([]);
    const defaultPassword = "123456";
    const [bulkSyncing, setBulkSyncing] = useState(false);

    const { data: users } = useUsers() as { data: any[] };
    const { data: groups } = useGroups();
    const { data: modules } = useModules();
    const queryClient = useQueryClient();

    const moduleMap = useMemo(() => {
        const map: Record<string, string> = {};
        modules?.forEach((m: any) => { map[m.id] = m.title; });
        return map;
    }, [modules]);

    const filteredUsers = users?.filter(u => {
        const userGroups = groups?.filter((g: any) => (g.members || []).includes(u.id)) || [];
        const userModuleIds = [...new Set(userGroups.map((g: any) => g.moduleId).filter(Boolean))];
        const groupModuleStr = userGroups.map((g: any) => {
            const modName = moduleMap[g.moduleId] || '';
            return `${g.name} ${modName}`;
        }).join(' ').toLowerCase();
        const q = searchTerm.toLowerCase();
        const matchesSearch = (u.name || '').toLowerCase().includes(q) ||
            (u.email || '').toLowerCase().includes(q) ||
            (u.id || '').toLowerCase().includes(q) ||
            groupModuleStr.includes(q);
        const matchesRole = roleFilter === "all" || u.role === roleFilter;
        const matchesModule = moduleUserFilter === "all" || userModuleIds.includes(moduleUserFilter);
        return matchesSearch && matchesRole && matchesModule;
    });

    const generateDeterministicId = (email: string, role: string) => {
        const lower = email.toLowerCase();
        const prefix = lower.split('@')[0].replace(/[^a-z0-9]/g, '');
        if (lower === 'admin@test.com') return 'admin-1';
        return `${role}-${prefix}`;
    };

    const syncToSupabase = async (usersList: { id?: string; email: string; password?: string; fullName: string; role: string; documentType?: string; documentNumber?: string; canCreateUsers?: boolean }[]) => {
        const cached = JSON.parse(localStorage.getItem('cached_user_profile') || '{}');
        const res = await fetch('/api/admin/users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ users: usersList, callerUserId: cached.id }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Error de conexión')
        return data.results as { email: string; success: boolean; error?: string; id?: string }[]
    }

    const handleSave = async () => {
        const email = (formData.email || '').trim().toLowerCase()
        if (!email || !formData.fullName) {
            toast.error("Nombre y Email son obligatorios");
            return;
        }
        if (formData.id && !isAdmin) {
            toast.error("Los docentes no pueden modificar usuarios.");
            return;
        }

        const role = formData.role || 'student';
        setSyncing(true);

        try {
            let authId: string | undefined

            // Always call syncToSupabase to ensure cloud state is updated
            const results = await syncToSupabase([{
                id: formData.id,
                email,
                password: formData.id ? (formData.password || undefined) : defaultPassword,
                fullName: formData.fullName,
                role,
                documentType: formData.documentType,
                documentNumber: formData.documentNumber,
                canCreateUsers: role === 'teacher' ? (formData.canCreateUsers || false) : false,
            }])

            const result = results[0]
            if (!result.success && result.error?.includes('ya existe')) {
                toast.warning(`${email}: ${result.error}. Se guardará solo localmente.`)
            } else if (!result.success) {
                toast.error(`Error en Auth: ${result.error}`)
                setSyncing(false)
                return
            } else if (result.id) {
                authId = result.id
            }

            queryClient.invalidateQueries({ queryKey: ['profiles'] });

            toast.success("Usuario guardado correctamente");
            setIsEditing(false);
            setFormData({ email: '', fullName: '', role: 'student', documentType: 'CC', documentNumber: '', canCreateUsers: false });
        } catch (error: any) {
            console.error(error);
            toast.error(error.message || "Error al guardar usuario");
        } finally {
            setSyncing(false);
        }
    };

    const handleEdit = (user: any) => {
        if (!isAdmin) return; // Prevent edits in UI for teachers
        setFormData({
            id: user.id,
            email: user.email,
            fullName: user.name,
            role: user.role,
            documentType: user.documentType || "CC",
            documentNumber: user.documentNumber || '',
            createdAt: user.createdAt,
            canCreateUsers: user.canCreateUsers || false,
            password: '',
        });
        setIsEditing(true);
    };

    const handleDelete = async (id: string) => {
        if (!isAdmin) {
            toast.error("No autorizado para eliminar usuarios");
            return;
        }
        if (confirm(`¿Eliminar usuario ${id}?`)) {
            try {
                await dataService.delete('profiles', id);
                queryClient.invalidateQueries({ queryKey: ['profiles'] });
                toast.success("Usuario eliminado");
            } catch {
                toast.error("Error al eliminar usuario");
            }
        }
    };

    const parseBulkData = () => {
        if (!bulkText.trim()) return;
        const lines = bulkText.trim().split('\n');
        const validRoles = ['student', 'teacher', 'admin'];
        const parsed = lines.map(line => {
            const cols = line.split(/[\t,;]/);
            if (cols.length < 2) return null;

            const fullName = cols[0]?.trim();
            const email = cols[1]?.trim().toLowerCase();
            const docType = cols[2]?.trim().toUpperCase() || "CC";
            const docNum = cols[3]?.trim() || "";
            const rawRole = cols[4]?.trim().toLowerCase() || "";
            const role = validRoles.includes(rawRole) ? rawRole : "student";

            if (!email || !fullName) return null;

            return {
                fullName,
                email,
                docType,
                docNum,
                role,
                generatedId: generateDeterministicId(email, role)
            };
        }).filter(Boolean);

        setBulkPreview(parsed);
    };

    const handleBulkImport = async () => {
        if (bulkPreview.length === 0) return;
        setBulkSyncing(true);

        let added = 0;
        let updated = 0;
        let errors = 0;

        try {
            const payload = bulkPreview.map(item => ({
                email: item.email,
                password: defaultPassword,
                fullName: item.fullName,
                role: item.role,
                documentType: item.docType,
                documentNumber: item.docNum,
            }))

            const results = await syncToSupabase(payload)
            const authIds = new Map(results.filter(r => r.success && r.id).map(r => [r.email, r.id!]))
            const failed = results.filter(r => !r.success)

            if (failed.length > 0) {
                const msgs = failed.map(f => `${f.email}: ${f.error}`).join('\n')
                toast.warning(`${failed.length} usuario(s) no se crearon en Auth:\n${msgs}`)
            }

            for (const item of bulkPreview) {
                try {
                    const userId = authIds.get(item.email) || item.generatedId
                    await dataService.save('profiles', {
                        userId,
                        email: item.email,
                        name: item.fullName,
                        role: item.role,
                        documentType: item.docType,
                        documentNumber: item.docNum,
                        createdAt: new Date().toISOString()
                    });
                    added++;
                } catch (e) {
                    console.error(e);
                    errors++;
                }
            }

            queryClient.invalidateQueries({ queryKey: ['profiles'] });
            toast.success(`Importación completada: ${added} sincronizados. Auth sincronizado.`);
            if (errors > 0) toast.warning(`${errors} errores locales.`);

            setBulkText("");
            setBulkPreview([]);
            setBulkSyncing(false);
        } catch (error: any) {
            toast.error(`Error de conexión con Auth: ${error.message}`)
            setBulkSyncing(false)
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Gestión de Usuarios</h2>
                    <p className="text-muted-foreground">
                        Administre docentes y estudiantes, o realice cargas masivas.
                        <span className="ml-2 inline-flex items-center gap-1 text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                            {users?.length || 0} usuarios
                        </span>
                        <span className="ml-1 text-xs text-muted-foreground">
                            ({users?.filter(u => u.role === 'student').length || 0} est. · {users?.filter(u => u.role === 'teacher').length || 0} doc. · {users?.filter(u => u.role === 'admin').length || 0} adm.)
                        </span>
                    </p>
                </div>
            </div>

            <Tabs defaultValue="list" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="list">Listado de Usuarios</TabsTrigger>
                    <TabsTrigger value="import">Carga Masiva</TabsTrigger>
                </TabsList>

                <TabsContent value="list" className="space-y-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <div className="flex items-center gap-2 flex-wrap">
                                <div className="relative">
                                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Buscar por nombre, email o ID..."
                                        className="pl-8 w-[220px]"
                                        value={searchTerm}
                                        onChange={e => setSearchTerm(e.target.value)}
                                    />
                                </div>
                                <Select value={roleFilter} onValueChange={(v) => setRoleFilter(v as any)}>
                                    <SelectTrigger className="w-[150px]">
                                        <SelectValue placeholder="Filtrar por Rol" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Todos los Roles</SelectItem>
                                        <SelectItem value="student">Estudiantes</SelectItem>
                                        <SelectItem value="teacher">Docentes</SelectItem>
                                        <SelectItem value="admin">Administradores</SelectItem>
                                    </SelectContent>
                                </Select>
                                <Select value={moduleUserFilter} onValueChange={setModuleUserFilter}>
                                    <SelectTrigger className="w-[180px]">
                                        <SelectValue placeholder="Módulo" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Todos los módulos</SelectItem>
                                        {modules?.map(m => (
                                            <SelectItem key={m.id} value={m.id}>{m.title}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <Button onClick={() => {
                                setFormData({ email: '', fullName: '', role: 'student', documentType: 'CC', documentNumber: '' });
                                setIsEditing(true);
                            }}>
                                <Plus className="mr-2 h-4 w-4" /> Nuevo Usuario
                            </Button>
                        </CardHeader>
                        <CardContent className="overflow-x-hidden">
                            <Table className="w-full table-fixed">
                                  <TableHeader>
                                      <TableRow>
                                          <TableHead className="w-[30%] min-w-[160px]">Nombre / ID</TableHead>
                                          <TableHead className="w-[25%] min-w-[140px]">Email / Rol</TableHead>
                                          <TableHead className="w-[25%] min-w-[150px]">Grupo / Módulo</TableHead>
                                          <TableHead className="w-[10%]">ID</TableHead>
                                          {isAdmin && <TableHead className="w-[10%] text-right">Acciones</TableHead>}
                                      </TableRow>
                                  </TableHeader>
                                 <TableBody>
                                      {filteredUsers?.map(user => {
                                          const userGroups = groups?.filter((g: any) => (g.members || []).includes(user.id)) || [];
                                          return (
                                          <TableRow key={user.id} className={`cursor-pointer hover:bg-muted/50 ${!isAdmin ? 'cursor-default' : ''}`} onClick={() => isAdmin && handleEdit(user)}>
                                              <TableCell className="font-medium">
                                                  <span className="truncate block max-w-[200px]" title={user.name}>{user.name}</span>
                                                  {user.documentNumber ? <span className="text-xs text-muted-foreground block truncate max-w-[200px]">{user.documentType} {user.documentNumber}</span> : null}
                                              </TableCell>
                                              <TableCell>
                                                  <div className="flex flex-col">
                                                      <span className="truncate max-w-[180px]" title={user.email}>{user.email}</span>
                                                      <span className="text-xs text-muted-foreground capitalize">{user.role}</span>
                                                  </div>
                                              </TableCell>
                                              <TableCell>
                                                  {userGroups.length > 0
                                                      ? userGroups.map((g: any) => (
                                                          <div key={g.id} className="text-xs leading-tight">
                                                              <div className="font-medium truncate max-w-[200px]" title={g.name}>{g.name}</div>
                                                              {g.moduleId && moduleMap[g.moduleId] && <div className="text-muted-foreground truncate max-w-[200px]" title={moduleMap[g.moduleId]}>{moduleMap[g.moduleId]}</div>}
                                                          </div>
                                                        ))
                                                      : <span className="text-xs text-muted-foreground">—</span>}
                                              </TableCell>
                                              <TableCell className="font-mono text-[10px] max-w-[90px] truncate" title={user.id}>{user.id}</TableCell>
                                              {isAdmin && (
                                                  <TableCell className="text-right">
                                                      <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10" onClick={(e) => { e.stopPropagation(); handleDelete(user.id); }}>
                                                          <Trash2 className="h-4 w-4" />
                                                      </Button>
                                                  </TableCell>
                                              )}
                                          </TableRow>
                                      )})}
                                    {(!filteredUsers || filteredUsers.length === 0) && (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                                No se encontraron usuarios.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>

                    <Dialog open={isEditing} onOpenChange={setIsEditing}>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>{formData.id ? "Editar Usuario" : "Nuevo Usuario"}</DialogTitle>
                                <DialogDescription>
                                    {formData.id
                                        ? "Edite los datos del usuario. No se puede cambiar el email."
                                        : "Ingrese los datos. La contraseña se creará en Supabase Auth automáticamente."}
                                </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label className="text-right">Nombre</Label>
                                    <Input
                                        className="col-span-3"
                                        value={formData.fullName}
                                        onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                                    />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label className="text-right">Email</Label>
                                    <Input
                                        className="col-span-3"
                                        value={formData.email}
                                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                                        disabled={!!formData.id}
                                    />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label className="text-right">Contraseña</Label>
                                    {formData.id ? (
                                        <Input
                                            className="col-span-3"
                                            type="password"
                                            placeholder="Dejar vacío para no cambiar"
                                            value={formData.password || ''}
                                            onChange={e => setFormData({ ...formData, password: e.target.value })}
                                        />
                                    ) : (
                                        <Input
                                            className="col-span-3"
                                            type="text"
                                            value="123456"
                                            disabled
                                        />
                                    )}
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label className="text-right">Rol</Label>
                                    <Select
                                        value={formData.role}
                                        onValueChange={v => setFormData({ ...formData, role: v as any })}
                                    >
                                        <SelectTrigger className="col-span-3">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="student">Estudiante</SelectItem>
                                            <SelectItem value="teacher">Docente</SelectItem>
                                            <SelectItem value="admin">Administrador</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label className="text-right">Doc. ID</Label>
                                    <div className="col-span-3 flex gap-2">
                                        <Select
                                            value={formData.documentType}
                                            onValueChange={v => setFormData({ ...formData, documentType: v as any })}
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
                                            value={formData.documentNumber}
                                            onChange={e => setFormData({ ...formData, documentNumber: e.target.value })}
                                        />
                                    </div>
                                </div>
                                {isAdmin && formData.role === 'teacher' && (
                                     <div className="grid grid-cols-4 items-center gap-4">
                                         <Label className="text-right">Permisos</Label>
                                         <div className="col-span-3 flex items-center space-x-2">
                                             <input
                                                 type="checkbox"
                                                 id="canCreateUsers"
                                                 checked={formData.canCreateUsers || false}
                                                 onChange={e => setFormData({ ...formData, canCreateUsers: e.target.checked })}
                                                 className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                             />
                                             <label htmlFor="canCreateUsers" className="text-sm text-muted-foreground select-none">
                                                 Permitir a este docente ingresar/registrar usuarios
                                             </label>
                                         </div>
                                     </div>
                                 )}
                            </div>
                            <DialogFooter>
                                <Button onClick={handleSave} disabled={syncing}>
                                    {syncing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                    {syncing ? "Sincronizando..." : "Guardar"}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </TabsContent>

                <TabsContent value="import">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <FileSpreadsheet className="w-5 h-5 text-green-600" />
                                Importación Masiva
                            </CardTitle>
                            <CardDescription>
                                Copie y pegue datos desde Excel. Todos los usuarios se crearán en Supabase Auth.<br />
                                Formato: <strong>Nombre Completo | Email | Tipo Doc (Opc.) | Num Doc (Opc.) | Rol (Opc.)</strong>
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="bg-amber-50 text-amber-800 p-4 rounded-md flex gap-2 text-sm border border-amber-200">
                                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                                <div>
                                    <p className="font-semibold">Contraseña por defecto: <span className="font-mono">123456</span></p>
                                    <p>Los usuarios deberán cambiar su contraseña al iniciar sesión por primera vez. Una vez cambiada, este mensaje no volverá a mostrarse.</p>
                                </div>
                            </div>

                            <Textarea
                                placeholder={"Ejemplo:\nJuan Perez\tjuan@email.com\tCC\t12345678\tstudent\nMaria Gomez\tmaria@email.com\tTI\t87654321\tteacher"}
                                className="min-h-[200px] font-mono text-sm"
                                value={bulkText}
                                onChange={e => {
                                    setBulkText(e.target.value);
                                    if (bulkPreview.length > 0) setBulkPreview([]);
                                }}
                            />

                            <div className="flex gap-2">
                                <Button onClick={parseBulkData} variant="secondary">
                                    <CheckCircle className="mr-2 h-4 w-4" />
                                    Previsualizar
                                </Button>
                                <Button onClick={handleBulkImport} disabled={bulkPreview.length === 0 || bulkSyncing}>
                                    {bulkSyncing ? (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    ) : (
                                        <Cloud className="mr-2 h-4 w-4" />
                                    )}
                                    {bulkSyncing ? "Sincronizando..." : `Importar (${bulkPreview.length})`}
                                </Button>
                            </div>

                            {bulkPreview.length > 0 && (
                                <div className="border rounded-md overflow-hidden">
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="bg-muted/50">
                                                <TableHead>Nombre</TableHead>
                                                <TableHead>Email</TableHead>
                                                <TableHead>Documento</TableHead>
                                                <TableHead>Rol</TableHead>
                                                <TableHead>ID Generado</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {bulkPreview.slice(0, 10).map((row, i) => (
                                                <TableRow key={i}>
                                                    <TableCell>{row.fullName}</TableCell>
                                                    <TableCell>{row.email}</TableCell>
                                                    <TableCell>{row.docType} {row.docNum}</TableCell>
                                                    <TableCell className="capitalize">{row.role}</TableCell>
                                                    <TableCell className="font-mono text-xs text-muted-foreground">{row.generatedId}</TableCell>
                                                </TableRow>
                                            ))}
                                            {bulkPreview.length > 10 && (
                                                <TableRow>
                                                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                                                        ... y {bulkPreview.length - 10} más ...
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            )}

                            <div className="bg-blue-50 text-blue-800 p-4 rounded-md flex gap-2 text-sm border-blue-100 border">
                                <AlertCircle className="w-5 h-5 shrink-0" />
                                <div>
                                    <p className="font-bold">¿Cómo funciona?</p>
                                    <p>Los usuarios se crean primero en Supabase Auth con la contraseña por defecto, y luego se guardan localmente con su rol. Si ya existen en Auth, se omiten y solo se guardan localmente.</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
