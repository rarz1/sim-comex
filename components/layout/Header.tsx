
"use client";

import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { MobileSidebar } from "./MobileSidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Menu, Moon, Sun, LogOut } from "lucide-react";
import { useTheme } from "next-themes";
import { useAppText } from "@/hooks/useAppText";

interface HeaderProps {
    onMenuClick?: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
    const { user } = useAuth();
    const { setTheme, theme } = useTheme();
    const { t } = useAppText();

    return (
        <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-16 items-center pl-4 lg:pl-0">
                <div className="lg:hidden mr-2">
                    <MobileSidebar />
                </div>
                <div className="ml-8 mr-4 flex flex-col justify-center">
                    <a className="flex flex-col -space-y-1" href="/dashboard">
                        <span className="hidden font-black sm:inline-block text-primary text-xl tracking-tighter uppercase">
                            {t('common.app.name', 'SIM-COMEX PRO')}
                        </span>
                        <span className="hidden sm:inline-block text-[10px] uppercase font-bold text-muted-foreground/60 tracking-[0.2em] pl-0.5">
                            {t('common.app.description', 'Plataforma Educativa')}
                        </span>
                    </a>
                </div>
                <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end pr-6">
                    <div className="w-full flex-1 md:w-auto md:flex-none">
                        {/* Search could go here */}
                    </div>
                    <nav className="flex items-center space-x-2">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-12 px-3 rounded-2xl flex items-center gap-3 hover:bg-muted/50 transition-all border border-transparent hover:border-muted-foreground/10 group">
                                    <div className="flex flex-col items-end hidden sm:flex">
                                        <p className="text-xs font-black text-gray-900 dark:text-gray-100 uppercase tracking-tight">{user?.fullName}</p>
                                        <p className="text-[9px] font-bold text-primary uppercase tracking-widest leading-none">
                                            {user?.role === 'admin' ? 'Administrador' : user?.role === 'teacher' ? 'Docente' : 'Estudiante'}
                                        </p>
                                    </div>
                                    <Avatar className="h-9 w-9 border-2 border-primary/20 group-hover:border-primary transition-colors shadow-sm">
                                        <AvatarImage src={user?.avatarUrl} alt={user?.fullName} />
                                        <AvatarFallback className="bg-primary text-white font-black text-xs">{user?.fullName?.charAt(0) || "U"}</AvatarFallback>
                                    </Avatar>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-56" align="end" forceMount>
                                <DropdownMenuLabel className="font-normal">
                                    <div className="flex flex-col space-y-1">
                                        <p className="text-sm font-medium leading-none">{user?.fullName}</p>
                                        <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                                        <p className="text-xs font-semibold text-primary capitalize mt-1">{user?.role === 'admin' ? 'Administrador' : user?.role === 'teacher' ? 'Docente' : 'Estudiante'}</p>
                                    </div>
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => window.location.href = '/dashboard/profile'}>
                                    Perfil
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => window.location.href = '/dashboard/settings'}>
                                    Configuración
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-red-500 cursor-pointer" onClick={() => window.location.href = '/logout'}>
                                    <LogOut className="mr-2 h-4 w-4" />
                                    Cerrar Sesión
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </nav>
                </div>
            </div>
        </header>
    );
}
