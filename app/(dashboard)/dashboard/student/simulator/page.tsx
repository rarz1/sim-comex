
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, ClipboardCheck } from "lucide-react";
import Link from "next/link";

export default function StudentSimulatorPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">Simulador de Trámites</h1>
                <p className="text-muted-foreground">Inicia una nueva simulación paso a paso.</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <Card className="border-primary/50 bg-accent/10">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Play className="h-5 w-5 text-primary" />
                            Simulación Guiada
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="mb-4 text-sm text-muted-foreground">
                            El sistema te guiará paso a paso en el proceso de importación/exportación, indicándote qué documentos llenar y en qué orden.
                        </p>
                        <Button className="w-full">Iniciar Nueva Simulación</Button>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <ClipboardCheck className="h-5 w-5" />
                            Práctica Libre
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="mb-4 text-sm text-muted-foreground">
                            Selecciona documentos individuales para practicar su diligenciamiento sin un flujo predefinido.
                        </p>
                        <Link href="/dashboard/student/documents">
                            <Button variant="outline" className="w-full">Ir a Documentos</Button>
                        </Link>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
