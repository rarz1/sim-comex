"use client";

import React from "react";
import { motion } from "framer-motion";
import { Ship, Mail, Shield } from "lucide-react";
import Link from "next/link";

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
  return (
    <footer className="bg-white border-t border-navy/5">
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-12">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-navy flex items-center justify-center">
                <Ship className="w-5 h-5 text-white" />
              </div>
              <span className="font-heading font-black text-xl text-navy tracking-tight">
                SIM_COMEX
              </span>
            </div>
            <p className="text-navy/40 text-sm font-medium leading-relaxed max-w-xs">
              Plataforma integral de simulación y gestión para el comercio exterior con asistencia de IA.
            </p>
          </div>

          {footerLinks.map((group) => (
            <div key={group.title}>
              <h4 className="font-heading font-bold text-xs text-navy uppercase tracking-[0.15em] mb-5">
                {group.title}
              </h4>
              <ul className="space-y-3">
                {group.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-navy/50 text-sm font-medium hover:text-gold transition-colors duration-200"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="pt-8 border-t border-navy/5 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-navy/30 text-xs font-medium">
            &copy; {new Date().getFullYear()} SIM_COMEX. Todos los derechos reservados.
          </p>
          <div className="flex items-center gap-6">
            <span className="text-navy/30 text-xs font-medium flex items-center gap-1.5">
              <Shield className="w-3 h-3" /> Datos Seguros
            </span>
            <span className="text-navy/30 text-xs font-medium flex items-center gap-1.5">
              <Mail className="w-3 h-3" /> soporte@simcomex.com
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};
