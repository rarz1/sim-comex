"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FormRenderer } from "@/components/document-renderer/FormRenderer";
import { FormVisualizer } from "@/components/document-renderer/FormVisualizer";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db/db";
import { FileText, Printer, Clock, CheckCircle, AlertCircle } from "lucide-react";
import { cn, calculateDocumentProgress } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

interface TeacherDocumentViewerProps {
    studentId: string;
    studentName: string;
    moduleId: string;
    groupId: string;
}

export function TeacherDocumentViewer({ studentId, studentName, moduleId, groupId }: TeacherDocumentViewerProps) {
    // 1. Fetch the Module to get all attached document IDs from sections
    const module = useLiveQuery(() => db.modules.get(moduleId));

    // 2. Get all document IDs attached to any section in this module
    const attachedDocIds = module?.sections?.flatMap((s: any) => s.attachedDocumentIds || []) || [];

    // 3. Fetch all those templates
    const allTemplates = useLiveQuery(() => db.templates.toArray());
    const templates = allTemplates?.filter((t: any) => attachedDocIds.includes(t.id)) || [];

    return (
        <div className="space-y-4">
            {(!templates || templates.length === 0) && <p className="text-muted-foreground text-sm">Este módulo no tiene documentos configurados.</p>}

            {templates?.map(template => {
                return <DocumentItem key={template.id} template={template} studentId={studentId} studentName={studentName} groupId={groupId} />;
            })}
        </div>
    );
}

function DocumentItem({ template, studentId, studentName, groupId }: { template: any, studentId: string, studentName: string, groupId: string }) {
    // Load specific draft
    const draft = useLiveQuery(() => db.drafts.where({ userId: studentId, moduleId: template.id, groupId: groupId }).first());
    
    const progress = calculateDocumentProgress(template, draft?.content);
    const status = (draft as any)?.status || 'pending';

    return (
        <FormVisualizer
            template={template}
            formData={draft?.content || {}}
            trigger={
                <div className="flex flex-col p-5 rounded-2xl bg-white dark:bg-muted/20 border hover:border-primary/50 hover:shadow-xl transition-all group gap-4 relative overflow-hidden bg-card">
                    {/* ROW 1: TITLE */}
                    <div className="flex items-center gap-3 relative z-10">
                        <div className={cn(
                            "h-10 w-10 rounded-xl flex items-center justify-center shrink-0 transition-colors",
                            status === 'completed' ? "bg-green-500/10 text-green-600" : 
                            status === 'in_progress' ? "bg-yellow-500/10 text-yellow-600" : 
                            "bg-red-500/10 text-red-600"
                        )}>
                            {status === 'completed' ? <CheckCircle className="w-5 h-5" /> : 
                             status === 'in_progress' ? <Clock className="w-5 h-5" /> : 
                             <AlertCircle className="w-5 h-5" />}
                        </div>
                        <p className="font-bold text-gray-900 dark:text-gray-100 group-hover:text-primary transition-colors text-base truncate flex-1">{template.title}</p>
                    </div>

                    {/* ROW 2: STATUS, PROGRESS, BUTTON */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10 bg-muted/40 p-4 rounded-xl border border-muted-foreground/10">
                        <div className="flex items-center gap-6 flex-1">
                            <Badge 
                                className={cn(
                                    "text-[10px] uppercase font-black px-2 py-0.5 border-none text-white shrink-0",
                                    status === 'completed' ? "bg-green-500" : 
                                    status === 'in_progress' ? "bg-yellow-500" : 
                                    "bg-red-500"
                                )}
                            >
                                {status === 'completed' ? 'Finalizado' : status === 'in_progress' ? 'Iniciado' : 'Sin Iniciar'}
                            </Badge>
                            
                            <div className="flex-1 max-w-[150px]">
                                <div className="flex justify-between items-center mb-1.5">
                                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Avance</span>
                                    <span className="text-[10px] font-black text-primary">{progress}%</span>
                                </div>
                                <Progress value={progress} className="h-1.5" />
                            </div>
                        </div>

                        <Button variant="outline" size="sm" className="rounded-full px-6 font-bold shadow-sm bg-background hover:bg-primary hover:text-white transition-all w-full sm:w-auto">
                            {draft ? 'Revisar' : 'Sin Datos'}
                        </Button>
                    </div>

                    {/* ROW 3: FOOTER */}
                    <div className="flex items-center justify-between pt-2 border-t border-dashed border-muted-foreground/20 relative z-10">
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-tighter">Estudiante:</span>
                            <span className="text-[10px] font-black text-primary uppercase">{studentName}</span>
                        </div>
                        <div className="text-[9px] font-bold text-muted-foreground/40 uppercase tracking-widest">
                            SIM COMEX v1.0
                        </div>
                    </div>
                </div>
            }
        />
    );
}
