"use client";

import React, { useEffect, useRef } from "react";
import { motion, useSpring, useMotionValue, useScroll, useTransform } from "framer-motion";

export const InteractiveBackground = () => {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const springConfig = { damping: 50, stiffness: 200 };
  const smoothX = useSpring(mouseX, springConfig);
  const smoothY = useSpring(mouseY, springConfig);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [mouseX, mouseY]);

  return (
    <div ref={containerRef} className="fixed inset-0 -z-50 overflow-hidden bg-cream">
      <div className="absolute inset-0 w-full h-full">
        <img
          src="https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=1920&q=80"
          alt="Logística y comercio internacional"
          className="absolute inset-0 w-full h-full object-cover pointer-events-none opacity-40 scale-105"
          loading="eager"
        />
        <div className="absolute inset-0 bg-cream/40 backdrop-blur-[1px]" />
      </div>

      <motion.div
        style={{ x: smoothX, y: smoothY }}
        className="absolute top-[15%] left-[10%] w-[30rem] h-[30rem] rounded-full bg-navy/10 blur-[160px] animate-float-slow pointer-events-none"
      />
      <motion.div
        style={{ x: useTransform(smoothX, v => -v * 0.3), y: useTransform(smoothY, v => -v * 0.3) }}
        className="absolute bottom-[20%] right-[15%] w-[35rem] h-[35rem] rounded-full bg-gold/10 blur-[200px] animate-float-slow pointer-events-none"
      />
      <motion.div
        style={{ x: useTransform(smoothX, v => v * 0.5), y: useTransform(smoothY, v => v * 0.5) }}
        className="absolute top-[40%] right-[30%] w-[20rem] h-[20rem] rounded-full bg-teal/5 blur-[120px] animate-float-slow pointer-events-none"
      />

      <svg
        className="absolute inset-0 w-full h-full pointer-events-none opacity-[0.03]"
        viewBox="0 0 1440 900"
        fill="none"
        preserveAspectRatio="none"
      >
        <path
          d="M100,100 Q400,50 720,200 T1340,100"
          stroke="#C4953C"
          strokeWidth="2"
          strokeDasharray="8 8"
          className="animate-route-dash"
          vectorEffect="non-scaling-stroke"
        />
        <path
          d="M50,500 Q300,300 720,600 T1300,400"
          stroke="#15123A"
          strokeWidth="1.5"
          strokeDasharray="6 6"
          className="animate-route-dash"
          vectorEffect="non-scaling-stroke"
          style={{ animationDelay: "-0.7s" }}
        />
        <path
          d="M200,800 Q500,600 720,750 T1400,700"
          stroke="#14B8A6"
          strokeWidth="1"
          strokeDasharray="4 4"
          className="animate-route-dash"
          vectorEffect="non-scaling-stroke"
          style={{ animationDelay: "-1.4s" }}
        />
        <circle cx="100" cy="100" r="4" fill="#C4953C" />
        <circle cx="1340" cy="100" r="4" fill="#C4953C" />
        <circle cx="50" cy="500" r="3" fill="#15123A" />
        <circle cx="1300" cy="400" r="3" fill="#15123A" />
        <circle cx="200" cy="800" r="2" fill="#14B8A6" />
        <circle cx="1400" cy="700" r="2" fill="#14B8A6" />
      </svg>

      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-cream/60 pointer-events-none" />
    </div>
  );
};
