"use client";

import { iconMap } from "@/lib/iconMap";
import { ImageIcon } from "lucide-react";

export function DynamicIcon({ name, className, style }: { name: string; className?: string; style?: React.CSSProperties }) {
  if (name.startsWith('http')) {
    return <img src={name} alt="" className={className} style={style as React.CSSProperties} />;
  }
  const Icon = iconMap[name] || ImageIcon;
  return <Icon className={className} style={style} />;
}
