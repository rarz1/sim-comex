"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db/db";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useAppText } from "@/hooks/useAppText";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, FileText, Calendar, BookOpen } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

export default function TeacherGroupsPage() {
    const { user } = useAuth();

    // Fetch My Groups
    const allGroups = useLiveQuery(() => db.groups.toArray());
    const teachers = useLiveQuery(() => db.users.where('role').equals('teacher').toArray());
    const { t } = useAppText();

    // Find my userId from the database (matching by email or id from auth)
    const myDbUser = teachers?.find(u =>
        u.userId === user?.id ||
        u.email === user?.email ||
        u.name === user?.fullName
    );

    const myGroups = allGroups?.filter(g =>
        g.teacherId === myDbUser?.userId ||
        g.teacherId === user?.id ||
        g.teacherId === user?.fullName ||
        g.teacherId === user?.email
    ) || [];

    // Fetch Modules and Templates
    const modules = useLiveQuery(() => db.modules.toArray());

    const getModuleName = (id?: string) => {
        return modules?.find(m => m.id === id)?.title || t('teacher.groups.no_module', 'Sin Módulo');
    };

    const formatDate = (dateStr: string) => {
        try { return format(new Date(dateStr), "dd MMM yyyy", { locale: es }); }
        catch { return dateStr; }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">{t('teacher.groups.title', 'Mis Grupos')}</h1>
                    <p className="text-muted-foreground">{t('teacher.groups.subtitle', 'Gestiona y revisa el progreso de tus estudiantes.')}</p>
                </div>
            </div>

            {myGroups.length === 0 ? (
                <div className="text-center py-20 border rounded-lg bg-muted/20">
                    <Users className="w-12 h-12 mx-auto text-muted-foreground opacity-50 mb-4" />
                    <h3 className="text-lg font-medium">{t('teacher.groups.no_groups_title', 'No tienes grupos asignados')}</h3>
                    <p className="text-muted-foreground">{t('teacher.groups.no_groups_message', 'Contacta al administrador para que te asigne un grupo.')}</p>
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {myGroups.map(group => {
                        const isActive = new Date() >= new Date(group.startDate) && new Date() <= new Date(group.endDate);
                        const mod = modules?.find(m => m.id === group.moduleId);
                        const docCount = mod?.sections?.flatMap((s: any) => s.attachedDocumentIds || []).length || 0;

                        return (
                            <Link key={group.id} href={`/dashboard/teacher/groups/${group.id}`} className="block">
                                <Card className="h-full hover:shadow-md hover:border-primary/40 transition-all cursor-pointer group">
                                    <CardHeader className="pb-2 pt-4 px-4">
                                        <div className="flex justify-between items-start gap-2">
                                            <CardTitle className="text-base leading-tight group-hover:text-primary transition-colors">{group.name}</CardTitle>
                                            <Badge variant={isActive ? "default" : "secondary"} className="text-[10px] shrink-0">
                                                {isActive ? t('teacher.groups.card_active', 'Activo') : t('teacher.groups.card_finished', 'Finalizado')}
                                            </Badge>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="px-4 pb-4 pt-0 space-y-2">
                                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                            <BookOpen className="w-3 h-3 text-primary shrink-0" />
                                            <span className="truncate">{getModuleName(group.moduleId)}</span>
                                        </div>
                                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                                            <span className="flex items-center gap-1">
                                                <Users className="w-3 h-3" /> {group.members.length}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <FileText className="w-3 h-3" /> {docCount} docs
                                            </span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2 text-[10px] text-muted-foreground pt-1 border-t">
                                            <div className="flex items-center gap-1">
                                                <Calendar className="w-3 h-3 shrink-0 text-green-500" />
                                                <span><span className="font-semibold">Fecha Inicial:</span> {formatDate(group.startDate)}</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Calendar className="w-3 h-3 shrink-0 text-red-500" />
                                                <span><span className="font-semibold">Fecha Final:</span> {formatDate(group.endDate)}</span>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </Link>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
