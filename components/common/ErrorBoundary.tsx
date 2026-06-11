
"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "@/components/ui/button";

interface Props {
    children?: ReactNode;
}

interface State {
    hasError: boolean;
    error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="flex min-h-screen flex-col items-center justify-center p-6 text-center space-y-4">
                    <h1 className="text-2xl font-bold text-destructive">Algo salió mal</h1>
                    <p className="text-muted-foreground max-w-md">
                        La aplicación encontró un error inesperado. Hemos registrado el problema e intentaremos solucionarlo lo antes posible.
                    </p>
                    <div className="bg-muted p-4 rounded-lg text-left text-xs font-mono overflow-auto max-w-full">
                        {this.state.error?.message}
                    </div>
                    <Button
                        onClick={() => {
                            localStorage.removeItem('mock_user_session'); // Clear potentially corrupted data
                            window.location.href = '/';
                        }}
                    >
                        Reiniciar Aplicación
                    </Button>
                </div>
            );
        }

        return this.props.children;
    }
}
