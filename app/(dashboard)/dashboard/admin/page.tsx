

"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { FileText, Users, BookOpen, Clock, Activity, Archive, Database, List } from "lucide-react";
import { useAppText } from "@/hooks/useAppText";
import { useGroups, useModules, useTemplates, useUsers, useCatalogs } from "@/hooks/useData";

export default function AdminDashboard() {
    const { data: groups } = useGroups();
    const { data: modules } = useModules();
    const { data: templates } = useTemplates();
    const { data: users } = useUsers();
    const { data: catalogs } = useCatalogs();
    const { t } = useAppText();
    // Calculate Stats
    const now = new Date();

    // 1. Groups Status
    const activeGroups = groups?.filter(g => {
        const start = new Date(g.startDate);
        const end = new Date(g.endDate);
        // Set end date to end of day
        end.setHours(23, 59, 59, 999);
        return now >= start && now <= end;
    }) || [];

    const inactiveGroups = groups?.filter(g => {
        const end = new Date(g.endDate);
        end.setHours(23, 59, 59, 999);
        return now > end;
    }) || [];

    // 2. User Stats (Derived from Groups)
    // Active Students: Sum of members in active groups
    const activeStudents = activeGroups.reduce((acc, g) => acc + (g.members || []).length, 0);

    // Inactive Students: Sum of members in inactive groups (Approximation)
    const inactiveStudents = inactiveGroups.reduce((acc, g) => acc + (g.members || []).length, 0);

    // Active Teachers: Unique teacher IDs in active groups
    const activeTeachers = new Set(activeGroups.map(g => g.teacherId)).size;

    // Inactive Teachers (only counted if not active anywhere else)
    const activeTeacherIds = new Set(activeGroups.map(g => g.teacherId));
    const allTeacherIds = new Set(groups?.map(g => g.teacherId));
    const inactiveTeachers = [...allTeacherIds].filter(id => !activeTeacherIds.has(id)).length;

    const totalActiveUsers = activeStudents + activeTeachers;
    const totalInactiveUsers = inactiveStudents + inactiveTeachers;

    // User counts from actual user records
    const totalUsers = users?.length || 0;
    const totalStudents = users?.filter(u => u.role === 'student').length || 0;
    const totalTeachers = users?.filter(u => u.role === 'teacher').length || 0;
    const totalAdmins = users?.filter(u => u.role === 'admin').length || 0;


    // 3. Module Stats
    const totalModules = modules?.length || 0;
    // Active Modules: Assigned to at least one active group
    const activeModuleIds = new Set(activeGroups.map(g => g.moduleId).filter(Boolean));
    const activeModules = activeModuleIds.size;


    // 5. Document Stats
    // Active Docs: Templates belonging to Active Modules AND Status is Published
    const activeDocs = templates?.filter(t =>
        t.status === 'published' && activeModuleIds.has(t.moduleId)
    ).length || 0;

    const draftDocs = templates?.filter(t => t.status !== 'published').length || 0;
    const totalDocs = templates?.length || 0;

    // 6. Catalog Stats
    const totalCatalogs = catalogs?.length || 0;
    const totalCatalogItems = catalogs?.reduce((acc, c) => acc + (c.items?.length || 0), 0) || 0;
    const simpleCatalogs = catalogs?.filter(c => c.type === 'simple').length || 0;
    const twoColumnCatalogs = catalogs?.filter(c => c.type === 'two_column').length || 0;


    return (
        <div className="space-y-6 p-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">{t('admin.dashboard.title', 'Panel de Administrador')}</h1>
                    <p className="text-muted-foreground">{t('admin.dashboard.subtitle', 'Resumen de actividad en tiempo real.')}</p>
                </div>
                <div className="flex gap-2">
                    <Link href="/dashboard/admin/builder">
                        <Button>
                            <FileText className="w-4 h-4 mr-2" /> {t('admin.dashboard.btn_builder', 'Diseñador de Documentos')}
                        </Button>
                    </Link>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">

                {/* USERS STATS */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{t('admin.dashboard.card_users_title', 'Usuarios')}</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalUsers}</div>
                        <div className="flex gap-4 text-xs text-muted-foreground mb-3">
                            <span>{totalStudents} Estudiantes</span>
                            <span>{totalTeachers} Docentes</span>
                            <span>{totalAdmins} Admins</span>
                        </div>
                        <div className="border-t pt-3">
                            <div className="flex items-baseline justify-between text-xs">
                                <span className="text-muted-foreground">En grupos activos:</span>
                                <span className="font-medium">{totalActiveUsers}</span>
                            </div>
                            <div className="flex items-baseline justify-between text-xs">
                                <span className="text-muted-foreground">En grupos inactivos:</span>
                                <span className="font-medium">{totalInactiveUsers}</span>
                            </div>
                        </div>
                        <div className="mt-4 space-y-2">
                            <div className="flex justify-between text-xs">
                                <span className="text-muted-foreground">Estudiantes en grupos activos</span>
                                <span className="font-medium">{activeStudents}</span>
                            </div>
                            <div className="w-full bg-secondary h-1.5 rounded-full overflow-hidden">
                                <div className="bg-primary h-full rounded-full" style={{ width: `${(activeStudents / (activeStudents + activeTeachers || 1)) * 100}%` }} />
                            </div>
                            <div className="flex justify-between text-xs pt-1">
                                <span className="text-muted-foreground">Docentes en grupos activos</span>
                                <span className="font-medium">{activeTeachers}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* DOCUMENTS STATS */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{t('admin.dashboard.card_docs_title', 'Documentos / Guías')}</CardTitle>
                        <FileText className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalDocs} <span className="text-sm font-normal text-muted-foreground">{t('admin.dashboard.card_docs_total', 'Total Creados')}</span></div>
                        <p className="text-xs text-muted-foreground mb-4">{t('admin.dashboard.card_docs_desc', 'Plantillas disponibles en el sistema.')}</p>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="flex flex-col border rounded p-2 bg-muted/20">
                                <span className="text-[10px] text-muted-foreground uppercase font-semibold">En Uso (Activos)</span>
                                <div className="flex items-center gap-2 mt-1">
                                    <Activity className="w-4 h-4 text-green-500" />
                                    <span className="text-lg font-bold">{activeDocs}</span>
                                </div>
                            </div>
                            <div className="flex flex-col border rounded p-2 bg-muted/20">
                                <span className="text-[10px] text-muted-foreground uppercase font-semibold">Borradores</span>
                                <div className="flex items-center gap-2 mt-1">
                                    <FileText className="w-4 h-4 text-orange-500" />
                                    <span className="text-lg font-bold">{draftDocs}</span>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* MODULES STATS */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{t('admin.dashboard.card_modules_title', 'Módulos Educativos')}</CardTitle>
                        <BookOpen className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalModules} <span className="text-sm font-normal text-muted-foreground">Total</span></div>

                        <div className="mt-4 flex items-center space-x-4">
                            <div className="flex-1">
                                <div className="flex justify-between text-xs mb-1">
                                    <span>Activos (Con Grupo)</span>
                                    <span className="font-bold">{activeModules}</span>
                                </div>
                                <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                                    <div className="bg-blue-500 h-full rounded-full" style={{ width: `${(activeModules / (totalModules || 1)) * 100}%` }} />
                                </div>
                            </div>
                        </div>
                        <p className="text-xs text-muted-foreground mt-4">
                            {activeGroups.length} grupos cursando módulos actualmente.
                        </p>
                    </CardContent>
                </Card>

                {/* GROUPS STATS */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{t('admin.dashboard.card_groups_title', 'Grupos de Estudiantes')}</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-baseline justify-between mb-4">
                            <div className="text-2xl font-bold">{groups?.length || 0} <span className="text-sm font-normal text-muted-foreground">Total</span></div>
                            <div className="flex gap-2 text-xs">
                                <span className="flex items-center text-green-600 font-medium"><Clock className="w-3 h-3 mr-1" /> {activeGroups.length} Activos</span>
                                <span className="flex items-center text-muted-foreground"><Archive className="w-3 h-3 mr-1" /> {inactiveGroups.length} Cerrados</span>
                            </div>
                        </div>

                        <div className="space-y-2 max-h-[100px] overflow-y-auto pr-2 custom-scrollbar">
                            <p className="text-[10px] text-muted-foreground font-semibold uppercase mb-1">Por Módulo</p>
                            {modules?.map(m => {
                                const count = groups?.filter(g => g.moduleId === m.id).length || 0;
                                if (count === 0) return null;
                                return (
                                    <div key={m.id} className="flex justify-between items-center text-xs">
                                        <span className="truncate w-2/3" title={m.title}>{m.title}</span>
                                        <div className="flex items-center gap-1">
                                            <span className="font-medium bg-secondary px-1.5 rounded">{count}</span>
                                        </div>
                                    </div>
                                );
                            })}
                            {(!modules || modules.length === 0) && <p className="text-xs text-muted-foreground italic">No hay datos</p>}
                        </div>
                    </CardContent>
                </Card>

                {/* CATALOGS STATS */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Catálogos / Listas</CardTitle>
                        <Database className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalCatalogs}</div>
                        <p className="text-xs text-muted-foreground mb-3">Catálogos disponibles</p>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="flex flex-col border rounded p-2 bg-muted/20">
                                <span className="text-[10px] text-muted-foreground uppercase font-semibold">Simples</span>
                                <div className="flex items-center gap-2 mt-1">
                                    <List className="w-4 h-4 text-blue-500" />
                                    <span className="text-lg font-bold">{simpleCatalogs}</span>
                                </div>
                            </div>
                            <div className="flex flex-col border rounded p-2 bg-muted/20">
                                <span className="text-[10px] text-muted-foreground uppercase font-semibold">Dos Columnas</span>
                                <div className="flex items-center gap-2 mt-1">
                                    <Database className="w-4 h-4 text-purple-500" />
                                    <span className="text-lg font-bold">{twoColumnCatalogs}</span>
                                </div>
                            </div>
                        </div>
                        <p className="text-xs text-muted-foreground mt-3">
                            {totalCatalogItems} ítems en total
                        </p>
                    </CardContent>
                </Card>

            </div>

            {/* QUICK ACTIONS / ALERTS could go here */}
        </div>
    );
}

