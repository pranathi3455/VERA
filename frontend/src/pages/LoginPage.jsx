import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import VeraParticleEngine from '../components/intro/VeraParticleEngine';
import VeraIntroLogo from '../components/intro/VeraIntroLogo';
import VeraInteractiveLoginCard from '../components/intro/VeraInteractiveLoginCard';
import VeraTelemetryShowcase from '../components/intro/VeraTelemetryShowcase';
import { ChevronDown, ArrowUp } from 'lucide-react';

/**
 * LoginPage: VERA Cinematic Scroll-Driven Intro & Animated Login Experience
 * 
 * Recreates the complete 240 keyframes as a real interactive, GPU-accelerated,
 * scroll-driven continuous cinematic journey:
 * 
 * Scroll Range:
 * - 0.00 - 0.18: Quiet Celestial Awakening (Frame 001 - 025)
 * - 0.18 - 0.38: Information Vortex & Flowing Ribbons (Frame 026 - 055)
 * - 0.38 - 0.58: VERA Crystal Star & Orbital Identity (Frame 056 - 090)
 * - 0.58 - 0.78: Awakening into Interactive Login (Frame 091 - 150)
 * - 0.78 - 1.00: Deep Decision Intelligence Ecosystem (Frame 151 - 240)
 */
export default function LoginPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const scrollContainerRef = useRef(null);

  // Scroll progress states
  const [scrollProgress, setScrollProgress] = useState(0);
  const [targetProgress, setTargetProgress] = useState(0);

  // Mouse tracking with inertia
  const [mousePos, setMousePos] = useState({
    x: typeof window !== 'undefined' ? window.innerWidth / 2 : 600,
    y: typeof window !== 'undefined' ? window.innerHeight / 2 : 400,
    vx: 0,
    vy: 0,
    isHovering: false,
  });

  const lastMouseRef = useRef({ x: 0, y: 0, time: 0 });

  // Body dark aesthetic enforcement
  useEffect(() => {
    const origBg = document.body.style.backgroundColor;
    document.body.style.backgroundColor = '#0E0B20';
    return () => {
      document.body.style.backgroundColor = origBg;
    };
  }, []);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // Window scroll handler
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY || window.pageYOffset;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (docHeight > 0) {
        const rawProgress = Math.max(0, Math.min(1, scrollY / docHeight));
        setTargetProgress(rawProgress);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Smooth lerping of scrollProgress for silky continuous movement
  useEffect(() => {
    let animId;
    const lerpLoop = () => {
      setScrollProgress((prev) => {
        const diff = targetProgress - prev;
        if (Math.abs(diff) < 0.0005) {
          return targetProgress;
        }
        return prev + diff * 0.18;
      });
      animId = requestAnimationFrame(lerpLoop);
    };

    animId = requestAnimationFrame(lerpLoop);
    return () => cancelAnimationFrame(animId);
  }, [targetProgress]);

  // Mouse movement listener
  const handleMouseMove = useCallback((e) => {
    const now = performance.now();
    const dt = Math.max(1, now - lastMouseRef.current.time);
    const vx = ((e.clientX - lastMouseRef.current.x) / dt) * 16;
    const vy = ((e.clientY - lastMouseRef.current.y) / dt) * 16;

    lastMouseRef.current = { x: e.clientX, y: e.clientY, time: now };

    setMousePos({
      x: e.clientX,
      y: e.clientY,
      vx: Math.max(-25, Math.min(25, vx)),
      vy: Math.max(-25, Math.min(25, vy)),
      isHovering: true,
    });
  }, []);

  const handleMouseLeave = useCallback(() => {
    setMousePos((prev) => ({ ...prev, isHovering: false, vx: 0, vy: 0 }));
  }, []);

  // Programmatic smooth scroll to specific stage
  const scrollToStage = (stageProgress) => {
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    window.scrollTo({
      top: stageProgress * docHeight,
      behavior: 'smooth',
    });
  };

  // Stage labels for progress HUD
  const stages = [
    { name: 'Awakening', progress: 0.05 },
    { name: 'Formation', progress: 0.28 },
    { name: 'Identity', progress: 0.48 },
    { name: 'Sign In', progress: 0.70 },
    { name: 'Intelligence', progress: 0.90 },
  ];

  // Current active stage index
  const activeStageIdx = scrollProgress < 0.20 ? 0
    : scrollProgress < 0.40 ? 1
    : scrollProgress < 0.60 ? 2
    : scrollProgress < 0.80 ? 3
    : 4;

  return (
    <div
      ref={scrollContainerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative w-full bg-[#0E0B20] text-white selection:bg-[#9B6DFF] selection:text-white"
      style={{ height: '420vh' }}
    >
      {/* Pinned Sticky Viewport (100vh) */}
      <div className="sticky top-0 h-screen w-full overflow-hidden select-none">
        {/* Living Canvas Particle Engine */}
        <VeraParticleEngine
          scrollProgress={scrollProgress}
          mousePos={mousePos}
        />

        {/* State 0: Quiet Ambient Intro Eyebrow & Hint (0.00 - 0.25) */}
        {scrollProgress < 0.28 && (
          <div
            className="absolute inset-0 flex flex-col items-center justify-between py-12 px-6 pointer-events-none z-10 transition-opacity duration-300"
            style={{
              opacity: Math.max(0, 1 - scrollProgress * 3.8),
            }}
          >
            {/* Top Brand Minimal Badge */}
            <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md shadow-[0_0_20px_rgba(155,109,255,0.2)]">
              <span className="w-2 h-2 rounded-full bg-[#FFD166] animate-pulse" />
              <span className="text-xs font-semibold tracking-wider text-[#DEB0C8] uppercase font-mono">
                VERA Intelligence Field
              </span>
            </div>

            {/* Central Minimal Greeting */}
            <div className="text-center max-w-md space-y-3">
              <h1 className="text-2xl sm:text-4xl font-extralight tracking-widest uppercase text-white/90">
                VERA
              </h1>
              <p className="text-xs sm:text-sm text-[#CBD5E1]/70 font-light tracking-wide leading-relaxed">
                Move cursor to interact with the field. Scroll to enter.
              </p>
            </div>

            {/* Bottom Scroll Prompt */}
            <div className="flex flex-col items-center gap-2 text-gray-400 animate-bounce">
              <span className="text-[11px] font-mono tracking-widest text-[#FFD166]">
                SCROLL TO AWAKEN
              </span>
              <ChevronDown className="w-4 h-4 text-[#FFD166]" />
            </div>
          </div>
        )}

        {/* State 2 & 3: VERA 4-Pointed Crystal Star Logo (0.30 - 0.78) */}
        <VeraIntroLogo
          scrollProgress={scrollProgress}
        />

        {/* State 3: Frosted Glassmorphic Interactive Login Card (0.54 - 0.84) */}
        <VeraInteractiveLoginCard
          scrollProgress={scrollProgress}
          onScrollToSection={(p) => scrollToStage(p)}
        />

        {/* State 4: Decision Intelligence Showcase (0.84 - 1.00) */}
        <VeraTelemetryShowcase
          scrollProgress={scrollProgress}
          mousePos={mousePos}
          onJumpToLogin={() => scrollToStage(0.70)}
          onJumpToProgress={(p) => scrollToStage(p)}
        />

        {/* Quick Nav Header Controls */}
        <div className="absolute top-4 right-6 z-50 flex items-center gap-3">
          {scrollProgress < 0.60 && (
            <button
              onClick={() => scrollToStage(0.70)}
              className="px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-xs font-semibold text-[#FFD166] backdrop-blur-md transition-all shadow-[0_0_15px_rgba(255,209,102,0.3)] hover:scale-105 active:scale-95"
            >
              Skip to Sign In →
            </button>
          )}

          {scrollProgress >= 0.80 && (
            <button
              onClick={() => scrollToStage(0.0)}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-white backdrop-blur-md transition-all"
              title="Return to top"
            >
              <ArrowUp className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Floating Interactive Stage HUD / Pagination (Bottom Center) */}
        <aside
          aria-label="Experience Navigation"
          className="absolute bottom-5 left-1/2 -translate-x-1/2 z-50 px-3.5 py-1.5 rounded-full bg-[#130E2E]/80 backdrop-blur-xl border border-white/10 flex items-center gap-2 shadow-[0_8px_32px_rgba(0,0,0,0.5)] transition-all"
        >
          {stages.map((stage, idx) => (
            <button
              key={stage.name}
              onClick={() => scrollToStage(stage.progress)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium transition-all ${
                activeStageIdx === idx
                  ? 'bg-gradient-to-r from-[#7B61FF] to-[#9B6DFF] text-white shadow-[0_0_12px_rgba(155,109,255,0.4)]'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${activeStageIdx === idx ? 'bg-[#FFD166]' : 'bg-gray-500'}`} />
              <span className="hidden sm:inline">{stage.name}</span>
            </button>
          ))}
        </aside>
      </div>
    </div>
  );
}
