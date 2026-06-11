"use client";

import { useState, useEffect, useRef } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db/db";
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

export function UserManager() {
    const [searchTerm, setSearchTerm] = useState("");
    const [roleFilter, setRoleFilter] = useState<UserRole | "all">("all");
    const [isEditing, setIsEditing] = useState(false);
    const [syncing, setSyncing] = useState(false);

    const [formData, setFormData] = useState<Partial<UserProfile> & { password?: string }>({
        email: "",
        fullName: "",
        role: "student",
        documentType: "CC",
        documentNumber: "",
        password: "",
    });

    const [bulkText, setBulkText] = useState("");
    const [bulkPreview, setBulkPreview] = useState<any[]>([]);
    const [defaultPassword, setDefaultPassword] = useState("123456");
    const [bulkSyncing, setBulkSyncing] = useState(false);

    const users = useLiveQuery(() => db.users.toArray());
    const deduped = useRef(false);

    useEffect(() => {
        if (!users || users.length === 0 || deduped.current) return;
        const seen = new Map<string, number>();
        const toDelete: number[] = [];
        for (const u of users) {
            if (!u.userId) continue;
            const prev = seen.get(u.userId);
            if (prev !== undefined) {
                toDelete.push(prev);
                seen.set(u.userId, u.id!);
            } else {
                seen.set(u.userId, u.id!);
            }
        }
        if (toDelete.length > 0) {
            deduped.current = true;
            db.users.bulkDelete(toDelete as any);
        }
    }, [users]);

    const filteredUsers = users?.filter(u => {
        const matchesSearch = u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            u.userId.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesRole = roleFilter === "all" || u.role === roleFilter;
        return matchesSearch && matchesRole;
    });

    const generateDeterministicId = (email: string, role: string) => {
        const lower = email.toLowerCase();
        const prefix = lower.split('@')[0].replace(/[^a-z0-9]/g, '');
        if (lower === 'admin@test.com') return 'admin-1';
        return `${role}-${prefix}`;
    };

    const syncToSupabase = async (usersList: { email: string; password: string; fullName: string; role: string; documentType?: string; documentNumber?: string }[]) => {
        const res = await fetch('/api/admin/users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ users: usersList }),
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
        if (!formData.id && !formData.password) {
            toast.error("Debe ingresar una contraseña para el nuevo usuario");
            return;
        }

        const role = formData.role || 'student';
        setSyncing(true);

        try {
            let authId: string | undefined

            if (!formData.id && formData.password) {
                const results = await syncToSupabase([{
                    email,
                    password: formData.password,
                    fullName: formData.fullName,
                    role,
                    documentType: formData.documentType,
                    documentNumber: formData.documentNumber,
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
            }

            const userId = authId || formData.id || generateDeterministicId(email, role)
            const existing = await db.users.where('userId').equals(userId).first();
            if (existing?.id) {
                await db.users.update(existing.id, {
                    userId,
                    email,
                    name: formData.fullName,
                    role: role as UserRole,
                    documentType: formData.documentType as any,
                    documentNumber: formData.documentNumber
                });
            } else {
                await db.users.add({
                    userId,
                    email,
                    name: formData.fullName,
                    role: role as UserRole,
                    documentType: formData.documentType as any,
                    documentNumber: formData.documentNumber,
                    createdAt: new Date().toISOString()
                });
            }

            toast.success("Usuario guardado correctamente");
            setIsEditing(false);
            setFormData({ email: '', fullName: '', role: 'student', documentType: 'CC', documentNumber: '', password: '' });
        } catch (error: any) {
            console.error(error);
            toast.error(error.message || "Error al guardar usuario");
        } finally {
            setSyncing(false);
        }
    };

    const handleEdit = (user: any) => {
        setFormData({
            id: user.userId,
            email: user.email,
            fullName: user.name,
            role: user.role,
            documentType: user.documentType || "CC",
            documentNumber: user.documentNumber || '',
            createdAt: user.createdAt,
            password: '',
        });
        setIsEditing(true);
    };

    const handleDelete = async (userId: string) => {
        if (confirm(`¿Eliminar usuario ${userId}? Solo se eliminará localmente (IndexedDB).`)) {
            const user = await db.users.where({ userId }).first();
            if (user && user.id) {
                await db.users.delete(user.id);
                toast.success("Usuario eliminado localmente");
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
                    const existing = await db.users.where('userId').equals(userId).first();
                    if (existing) {
                        await db.users.update(existing.id!, {
                            userId,
                            name: item.fullName,
                            role: item.role,
                            documentType: item.docType,
                            documentNumber: item.docNum
                        });
                        updated++;
                    } else {
                        await db.users.add({
                            userId,
                            email: item.email,
                            name: item.fullName,
                            role: item.role,
                            documentType: item.docType,
                            documentNumber: item.docNum,
                            createdAt: new Date().toISOString()
                        });
                        added++;
                    }
                } catch (e) {
                    console.error(e);
                    errors++;
                }
            }

            toast.success(`Importación completada: ${added} nuevos, ${updated} actualizados. Auth sincronizado.`);
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
                    <p className="text-muted-foreground">Administre docentes y estudiantes, o realice cargas masivas.</p>
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
                            <div className="flex items-center gap-2">
                                <div className="relative">
                                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Buscar por nombre, email o ID..."
                                        className="pl-8 w-[300px]"
                                        value={searchTerm}
                                        onChange={e => setSearchTerm(e.target.value)}
                                    />
                                </div>
                                <Select value={roleFilter} onValueChange={(v) => setRoleFilter(v as any)}>
                                    <SelectTrigger className="w-[180px]">
                                        <SelectValue placeholder="Filtrar por Rol" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Todos los Roles</SelectItem>
                                        <SelectItem value="student">Estudiantes</SelectItem>
                                        <SelectItem value="teacher">Docentes</SelectItem>
                                        <SelectItem value="admin">Administradores</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <Button onClick={() => {
                                setFormData({ email: '', fullName: '', role: 'student', documentType: 'CC', documentNumber: '', password: '' });
                                setIsEditing(true);
                            }}>
                                <Plus className="mr-2 h-4 w-4" /> Nuevo Usuario
                            </Button>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Nombre</TableHead>
                                        <TableHead>Email / Rol</TableHead>
                                        <TableHead>Identificación</TableHead>
                                        <TableHead>ID Sistema</TableHead>
                                        <TableHead className="text-right">Acciones</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredUsers?.map(user => (
                                        <TableRow key={user.userId} className="cursor-pointer hover:bg-muted/50" onClick={() => handleEdit(user)}>
                                            <TableCell className="font-medium">{user.name}</TableCell>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span>{user.email}</span>
                                                    <span className="text-xs text-muted-foreground capitalize">{user.role}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>{user.documentType} {user.documentNumber}</TableCell>
                                            <TableCell className="font-mono text-xs">{user.userId}</TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10" onClick={(e) => { e.stopPropagation(); handleDelete(user.userId); }}>
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
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
                                {!formData.id && (
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <Label className="text-right">Contraseña</Label>
                                        <Input
                                            className="col-span-3"
                                            type="password"
                                            value={formData.password || ''}
                                            onChange={e => setFormData({ ...formData, password: e.target.value })}
                                            placeholder="Mínimo 6 caracteres"
                                        />
                                    </div>
                                )}
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
                                Copie y pegue datos desde Excel. Todos los usuarios se crearán en Supabase Auth con la contraseña por defecto.<br />
                                Formato: <strong>Nombre Completo | Email | Tipo Doc (Opc.) | Num Doc (Opc.) | Rol (Opc.)</strong>
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center gap-4">
                                <Label className="shrink-0">Contraseña por defecto:</Label>
                                <Input
                                    className="w-[200px]"
                                    type="password"
                                    value={defaultPassword}
                                    onChange={e => setDefaultPassword(e.target.value)}
                                    placeholder="123456"
                                />
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
