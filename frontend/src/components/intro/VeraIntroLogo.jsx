import React from 'react';
import VeraLogoImage from '../common/VeraLogoImage';

/**
 * VeraIntroLogo
 * Recreates the iconic VERA crystal faceted 4-pointed star identity,
 * golden orbital rings, and dynamic typography matching Keyframes 45-140.
 * 
 * Easing:
 * - p 0.00 -> 0.35: invisible (particles are assembling it)
 * - p 0.35 -> 0.52: coalesces and blooms at center
 * - p 0.52 -> 0.74: ascends to crown position above the emerging login card
 * - p > 0.76: fades out smoothly as Telemetry Showcase header takes over
 */
export default function VeraIntroLogo({ scrollProgress = 0 }) {
  const p = Math.max(0, Math.min(1, scrollProgress));

  // Opacity progression
  let opacity = 0;
  if (p >= 0.32 && p < 0.46) {
    opacity = (p - 0.32) / 0.14;
  } else if (p >= 0.46 && p <= 0.74) {
    opacity = 1;
  } else if (p > 0.74 && p <= 0.80) {
    // Fade out as Telemetry Showcase navbar takes over
    opacity = Math.max(0, 1 - (p - 0.74) / 0.06);
  }

  if (p < 0.30 || opacity <= 0.01) {
    return null;
  }

  // Vertical position interpolation
  // At center (0px) between 0.35 and 0.50, then slides up to -230px above login card
  let translateY = 0;
  let scale = 1.0;

  if (p < 0.48) {
    translateY = 0;
    scale = 0.75 + 0.25 * Math.min(1, Math.max(0, (p - 0.32) / 0.16));
  } else {
    const ascendP = Math.min(1, (p - 0.48) / 0.22);
    const eased = easeInOutCubic(ascendP);
    translateY = -230 * eased;
    scale = 1.0 - 0.28 * eased;
  }

  // Orbital ring rotation angle
  const ringRotation = (p * 720) % 360;

  return (
    <div
      className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10 transition-opacity duration-300"
      style={{ opacity }}
    >
      <div
        className="flex flex-col items-center justify-center will-change-transform"
        style={{
          transform: `translate3d(0, ${translateY}px, 0) scale(${scale})`,
          transition: 'transform 0.08s linear',
        }}
      >
        {/* Crystal Star Badge & Orbital Rings */}
        <div className="relative w-36 h-36 sm:w-44 sm:h-44 flex items-center justify-center">
          {/* Outer Radiant Glow Halo */}
          <div
            className="absolute inset-0 rounded-full blur-2xl pointer-events-none"
            style={{
              background: 'radial-gradient(circle, rgba(155, 109, 255, 0.5) 0%, rgba(250, 208, 116, 0.3) 40%, transparent 70%)',
              transform: `scale(${1 + 0.15 * Math.sin(p * Math.PI * 4)})`,
            }}
          />

          {/* Golden Orbital Ring 1 (Tilted Ellipse) */}
          <div
            className="absolute w-52 h-20 sm:w-60 sm:h-24 rounded-full border border-[#FFD166]/60 pointer-events-none shadow-[0_0_18px_rgba(255,209,102,0.45)]"
            style={{
              transform: `rotate(-28deg) rotateY(${ringRotation}deg)`,
            }}
          />

          {/* Golden Orbital Ring 2 (Cross Ellipse) */}
          <div
            className="absolute w-44 h-16 sm:w-52 sm:h-20 rounded-full border border-[#DEB0C8]/50 pointer-events-none shadow-[0_0_12px_rgba(222,176,200,0.3)]"
            style={{
              transform: `rotate(35deg) rotateX(${ringRotation * 0.8}deg)`,
            }}
          />

          {/* Central Faceted Crystal Star (using transparent keyed asset) */}
          <div className="relative z-10 w-28 h-28 sm:w-36 sm:h-36 drop-shadow-[0_0_25px_rgba(155,109,255,0.7)] animate-pulse-glow flex items-center justify-center">
            <VeraLogoImage
              className="w-full h-full object-contain filter drop-shadow-[0_4px_16px_rgba(255,209,102,0.4)] select-none"
              alt="VERA Identity"
            />
          </div>

          {/* Radiant Starburst Core Shimmer */}
          <div
            className="absolute z-20 w-8 h-8 rounded-full bg-white/90 blur-xs shadow-[0_0_20px_#FFFFFF,0_0_40px_#FFD166]"
            style={{
              opacity: 0.6 + 0.4 * Math.sin(p * 20),
            }}
          />
        </div>

        {/* Brand Wordmark & Tagline */}
        <div className="text-center mt-3 select-none">
          <div className="flex items-center justify-center tracking-[0.22em] text-3xl sm:text-4xl font-black">
            {/* 'V' with Golden Accent from Keyframe 60 & 80 */}
            <span className="bg-gradient-to-br from-[#FFD166] via-[#F39C12] to-[#E28C74] bg-clip-text text-transparent drop-shadow-[0_2px_8px_rgba(255,209,102,0.4)]">
              V
            </span>
            <span className="bg-gradient-to-br from-[#FFFFFF] via-[#E2E8F0] to-[#C7D2FE] bg-clip-text text-transparent ml-1">
              ERA
            </span>
          </div>

          {/* Tagline: Understand. Analyze. Decide. */}
          <div className="mt-1 text-xs sm:text-sm font-medium tracking-wide text-[#DEB0C8] opacity-90 drop-shadow-[0_1px_4px_rgba(0,0,0,0.8)]">
            Understand. Analyze. Decide.
          </div>
        </div>
      </div>
    </div>
  );
}

function easeInOutCubic(x) {
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
}
