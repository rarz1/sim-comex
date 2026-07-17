"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { useAppText } from "@/hooks/useAppText";
import { useDesignSettings } from "@/hooks/useDesignSettings";
import { hexToRgba } from "@/lib/colorUtils";
import { DynamicIcon } from "@/components/shared/DynamicIcon";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.12 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 40, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] as const },
  },
};

export const SimulatorsGrid = () => {
  const { t } = useAppText();
  const { colors } = useDesignSettings();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [closeBtnHovered, setCloseBtnHovered] = useState(false);
  const simBgColor = t('marketing.bg.simulators_color', colors.navy || '#15123A');
  const simBgOpacity = Number(t('marketing.bg.simulators_opacity', '50')) / 100;
  const simulators = useMemo(() => [
    { id: "export", iconKey: "marketing.simulators.icon_1", title: t('marketing.simulators.card_1_title', 'Procesos de Exportación'), description: t('marketing.simulators.card_1_desc', 'Régimen que regula la salida legal de mercancías del territorio nacional hacia mercados externos.') },
    { id: "import", iconKey: "marketing.simulators.icon_2", title: t('marketing.simulators.card_2_title', 'Procesos de Importación'), description: t('marketing.simulators.card_2_desc', 'Régimen que regula el ingreso legal de mercancías extranjeras para consumo o uso nacional.') },
    { id: "tariff", iconKey: "marketing.simulators.icon_3", title: t('marketing.simulators.card_3_title', 'Operaciones de Clasificación Arancelaria'), description: t('marketing.simulators.card_3_desc', 'Sistema de codificación universal de las mercancías objeto de comercio internacional.') },
    { id: "exchange", iconKey: "marketing.simulators.icon_4", title: t('marketing.simulators.card_4_title', 'Operaciones Cambiarias'), description: t('marketing.simulators.card_4_desc', 'Régimen que regula el control y canalización legal de las divisas derivadas de las operaciones internacionales.') },
    { id: "logistics", iconKey: "marketing.simulators.icon_5", title: t('marketing.simulators.card_5_title', 'Operaciones Logísticas'), description: t('marketing.simulators.card_5_desc', 'Gestión física y eficiente de la carga en la cadena de suministro.') },
  ], [t]);
  const selectedCard = simulators.find((s) => s.id === selectedId);

  return (
    <section
      id="simuladores"
      className="min-h-[70vh] flex flex-col justify-center py-28 px-6 backdrop-blur-sm border-y overflow-hidden relative"
      style={{
        backgroundColor: hexToRgba(simBgColor, simBgOpacity),
        borderColor: hexToRgba('#FFFFFF', 0.06),
        color: '#FFFFFF',
      }}
    >
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-white/[0.03] via-transparent to-black/[0.08]" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[500px] rounded-full pointer-events-none opacity-70"
        style={{ background: `radial-gradient(ellipse, ${hexToRgba(colors.gold, 0.07)} 0%, transparent 70%)` }}
      />

      <div className="max-w-7xl mx-auto relative z-10 w-full">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] as const }}
          viewport={{ once: true, margin: "-100px" }}
          className="text-center mb-16"
        >
          <span
            className="inline-block font-bold text-xs tracking-[0.2em] uppercase mb-4"
            style={{ color: colors.gold }}
          >
            {t('marketing.simulators.badge', 'Plataforma de Simulación')}
          </span>
          <h2 className="font-heading text-4xl md:text-5xl font-black tracking-tight uppercase">
            {t('marketing.simulators.title_before', 'Nuestros')}{' '}
            <span style={{ color: colors.gold }}>{t('marketing.simulators.title_highlight', 'Simuladores')}</span>
          </h2>
          <div
            className="w-16 h-[2px] mx-auto mt-6"
            style={{ backgroundColor: hexToRgba(colors.gold, 0.5) }}
          />
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4"
        >
          {simulators.map((sim) => {
            const isHovered = hoveredId === sim.id;
            return (
              <motion.div
                key={sim.id}
                variants={cardVariants}
                layout
                onClick={() => setSelectedId(sim.id)}
                onMouseEnter={() => setHoveredId(sim.id)}
                onMouseLeave={() => setHoveredId(null)}
                className="relative rounded-2xl p-6 md:p-8 border cursor-pointer transition-shadow duration-300 min-h-[180px] md:min-h-[220px] flex flex-col items-center justify-center text-center"
                style={{
                  backgroundColor: hexToRgba(simBgColor, 0.4),
                  backdropFilter: 'blur(12px)',
                  borderColor: isHovered ? hexToRgba(colors.gold, 0.3) : hexToRgba('#FFFFFF', 0.08),
                  boxShadow: isHovered
                    ? '0 25px 50px -12px ' + hexToRgba(colors.gold, 0.1)
                    : undefined,
                }}
              >
                <div
                  className="w-12 h-12 md:w-14 md:h-14 rounded-xl flex items-center justify-center mb-4 transition-all duration-300"
                  style={{
                    backgroundColor: isHovered
                      ? hexToRgba(colors.gold, 0.2)
                      : hexToRgba('#FFFFFF', 0.1),
                    transform: isHovered ? 'scale(1.1)' : 'scale(1)',
                  }}
                >
                  <DynamicIcon name={t(sim.iconKey, 'Ship')}
                    className="w-6 h-6 md:w-7 md:h-7 transition-colors duration-300"
                    style={{
                      color: isHovered ? colors.gold : hexToRgba('#FFFFFF', 0.8),
                    }}
                  />
                </div>
                <h3
                  className="font-heading font-bold text-sm md:text-base uppercase tracking-wide transition-colors duration-300"
                  style={{ color: isHovered ? colors.gold : undefined }}
                >
                  {sim.title}
                </h3>
                <div
                  className="absolute bottom-3 left-1/2 -translate-x-1/2 transition-opacity duration-300"
                  style={{ opacity: isHovered ? 1 : 0 }}
                >
                  <span
                    className="text-[0.6rem] uppercase tracking-widest"
                    style={{ color: hexToRgba('#FFFFFF', 0.4) }}
                  >
                    {t('marketing.simulators.card_hint', 'Click para más')}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>

      <AnimatePresence>
        {selectedId && selectedCard && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedId(null)}
              className="absolute inset-0 backdrop-blur-md"
              style={{ backgroundColor: hexToRgba(colors.navy, 0.8) }}
            />

            <motion.div
              layoutId={selectedId}
              className="relative w-full max-w-lg rounded-[2rem] p-10 md:p-12 overflow-hidden shadow-2xl"
              style={{
                backgroundColor: colors.cream,
                color: colors.navy,
              }}
            >
              <button
                onClick={() => setSelectedId(null)}
                onMouseEnter={() => setCloseBtnHovered(true)}
                onMouseLeave={() => setCloseBtnHovered(false)}
                className="absolute top-5 right-5 p-2 rounded-full transition-all"
                style={{
                  backgroundColor: closeBtnHovered
                    ? hexToRgba(colors.navy, 0.1)
                    : 'transparent',
                  color: closeBtnHovered
                    ? colors.navy
                    : hexToRgba(colors.navy, 0.4),
                }}
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex flex-col items-center text-center">
                <div
                  className="w-20 h-20 rounded-2xl flex items-center justify-center mb-8 shadow-lg"
                  style={{ backgroundColor: colors.navy }}
                >
                  <DynamicIcon name={t(selectedCard.iconKey, 'Ship')}
                    className="w-10 h-10"
                    style={{ color: '#FFFFFF' }}
                  />
                </div>

                <h3
                  className="font-heading text-3xl md:text-4xl font-black mb-4 uppercase"
                  style={{ color: colors.navy }}
                >
                  {selectedCard.title}
                </h3>

                <div
                  className="w-12 h-[2px] mx-auto mb-6"
                  style={{ backgroundColor: hexToRgba(colors.gold, 0.5) }}
                />

                <p
                  className="text-base font-medium leading-relaxed max-w-md"
                  style={{ color: hexToRgba(colors.navy, 0.7) }}
                >
                  {selectedCard.description}
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
};