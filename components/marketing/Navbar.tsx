"use client";

import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { useAppText } from "@/hooks/useAppText";
import { useDesignSettings } from "@/hooks/useDesignSettings";
import { hexToRgba } from "@/lib/colorUtils";

export const Navbar = () => {
  const { t } = useAppText();
  const { colors } = useDesignSettings();
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
      <div className="absolute inset-0 backdrop-blur-xl border-b -z-10"
        style={{ backgroundColor: hexToRgba(colors.cream, 0.4), borderColor: hexToRgba(colors.navy, 0.05) }}
      />

      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm transition-all duration-500 group-hover:scale-110"
            style={{ backgroundColor: isDarkSection ? colors.cream : colors.navy, color: isDarkSection ? colors.navy : colors.cream }}
          >
            {t('marketing.navbar.brand_text', 'SC')}
          </div>
          <span className="font-heading font-black tracking-tight text-xl transition-colors duration-300"
            style={{ color: isDarkSection ? colors.cream : colors.navy }}
          >
            {t('marketing.navbar.brand_name', 'SIM_COMEX')}
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-10">
          {[t('marketing.navbar.link_simulators', 'Simuladores'), t('marketing.navbar.link_contact', 'Contacto')].map((item) => (
            <a
              key={item}
              href={`#${item.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")}`}
              className="group relative font-medium text-sm tracking-wider uppercase"
            >
              <span className="transition-colors duration-300"
                style={{ color: isDarkSection ? hexToRgba(colors.cream, 0.8) : hexToRgba(colors.navy, 0.7) }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = isDarkSection ? colors.cream : colors.navy; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = isDarkSection ? hexToRgba(colors.cream, 0.8) : hexToRgba(colors.navy, 0.7); }}
              >
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
              <span className="absolute -bottom-1 left-0 w-0 h-[2px] transition-all duration-300 group-hover:w-full"
                style={{ backgroundColor: colors.gold }}
              />
            </a>
          ))}
        </div>

        <Link href="/login">
          <Button
            className="font-bold px-8 rounded-full transition-all duration-300 hover:scale-105 active:scale-95"
            style={{
              backgroundColor: isDarkSection ? colors.cream : colors.navy,
              color: isDarkSection ? colors.navy : colors.cream,
            }}
          >
            {t('marketing.navbar.btn_login', 'Ingresar')}
          </Button>
        </Link>
      </div>
    </motion.nav>
  );
};
