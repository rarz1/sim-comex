"use client";

import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

export const Navbar = () => {
  const [isDarkSection, setIsDarkSection] = React.useState(false);

  React.useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const vh = window.innerHeight;
      setIsDarkSection(scrollY > vh * 0.85 && scrollY < vh * 2.25);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="fixed top-0 left-0 right-0 z-50 px-6 py-4"
    >
      <div className="absolute inset-0 bg-cream/40 backdrop-blur-xl border-b border-navy/5 -z-10" />

      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm transition-all duration-500 group-hover:scale-110 ${isDarkSection ? 'bg-white text-navy' : 'bg-navy text-white'}`}>
            SC
          </div>
          <span className={`font-heading font-black tracking-tight text-xl transition-colors duration-300 ${isDarkSection ? 'text-white' : 'text-navy'}`}>
            SIM_COMEX
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-10">
          {["Simuladores", "Contacto"].map((item) => (
            <a
              key={item}
              href={`#${item.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")}`}
              className="group relative font-medium text-sm tracking-wider uppercase"
            >
              <span className={`transition-colors duration-300 ${isDarkSection ? 'text-white/80 hover:text-white' : 'text-navy/70 hover:text-navy'}`}>
                {item.split("").map((char, i) => (
                  <span
                    key={i}
                    className="inline-block transition-all duration-150 group-hover:translate-y-[-2px] group-hover:opacity-100"
                    style={{ transitionDelay: `${i * 20}ms` }}
                  >
                    {char}
                  </span>
                ))}
              </span>
              <span className="absolute -bottom-1 left-0 w-0 h-[2px] bg-gold transition-all duration-300 group-hover:w-full" />
            </a>
          ))}
        </div>

        <Link href="/login">
          <Button
            className={`font-bold px-8 rounded-full transition-all duration-300 hover:scale-105 active:scale-95 ${
              isDarkSection
                ? 'bg-white text-navy hover:bg-white/90'
                : 'bg-navy text-white hover:bg-navy/90'
            }`}
          >
            Ingresar
          </Button>
        </Link>
      </div>
    </motion.nav>
  );
};
