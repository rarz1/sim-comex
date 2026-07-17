"use client";

import { useAuth } from "@/hooks/useAuth";
import { UserRole } from "@/types/roles";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAppText } from "@/hooks/useAppText";
import {
    LayoutDashboard,
    FileText,
    Users,
    Settings,
    Database,
    BookOpen,
    PenTool,
    BarChart,
    UserCog,
    HardDriveDownload
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface SidebarProps {
    className?: string;
}

interface NavItem {
    id: string; // Added ID for text translation
    title: string;
    href: string;
    icon: React.ComponentType<{ className?: string }>;
    roles: UserRole[];
}

const navItems: NavItem[] = [
    // Admin Routes
    { id: "common.sidebar.dashboard", title: "Panel de Control", href: "/dashboard/admin", icon: LayoutDashboard, roles: ["admin"] },
    { id: "common.sidebar.users", title: "Usuarios", href: "/dashboard/admin/users", icon: UserCog, roles: ["admin"] },
    { id: "common.sidebar.modules", title: "Módulos", href: "/dashboard/admin/modules", icon: BookOpen, roles: ["admin"] },
    { id: "common.sidebar.builder", title: "Documentos", href: "/dashboard/admin/builder", icon: PenTool, roles: ["admin"] },
    { id: "common.sidebar.catalogs", title: "Catálogos", href: "/dashboard/admin/catalogs", icon: Database, roles: ["admin"] },
    { id: "common.sidebar.admin_exercises", title: "Banco de Casos", href: "/dashboard/admin/exercises", icon: BookOpen, roles: ["admin"] },
    { id: "common.sidebar.groups", title: "Grupos", href: "/dashboard/admin/groups", icon: Users, roles: ["admin"] },
    { id: "common.sidebar.reports", title: "Evaluaciones", href: "/dashboard/admin/reports", icon: BarChart, roles: ["admin"] },
    { id: "common.sidebar.migrate", title: "Migrar a Nube", href: "/dashboard/admin/migrate", icon: HardDriveDownload, roles: ["admin"] },
    { id: "common.sidebar.settings", title: "Configuración", href: "/dashboard/admin/settings", icon: Settings, roles: ["admin"] },

    // Teacher Routes
    { id: "common.sidebar.teacher_panel", title: "Panel de Control", href: "/dashboard/teacher", icon: LayoutDashboard, roles: ["teacher"] },
    { id: "common.sidebar.teacher_groups", title: "Mis Grupos", href: "/dashboard/teacher/groups", icon: Users, roles: ["teacher"] },
    { id: "common.sidebar.teacher_library", title: "Banco de Casos", href: "/dashboard/teacher/library", icon: BookOpen, roles: ["teacher"] },
    { id: "common.sidebar.teacher_reports", title: "Evaluaciones", href: "/dashboard/teacher/reports", icon: BarChart, roles: ["teacher"] },

    // Student Routes
    { id: "common.sidebar.student_panel", title: "Panel de Control", href: "/dashboard/student", icon: LayoutDashboard, roles: ["student"] },
    { id: "common.sidebar.student_groups", title: "Mis Grupos", href: "/dashboard/student/groups", icon: Users, roles: ["student"] },
    { id: "common.sidebar.student_docs", title: "Mis Documentos", href: "/dashboard/student/documents", icon: FileText, roles: ["student"] },
    { id: "common.sidebar.student_cases", title: "Mis Casos", href: "/dashboard/student/cases", icon: FileText, roles: ["student"] },
    { id: "common.sidebar.student_reports", title: "Mis Evaluaciones", href: "/dashboard/student/reports", icon: BarChart, roles: ["student"] },
];

export function Sidebar({ className }: SidebarProps) {
    const { user, loading } = useAuth();
    const pathname = usePathname();
    const { t } = useAppText();

    if (user === undefined && !loading) return null;

    // Filter items.
    const filteredItems = user ? navItems.filter(item => {
        if (item.href === "/dashboard/admin/users") {
            return user.role === 'admin' || (user.role === 'teacher' && !!user.canCreateUsers);
        }
        return item.roles.includes(user.role);
    }) : [];

    return (
        <div className={cn("w-52 border-r bg-sidebar h-full flex flex-col sticky top-0", className)}>

            <div className="flex-1 overflow-y-auto py-4 no-scrollbar">
                <div className="px-2 py-2">
                    <h2 className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/60">
                        {t('common.sidebar.menu', 'Menú Principal')}
                    </h2>
                    <div className="space-y-0.5">
                        {loading && (
                            Array(5).fill(0).map((_, i) => (
                                <div key={i} className="h-9 w-full bg-muted/20 animate-pulse rounded-md mb-1" />
                            ))
                        )}
                        {!loading && filteredItems.map((item) => {
                            const isActive = pathname === item.href;
                            return (
                            <Link key={item.href} href={item.href}>
                                <Button
                                    variant={isActive ? "secondary" : "ghost"}
                                    className={cn(
                                        "w-full justify-start h-9 px-3 transition-all duration-150",
                                        isActive
                                            ? "bg-sidebar-accent text-sidebar-accent-foreground font-semibold shadow-sm"
                                            : "text-sidebar-foreground/80 hover:bg-sidebar-accent/70 hover:text-sidebar-foreground"
                                    )}
                                >
                                    <item.icon className={cn("mr-2 h-4 w-4 shrink-0 transition-colors", isActive && "text-primary")} />
                                    <span className="truncate text-sm">{t(item.id, item.title)}</span>
                                </Button>
                            </Link>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}
