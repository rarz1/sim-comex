"use client";

import { useState } from "react";
import { useAppTexts, useCreateOrUpdateAppText } from "@/hooks/useData";
import { defaultTexts } from "@/lib/appTexts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    Settings,
    Save,
    RotateCcw,
    Search,
    Globe,
    UserCog,
    Users,
    GraduationCap,
    LayoutDashboard,
    BarChart,
    FileText,
    BookOpen,
    Info,
    PenTool,
    Database
} from "lucide-react";
import { useAppText } from "@/hooks/useAppText";
import { toast } from "sonner";
import { LandingPageDesigner } from "@/components/admin/LandingPageDesigner";

export default function AdminSettingsPage() {
    const [search, setSearch] = useState("");
    const [saving, setSaving] = useState<string | null>(null);
    const { t } = useAppText();

    const { data: overrides } = useAppTexts();
    const createOrUpdateAppText = useCreateOrUpdateAppText();
    const overrideMap = new Map<string, string>();
    overrides?.forEach((item: any) => overrideMap.set(item.id, item.value));

    // Group keys for UI categorization
    const allKeys = Object.keys(defaultTexts);

    const handleSave = async (key: string, value: string) => {
        setSaving(key);
        try {
            await createOrUpdateAppText.mutateAsync({ id: key, key, value });
            toast.success(t('admin.settings.toast_success', "Texto actualizado correctamente"));
        } catch (error) {
            console.error(error);
            toast.error("Error al guardar el texto");
        } finally {
            setSaving(null);
        }
    };

    const handleReset = async (key: string) => {
        try {
            const defaultVal = defaultTexts[key] || '';
            await createOrUpdateAppText.mutateAsync({ id: key, key, value: defaultVal });
            toast.success(t('admin.settings.toast_success', "Texto restaurado"));
        } catch (error) {
            console.error(error);
            toast.error(t('admin.settings.toast_error', "Error al restaurar"));
        }
    };

    const renderTextList = (category: string, subCategory?: string) => {
        const filteredKeys = allKeys.filter(k => {
            const matchesCategory = k.startsWith(category);
            const matchesSub = subCategory ? k.includes(`.${subCategory}.`) : true;
            const matchesSearch = k.toLowerCase().includes(search.toLowerCase()) ||
                (defaultTexts[k] || "").toLowerCase().includes(search.toLowerCase()) ||
                (overrideMap.get(k) || "").toLowerCase().includes(search.toLowerCase());
            return matchesCategory && matchesSub && matchesSearch;
        });

        if (filteredKeys.length === 0) {
            return (
                <div className="text-center py-20 text-muted-foreground italic border-2 border-dashed rounded-3xl bg-muted/10">
                    <Info className="w-8 h-8 mx-auto mb-2 opacity-20" />
                    {t('admin.settings.empty', 'No se encontraron resultados.')}
                </div>
            );
        }

        return (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 pb-10">
                {filteredKeys.map(key => {
                    const defaultValue = defaultTexts[key];
                    const currentValue = overrideMap.get(key) || defaultValue;
                    const isEdited = overrideMap.has(key);

                    return (
                        <Card key={key} className={`transition-all shadow-sm group border-muted/30 ${isEdited ? 'border-primary/40 bg-primary/5' : 'hover:border-primary/20'}`}>
                            <CardContent className="p-2 px-3 flex flex-col gap-1.5">
                                <div className="flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-1.5 overflow-hidden">
                                        <Badge variant="outline" className="text-[7px] uppercase font-mono tracking-tighter opacity-50 px-1 py-0 h-3.5 truncate">
                                            {key}
                                        </Badge>
                                        {isEdited && (
                                            <Badge className="bg-primary/20 text-primary border-none text-[7px] uppercase px-1 py-0 h-3.5">Editado</Badge>
                                        )}
                                    </div>
                                    <div className="flex gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-5 w-5 text-muted-foreground hover:text-red-500"
                                            onClick={() => handleReset(key)}
                                            disabled={!isEdited || saving === key}
                                        >
                                            <RotateCcw className="h-2.5 w-2.5" />
                                        </Button>
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <div className="flex justify-between items-center text-[8px] text-muted-foreground font-bold uppercase tracking-widest px-0.5">
                                        <span className="flex items-center gap-1 opacity-60">
                                            <div className="w-1 h-1 rounded-full bg-muted-foreground/30" />
                                            {t('admin.settings.card_original', 'Por Defecto')}
                                        </span>
                                        <span className="italic font-medium normal-case opacity-80 truncate max-w-[150px]">{defaultValue}</span>
                                    </div>
                                    <div className="relative group/input">
                                        <Textarea
                                            defaultValue={currentValue}
                                            className="min-h-[38px] w-full py-2 font-semibold text-[11px] bg-background/40 border-muted-foreground/10 focus-visible:ring-1 rounded-lg resize-none overflow-hidden transition-all focus:min-h-[80px]"
                                            onInput={(e: any) => {
                                                e.target.style.height = 'auto';
                                                e.target.style.height = e.target.scrollHeight + 'px';
                                            }}
                                            onBlur={(e) => {
                                                if (e.target.value !== currentValue) {
                                                    handleSave(key, e.target.value);
                                                }
                                            }}
                                            disabled={saving === key}
                                        />
                                        <div className="absolute right-2 bottom-2">
                                            {saving === key ? (
                                                <RotateCcw className="h-2.5 w-2.5 animate-spin text-primary" />
                                            ) : (
                                                <Save className="h-2.5 w-2.5 text-muted-foreground opacity-30 group-focus-within/input:opacity-100 transition-opacity" />
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>
        );
    };

    return (
        <div className="space-y-6 pb-20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-sm">
                        <Settings className="w-6 h-6 animate-spin-slow" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black tracking-tight text-gray-900 dark:text-gray-100">{t('admin.settings.title', 'Gestión de Contenidos')}</h1>
                        <p className="text-muted-foreground font-medium">{t('admin.settings.subtitle', 'Personaliza todos los textos en tiempo real.')}</p>
                    </div>
                </div>
                <div className="relative w-full md:w-80">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder={t('admin.settings.search_placeholder', 'Buscar texto o tag...')}
                        className="pl-9 rounded-full bg-muted/40 border-none h-11"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            <Tabs defaultValue="admin" className="space-y-6 flex flex-col">
                <TabsList className="bg-muted/30 p-1.5 rounded-2xl h-auto w-fit flex-wrap border shadow-inner shrink-0 sm:h-14 mb-4 gap-1">
                    <TabsTrigger value="admin" className="rounded-xl px-5 data-[state=active]:bg-white data-[state=active]:shadow-md font-bold text-[13px] h-10 gap-2 shrink-0 sm:h-full">
                        <UserCog className="w-4 h-4" /> {t('admin.settings.tab_admin', 'Administrador')}
                    </TabsTrigger>
                    <TabsTrigger value="teacher" className="rounded-xl px-5 data-[state=active]:bg-white data-[state=active]:shadow-md font-bold text-[13px] h-10 gap-2 shrink-0 sm:h-full">
                        <Users className="w-4 h-4" /> {t('admin.settings.tab_teachers', 'Docentes')}
                    </TabsTrigger>
                    <TabsTrigger value="student" className="rounded-xl px-5 data-[state=active]:bg-white data-[state=active]:shadow-md font-bold text-[13px] h-10 gap-2 shrink-0 sm:h-full">
                        <GraduationCap className="w-4 h-4" /> {t('admin.settings.tab_students', 'Estudiantes')}
                    </TabsTrigger>
                    <TabsTrigger value="common" className="rounded-xl px-5 data-[state=active]:bg-white data-[state=active]:shadow-md font-bold text-[13px] h-10 gap-2 shrink-0 sm:h-full">
                        <Globe className="w-4 h-4" /> {t('admin.settings.tab_global', 'Sistema')}
                    </TabsTrigger>
                </TabsList>

                {/* --- ADMIN TABS --- */}
                <TabsContent value="admin" className="space-y-6 focus-visible:outline-none">
                    <Tabs defaultValue="general">
                        <TabsList className="bg-muted/30 p-1 rounded-xl h-auto w-fit flex-wrap">
                            <TabsTrigger value="general" className="rounded-lg px-4 data-[state=active]:bg-background data-[state=active]:shadow-sm text-xs font-bold h-9">
                                <LayoutDashboard className="w-3.5 h-3.5 mr-1" /> {t('admin.settings.subtab_dashboard', 'Dashboard')}
                            </TabsTrigger>
                            <TabsTrigger value="builder" className="rounded-lg px-4 data-[state=active]:bg-background data-[state=active]:shadow-sm text-xs font-bold h-9">
                                <PenTool className="w-3.5 h-3.5 mr-1" /> Constructor
                            </TabsTrigger>
                            <TabsTrigger value="reports" className="rounded-lg px-4 data-[state=active]:bg-background data-[state=active]:shadow-sm text-xs font-bold h-9">
                                <BarChart className="w-3.5 h-3.5 mr-1" /> {t('admin.settings.subtab_reports', 'Reportes')}
                            </TabsTrigger>
                            <TabsTrigger value="groups" className="rounded-lg px-4 data-[state=active]:bg-background data-[state=active]:shadow-sm text-xs font-bold h-9">
                                <Users className="w-3.5 h-3.5 mr-1" /> {t('admin.settings.subtab_groups', 'Grupos')}
                            </TabsTrigger>
                            <TabsTrigger value="users" className="rounded-lg px-4 data-[state=active]:bg-background data-[state=active]:shadow-sm text-xs font-bold h-9">
                                <UserCog className="w-3.5 h-3.5 mr-1" /> {t('admin.settings.subtab_users', 'Usuarios')}
                            </TabsTrigger>
                            <TabsTrigger value="modules" className="rounded-lg px-4 data-[state=active]:bg-background data-[state=active]:shadow-sm text-xs font-bold h-9">
                                <BookOpen className="w-3.5 h-3.5 mr-1" /> Módulos
                            </TabsTrigger>
                            <TabsTrigger value="catalogs" className="rounded-lg px-4 data-[state=active]:bg-background data-[state=active]:shadow-sm text-xs font-bold h-9">
                                <Database className="w-3.5 h-3.5 mr-1" /> Catálogos
                            </TabsTrigger>
                            <TabsTrigger value="seed" className="rounded-lg px-4 data-[state=active]:bg-background data-[state=active]:shadow-sm text-xs font-bold h-9">
                                <Database className="w-3.5 h-3.5 mr-1" /> Datos (Test)
                            </TabsTrigger>
                        </TabsList>

                        <div className="mt-6">
                            <TabsContent value="general" className="mt-0 focus-visible:outline-none">
                                {renderTextList("admin.dashboard")}
                            </TabsContent>
                            <TabsContent value="builder" className="mt-0 focus-visible:outline-none">
                                {renderTextList("admin.builder")}
                            </TabsContent>
                            <TabsContent value="reports" className="mt-0 focus-visible:outline-none">
                                {renderTextList("admin.reports")}
                            </TabsContent>
                            <TabsContent value="groups" className="mt-0 focus-visible:outline-none">
                                {renderTextList("admin.groups")}
                            </TabsContent>
                            <TabsContent value="users" className="mt-0 focus-visible:outline-none">
                                {renderTextList("admin.users")}
                            </TabsContent>
                            <TabsContent value="modules" className="mt-0 focus-visible:outline-none">
                                {renderTextList("admin.modules")}
                            </TabsContent>
                            <TabsContent value="catalogs" className="mt-0 focus-visible:outline-none">
                                {renderTextList("admin.catalogs")}
                            </TabsContent>
                            <TabsContent value="seed" className="mt-0 focus-visible:outline-none">
                                {renderTextList("admin.seed")}
                            </TabsContent>
                        </div>
                    </Tabs>
                </TabsContent>

                {/* --- TEACHER TABS --- */}
                <TabsContent value="teacher" className="space-y-6 focus-visible:outline-none">
                    <Tabs defaultValue="dashboard">
                        <TabsList className="bg-muted/30 p-1 rounded-xl h-auto w-fit flex-wrap">
                            <TabsTrigger value="dashboard" className="rounded-lg px-4 data-[state=active]:bg-background data-[state=active]:shadow-sm text-xs font-bold h-9">
                                <LayoutDashboard className="w-3.5 h-3.5 mr-1" /> {t('admin.settings.subtab_dashboard', 'Dashboard')}
                            </TabsTrigger>
                            <TabsTrigger value="groups" className="rounded-lg px-4 data-[state=active]:bg-background data-[state=active]:shadow-sm text-xs font-bold h-9">
                                <Users className="w-3.5 h-3.5 mr-1" /> {t('admin.settings.subtab_groups', 'Mis Grupos')}
                            </TabsTrigger>
                            <TabsTrigger value="reports" className="rounded-lg px-4 data-[state=active]:bg-background data-[state=active]:shadow-sm text-xs font-bold h-9">
                                <BarChart className="w-3.5 h-3.5 mr-1" /> {t('admin.settings.subtab_reports', 'Reportes')}
                            </TabsTrigger>
                            <TabsTrigger value="library" className="rounded-lg px-4 data-[state=active]:bg-background data-[state=active]:shadow-sm text-xs font-bold h-9">
                                <BookOpen className="w-3.5 h-3.5 mr-1" /> Biblioteca
                            </TabsTrigger>
                        </TabsList>
                        <div className="mt-6">
                            <TabsContent value="dashboard" className="mt-0 focus-visible:outline-none">
                                {renderTextList("teacher.dashboard")}
                            </TabsContent>
                            <TabsContent value="groups" className="mt-0 focus-visible:outline-none">
                                {renderTextList("teacher.groups")}
                            </TabsContent>
                            <TabsContent value="reports" className="mt-0 focus-visible:outline-none">
                                {renderTextList("teacher.reports")}
                            </TabsContent>
                            <TabsContent value="library" className="mt-0 focus-visible:outline-none">
                                {renderTextList("teacher.library")}
                            </TabsContent>
                        </div>
                    </Tabs>
                </TabsContent>

                {/* --- STUDENT TABS --- */}
                <TabsContent value="student" className="space-y-6 focus-visible:outline-none">
                    <Tabs defaultValue="dashboard">
                        <TabsList className="bg-muted/30 p-1 rounded-xl h-auto w-fit flex-wrap">
                            <TabsTrigger value="dashboard" className="rounded-lg px-4 data-[state=active]:bg-background data-[state=active]:shadow-sm text-xs font-bold h-9">
                                <LayoutDashboard className="w-3.5 h-3.5 mr-1" /> {t('admin.settings.subtab_dashboard', 'Dashboard')}
                            </TabsTrigger>
                            <TabsTrigger value="groups" className="rounded-lg px-4 data-[state=active]:bg-background data-[state=active]:shadow-sm text-xs font-bold h-9">
                                <Users className="w-3.5 h-3.5 mr-1" /> {t('admin.settings.subtab_groups', 'Mis Grupos')}
                            </TabsTrigger>
                            <TabsTrigger value="docs" className="rounded-lg px-4 data-[state=active]:bg-background data-[state=active]:shadow-sm text-xs font-bold h-9">
                                <FileText className="w-3.5 h-3.5 mr-1" /> Documentos
                            </TabsTrigger>
                            <TabsTrigger value="reports" className="rounded-lg px-4 data-[state=active]:bg-background data-[state=active]:shadow-sm text-xs font-bold h-9">
                                <BarChart className="w-3.5 h-3.5 mr-1" /> {t('admin.settings.subtab_reports', 'Reportes')}
                            </TabsTrigger>
                        </TabsList>
                        <div className="mt-6">
                            <TabsContent value="dashboard" className="mt-0 focus-visible:outline-none">
                                {renderTextList("student.dashboard")}
                            </TabsContent>
                            <TabsContent value="groups" className="mt-0 focus-visible:outline-none">
                                {renderTextList("student.groups")}
                            </TabsContent>
                            <TabsContent value="docs" className="mt-0 focus-visible:outline-none">
                                {renderTextList("student.docs")}
                            </TabsContent>
                            <TabsContent value="reports" className="mt-0 focus-visible:outline-none">
                                {renderTextList("student.reports")}
                            </TabsContent>
                        </div>
                    </Tabs>
                </TabsContent>

                {/* --- GLOBAL TABS --- */}
                <TabsContent value="common" className="space-y-6 focus-visible:outline-none">
                    <Tabs defaultValue="branding">
                        <TabsList className="bg-muted/30 p-1 rounded-xl h-auto w-fit flex-wrap">
                            <TabsTrigger value="branding" className="rounded-lg px-4 data-[state=active]:bg-background data-[state=active]:shadow-sm text-xs font-bold h-9">
                                <Globe className="w-3.5 h-3.5 mr-1" /> {t('admin.settings.subtab_branding', 'Identidad')}
                            </TabsTrigger>
                            <TabsTrigger value="sidebar" className="rounded-lg px-4 data-[state=active]:bg-background data-[state=active]:shadow-sm text-xs font-bold h-9">
                                <LayoutDashboard className="w-3.5 h-3.5 mr-1" /> {t('admin.settings.subtab_sidebar', 'Menú Lateral')}
                            </TabsTrigger>
                            <TabsTrigger value="settings" className="rounded-lg px-4 data-[state=active]:bg-background data-[state=active]:shadow-sm text-xs font-bold h-9">
                                <Settings className="w-3.5 h-3.5 mr-1" /> Ajustes Admin
                            </TabsTrigger>
                            <TabsTrigger value="home_login" className="rounded-lg px-4 data-[state=active]:bg-background data-[state=active]:shadow-sm text-xs font-bold h-9">
                                <Globe className="w-3.5 h-3.5 mr-1" /> Home & Login
                            </TabsTrigger>
                            <TabsTrigger value="landing" className="rounded-lg px-4 data-[state=active]:bg-background data-[state=active]:shadow-sm text-xs font-bold h-9">
                                <PenTool className="w-3.5 h-3.5 mr-1" /> Landing Page
                            </TabsTrigger>
                        </TabsList>
                        <div className="mt-6">
                            <TabsContent value="branding" className="mt-0 focus-visible:outline-none">
                                {renderTextList("common.app")}
                            </TabsContent>
                            <TabsContent value="sidebar" className="mt-0 focus-visible:outline-none">
                                {renderTextList("common.sidebar")}
                            </TabsContent>
                            <TabsContent value="settings" className="mt-0 focus-visible:outline-none">
                                {renderTextList("admin.settings")}
                            </TabsContent>
                            <TabsContent value="home_login" className="mt-0 focus-visible:outline-none">
                                <div className="space-y-8">
                                    <div>
                                        <h3 className="text-xs font-black uppercase text-primary/40 mb-3 tracking-widest pl-1">Página de Inicio</h3>
                                        {renderTextList("common.home")}
                                    </div>
                                    <div className="pt-4 border-t">
                                        <h3 className="text-xs font-black uppercase text-primary/40 mb-3 tracking-widest pl-1">Inicio de Sesión</h3>
                                        {renderTextList("common.login")}
                                    </div>
                                </div>
                            </TabsContent>
                            <TabsContent value="landing" className="mt-0 focus-visible:outline-none">
                                <LandingPageDesigner />
                            </TabsContent>
                        </div>
                    </Tabs>
                </TabsContent>
            </Tabs>
        </div>
    );
}
