"use client";

import React from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useAppText } from "@/hooks/useAppText";
import { useDesignSettings } from "@/hooks/useDesignSettings";
import { hexToRgba } from "@/lib/colorUtils";
import { DynamicIcon } from "@/components/shared/DynamicIcon";

const footerLinks = [
  {
    title: "Plataforma",
    links: [
      { label: "Simuladores", href: "#simuladores" },
      { label: "Contacto", href: "#contacto" },
      { label: "Acceso", href: "/login" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Términos y Condiciones", href: "#" },
      { label: "Política de Privacidad", href: "#" },
      { label: "Seguridad", href: "#" },
    ],
  },
  {
    title: "Soporte",
    links: [
      { label: "Centro de Ayuda", href: "#" },
      { label: "Documentación", href: "#" },
      { label: "Estado del Sistema", href: "#" },
    ],
  },
];

export const Footer = () => {
  const { t } = useAppText();
  const { colors } = useDesignSettings();

  return (
    <footer
      className="border-t"
      style={{
        backgroundColor: hexToRgba(t('marketing.bg.footer_color', colors.cream || '#F5F3F0'), Number(t('marketing.bg.footer_opacity', '30')) / 100),
        borderColor: hexToRgba(colors.navy, 0.05),
      }}
    >
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-12">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-3 mb-4">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: colors.navy }}
              >
                <DynamicIcon name={t('marketing.footer.icon', 'Ship')} className="w-5 h-5" style={{ color: '#FFFFFF' }} />
              </div>
              <span
                className="font-heading font-black text-xl tracking-tight"
                style={{ color: colors.navy }}
              >
                SIM_COMEX
              </span>
            </div>
            <p
              className="text-sm font-medium leading-relaxed max-w-xs"
              style={{ color: hexToRgba(colors.navy, 0.4) }}
            >
              {t("marketing.footer.description", "Plataforma integral de simulación y gestión para el comercio exterior con asistencia de IA.")}
            </p>
          </div>

          {footerLinks.map((group) => (
            <div key={group.title}>
              <h4
                className="font-heading font-bold text-xs uppercase tracking-[0.15em] mb-5"
                style={{ color: colors.navy }}
              >
                {group.title}
              </h4>
              <ul className="space-y-3">
                {group.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm font-medium transition-colors duration-200"
                      style={{
                        color: hexToRgba(colors.navy, 0.5),
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.color = colors.gold; }}
                      onMouseLeave={(e) => { e.currentTarget.style.color = hexToRgba(colors.navy, 0.5); }}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div
          className="pt-8 flex flex-col md:flex-row items-center justify-between gap-4"
          style={{ borderTop: `1px solid ${hexToRgba(colors.navy, 0.05)}` }}
        >
          <p className="text-xs font-medium" style={{ color: hexToRgba(colors.navy, 0.3) }}>
            &copy; {new Date().getFullYear()} {t("marketing.footer.copyright", "SIM_COMEX. Todos los derechos reservados.")}
          </p>
          <div className="flex items-center gap-6">
            <span className="text-xs font-medium flex items-center gap-1.5" style={{ color: hexToRgba(colors.navy, 0.3) }}>
              <DynamicIcon name={t('marketing.footer.icon_shield', 'Shield')} className="w-3 h-3" /> {t("marketing.footer.badge_security", "Datos Seguros")}
            </span>
            <span className="text-xs font-medium flex items-center gap-1.5" style={{ color: hexToRgba(colors.navy, 0.3) }}>
              <DynamicIcon name={t('marketing.footer.icon_mail', 'Mail')} className="w-3 h-3" /> {t("marketing.footer.badge_email", "soporte@simcomex.com")}
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};
