"use client";

import { useState, useRef } from "react";
import { useAppTexts, useCreateOrUpdateAppText } from "@/hooks/useData";
import { defaultTexts } from "@/lib/appTexts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Save, RotateCcw, Image, Type, Palette, Upload, Loader2 } from "lucide-react";
import { IconPicker } from "@/components/admin/IconPicker";
import { useAppText } from "@/hooks/useAppText";
import { toast } from "sonner";

const FONT_OPTIONS = [
  { value: "Inter", label: "Inter" },
  { value: "DM Sans", label: "DM Sans" },
  { value: "Syne", label: "Syne" },
  { value: "Plus Jakarta Sans", label: "Plus Jakarta Sans" },
  { value: "Outfit", label: "Outfit" },
  { value: "Sora", label: "Sora" },
  { value: "Clash Display", label: "Clash Display" },
  { value: "Cabinet Grotesk", label: "Cabinet Grotesk" },
  { value: "Manrope", label: "Manrope" },
  { value: "Figtree", label: "Figtree" },
];

const COLOR_PRESETS = [
  { label: "Navy & Gold", navy: "#15123A", gold: "#C4953C", teal: "#0D9488", cream: "#F5F3F0" },
  { label: "Blue & Amber", navy: "#1E3A5F", gold: "#E8A838", teal: "#0EA5E9", cream: "#F8F6F3" },
  { label: "Slate & Rose", navy: "#1E293B", gold: "#E11D48", teal: "#14B8A6", cream: "#FAF9F6" },
  { label: "Emerald & Bronze", navy: "#064E3B", gold: "#B8860B", teal: "#10B981", cream: "#F5F2EB" },
  { label: "Purple & Pearl", navy: "#2D1B69", gold: "#D4A5A5", teal: "#8B5CF6", cream: "#F7F5FA" },
];

