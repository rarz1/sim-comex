"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAppText } from "@/hooks/useAppText";
import { useDesignSettings } from "@/hooks/useDesignSettings";
import { hexToRgba } from "@/lib/colorUtils";
import { DynamicIcon } from "@/components/shared/DynamicIcon";

export const ContactSection = () => {
  const { t } = useAppText();
  const { colors } = useDesignSettings();
  const [submitted, setSubmitted] = useState(false);
  const contactBgOpacity = Number(t('marketing.bg.contact_opacity', '50')) / 100;
  const shadowStyle = `0 10px 15px -3px ${hexToRgba(colors.navy, 0.2)}, 0 4px 6px -4px ${hexToRgba(colors.navy, 0.2)}`;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <>
      <style>{`
        .contact-btn:hover {
          background-color: ${hexToRgba(colors.navy, 0.9)} !important;
        }
        .contact-input-field:focus {
          border-color: ${hexToRgba(colors.gold, 0.5)} !important;
          box-shadow: 0 0 0 3px ${hexToRgba(colors.gold, 0.2)} !important;
        }
        .contact-input-field::placeholder {
          color: ${hexToRgba(colors.navy, 0.2)} !important;
        }
      `}</style>
      <section id="contacto" className="py-28 px-6" style={{ backgroundColor: hexToRgba(t('marketing.bg.contact_color', colors.cream || '#F5F3F0'), contactBgOpacity) }}>
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] as const }}
            viewport={{ once: true, margin: "-100px" }}
            className="text-center mb-16"
          >
            <span className="inline-block font-bold text-xs tracking-[0.2em] uppercase mb-4" style={{ color: colors.gold }}>
              {t('marketing.contact.badge', 'Comunicación')}
            </span>
            <h2 className="font-heading text-4xl md:text-5xl font-black tracking-tight uppercase" style={{ color: colors.navy }}>
              {t('marketing.contact.title', 'Contáctanos')}
            </h2>
            <p className="font-medium mt-4 text-sm uppercase tracking-wider" style={{ color: hexToRgba(colors.navy, 0.5) }}>
              {t('marketing.contact.subtitle', 'Estamos aquí para asistirte')}
            </p>
            <div className="w-16 h-[2px] mx-auto mt-6" style={{ backgroundColor: hexToRgba(colors.gold, 0.5) }} />
          </motion.div>

          <motion.form
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] as const }}
            viewport={{ once: true }}
            onSubmit={handleSubmit}
            className="relative bg-white rounded-[2.5rem] p-8 md:p-12 shadow-xl border"
            style={{ borderColor: hexToRgba(colors.navy, 0.05) }}
          >
            {submitted ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center py-12 gap-4"
              >
                <DynamicIcon name={t('marketing.contact.icon_success', 'CheckCircle')} className="w-16 h-16" style={{ color: colors.teal }} />
                <h3 className="font-heading text-2xl font-bold" style={{ color: colors.navy }}>{t('marketing.contact.success_title', 'Mensaje Enviado')}</h3>
                <p style={{ color: hexToRgba(colors.navy, 0.5) }}>{t('marketing.contact.success_msg', 'Nos pondremos en contacto pronto.')}</p>
              </motion.div>
            ) : (
              <>
                <div className="grid md:grid-cols-2 gap-6 mb-6">
                  <FloatLabelInput colors={colors} id="name" label={t('marketing.contact.field_name_label', 'Nombre Completo')} placeholder={t('marketing.contact.field_name_placeholder', 'Juan Pérez')} />
                  <FloatLabelInput colors={colors} id="email" label={t('marketing.contact.field_email_label', 'Correo Electrónico')} type="email" placeholder={t('marketing.contact.field_email_placeholder', 'juan@ejemplo.com')} />
                </div>
                <FloatLabelInput colors={colors} id="subject" label={t('marketing.contact.field_subject_label', 'Asunto')} placeholder={t('marketing.contact.field_subject_placeholder', '¿Cómo podemos ayudarte?')} />

                <div className="pt-8">
                  <Button
                    type="submit"
                    className="contact-btn w-full h-16 text-white rounded-full font-bold text-lg shadow-lg transition-all hover:scale-[1.01] active:scale-[0.99] group"
                    style={{
                      backgroundColor: colors.navy,
                      boxShadow: shadowStyle,
                    }}
                  >
                    <span className="mr-2">{t('marketing.contact.btn_submit', 'Enviar Mensaje')}</span>
                    <DynamicIcon name={t('marketing.contact.icon_send', 'Send')} className="w-4 h-4 inline-block transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1" />
                  </Button>
                </div>
              </>
            )}
          </motion.form>
        </div>
      </section>
    </>
  );
};

function FloatLabelInput({
  id,
  label,
  placeholder,
  type = "text",
  colors,
}: {
  id: string;
  label: string;
  placeholder: string;
  type?: string;
  colors: { navy: string; gold: string; teal: string; cream: string };
}) {
  const [focused, setFocused] = useState(false);
  const [value, setValue] = useState("");

  return (
    <div className="relative">
      <Label
        htmlFor={id}
        className={`absolute left-6 transition-all duration-200 pointer-events-none ${
          focused || value
            ? "-top-2.5 text-[0.6rem] bg-white px-2 font-bold uppercase tracking-widest"
            : "top-4 text-sm font-medium"
        }`}
        style={{
          color: focused || value ? colors.gold : hexToRgba(colors.navy, 0.4),
        }}
      >
        {label}
      </Label>
      <Input
        id={id}
        type={type}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={focused ? placeholder : ""}
        className="contact-input-field h-14 rounded-2xl px-6 font-medium transition-all duration-200"
        style={{
          backgroundColor: hexToRgba(colors.navy, 0.02),
          borderColor: hexToRgba(colors.navy, 0.1),
          color: colors.navy,
        }}
      />
    </div>
  );
}
