"use client";

import React, { useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useAppText } from "@/hooks/useAppText";
import { useDesignSettings } from "@/hooks/useDesignSettings";
import { hexToRgba } from "@/lib/colorUtils";
import { DynamicIcon } from "@/components/shared/DynamicIcon";

export const AccessSection = () => {
  const { t } = useAppText();
  const { colors } = useDesignSettings();
  const { scrollY } = useScroll();
  const bgY = useTransform(scrollY, [2300, 3000], [0, -80]);
  const [isBtnHovered, setIsBtnHovered] = useState(false);
  const accessBgColor = t('marketing.bg.access_color', colors.navy || '#15123A');
  const accessBgOpacity = Number(t('marketing.bg.access_opacity', '70')) / 100;

  return (
    <section className="relative min-h-[60vh] flex flex-col justify-center py-24 px-6 backdrop-blur-sm overflow-hidden border-y"
      style={{
        backgroundColor: hexToRgba(accessBgColor, accessBgOpacity),
        borderColor: hexToRgba('#FFFFFF', 0.06),
      }}
    >
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-white/[0.02] via-transparent to-black/[0.06]" />
      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={{
          y: bgY,
          background: `radial-gradient(ellipse at 30% 50%, ${hexToRgba(colors.gold, 0.08)} 0%, transparent 60%)`,
        }}
      />

      <div className="max-w-6xl mx-auto relative z-10 flex flex-col md:flex-row items-center justify-center gap-16 md:gap-32">
        <motion.div
          initial={{ opacity: 0, x: -60 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] as const }}
          viewport={{ once: true }}
          className="flex-1 flex flex-col items-center md:items-end text-center md:text-right"
        >
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6" style={{ backgroundColor: hexToRgba(colors.gold, 0.2) }}>
            <DynamicIcon name={t('marketing.access.icon', 'ShieldCheck')} className="w-7 h-7" style={{ color: colors.gold }} />
          </div>
          <h2 className="font-heading text-4xl md:text-5xl font-black text-white mb-4 tracking-tight uppercase leading-[0.9]">
            {t("marketing.access.title_1", "Seguridad")} <br />y{" "}
            <span style={{ color: colors.gold }}>{t("marketing.access.title_2", "Control")}</span>
          </h2>
          <div className="w-12 h-[2px] mx-auto md:mr-0 mb-6" style={{ backgroundColor: hexToRgba(colors.gold, 0.5) }} />
          <p className="text-base md:text-lg text-white/50 font-medium leading-relaxed max-w-md tracking-wide">
            {t("marketing.access.description", "Un entorno seguro donde la información está protegida con estándares de clase mundial, y la gestión documental y de procesos se adapta al ritmo y rol de cada usuario con la mejor experiencia educativa.")}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 60 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] as const }}
          viewport={{ once: true }}
          className="flex-1 flex justify-center md:justify-start"
        >
          <Link href="/login">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }} className="group">
              <Button
                className="h-14 md:h-16 px-14 md:px-20 rounded-full font-bold text-xl md:text-2xl shadow-2xl transition-all uppercase"
                style={{
                  backgroundColor: isBtnHovered ? hexToRgba(colors.gold, 0.9) : colors.gold,
                  color: colors.navy,
                  boxShadow: `0 25px 50px -12px ${hexToRgba(colors.gold, 0.3)}`,
                }}
                onMouseEnter={() => setIsBtnHovered(true)}
                onMouseLeave={() => setIsBtnHovered(false)}
              >
                {t("marketing.access.btn_text", "Ingresar")}
                <ArrowRight className="ml-3 w-5 h-5 md:w-6 md:h-6 inline-block transition-transform duration-300 group-hover:translate-x-1" />
              </Button>
            </motion.div>
          </Link>
        </motion.div>
      </div>
    </section>
  );
};
