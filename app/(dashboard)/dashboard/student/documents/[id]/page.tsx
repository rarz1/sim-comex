"use client";

import React from "react";
import { FormRenderer } from "@/components/document-renderer/FormRenderer";
import { useRouter, useSearchParams } from "next/navigation";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db/db";

export default function DocumentFillPage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { id: templateId } = React.use(params);
    const groupId = searchParams.get("groupId") || "default";

    // 1. Fetch Template dynamically
    const template = useLiveQuery(() => db.templates.get(templateId));

    if (!template) {
        return (
            <div className="flex flex-col items-center justify-center py-20 animate-pulse">
                <div className="w-12 h-12 rounded-full border-4 border-primary/30 border-t-primary animate-spin mb-4" />
                <p className="text-muted-foreground font-medium">Cargando plantilla de simulación...</p>
            </div>
        );
    }

    const handleSave = (data: any) => {
        // FormRenderer uses its own internal logic to save to Dexie
        // We can just log or show a success message if we want
        console.log("Datos de simulación actualizados.");
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-4 mb-6">
                <button
                    onClick={() => router.back()}
                    className="text-sm font-bold text-primary hover:bg-primary/5 px-3 py-1.5 rounded-lg border border-primary/20 transition-colors"
                >
                    ← Volver
                </button>
                <div>
                    <h1 className="text-xl font-bold">{template.title}</h1>
                    <p className="text-xs text-muted-foreground font-mono uppercase tracking-widest bg-muted px-2 py-0.5 rounded w-fit">ID: {template.id} | Grupo: {groupId}</p>
                </div>
            </div>

            <FormRenderer
                template={template}
                groupId={groupId}
                moduleId={template.moduleId}
                onSave={handleSave}
                onExit={() => router.back()}
            />
        </div>
    );
}
