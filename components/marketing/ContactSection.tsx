"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Send, CheckCircle } from "lucide-react";

export const ContactSection = () => {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <section id="contacto" className="py-28 px-6 bg-cream/50">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] as const }}
          viewport={{ once: true, margin: "-100px" }}
          className="text-center mb-16"
        >
          <span className="inline-block text-gold font-bold text-xs tracking-[0.2em] uppercase mb-4">
            Comunicación
          </span>
          <h2 className="font-heading text-4xl md:text-5xl font-black text-navy tracking-tight uppercase">
            Contáctanos
          </h2>
          <p className="text-navy/50 font-medium mt-4 text-sm uppercase tracking-wider">
            Estamos aquí para asistirte
          </p>
          <div className="w-16 h-[2px] bg-gold/50 mx-auto mt-6" />
        </motion.div>

        <motion.form
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] as const }}
          viewport={{ once: true }}
          onSubmit={handleSubmit}
          className="relative bg-white rounded-[2.5rem] p-8 md:p-12 shadow-xl border border-navy/5"
        >
          {submitted ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center py-12 gap-4"
            >
              <CheckCircle className="w-16 h-16 text-teal" />
              <h3 className="font-heading text-2xl font-bold text-navy">Mensaje Enviado</h3>
              <p className="text-navy/50">Nos pondremos en contacto pronto.</p>
            </motion.div>
          ) : (
            <>
              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <FloatLabelInput id="name" label="Nombre Completo" placeholder="Juan Pérez" />
                <FloatLabelInput id="email" label="Correo Electrónico" type="email" placeholder="juan@ejemplo.com" />
              </div>
              <FloatLabelInput id="subject" label="Asunto" placeholder="¿Cómo podemos ayudarte?" />

              <div className="pt-8">
                <Button
                  type="submit"
                  className="w-full h-16 bg-navy hover:bg-navy/90 text-white rounded-full font-bold text-lg shadow-lg shadow-navy/20 transition-all hover:scale-[1.01] active:scale-[0.99] group"
                >
                  <span className="mr-2">Enviar Mensaje</span>
                  <Send className="w-4 h-4 inline-block transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1" />
                </Button>
              </div>
            </>
          )}
        </motion.form>
      </div>
    </section>
  );
};

function FloatLabelInput({
  id,
  label,
  placeholder,
  type = "text",
}: {
  id: string;
  label: string;
  placeholder: string;
  type?: string;
}) {
  const [focused, setFocused] = useState(false);
  const [value, setValue] = useState("");

  return (
    <div className="relative">
      <Label
        htmlFor={id}
        className={`absolute left-6 transition-all duration-200 pointer-events-none ${
          focused || value
            ? "-top-2.5 text-[0.6rem] bg-white px-2 text-gold font-bold uppercase tracking-widest"
            : "top-4 text-sm text-navy/40 font-medium"
        }`}
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
        className="h-14 bg-navy/[0.02] rounded-2xl border-navy/10 focus:border-gold/50 focus:ring-gold/20 px-6 text-navy placeholder:text-navy/20 font-medium transition-all duration-200"
      />
    </div>
  );
}
