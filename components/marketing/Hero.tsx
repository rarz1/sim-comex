"use client";

import React, { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useAppText } from "@/hooks/useAppText";
import { useDesignSettings } from "@/hooks/useDesignSettings";
import { hexToRgba } from "@/lib/colorUtils";
import { DynamicIcon } from "@/components/shared/DynamicIcon";

function LetterHover({ text, className }: { text: string; className?: string }) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  return (
    <span className={`inline-block ${className}`}>
      {text.split("").map((char, i) => (
        <motion.span
          key={i}
          onMouseEnter={() => setHoveredIndex(i)}
          onMouseLeave={() => setHoveredIndex(null)}
          animate={{
            y: hoveredIndex === i ? -8 : 0,
            color: hoveredIndex === i ? "#C4953C" : undefined,
          }}
          transition={{ type: "spring", stiffness: 300, damping: 12 }}
          className="inline-block cursor-default"
          style={{ transitionDelay: `${i * 10}ms` }}
        >
          {char === " " ? "\u00A0" : char}
        </motion.span>
      ))}
    </span>
  );
}

export const Hero = () => {
  const { t } = useAppText();
  const { colors } = useDesignSettings();
  const heroBgColor = t('marketing.bg.hero_color', colors.cream || '#F5F3F0');
  const heroBgOpacity = Number(t('marketing.bg.hero_opacity', '40')) / 100;
  const heroLines = useMemo(() => [
    { text: t('marketing.hero.line_1', 'APRENDIZAJE BASADO'), delay: 0 },
    { text: t('marketing.hero.line_2', 'EN SIMULACION PARA LA'), delay: 0.15 },
    { text: t('marketing.hero.line_3', 'GESTION DOCUMENTAL'), delay: 0.3 },
    { text: t('marketing.hero.line_4', 'DEL COMERCIO EXTERIOR'), delay: 0.45 },
  ], [t]);
  return (
    <section className="relative pt-32 pb-24 px-6 overflow-hidden min-h-[90vh] flex flex-col items-start justify-center text-left"
      style={{ backgroundColor: hexToRgba(heroBgColor, heroBgOpacity) }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="flex items-center gap-2 px-5 py-2 rounded-full border mb-8 backdrop-blur-sm"
        style={{ borderColor: hexToRgba(colors.navy, 0.1), backgroundColor: hexToRgba(colors.cream, 0.8) }}
      >
        <DynamicIcon name={t('marketing.hero.icon', 'Zap')} className="w-4 h-4" style={{ color: colors.gold, fill: colors.gold }} />
        <span className="text-[0.65rem] font-bold uppercase tracking-[0.15em]" style={{ color: colors.navy }}>
          {t('marketing.hero.badge', 'Simuladores Asistidos con IA para el Comercio Exterior')}
        </span>
      </motion.div>

      <h1 className="font-heading font-black tracking-[-0.07em] leading-[1.05] mb-6 flex flex-col items-start gap-1 select-none uppercase">
        {heroLines.map((line, idx) => (
          <motion.span
            key={idx}
            initial={{ opacity: 0, y: idx === 0 ? -60 : idx === 3 ? 60 : idx === 1 ? -30 : 30, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] as const, delay: line.delay }}
            className="whitespace-nowrap text-3xl md:text-4xl lg:text-5xl leading-[1.1] bg-clip-text text-transparent animate-gradient-shift"
            style={{ backgroundImage: `linear-gradient(to right, ${colors.navy}, ${colors.gold}, ${colors.navy})` }}
          >
            <LetterHover text={line.text} />
          </motion.span>
        ))}
      </h1>

      <div className="flex flex-col md:flex-row md:items-center gap-6 md:gap-16 w-full max-w-4xl">
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="text-lg md:text-xl max-w-2xl font-medium leading-normal tracking-wide"
          style={{ color: hexToRgba(colors.navy, 0.6) }}
        >
          {t('marketing.hero.description', 'Un entorno tecnológico de aprendizaje interactivo asistido con IA, que transforma la teoría en práctica de la gestión en procesos documentales, convergiendo en la formación y preparación de profesionales para el comercio global.')}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="shrink-0"
        >
          <Link href="/login">
            <Button
              size="lg"
              className="h-14 px-12 text-white rounded-full font-bold text-base transition-all hover:scale-105 active:scale-95 group"
              style={{ backgroundColor: colors.navy, boxShadow: `0 20px 50px ${hexToRgba(colors.navy, 0.25)}` }}
            >
              <span className="mr-2">{t('marketing.hero.btn_text', 'INGRESAR')}</span>
              <span className="inline-block transition-transform duration-300 group-hover:translate-x-1">{t('marketing.hero.btn_arrow', '→')}</span>
            </Button>
          </Link>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="w-5 h-8 rounded-full border-2 flex items-start justify-center p-1"
          style={{ borderColor: hexToRgba(colors.navy, 0.2) }}
        >
          <motion.div className="w-1 h-2 rounded-full" style={{ backgroundColor: hexToRgba(colors.navy, 0.3) }} />
        </motion.div>
      </motion.div>
    </section>
  );
};
