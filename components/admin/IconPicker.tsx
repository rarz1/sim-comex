"use client";

import { useState, useRef } from "react";
import { iconMap, ICON_NAMES } from "@/lib/iconMap";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Upload, ImageIcon, Loader2 } from "lucide-react";

interface IconPickerProps {
  value: string;
  onChange: (name: string) => void;
}

const isUrl = (v: string) => v.startsWith('http');

export function IconPicker({ value, onChange }: IconPickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const SelectedIcon = iconMap[value];
  const filtered = search ? ICON_NAMES.filter(n => n.toLowerCase().includes(search.toLowerCase())) : ICON_NAMES;

  const handleUpload = async (file: File) => {
    if (file.type !== 'image/png') return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('path', `icons/${Date.now()}.png`);
      const res = await fetch('/api/storage/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onChange(data.url);
      setOpen(false);
    } catch { /* toast handled elsewhere */ } finally {
      setUploading(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="h-9 w-9 p-0 overflow-hidden" onClick={() => setOpen(true)}>
          {isUrl(value) ? (
            <img src={value} alt="" className="w-5 h-5 object-contain" />
          ) : SelectedIcon ? (
            <SelectedIcon className="w-4 h-4" />
          ) : (
            <ImageIcon className="w-4 h-4 text-muted-foreground" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-3" align="start">
        <Input
          placeholder="Buscar icono..."
          className="h-8 text-xs mb-2 rounded-lg"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="max-h-48 overflow-y-auto grid grid-cols-6 gap-1 mb-2">
          {filtered.map((name) => {
            const Icon = iconMap[name];
            const isActive = name === value;
            return (
              <button
                key={name}
                onClick={() => { onChange(name); setOpen(false); }}
                className={`p-2 rounded-md transition-colors flex items-center justify-center ${isActive ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}
                title={name}
              >
                <Icon className="w-4 h-4" />
              </button>
            );
          })}
        </div>
        <div className="border-t pt-2">
          <input
            ref={fileRef}
            type="file"
            accept=".png,image/png"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(f); }}
          />
          <Button
            variant="outline"
            size="sm"
            className="w-full h-8 text-xs gap-1.5"
            disabled={uploading}
            onClick={() => fileRef.current?.click()}
          >
            {uploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
            {uploading ? "Subiendo..." : "Subir PNG personalizado"}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
