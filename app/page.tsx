"use client";

import React from "react";
import { InteractiveBackground } from "@/components/marketing/InteractiveBackground";
import { Navbar } from "@/components/marketing/Navbar";
import { Hero } from "@/components/marketing/Hero";
import { SimulatorsGrid } from "@/components/marketing/SimulatorsGrid";
import { ContactSection } from "@/components/marketing/ContactSection";
import { AccessSection } from "@/components/marketing/AccessSection";
import { Footer } from "@/components/marketing/Footer";

export default function Home() {
  return (
    <main className="relative min-h-screen">
      <InteractiveBackground />
      <Navbar />
      <div className="relative z-10">
        <Hero />
        <SimulatorsGrid />
        <ContactSection />
        <AccessSection />
        <Footer />
      </div>
    </main>
  );
}