export function LandingPageDesigner() {
  const { t } = useAppText();
  const { data: overrides } = useAppTexts();
  const createOrUpdateAppText = useCreateOrUpdateAppText();
  const overrideMap = new Map<string, string>();
  const locationMap = new Map<string, string>();
  overrides?.forEach((item: any) => {
    overrideMap.set(item.id, item.value);
    if (item.location) locationMap.set(item.id, item.location);
  });

  const [saving, setSaving] = useState<string | null>(null);
  const [previewBg, setPreviewBg] = useState<string | null>(null);
  const [bgOpacity, setBgOpacity] = useState(40);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleSave = async (key: string, value: string, location?: string) => {
    setSaving(key);
    try {
      await createOrUpdateAppText.mutateAsync({ id: key, key, value, location: location ?? locationMap.get(key) ?? '' });
      toast.success("Guardado");
    } catch {
      toast.error("Error al guardar");
    } finally {
      setSaving(null);
    }
  };

  const handleReset = async (key: string) => {
    const defaultVal = defaultTexts[key] || '';
    await createOrUpdateAppText.mutateAsync({ id: key, key, value: defaultVal, location: locationMap.get(key) ?? '' });
    toast.success("Restaurado");
  };

  const handleBgUpload = async (file: File) => {
    if (file.type !== 'image/png') {
      toast.error("Solo se permiten archivos PNG");
      return;
    }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('path', `landing/bg-${Date.now()}.png`);
      const res = await fetch('/api/storage/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setPreviewBg(data.url);
      await handleSave('marketing.bg.url', data.url);
      toast.success("Imagen de fondo subida");
    } catch (err: any) {
      toast.error("Error al subir: " + (err.message || 'desconocido'));
    } finally {
      setUploading(false);
    }
  };

  const renderEditor = (keys: string[], group: string) => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
      {keys.map(key => {
        const defaultValue = defaultTexts[key] || '';
        const currentValue = overrideMap.get(key) || defaultValue;
        const currentLocation = locationMap.get(key) || '';
        const isEdited = overrideMap.has(key);
        const isIconKey = key.includes('.icon');
        return (
          <Card key={key} className={`shadow-sm ${isEdited ? 'border-primary/40 bg-primary/5' : ''}`}>
            <CardContent className="p-3 space-y-2">
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="text-[9px] font-mono opacity-50">{key.replace(group + '.', '')}</Badge>
                <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => handleReset(key)} disabled={!isEdited}>
                  <RotateCcw className="h-3 w-3" />
                </Button>
              </div>
              {isIconKey ? (
                <div className="flex items-center gap-3 py-1">
                  <IconPicker value={currentValue} onChange={(name) => handleSave(key, name)} />
                  <span className="text-xs font-mono text-muted-foreground">{currentValue}</span>
                </div>
              ) : (
                <Textarea
                  defaultValue={currentValue}
                  data-text-for={key}
                  className="min-h-[36px] text-sm resize-none"
                  onBlur={(e) => { if (e.target.value !== currentValue) handleSave(key, e.target.value); }}
                />
              )}
              <input
                defaultValue={currentLocation}
                data-location-for={key}
                placeholder="Ubicación (ej: Hero, badge debajo del título)"
                className="w-full text-[10px] px-2 py-1 rounded-md bg-muted/30 border border-transparent focus:border-primary/30 focus:bg-background outline-none transition-all placeholder:text-muted-foreground/30"
                onBlur={(e) => {
                  if (e.target.value !== currentLocation) {
                    const textarea = document.querySelector(`textarea[data-text-for="${key}"]`) as HTMLTextAreaElement;
                    const val = textarea?.value || currentValue;
                    handleSave(key, val, e.target.value);
                  }
                }}
              />
            </CardContent>
          </Card>
        );
      })}
    </div>
  );

  const sections = [
    { key: "marketing.navbar", label: "Barra de Navegación", icon: "🔗" },
    { key: "marketing.hero", label: "Hero / Portada", icon: "🖼️" },
    { key: "marketing.simulators", label: "Simuladores", icon: "🛠️" },
    { key: "marketing.access", label: "Acceso / Seguridad", icon: "🔒" },
    { key: "marketing.contact", label: "Contacto", icon: "📧" },
    { key: "marketing.footer", label: "Footer / Pie", icon: "📄" },
    { key: "marketing.bg", label: "Fondo / Background", icon: "🌅" },
  ];

  return (
    <Tabs defaultValue="texts" className="space-y-4">
      <TabsList className="bg-muted/30 p-1 rounded-xl h-auto w-fit flex-wrap">
        <TabsTrigger value="texts" className="rounded-lg px-4 data-[state=active]:bg-background data-[state=active]:shadow-sm text-xs font-bold h-9">
          <Type className="w-3.5 h-3.5 mr-1.5" /> Textos
        </TabsTrigger>
        <TabsTrigger value="design" className="rounded-lg px-4 data-[state=active]:bg-background data-[state=active]:shadow-sm text-xs font-bold h-9">
          <Palette className="w-3.5 h-3.5 mr-1.5" /> Diseño
        </TabsTrigger>
        <TabsTrigger value="background" className="rounded-lg px-4 data-[state=active]:bg-background data-[state=active]:shadow-sm text-xs font-bold h-9">
          <Image className="w-3.5 h-3.5 mr-1.5" /> Fondo
        </TabsTrigger>
      </TabsList>

      <TabsContent value="texts">
        <div className="space-y-8">
          {sections.map((section) => {
            const sectionKeys = Object.keys(defaultTexts).filter(k => k.startsWith(section.key) && !k.includes('.icon'));
            if (sectionKeys.length === 0) return null;
            const iconCount = Object.keys(defaultTexts).filter(k => k.startsWith(section.key) && k.includes('.icon')).length;
            return (
              <div key={section.key}>
                <h3 className="text-xs font-black uppercase text-muted-foreground/60 mb-3 tracking-widest flex items-center gap-2">
                  <span>{section.icon}</span>
                  <span>{section.label}</span>
                  <span className="text-[9px] font-mono opacity-30 font-normal normal-case ml-auto">{sectionKeys.length} textos{iconCount > 0 ? `, ${iconCount} iconos` : ''}</span>
                </h3>
                {renderEditor(sectionKeys, section.key)}
              </div>
            );
          })}
        </div>
      </TabsContent>

      <TabsContent value="design">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Paleta de Colores</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-3 mb-4">
              {COLOR_PRESETS.map((preset, i) => (
                <div key={i} className="p-2 border rounded-lg hover:bg-muted/30 cursor-pointer transition-colors"
                  onClick={() => {
                    handleSave("design.color_navy", preset.navy);
                    handleSave("design.color_gold", preset.gold);
                    handleSave("design.color_teal", preset.teal);
                    handleSave("design.color_cream", preset.cream);
                  }}
                >
                  <div className="flex gap-1">
                    <div className="w-6 h-6 rounded" style={{ background: preset.navy }} />
                    <div className="w-6 h-6 rounded" style={{ background: preset.gold }} />
                    <div className="w-6 h-6 rounded" style={{ background: preset.teal }} />
                    <div className="w-6 h-6 rounded" style={{ background: preset.cream }} />
                  </div>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2 border-t">
              {(["#15123A", "#C4953C", "#0D9488", "#F5F3F0"]).map((defaultVal, i) => {
                const keys = ["design.color_navy", "design.color_gold", "design.color_teal", "design.color_cream"];
                const key = keys[i];
                const currentVal = overrideMap.get(key) || defaultTexts[key] || defaultVal;
                return (
                  <div key={key}>
                    <Input type="color" defaultValue={currentVal} className="w-10 h-8 p-0.5 cursor-pointer"
                      onBlur={(e) => { if (e.target.value !== currentVal) handleSave(key, e.target.value); }}
                    />
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          <Card>
            <CardHeader><CardTitle className="text-sm">Tipografía</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1">
                <Label className="text-xs">Fuente de Títulos</Label>
                <Select defaultValue={overrideMap.get("design.title_font") || defaultTexts["design.title_font"] || "Syne"}
                  onValueChange={(v) => handleSave("design.title_font", v)}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {FONT_OPTIONS.map(f => (
                      <SelectItem key={f.value} value={f.value} style={{ fontFamily: f.value }}>{f.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Fuente de Cuerpo</Label>
                <Select defaultValue={overrideMap.get("design.body_font") || defaultTexts["design.body_font"] || "DM Sans"}
                  onValueChange={(v) => handleSave("design.body_font", v)}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {FONT_OPTIONS.map(f => (
                      <SelectItem key={f.value} value={f.value} style={{ fontFamily: f.value }}>{f.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

        </div>
      </TabsContent>

      <TabsContent value="background">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader><CardTitle className="text-sm">Imagen de Fondo</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <Label className="text-xs">Subir imagen PNG (fondo de la landing)</Label>
              <div className="flex items-center gap-2">
                <input
                  ref={fileRef}
                  type="file"
                  accept=".png,image/png"
                  className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handleBgUpload(f); }}
                />
                <Button
                  variant="outline"
                  className="w-full h-24 border-dashed flex flex-col gap-2"
                  disabled={uploading}
                  onClick={() => fileRef.current?.click()}
                >
                  {uploading ? (
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  ) : (
                    <Upload className="w-6 h-6 text-muted-foreground" />
                  )}
                  <span className="text-xs font-medium text-muted-foreground">
                    {uploading ? "Subiendo..." : "Seleccionar PNG"}
                  </span>
                </Button>
              </div>
              {previewBg && (
                <div className="relative mt-2 rounded-lg overflow-hidden border">
                  <img src={previewBg} alt="Preview" className="w-full h-32 object-cover" />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-1 right-1 h-6 w-6 bg-background/80 hover:bg-background"
                    onClick={() => { setPreviewBg(null); handleSave('marketing.bg.url', ''); }}
                  >
                    <RotateCcw className="h-3 w-3" />
                  </Button>
                </div>
              )}
              <div className="space-y-1">
                <Label className="text-xs">Opacidad de la imagen</Label>
                <input
                  type="range"
                  min={0}
                  max={100}
                  defaultValue={40}
                  onChange={(e) => { setBgOpacity(Number(e.target.value)); handleSave('design.bg_opacity', String(e.target.value)); }}
                  className="w-full h-1.5 bg-muted rounded-full appearance-none cursor-pointer accent-primary [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:shadow-md"
                />
                <span className="text-[10px] text-muted-foreground">{bgOpacity}%</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-sm">Secciones</CardTitle></CardHeader>
            <CardContent className="space-y-5">
              {[
                { key: "hero", label: "Hero (Portada)", colorKey: "marketing.bg.hero_color", opacityKey: "marketing.bg.hero_opacity", defaultColor: "#F5F3F0", defaultOpacity: 40 },
                { key: "simulators", label: "Simuladores", colorKey: "marketing.bg.simulators_color", opacityKey: "marketing.bg.simulators_opacity", defaultColor: "#15123A", defaultOpacity: 50 },
                { key: "contact", label: "Contacto", colorKey: "marketing.bg.contact_color", opacityKey: "marketing.bg.contact_opacity", defaultColor: "#F5F3F0", defaultOpacity: 50 },
                { key: "access", label: "Acceso", colorKey: "marketing.bg.access_color", opacityKey: "marketing.bg.access_opacity", defaultColor: "#15123A", defaultOpacity: 70 },
                { key: "footer", label: "Footer", colorKey: "marketing.bg.footer_color", opacityKey: "marketing.bg.footer_opacity", defaultColor: "#F5F3F0", defaultOpacity: 30 },
              ].map(s => {
                const curColor = overrideMap.get(s.colorKey) || defaultTexts[s.colorKey] || s.defaultColor;
                const curOpacity = Number(overrideMap.get(s.opacityKey) || defaultTexts[s.opacityKey] || s.defaultOpacity);
                return (
                  <div key={s.key} className="p-3 border rounded-xl space-y-3">
                    <Label className="text-xs font-bold tracking-wide uppercase">{s.label}</Label>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2 flex-1">
                        <Input type="color" defaultValue={curColor} className="w-9 h-8 p-0.5 cursor-pointer"
                          onBlur={(e) => { if (e.target.value !== curColor) handleSave(s.colorKey, e.target.value); }}
                        />
                        <span className="text-[10px] font-mono text-muted-foreground">{curColor}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <input type="range" min={0} max={100} defaultValue={curOpacity}
                          onChange={(e) => handleSave(s.opacityKey, e.target.value)}
                          className="w-20 h-1.5 bg-muted rounded-full appearance-none cursor-pointer accent-primary [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:shadow-md"
                        />
                        <span className="text-[10px] font-mono text-muted-foreground w-6 text-right">{curOpacity}%</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader><CardTitle className="text-sm">Iconos</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {Object.keys(defaultTexts).filter(k => k.includes('.icon')).map(key => {
                const currentValue = overrideMap.get(key) || defaultTexts[key] || '';
                return (
                  <div key={key} className="flex items-center gap-3 p-2 border rounded-lg">
                    <IconPicker value={currentValue} onChange={(name) => handleSave(key, name)} />
                    <div className="flex flex-col min-w-0">
                      <span className="text-[9px] font-mono text-muted-foreground truncate">{key.replace('marketing.', '').replace('.icon', '')}</span>
                      <span className="text-[9px] font-mono text-muted-foreground/50 truncate">{currentValue}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
