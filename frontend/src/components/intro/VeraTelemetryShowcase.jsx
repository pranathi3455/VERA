import React from 'react';
import {
  Scale,
  TrendingUp,
  Lightbulb,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  BarChart3,
  Sparkles,
} from 'lucide-react';
import VeraLogoImage from '../common/VeraLogoImage';

/**
 * VeraTelemetryShowcase
 * Recreates the dark-mode Decision Intelligence showcase from Keyframes 160-240.
 * 
 * Contains 3 narrative chapters:
 * 1. Research (p: 0.74 - 0.83): "Turn complexity into clarity"
 * 2. Analyze  (p: 0.83 - 0.92): "Explore possibilities"
 * 3. Decide   (p: 0.92 - 1.00): "Make decisions with confidence"
 * 
 * Features 3D floating glass telemetry cards, hexagon badges, glowing charts,
 * and mouse tilt parallax.
 */
export default function VeraTelemetryShowcase({
  scrollProgress = 0,
  mousePos = { x: 0, y: 0 },
  onJumpToLogin,
  onJumpToProgress,
}) {
  const p = Math.max(0, Math.min(1, scrollProgress));

  // Only render when scroll enters the deep intelligence territory (after login stage)
  if (p < 0.84) {
    return null;
  }

  // Showcase container opacity
  const containerOpacity = Math.min(1, (p - 0.84) / 0.05);

  // Active step calculation: 0 = Research, 1 = Analyze, 2 = Decide
  let activeStep = 0;
  if (p < 0.89) {
    activeStep = 0;
  } else if (p < 0.94) {
    activeStep = 1;
  } else {
    activeStep = 2;
  }

  // Mouse tilt calculation
  const winW = typeof window !== 'undefined' ? window.innerWidth : 1200;
  const winH = typeof window !== 'undefined' ? window.innerHeight : 800;
  const tiltX = ((mousePos.y - winH / 2) / (winH / 2)) * 5; // degrees
  const tiltY = -((mousePos.x - winW / 2) / (winW / 2)) * 6; // degrees

  const chapters = [
    {
      badge: '1. Research',
      title: 'Turn complexity into clarity.',
      desc: 'Ground every decision in empirical evidence. Ingest verified studies, ERP audit logs, and data citations into an unshakeable single source of truth.',
      highlight: 'Evidence Normalization Engine',
      scrollTarget: 0.78,
    },
    {
      badge: '2. Analyze',
      title: 'Explore possibilities.',
      desc: 'Evaluate trade-offs across divergent scenarios. VERA deterministically normalizes multi-attribute criteria to eliminate cognitive bias and recency fallacies.',
      highlight: 'Multi-Criteria Decision Modeling',
      scrollTarget: 0.87,
    },
    {
      badge: '3. Decide',
      title: 'Make decisions with confidence.',
      desc: 'Receive transparent, audit-ready decision synthesis paired with AI explainability, sensitivity boundaries, and downside risk bounds.',
      highlight: 'Deterministic Decision Synthesis',
      scrollTarget: 0.96,
    }
  ];

  const currentChapter = chapters[activeStep];

  return (
    <div
      className="absolute inset-0 flex flex-col justify-between pt-16 pb-8 px-6 sm:px-12 pointer-events-none z-20 text-white select-none transition-opacity duration-300"
      style={{ opacity: containerOpacity }}
    >
      {/* Top persistent Brand & Navigation Bar (Keyframes 160-240) */}
      <header className="w-full max-w-7xl mx-auto flex items-center justify-between py-3 border-b border-white/10 backdrop-blur-md pointer-events-auto">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#9B6DFF]/20 border border-[#9B6DFF]/30 p-1 flex items-center justify-center shadow-[0_0_15px_rgba(155,109,255,0.4)]">
            <VeraLogoImage className="w-full h-full object-contain" alt="VERA" />
          </div>
          <span className="font-bold tracking-widest text-lg bg-gradient-to-r from-white via-[#DEB0C8] to-[#FFD166] bg-clip-text text-transparent">
            VERA
          </span>
        </div>

        {/* Navigation items matching reference slides */}
        <nav className="hidden md:flex items-center gap-8 text-xs font-medium text-gray-300">
          <button
            onClick={() => onJumpToProgress?.(0.05)}
            className="hover:text-white transition-colors"
          >
            Home
          </button>
          <button
            onClick={() => onJumpToProgress?.(0.78)}
            className={`transition-colors ${activeStep === 0 ? 'text-[#FFD166] font-semibold' : 'hover:text-white'}`}
          >
            Research
          </button>
          <button
            onClick={() => onJumpToProgress?.(0.87)}
            className={`transition-colors ${activeStep === 1 ? 'text-[#FFD166] font-semibold' : 'hover:text-white'}`}
          >
            Analyze
          </button>
          <button
            onClick={() => onJumpToProgress?.(0.96)}
            className={`transition-colors ${activeStep === 2 ? 'text-[#FFD166] font-semibold' : 'hover:text-white'}`}
          >
            Decide
          </button>
        </nav>

        {/* Top Right Action */}
        <div className="flex items-center gap-3">
          <button
            onClick={onJumpToLogin}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#7B61FF] to-[#6366F1] hover:brightness-110 text-white text-xs font-semibold shadow-[0_0_20px_rgba(123,97,255,0.4)] transition-all"
          >
            Sign In
          </button>
        </div>
      </header>

      {/* Main Narrative & 3D Interactive Telemetry Stage */}
      <div className="w-full max-w-7xl mx-auto flex-1 flex flex-col lg:flex-row items-center justify-center gap-12 my-auto pointer-events-auto">
        {/* Left Column: Narrative Headline & Mission */}
        <div className="w-full lg:w-1/2 space-y-6 max-w-xl text-left">
          {/* Eyebrow Pill */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#9B6DFF]/15 border border-[#9B6DFF]/30 text-[#DEB0C8] text-xs font-semibold tracking-wide shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-[#FFD166]" />
            {currentChapter.badge}
          </div>

          {/* Heading */}
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.5)]">
            {currentChapter.title}
          </h1>

          {/* Description */}
          <p className="text-sm sm:text-base text-gray-300 leading-relaxed">
            {currentChapter.desc}
          </p>

          {/* Key Feature Highlight */}
          <div className="flex items-center gap-2 text-xs font-medium text-[#FFD166]">
            <CheckCircle2 className="w-4 h-4 text-[#FFD166]" />
            <span>{currentChapter.highlight}</span>
          </div>

          {/* Action CTAs */}
          <div className="flex items-center gap-4 pt-2">
            <button
              onClick={onJumpToLogin}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#7B61FF] via-[#9B6DFF] to-[#6366F1] hover:brightness-110 active:scale-[0.98] text-white text-xs font-semibold shadow-[0_0_25px_rgba(155,109,255,0.4)] transition-all flex items-center gap-2"
            >
              Sign In to Experience VERA
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Right Column: Floating 3D Glass Telemetry Widgets */}
        <div
          className="w-full lg:w-1/2 flex items-center justify-center relative perspective-[1200px]"
          style={{
            transform: `rotateX(${tiltX}deg) rotateY(${tiltY}deg)`,
            transition: 'transform 0.15s ease-out',
          }}
        >
          {/* Hexagonal Badges Floating in 3D Space */}
          {/* Hexagon 1: Scales of Justice (Frames 180, 210, 230) */}
          <div className="absolute -top-10 -left-6 z-20 w-16 h-18 sm:w-20 sm:h-22 rounded-2xl bg-[#1E163B]/80 backdrop-blur-xl border border-[#9B6DFF]/40 p-3 flex flex-col items-center justify-center shadow-[0_8px_24px_rgba(0,0,0,0.4),0_0_15px_rgba(155,109,255,0.2)] animate-float-1">
            <Scale className="w-7 h-7 text-[#FFD166] drop-shadow-[0_0_8px_#FFD166]" />
            <span className="text-[9px] font-mono text-[#DEB0C8] mt-1 font-bold">EQUITY</span>
          </div>

          {/* Hexagon 2: Ideas / Analytics */}
          <div className="absolute -bottom-8 -left-4 z-20 w-16 h-18 sm:w-20 sm:h-22 rounded-2xl bg-[#1E163B]/80 backdrop-blur-xl border border-[#9B6DFF]/40 p-3 flex flex-col items-center justify-center shadow-[0_8px_24px_rgba(0,0,0,0.4),0_0_15px_rgba(155,109,255,0.2)] animate-float-3">
            <Lightbulb className="w-7 h-7 text-[#FFD166] drop-shadow-[0_0_8px_#FFD166]" />
            <span className="text-[9px] font-mono text-[#DEB0C8] mt-1 font-bold">INSIGHT</span>
          </div>

          {/* Hexagon 3: Risk Assessment */}
          <div className="absolute -top-6 -right-6 z-20 w-16 h-18 sm:w-20 sm:h-22 rounded-2xl bg-[#1E163B]/80 backdrop-blur-xl border border-[#9B6DFF]/40 p-3 flex flex-col items-center justify-center shadow-[0_8px_24px_rgba(0,0,0,0.4),0_0_15px_rgba(155,109,255,0.2)] animate-float-2">
            <ShieldCheck className="w-7 h-7 text-[#DEB0C8] drop-shadow-[0_0_8px_#DEB0C8]" />
            <span className="text-[9px] font-mono text-[#FFD166] mt-1 font-bold">VERIFIED</span>
          </div>

          {/* Centerpiece: Glass Telemetry Monitor Card */}
          <div className="w-full max-w-md rounded-3xl p-6 bg-[#161033]/85 backdrop-blur-2xl border border-[#9B6DFF]/30 shadow-[0_20px_60px_rgba(0,0,0,0.7),_0_0_30px_rgba(155,109,255,0.15)] space-y-4 relative overflow-hidden">
            {/* Window Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-400/80" />
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400/80" />
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400/80" />
                <span className="text-[11px] font-mono text-gray-400 ml-2">VERA ENGINE telemetry</span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                ACTIVE
              </span>
            </div>

            {/* Dynamic Content Switching based on Chapter */}
            {activeStep === 0 && (
              /* Chapter 1: Evidence Wave Monitor */
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-300 font-medium">Empirical Signal-to-Noise Ratio</span>
                  <span className="font-mono text-[#FFD166] font-bold">98.2%</span>
                </div>
                {/* SVG Luminous Wave Chart */}
                <div className="h-32 w-full bg-black/30 rounded-xl p-2 relative overflow-hidden border border-white/5">
                  <svg className="w-full h-full overflow-visible" viewBox="0 0 300 100" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="waveGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#9B6DFF" stopOpacity="0.5" />
                        <stop offset="100%" stopColor="#9B6DFF" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>
                    <path
                      d="M0,70 Q40,20 80,50 T160,30 T240,60 T300,25 L300,100 L0,100 Z"
                      fill="url(#waveGrad)"
                    />
                    <path
                      d="M0,70 Q40,20 80,50 T160,30 T240,60 T300,25"
                      fill="none"
                      stroke="#FFD166"
                      strokeWidth="2.5"
                    />
                  </svg>
                </div>
                <div className="grid grid-cols-3 gap-2 pt-1 text-center">
                  <div className="p-2 rounded-lg bg-white/5 border border-white/5">
                    <div className="text-[10px] text-gray-400">Sources</div>
                    <div className="text-xs font-bold text-white font-mono">14 Citations</div>
                  </div>
                  <div className="p-2 rounded-lg bg-white/5 border border-white/5">
                    <div className="text-[10px] text-gray-400">Conflict</div>
                    <div className="text-xs font-bold text-emerald-400 font-mono">0 Flags</div>
                  </div>
                  <div className="p-2 rounded-lg bg-white/5 border border-white/5">
                    <div className="text-[10px] text-gray-400">Method</div>
                    <div className="text-xs font-bold text-[#DEB0C8] font-mono">Deterministic</div>
                  </div>
                </div>
              </div>
            )}

            {activeStep === 1 && (
              /* Chapter 2: Multi-Option Evaluation Matrix */
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-300 font-medium">Scenario Trade-off Matrix</span>
                  <span className="font-mono text-[#9B6DFF] font-bold">3 Alternatives</span>
                </div>
                <div className="space-y-2 pt-1">
                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-gray-200">Alternative A: Modular Architecture</span>
                      <span className="text-[#FFD166] font-mono font-bold">92.4%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-[#7B61FF] to-[#FFD166] rounded-full" style={{ width: '92.4%' }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-gray-200">Alternative B: Monolith Optimization</span>
                      <span className="text-gray-400 font-mono">71.8%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                      <div className="h-full bg-[#9B6DFF]/60 rounded-full" style={{ width: '71.8%' }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-gray-200">Alternative C: Managed Serverless</span>
                      <span className="text-gray-400 font-mono">59.2%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                      <div className="h-full bg-[#644BA1]/60 rounded-full" style={{ width: '59.2%' }} />
                    </div>
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-[11px] text-gray-300">
                  <span className="text-[#FFD166] font-semibold">Sensitivity Notice:</span> Alternative A yields lowest 3-year downside risk variance.
                </div>
              </div>
            )}

            {activeStep === 2 && (
              /* Chapter 3: Audit-Ready Decision Recommendation */
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-300 font-medium">Verified Recommendation</span>
                  <span className="font-mono text-emerald-400 font-bold">VERIFIED 94.8%</span>
                </div>
                <div className="p-3.5 rounded-2xl bg-gradient-to-br from-[#1E1442] to-[#130E2E] border border-[#FFD166]/40 shadow-inner">
                  <div className="text-xs font-semibold text-white mb-1">
                    Primary Verdict: Execute Alternative A
                  </div>
                  <p className="text-[11px] text-gray-300 leading-relaxed">
                    Empirical data demonstrates +34% margin improvement with isolated fault containment. Full deterministic calculation audited.
                  </p>
                </div>
                <button
                  onClick={onJumpToLogin}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#FFD166] to-[#E28C74] hover:brightness-110 text-[#0E0B20] text-xs font-bold shadow-[0_0_20px_rgba(255,209,102,0.4)] transition-all flex items-center justify-center gap-1.5"
                >
                  Enter VERA System
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Slider & Pagination Indicator (matching Keyframes 180, 195, 210, 230) */}
      <footer className="w-full max-w-7xl mx-auto flex items-center justify-between pt-4 border-t border-white/10 text-xs text-gray-400 pointer-events-auto">
        <div className="flex items-center gap-2">
          {chapters.map((ch, idx) => (
            <button
              key={idx}
              onClick={() => onJumpToProgress?.(ch.scrollTarget)}
              className={`h-2 rounded-full transition-all duration-300 ${
                activeStep === idx
                  ? 'w-10 bg-[#FFD166] shadow-[0_0_8px_#FFD166]'
                  : 'w-3 bg-white/20 hover:bg-white/40'
              }`}
              title={ch.title}
            />
          ))}
        </div>

        <div className="flex items-center gap-3">
          <span className="text-[11px] font-mono">
            0{activeStep + 1} / 03
          </span>
          <button
            onClick={() => {
              const nextIdx = (activeStep + 1) % chapters.length;
              if (activeStep === 2) {
                onJumpToLogin?.();
              } else {
                onJumpToProgress?.(chapters[nextIdx].scrollTarget);
              }
            }}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
            title="Next Step"
          >
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </footer>
    </div>
  );
}
