import React from 'react';

export default function HeroMotionStage() {
  return (
    <div className="relative w-full max-w-4xl mx-auto rounded-3xl overflow-hidden shadow-md border border-[#E2E6F5] bg-[#EEF2FB] select-none group transition-all">
      {/* High-Resolution Artwork (Exact Reference Image with Every Detail) */}
      <div className="relative w-full aspect-[757/337] overflow-hidden">
        <img
          src="/vera-hero-hd.png"
          alt="Hi, I'm VERA — What are you trying to decide?"
          className="w-full h-full object-cover select-none pointer-events-none transform group-hover:scale-[1.01] transition-transform duration-700 ease-out"
        />

        {/* Ambient Living Motion Overlays */}
        {/* 1. Atmospheric Pulsing Glow on the 3D Globe */}
        <div className="absolute top-1/2 right-[28%] -translate-y-1/2 w-44 h-44 rounded-full bg-[#7B61FF]/25 blur-2xl pointer-events-none animate-pulse-glow" />

        {/* 2. Sparkling Stardust Particles on Orbit Ring */}
        <div className="absolute top-[26%] right-[18%] w-3 h-3 rounded-full bg-white shadow-[0_0_12px_#FFF] pointer-events-none animate-ping opacity-50" />
        <div className="absolute top-[68%] right-[38%] w-2 h-2 rounded-full bg-[#60A5FA] shadow-[0_0_8px_#60A5FA] pointer-events-none animate-ping opacity-40 delay-1000" />
        <div className="absolute top-[35%] right-[44%] w-2.5 h-2.5 rounded-full bg-[#A78BFA] shadow-[0_0_10px_#A78BFA] pointer-events-none animate-ping opacity-45 delay-700" />

        {/* 3. Subtle Holographic Shimmer Sweep */}
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent pointer-events-none" />
      </div>
    </div>
  );
}
