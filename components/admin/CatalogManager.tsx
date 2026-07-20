"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2, LayoutGrid, List, Zap, X, Edit2, Copy, Save, Check } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useCatalogs, useCreateOrUpdateCatalog, useDeleteCatalog } from "@/hooks/useData";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface CatalogItem {
    id: string;
    value: string;
    label: string;
    value2?: string; // For two-column catalogs
}

export function CatalogManager() {
    const { data: catalogs } = useCatalogs();
    const createOrUpdateCatalog = useCreateOrUpdateCatalog();
    const deleteCatalogMutation = useDeleteCatalog();
    const [isCreating, setIsCreating] = useState(false);
    const [newName, setNewName] = useState("");
    const [newType, setNewType] = useState<'simple' | 'two_column' | 'three_column'>('two_column');
    const [catalogTypeFilter, setCatalogTypeFilter] = useState("all");
    const [localEdits, setLocalEdits] = useState<Record<string, string>>({});

    const CATALOG_TYPES = [
        { value: 'simple' as const, label: 'Lista Simple', desc: 'Una columna: etiqueta' },
        { value: 'two_column' as const, label: 'Dos Columnas', desc: 'Etiqueta + Valor' },
        { value: 'three_column' as const, label: 'Tres Columnas', desc: 'Etiqueta + Valor + Secundario' },
    ];
    const [bulkText, setBulkText] = useState("");
    const [showBulkId, setShowBulkId] = useState<string | null>(null);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editingName, setEditingName] = useState("");

    const addCatalog = async () => {
        if (!newName) return;
        await createOrUpdateCatalog.mutateAsync({
            id: crypto.randomUUID(),
            name: newName,
            type: newType,
            items: []
        });
        setNewName("");
        setNewType('two_column');
        setIsCreating(false);
    };

    const deleteCatalog = async (id: string) => {
        if (!confirm("¿Está seguro de eliminar este catálogo y todos sus ítems? Esta acción no se puede deshacer.")) return;
        deleteCatalogMutation.mutate(id);
    };

    const duplicateCatalog = async (catalog: any) => {
        const newCatalog = {
            ...catalog,
            id: crypto.randomUUID(),
            name: `${catalog.name} (Copia)`,
            items: catalog.items.map((item: any) => ({ ...item, id: crypto.randomUUID() }))
        };
        await createOrUpdateCatalog.mutateAsync(newCatalog);
    };

    const saveCatalogName = async (id: string) => {
        if (!editingName.trim()) return;
        const cat = catalogs?.find(c => c.id === id);
        if (!cat) return;
        await createOrUpdateCatalog.mutateAsync({ ...cat, name: editingName });
        setEditingId(null);
    };

    const addItem = async (catalogId: string) => {
        const cat = catalogs?.find(c => c.id === catalogId);
        if (!cat) return;

        const newItem: CatalogItem = {
            id: crypto.randomUUID(),
            value: "",
            label: ""
        };

        await createOrUpdateCatalog.mutateAsync({
            ...cat,
            items: [...cat.items, newItem]
        });
    };

    const updateItem = (catalogId: string, itemId: string, field: keyof CatalogItem, val: string) => {
        const key = `${catalogId}:${itemId}:${field}`;
        setLocalEdits(prev => ({ ...prev, [key]: val }));
    };

    const getItemValue = (catalogId: string, itemId: string, field: string, defaultValue: string) => {
        const key = `${catalogId}:${itemId}:${field}`;
        return localEdits[key] ?? defaultValue;
    };

    const saveCatalogOnBlur = async (catalogId: string) => {
        const cat = catalogs?.find(c => c.id === catalogId);
        if (!cat) return;

        const updatedItems = cat.items.map((item: any) => {
            const newItem = { ...item };
            ['label', 'value', 'value2'].forEach(f => {
                const key = `${catalogId}:${item.id}:${f}`;
                if (localEdits[key] !== undefined) {
                    (newItem as any)[f] = localEdits[key];
                }
            });
            return newItem;
        });

        await createOrUpdateCatalog.mutateAsync({ ...cat, items: updatedItems });

        setLocalEdits(prev => {
            const next = { ...prev };
            Object.keys(next).forEach(k => { if (k.startsWith(`${catalogId}:`)) delete next[k]; });
            return next;
        });
    };

    const deleteItem = async (catalogId: string, itemId: string) => {
        const cat = catalogs?.find(c => c.id === catalogId);
        if (!cat) return;

        await createOrUpdateCatalog.mutateAsync({
            ...cat,
            items: cat.items.filter((i: any) => i.id !== itemId)
        });
    };

    const handleBulkAdd = async (catalogId: string) => {
        const cat = catalogs?.find(c => c.id === catalogId);
        if (!cat || !bulkText) return;

        const rows = bulkText.split(',').map(p => p.trim()).filter(p => p);
        const newItems: CatalogItem[] = rows.map(p => {
            const parts = p.split(';').map(s => s.trim());
            const item: CatalogItem = {
                id: crypto.randomUUID(),
                label: parts[0],
                value: parts[1] || parts[0]
            };
            if (cat.type === 'three_column' && parts[2]) {
                item.value2 = parts[2];
            }
            return item;
        });

        await createOrUpdateCatalog.mutateAsync({
            ...cat,
            items: [...cat.items, ...newItems]
        });
        setBulkText("");
        setShowBulkId(null);
    };

    const filteredCatalogs = catalogs?.filter(c => catalogTypeFilter === "all" || c.type === catalogTypeFilter);

    return (
        <Card className="h-full border-none shadow-none">
            <CardHeader className="flex flex-row items-center justify-between px-0 pt-0">
                <div>
                    <CardTitle className="text-2xl font-bold">Catálogos del Sistema</CardTitle>
                    <p className="text-sm text-muted-foreground">
                        Gestiona las listas desplegables reutilizables.
                        <span className="ml-2 inline-flex items-center gap-1 text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                            {catalogs?.length || 0} catálogos
                        </span>
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    {!isCreating ? (
                        <Button onClick={() => setIsCreating(true)} size="sm">
                            <Plus className="w-4 h-4 mr-2" /> Nuevo Catálogo
                        </Button>
                    ) : (
                        <div className="flex items-center gap-2">
                            <Input
                                value={newName}
                                onChange={e => setNewName(e.target.value)}
                                placeholder="Nombre del catálogo"
                                className="h-8 text-xs w-44"
                                onKeyDown={e => e.key === 'Enter' && addCatalog()}
                            />
                            <Select value={newType} onValueChange={(v: any) => setNewType(v)}>
                                <SelectTrigger className="h-8 w-40 text-xs">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {CATALOG_TYPES.map(t => (
                                        <SelectItem key={t.value} value={t.value} className="text-xs">
                                            {t.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Button onClick={addCatalog} size="sm" variant="default" className="h-8">Crear</Button>
                            <Button onClick={() => setIsCreating(false)} size="sm" variant="ghost" className="h-8 text-xs">Cancelar</Button>
                        </div>
                    )}
                </div>
            </CardHeader>
            <CardContent className="px-0">
                <div className="flex items-center gap-2 mb-4">
                    <Select value={catalogTypeFilter} onValueChange={setCatalogTypeFilter}>
                        <SelectTrigger className="h-8 w-[180px] text-xs">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todos los tipos</SelectItem>
                            {CATALOG_TYPES.map(t => (
                                <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <Accordion type="single" collapsible className="w-full space-y-2">
                    {[...(filteredCatalogs || [])].sort((a, b) => a.name.localeCompare(b.name)).map(cat => (
                        <AccordionItem value={cat.id} key={cat.id} className="border rounded-xl px-4 bg-muted/20 group">
                            <div className="flex items-center justify-between gap-4">
                                {editingId === cat.id ? (
                                    <div className="flex items-center gap-2 flex-1 py-4">
                                        <Input
                                            value={editingName}
                                            onChange={e => setEditingName(e.target.value)}
                                            className="h-8 text-sm font-bold flex-1"
                                            autoFocus
                                            onKeyDown={e => e.key === 'Enter' && saveCatalogName(cat.id)}
                                        />
                                        <Button size="icon" variant="default" className="h-8 w-8" onClick={() => saveCatalogName(cat.id)}>
                                            <Check className="w-4 h-4" />
                                        </Button>
                                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setEditingId(null)}>
                                            <X className="w-4 h-4" />
                                        </Button>
                                    </div>
                                ) : (
                                    <AccordionTrigger className="hover:no-underline flex-1 py-4">
                                        <div className="flex items-center gap-2">
                                            {cat.type === 'simple' ? <List className="w-4 h-4 text-primary" /> : <LayoutGrid className="w-4 h-4 text-primary" />}
                                            <span className="font-bold text-left">{cat.name}</span>
                                            <span className="text-xs text-muted-foreground px-2 py-0.5 bg-background rounded-full border">
                                                {cat.items.length} ítems
                                            </span>
                                            <span className="text-[10px] text-muted-foreground/60 px-2 py-0.5 bg-muted rounded-full border">
                                                {CATALOG_TYPES.find(t => t.value === cat.type)?.label || cat.type}
                                            </span>
                                        </div>
                                    </AccordionTrigger>
                                )}

                                <div className="flex items-center gap-1">
                                    {editingId !== cat.id && (
                                        <>
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                className="h-8 w-8 text-muted-foreground hover:text-primary transition-opacity sm:opacity-0 group-hover:opacity-100"
                                                onClick={() => {
                                                    setEditingId(cat.id);
                                                    setEditingName(cat.name);
                                                }}
                                                title="Editar nombre"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </Button>
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                className="h-8 w-8 text-muted-foreground hover:text-primary transition-opacity sm:opacity-0 group-hover:opacity-100"
                                                onClick={() => duplicateCatalog(cat)}
                                                title="Duplicar catálogo"
                                            >
                                                <Copy className="w-4 h-4" />
                                            </Button>
                                        </>
                                    )}
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        className="h-8 w-8 text-destructive hover:bg-destructive/10 transition-opacity sm:opacity-0 group-hover:opacity-100"
                                        onClick={() => deleteCatalog(cat.id)}
                                        title="Eliminar catálogo"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                            <AccordionContent className="pt-2 pb-4">
                                <div className="space-y-3">
                                    {/* Column headers based on type */}
                                    {cat.type === 'simple' && (
                                        <div className="grid grid-cols-12 gap-2 font-black text-[10px] text-muted-foreground uppercase tracking-wider mb-1 px-1">
                                            <div className="col-span-11">Etiqueta Visible</div>
                                            <div className="col-span-1"></div>
                                        </div>
                                    )}
                                    {cat.type === 'two_column' && (
                                        <div className="grid grid-cols-12 gap-2 font-black text-[10px] text-muted-foreground uppercase tracking-wider mb-1 px-1">
                                            <div className="col-span-6">Columna 1: Etiqueta Visible</div>
                                            <div className="col-span-5">Columna 2: Valor Principal</div>
                                            <div className="col-span-1"></div>
                                        </div>
                                    )}
                                    {cat.type === 'three_column' && (
                                        <div className="grid grid-cols-12 gap-2 font-black text-[10px] text-muted-foreground uppercase tracking-wider mb-1 px-1">
                                            <div className="col-span-4">Columna 1: Etiqueta Visible</div>
                                            <div className="col-span-4">Columna 2: Valor Principal</div>
                                            <div className="col-span-3">Columna 3: Valor Secundario</div>
                                            <div className="col-span-1"></div>
                                        </div>
                                    )}

                                    <div className="space-y-2">
                                        {cat.items.map((item: any) => (
                                            <div key={item.id} className="grid grid-cols-12 gap-2 items-center group">
                                                {cat.type === 'simple' && (
                                                    <>
                                                        <div className="col-span-11">
                                                            <Input
                                                                value={getItemValue(cat.id, item.id, 'label', item.label)}
                                                                onChange={e => updateItem(cat.id, item.id, 'label', e.target.value)}
                                                                onBlur={() => saveCatalogOnBlur(cat.id)}
                                                                placeholder="Etiqueta"
                                                                className="h-9 text-xs bg-background font-medium"
                                                            />
                                                        </div>
                                                        <div className="col-span-1 flex justify-end">
                                                            <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => deleteItem(cat.id, item.id)}>
                                                                <Trash2 className="w-3.5 h-3.5" />
                                                            </Button>
                                                        </div>
                                                    </>
                                                )}
                                                {cat.type === 'two_column' && (
                                                    <>
                                                        <div className="col-span-6">
                                                            <Input
                                                                value={getItemValue(cat.id, item.id, 'label', item.label)}
                                                                onChange={e => updateItem(cat.id, item.id, 'label', e.target.value)}
                                                                onBlur={() => saveCatalogOnBlur(cat.id)}
                                                                placeholder="Etiqueta visible"
                                                                className="h-9 text-xs bg-background font-medium"
                                                            />
                                                        </div>
                                                        <div className="col-span-5">
                                                            <Input
                                                                value={getItemValue(cat.id, item.id, 'value', item.value)}
                                                                onChange={e => updateItem(cat.id, item.id, 'value', e.target.value)}
                                                                onBlur={() => saveCatalogOnBlur(cat.id)}
                                                                placeholder="Valor principal"
                                                                className="h-9 text-xs bg-background"
                                                            />
                                                        </div>
                                                        <div className="col-span-1 flex justify-end">
                                                            <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => deleteItem(cat.id, item.id)}>
                                                                <Trash2 className="w-3.5 h-3.5" />
                                                            </Button>
                                                        </div>
                                                    </>
                                                )}
                                                {cat.type === 'three_column' && (
                                                    <>
                                                        <div className="col-span-4">
                                                            <Input
                                                                value={getItemValue(cat.id, item.id, 'label', item.label)}
                                                                onChange={e => updateItem(cat.id, item.id, 'label', e.target.value)}
                                                                onBlur={() => saveCatalogOnBlur(cat.id)}
                                                                placeholder="Etiqueta visible"
                                                                className="h-9 text-xs bg-background font-medium"
                                                            />
                                                        </div>
                                                        <div className="col-span-4">
                                                            <Input
                                                                value={getItemValue(cat.id, item.id, 'value', item.value)}
                                                                onChange={e => updateItem(cat.id, item.id, 'value', e.target.value)}
                                                                onBlur={() => saveCatalogOnBlur(cat.id)}
                                                                placeholder="Valor principal"
                                                                className="h-9 text-xs bg-background"
                                                            />
                                                        </div>
                                                        <div className="col-span-3">
                                                            <Input
                                                                value={getItemValue(cat.id, item.id, 'value2', item.value2 || '')}
                                                                onChange={e => updateItem(cat.id, item.id, 'value2', e.target.value)}
                                                                onBlur={() => saveCatalogOnBlur(cat.id)}
                                                                placeholder="Valor secundario"
                                                                className="h-9 text-xs bg-background"
                                                            />
                                                        </div>
                                                        <div className="col-span-1 flex justify-end">
                                                            <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => deleteItem(cat.id, item.id)}>
                                                                <Trash2 className="w-3.5 h-3.5" />
                                                            </Button>
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        ))}
                                    </div>

                                    {cat.items.length === 0 && (
                                        <div className="text-center py-6 border-2 border-dashed rounded-xl bg-background/50">
                                            <p className="text-xs text-muted-foreground italic">Este catálogo está vacío.</p>
                                        </div>
                                    )}

                                    <div className="flex gap-2 mt-2">
                                        <Button variant="outline" size="sm" className="flex-1 border-dashed hover:border-primary border-2 h-10 font-bold bg-background" onClick={() => addItem(cat.id)}>
                                            <Plus className="w-4 h-4 mr-2" /> Agregar Item
                                        </Button>
                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            className="border-2 border-transparent h-10 font-bold"
                                            onClick={() => {
                                                setShowBulkId(showBulkId === cat.id ? null : cat.id);
                                                setBulkText("");
                                            }}
                                        >
                                            <Zap className="w-4 h-4 mr-2 text-yellow-500 fill-yellow-500" /> Carga Masiva
                                        </Button>
                                    </div>

                                    {showBulkId === cat.id && (
                                        <div className="p-4 border-2 border-primary/20 rounded-xl bg-primary/5 space-y-3 animate-in fade-in slide-in-from-top-2">
                                            <div className="flex justify-between items-center">
                                                <div className="space-y-1">
                                                    <h4 className="text-xs font-black uppercase text-primary">Carga Masiva de Datos</h4>
                                                    <p className="text-[10px] text-muted-foreground">
                                                        Formato: <b>
                                                            {cat.type === 'three_column'
                                                                ? 'Etiqueta;Valor;Valor2, Etiqueta;Valor;Valor2...'
                                                                : 'Etiqueta;Valor, Etiqueta;Valor...'
                                                            }
                                                        </b>
                                                    </p>
                                                </div>
                                                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setShowBulkId(null)}>
                                                    <X className="w-3 h-3" />
                                                </Button>
                                            </div>
                                            <Textarea
                                                placeholder={cat.type === 'three_column' ? 'Ej: Cartagena;CTG;Caribe, Barranquilla;BAQ;Caribe' : 'Ej: Cartagena;CTG, Barranquilla;BAQ'}
                                                value={bulkText}
                                                onChange={e => setBulkText(e.target.value)}
                                                className="min-h-[100px] text-xs bg-background"
                                            />
                                            <div className="flex justify-end gap-2">
                                                <Button variant="ghost" size="sm" className="h-8 text-xs font-bold" onClick={() => setShowBulkId(null)}>Cancelar</Button>
                                                <Button size="sm" className="h-8 text-xs font-bold px-6" onClick={() => handleBulkAdd(cat.id)}>Procesar e Importar</Button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                    {(!catalogs || catalogs.length === 0) && (
                        <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed rounded-2xl bg-muted/10">
                            <List className="w-10 h-10 text-muted-foreground opacity-20 mb-4" />
                            <p className="text-sm font-medium text-muted-foreground">No hay catálogos creados todavía.</p>
                            <Button variant="link" onClick={() => setIsCreating(true)}>Comenzar creando uno</Button>
                        </div>
                    )}
                    {catalogs && catalogs.length > 0 && filteredCatalogs?.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-16 border-2 border-dashed rounded-2xl bg-muted/10">
                            <List className="w-10 h-10 text-muted-foreground opacity-20 mb-4" />
                            <p className="text-sm font-medium text-muted-foreground">Ningún catálogo coincide con el filtro seleccionado.</p>
                        </div>
                    )}
                </Accordion>
            </CardContent>
        </Card>
    );
}

