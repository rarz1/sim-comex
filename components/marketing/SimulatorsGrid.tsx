"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Ship, Package, Search, RefreshCw, Truck, X } from "lucide-react";

const simulators = [
  {
    id: "export",
    title: "Procesos de Exportación",
    description: "Régimen que regula la salida legal de mercancías del territorio nacional hacia mercados externos.",
    icon: Ship,
  },
  {
    id: "import",
    title: "Procesos de Importación",
    description: "Régimen que regula el ingreso legal de mercancías extranjeras para consumo o uso nacional.",
    icon: Package,
  },
  {
    id: "tariff",
    title: "Operaciones de Clasificación Arancelaria",
    description: "Sistema de codificación universal de las mercancías objeto de comercio internacional.",
    icon: Search,
  },
  {
    id: "exchange",
    title: "Operaciones Cambiarias",
    description: "Régimen que regula el control y canalización legal de las divisas derivadas de las operaciones internacionales.",
    icon: RefreshCw,
  },
  {
    id: "logistics",
    title: "Operaciones Logísticas",
    description: "Gestión física y eficiente de la carga en la cadena de suministro.",
    icon: Truck,
  },
];

const cardColors = [
  "from-navy/80 to-navy/60",
  "from-navy/80 to-navy/60",
  "from-navy/80 to-navy/60",
  "from-navy/80 to-navy/60",
  "from-navy/80 to-navy/60",
];

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
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selectedCard = simulators.find((s) => s.id === selectedId);

  return (
    <section
      id="simuladores"
      className="min-h-[70vh] flex flex-col justify-center py-28 px-6 bg-navy/50 backdrop-blur-sm border-y border-white/10 text-white overflow-hidden relative"
    >
      <div className="absolute inset-0 bg-gradient-to-b from-navy/40 via-navy/30 to-navy/40 pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10 w-full">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] as const }}
          viewport={{ once: true, margin: "-100px" }}
          className="text-center mb-16"
        >
          <span className="inline-block text-gold font-bold text-xs tracking-[0.2em] uppercase mb-4">
            Plataforma de Simulación
          </span>
          <h2 className="font-heading text-4xl md:text-5xl font-black tracking-tight uppercase">
            Nuestros <span className="text-gold">Simuladores</span>
          </h2>
          <div className="w-16 h-[2px] bg-gold/50 mx-auto mt-6" />
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4"
        >
          {simulators.map((sim, idx) => (
            <motion.div
              key={sim.id}
              variants={cardVariants}
              layout
              onClick={() => setSelectedId(sim.id)}
              className={`relative rounded-2xl p-6 md:p-8 bg-gradient-to-br ${cardColors[idx]} border border-white/10 cursor-pointer group transition-shadow duration-300 hover:shadow-2xl hover:shadow-gold/10 min-h-[180px] md:min-h-[220px] flex flex-col items-center justify-center text-center`}
            >
              <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl bg-white/10 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-gold/20 transition-all duration-300">
                <sim.icon className="w-6 h-6 md:w-7 md:h-7 text-white/80 group-hover:text-gold transition-colors duration-300" />
              </div>
              <h3 className="font-heading font-bold text-sm md:text-base uppercase tracking-wide group-hover:text-gold transition-colors duration-300">
                {sim.title}
              </h3>
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <span className="text-[0.6rem] text-white/40 uppercase tracking-widest">Click para más</span>
              </div>
            </motion.div>
          ))}
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
              className="absolute inset-0 bg-navy/80 backdrop-blur-md"
            />

            <motion.div
              layoutId={selectedId}
              className="relative w-full max-w-lg bg-cream rounded-[2rem] p-10 md:p-12 text-navy overflow-hidden shadow-2xl"
            >
              <button
                onClick={() => setSelectedId(null)}
                className="absolute top-5 right-5 p-2 rounded-full hover:bg-navy/10 text-navy/40 hover:text-navy transition-all"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex flex-col items-center text-center">
                <div className="w-20 h-20 rounded-2xl bg-navy flex items-center justify-center mb-8 shadow-lg">
                  <selectedCard.icon className="w-10 h-10 text-white" />
                </div>

                <h3 className="font-heading text-3xl md:text-4xl font-black text-navy mb-4 uppercase">
                  {selectedCard.title}
                </h3>

                <div className="w-12 h-[2px] bg-gold/50 mx-auto mb-6" />

                <p className="text-base text-navy/70 font-medium leading-relaxed max-w-md">
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
