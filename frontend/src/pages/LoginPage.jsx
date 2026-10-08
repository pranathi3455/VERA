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
    { name: 'Sign In', progress: 0.0 },
    { name: 'Decision Intelligence', progress: 0.85 },
  ];

  return (
    <div
      ref={scrollContainerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative w-full bg-[#0E0B20] text-white selection:bg-[#9B6DFF] selection:text-white"
      style={{ height: '220vh' }}
    >
      {/* Pinned Sticky Viewport (100vh) */}
      <div className="sticky top-0 h-screen w-full overflow-hidden select-none">
        {/* Living Canvas Particle Engine */}
        <VeraParticleEngine
          scrollProgress={scrollProgress}
          mousePos={mousePos}
        />

        {/* VERA 4-Pointed Crystal Star Logo crowned above card */}
        <VeraIntroLogo
          scrollProgress={scrollProgress}
        />

        {/* Frosted Glassmorphic Interactive Login Card (Normal condition: visible immediately) */}
        <VeraInteractiveLoginCard
          scrollProgress={scrollProgress}
          onScrollToSection={(p) => scrollToStage(p)}
        />

        {/* Decision Intelligence Showcase (available on scroll down) */}
        <VeraTelemetryShowcase
          scrollProgress={scrollProgress}
          mousePos={mousePos}
          onJumpToLogin={() => scrollToStage(0.0)}
          onJumpToProgress={(p) => scrollToStage(p)}
        />

        {/* Quick Nav Header Controls */}
        <div className="absolute top-4 right-6 z-50 flex items-center gap-3">
          {scrollProgress > 0.40 ? (
            <button
              onClick={() => scrollToStage(0.0)}
              className="px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-xs font-semibold text-white backdrop-blur-md transition-all shadow-sm hover:scale-105 active:scale-95 flex items-center gap-1.5"
            >
              <ArrowUp className="w-3.5 h-3.5 text-[#FFD166]" />
              <span>Back to Sign In</span>
            </button>
          ) : (
            <button
              onClick={() => scrollToStage(0.85)}
              className="px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-xs font-semibold text-[#FFD166] backdrop-blur-md transition-all shadow-[0_0_15px_rgba(255,209,102,0.3)] hover:scale-105 active:scale-95 flex items-center gap-1.5"
            >
              <span>Explore Features</span>
              <ChevronDown className="w-3.5 h-3.5" />
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
                (scrollProgress < 0.45 ? 0 : 1) === idx
                  ? 'bg-gradient-to-r from-[#7B61FF] to-[#9B6DFF] text-white shadow-[0_0_12px_rgba(155,109,255,0.4)]'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${(scrollProgress < 0.45 ? 0 : 1) === idx ? 'bg-[#FFD166]' : 'bg-gray-500'}`} />
              <span>{stage.name}</span>
            </button>
          ))}
        </aside>
      </div>
    </div>
  );
}
