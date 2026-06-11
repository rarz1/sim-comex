"use client";

import React from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ShieldCheck, ArrowRight } from "lucide-react";

export const AccessSection = () => {
  const { scrollY } = useScroll();
  const bgY = useTransform(scrollY, [2300, 3000], [0, -80]);

  return (
    <section className="relative min-h-[60vh] flex flex-col justify-center py-24 px-6 overflow-hidden">
      <motion.div
        style={{ y: bgY }}
        className="absolute inset-0 bg-gradient-to-br from-navy/70 via-navy/60 to-navy/70 pointer-events-none"
      />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(196,149,60,0.08),transparent_50%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(20,184,166,0.05),transparent_50%)] pointer-events-none" />

      <div className="max-w-6xl mx-auto relative z-10 flex flex-col md:flex-row items-center justify-center gap-16 md:gap-32">
        <motion.div
          initial={{ opacity: 0, x: -60 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] as const }}
          viewport={{ once: true }}
          className="flex-1 flex flex-col items-center md:items-end text-center md:text-right"
        >
          <div className="w-14 h-14 rounded-2xl bg-gold/20 flex items-center justify-center mb-6">
            <ShieldCheck className="w-7 h-7 text-gold" />
          </div>
          <h2 className="font-heading text-4xl md:text-5xl font-black text-white mb-4 tracking-tight uppercase leading-[0.9]">
            Seguridad <br/>y <span className="text-gold">Control</span>
          </h2>
          <div className="w-12 h-[2px] bg-gold/50 mx-auto md:mr-0 mb-6" />
          <p className="text-base md:text-lg text-white/50 font-medium leading-relaxed max-w-md tracking-wide">
            Un entorno seguro donde la información está protegida con estándares de clase mundial, y la gestión documental y de procesos se adapta al ritmo y rol de cada usuario con la mejor experiencia educativa.
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
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.97 }}
              className="group"
            >
              <Button className="h-14 md:h-16 px-14 md:px-20 bg-gold hover:bg-gold/90 text-navy rounded-full font-bold text-xl md:text-2xl shadow-2xl shadow-gold/30 transition-all uppercase">
                Ingresar
                <ArrowRight className="ml-3 w-5 h-5 md:w-6 md:h-6 inline-block transition-transform duration-300 group-hover:translate-x-1" />
              </Button>
            </motion.div>
          </Link>
        </motion.div>
      </div>
    </section>
  );
};
