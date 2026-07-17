"use client";

import { useMemo } from "react";
import { useAppTexts } from "@/hooks/useData";
import { defaultTexts } from "@/lib/appTexts";
import { hexToRgba, getContrastColor } from "@/lib/colorUtils";

export interface DesignSettings {
  colors: {
    navy: string;
    gold: string;
    teal: string;
    cream: string;
  };
  fonts: {
    title: string;
    body: string;
  };
  textColors: {
    titleLight: string;
    titleDark: string;
    subtitleLight: string;
    subtitleDark: string;
    bodyLight: string;
    bodyDark: string;
  };
}

const defaults: DesignSettings = {
  colors: { navy: "#15123A", gold: "#C4953C", teal: "#0D9488", cream: "#F5F3F0" },
  fonts: { title: "Syne", body: "DM Sans" },
  textColors: {
    titleLight: "#0F0B29", titleDark: "#FFFFFF",
    subtitleLight: "#2D2960", subtitleDark: "#D4C8B0",
    bodyLight: "#1A1740", bodyDark: "#E8E0D0",
  },
};

function val(map: Map<string, string>, key: string, def: string): string {
  return map.get(`design.${key}`) || defaultTexts[`design.${key}`] || def;
}

export function useDesignSettings(): DesignSettings {
  const { data: overrides } = useAppTexts();

  return useMemo(() => {
    const m = new Map<string, string>();
    overrides?.forEach((item: any) => m.set(item.id, item.value));

    const colors = {
      navy: val(m, "color_navy", defaults.colors.navy),
      gold: val(m, "color_gold", defaults.colors.gold),
      teal: val(m, "color_teal", defaults.colors.teal),
      cream: val(m, "color_cream", defaults.colors.cream),
    };

    const textColors = {
      titleLight: getContrastColor(colors.cream, colors.cream, colors.navy),
      titleDark: getContrastColor(colors.navy, colors.cream, colors.navy),
      subtitleLight: hexToRgba(getContrastColor(colors.cream, colors.cream, colors.navy), 0.65),
      subtitleDark: hexToRgba(getContrastColor(colors.navy, colors.cream, colors.navy), 0.75),
      bodyLight: hexToRgba(getContrastColor(colors.cream, colors.cream, colors.navy), 0.7),
      bodyDark: hexToRgba(getContrastColor(colors.navy, colors.cream, colors.navy), 0.85),
    };

    return {
      colors,
      fonts: {
        title: val(m, "title_font", defaults.fonts.title),
        body: val(m, "body_font", defaults.fonts.body),
      },
      textColors,
    };
  }, [overrides]);
}
