"use client";

import React, { useState, useRef } from "react";
import { Sparkles } from "lucide-react";

/**
 * SpatialAbstractHero3D
 *
 * A clean, elegant, abstract 3D spatial artifact:
 * - Concentric luminous orbital rings rotating smoothly in 3D space
 * - A central floating frosted-glass prism with subtle ambient refraction
 * - Zero clutter, zero micro-text, zero fake widgets or chip schematics
 * - Smooth, subtle mouse-tracking tilt for an immersive spatial feel
 */
export function SpatialAbstractHero3D() {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
    setMousePos({ x, y });
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setMousePos({ x: 0, y: 0 });
  };

  // Smooth tilt based on mouse position
  const rotX = isHovered ? 12 - mousePos.y * 14 : 10;
  const rotY = isHovered ? -14 + mousePos.x * 18 : -12;

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      className="relative w-full h-[380px] md:h-[460px] flex items-center justify-center select-none overflow-visible"
      style={{ perspective: "1000px" }}
    >
      {/* Soft Ambient Radial Background Glows */}
      <div className="absolute w-72 h-72 rounded-full bg-cyan-500/15 blur-[90px] pointer-events-none -top-6 -left-6 animate-pulse" />
      <div className="absolute w-80 h-80 rounded-full bg-emerald-500/15 blur-[100px] pointer-events-none -bottom-8 -right-8 animate-pulse" />
      <div className="absolute w-64 h-64 rounded-full bg-purple-500/10 blur-[80px] pointer-events-none top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />

      {/* 3D FLOATING SPATIAL STAGE */}
      <div
        className="relative w-[280px] h-[280px] md:w-[340px] md:h-[340px] transition-transform duration-500 ease-out flex items-center justify-center"
        style={{
          transformStyle: "preserve-3d",
          transform: `rotateX(${rotX}deg) rotateY(${rotY}deg)`,
        }}
      >
        {/* Orbital Ring 1 (Cyan - Horizontal Axis) */}
        <div
          className="absolute inset-0 rounded-full border-2 border-cyan-400/30 transition-transform duration-700"
          style={{
            transform: `rotateX(68deg) rotateY(12deg) scale(1.18)`,
            boxShadow:
              "0 0 35px rgba(6,182,212,0.25), inset 0 0 25px rgba(6,182,212,0.15)",
          }}
        >
          {/* Orbital Light Particle */}
          <div
            className="absolute -top-1.5 left-1/2 w-3 h-3 -translate-x-1/2 rounded-full bg-cyan-300 shadow-[0_0_15px_#22d3ee] animate-pulse"
          />
        </div>

        {/* Orbital Ring 2 (Emerald - Diagonal Axis) */}
        <div
          className="absolute inset-0 rounded-full border-2 border-emerald-400/25 transition-transform duration-700"
          style={{
            transform: `rotateY(68deg) rotateX(-20deg) scale(1.12)`,
            boxShadow:
              "0 0 35px rgba(16,185,129,0.2), inset 0 0 25px rgba(16,185,129,0.12)",
          }}
        >
          {/* Orbital Light Particle */}
          <div
            className="absolute top-1/2 -right-1.5 w-3 h-3 -translate-y-1/2 rounded-full bg-emerald-300 shadow-[0_0_15px_#34d399] animate-pulse"
          />
        </div>

        {/* Orbital Ring 3 (Violet - Cross Axis) */}
        <div
          className="absolute inset-0 rounded-full border border-purple-400/20 transition-transform duration-700"
          style={{
            transform: `rotateZ(45deg) rotateX(45deg) scale(1.05)`,
            boxShadow: "0 0 30px rgba(168,85,247,0.15)",
          }}
        >
          {/* Orbital Light Particle */}
          <div
            className="absolute bottom-2 left-1/4 w-2.5 h-2.5 rounded-full bg-purple-300 shadow-[0_0_12px_#c084fc]"
          />
        </div>

        {/* Backlight Glow Disc behind the prism */}
        <div
          className="absolute w-48 h-48 rounded-full bg-gradient-to-tr from-cyan-500/20 via-emerald-500/20 to-purple-500/20 blur-xl pointer-events-none"
          style={{
            transform: "translateZ(-30px)",
          }}
        />

        {/* Central Luminous Spatial Glass Core */}
        <div
          className="relative w-40 h-40 md:w-48 md:h-48 rounded-3xl bg-gradient-to-br from-slate-900/90 via-[#0d1527]/90 to-slate-950/95 border border-cyan-400/40 backdrop-blur-2xl shadow-[0_20px_60px_rgba(0,0,0,0.85),0_0_50px_rgba(6,182,212,0.25)] flex flex-col items-center justify-center p-6 text-center space-y-3 transition-transform duration-300 hover:scale-105"
          style={{
            transform: `translateZ(45px)`,
          }}
        >
          {/* Specular Highlight Sheen across top glass */}
          <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/10 to-transparent rounded-t-3xl pointer-events-none" />

          {/* Glowing Inner Core Icon */}
          <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-500/25 via-teal-400/20 to-emerald-400/25 border border-cyan-300/40 flex items-center justify-center shadow-[0_0_30px_rgba(6,182,212,0.4)]">
            <Sparkles className="w-8 h-8 text-cyan-300 animate-pulse" />
          </div>

          {/* Minimalist Brand Accent */}
          <div className="space-y-1">
            <div className="text-xs font-mono font-bold tracking-[0.25em] text-cyan-400 uppercase">
              Ace-Seek
            </div>
            <div className="text-[11px] text-slate-400 font-medium">
              Unified Ecosystem
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
