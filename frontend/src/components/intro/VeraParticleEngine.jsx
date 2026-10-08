import React, { useEffect, useRef } from 'react';

/**
 * VeraParticleEngine
 * High-performance HTML5 Canvas living particle intelligence field.
 * 
 * Features:
 * - 3 particle depth layers (background, midground, foreground with parallax)
 * - Living magnetic/intelligence cursor interaction with inertia damping
 * - Continuous scroll-driven geometric transformations:
 *    0.00 - 0.18: Quiet celestial intelligence field
 *    0.18 - 0.38: Twin logarithmic vortex streams & ribbon highways
 *    0.38 - 0.58: Coalescence into the VERA 4-pointed diamond star logo
 *    0.58 - 0.78: Streams part outward, opening space for the login interface
 *    0.78 - 1.00: Weaving photon ribbons wrapping around telemetry cards & finale flare
 * - Reversible bidirectional scroll physics
 * - High-DPI support, mobile adaptive particle counts, 60 FPS requestAnimationFrame
 */
export default function VeraParticleEngine({ scrollProgress = 0, mousePos = { x: 0, y: 0, vx: 0, vy: 0, isHovering: false } }) {
  const canvasRef = useRef(null);

  // Store references for the animation loop
  const stateRef = useRef({
    particles: [],
    ribbons: [],
    width: 0,
    height: 0,
    dpr: 1,
    time: 0,
    currScroll: 0,
    targetScroll: 0,
    currMouse: { x: 0, y: 0, vx: 0, vy: 0, isHovering: false },
    isReducedMotion: false,
  });

  // Keep target scroll and mouse pos synced to refs
  useEffect(() => {
    stateRef.current.targetScroll = scrollProgress;
  }, [scrollProgress]);

  useEffect(() => {
    stateRef.current.currMouse = mousePos;
  }, [mousePos]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    stateRef.current.isReducedMotion = prefersReducedMotion;

    // Palette tokens aligned with VERA visual identity
    // #0E0B20, #1A1638, #3F284E, #644BA1, #9B6DFF, #DEB0C8, #E28C74, and Gold accents #FFD166
    const colors = [
      { r: 155, g: 109, b: 255 }, // Violet #9B6DFF
      { r: 222, g: 176, b: 200 }, // Soft pink #DEB0C8
      { r: 226, g: 140, b: 116 }, // Warm orange/coral #E28C74
      { r: 255, g: 209, b: 102 }, // Premium Gold #FFD166
      { r: 100, g: 75,  b: 161 }, // Deep purple #644BA1
      { r: 255, g: 255, b: 255 }, // Crisp pure white highlight
      { r: 99,  g: 102, b: 241 }, // Indigo highlight #6366F1
    ];

    // Generate VERA 4-pointed faceted star targets
    function getStarTarget(index, total, cx, cy, starRadius) {
      // 4 cardinal arms + 4 inner facets + central diamond core
      const angle = (index / total) * Math.PI * 2;
      const modAngle = ((angle % (Math.PI / 2)) + Math.PI / 2) % (Math.PI / 2);
      // Normalized angle within quadrant: 0 to pi/2
      const t = modAngle / (Math.PI / 2);
      
      // Multi-pointed star radius modulation (diamond star equation)
      // Cardinal points at 0, PI/2, PI, 3PI/2
      const isCardinalNear = Math.abs(Math.sin(angle * 2)) < 0.35;
      const armLength = isCardinalNear ? starRadius * 1.35 : starRadius * 0.42;
      
      // Some particles form the inner diamond facet
      if (index % 3 === 0) {
        const innerR = starRadius * 0.38;
        const ix = cx + Math.cos(angle) * innerR;
        const iy = cy + Math.sin(angle) * innerR;
        return { x: ix, y: iy };
      }

      // Outer facet contour
      const r = armLength * (0.65 + 0.35 * Math.cos(angle * 4));
      return {
        x: cx + Math.cos(angle) * r,
        y: cy + Math.sin(angle) * r
      };
    }

    // Initialize particles
    function initParticles(w, h) {
      const isMobile = w < 768;
      const count = prefersReducedMotion ? 75 : isMobile ? 180 : 380;
      const particles = [];
      const cx = w / 2;
      const cy = h / 2;
      const starRadius = Math.min(w, h) * 0.22;

      for (let i = 0; i < count; i++) {
        // Assign layers: 0 = background (tiny, slow), 1 = midground, 2 = foreground (large, responsive)
        const layer = i % 10 < 5 ? 0 : i % 10 < 8 ? 1 : 2;
        const color = colors[i % colors.length];

        const baseSize = layer === 0 ? 1.0 + Math.random() * 1.2 : layer === 1 ? 1.8 + Math.random() * 1.6 : 3.0 + Math.random() * 2.2;
        const depth = layer === 0 ? 0.25 : layer === 1 ? 0.65 : 1.0;

        // Ambient random position
        const ambientX = Math.random() * w;
        const ambientY = Math.random() * h;

        // Spiral vortex angle & radius
        const vortexAngle = (i / count) * Math.PI * 8 + Math.random() * 0.4;
        const vortexRadius = 25 + Math.pow(i / count, 1.2) * (Math.min(w, h) * 0.46);

        // Star target
        const star = getStarTarget(i, count, cx, cy, starRadius);

        // Split streams when login card appears (push outward left and right)
        const side = i % 2 === 0 ? -1 : 1;
        const splitX = cx + side * (w * 0.38 + Math.random() * (w * 0.16));
        const splitY = (h * 0.15) + (i / count) * (h * 0.7);

        // Telemetry ribbon stream target (curved highway across the bottom and sides)
        const tVal = i / count;
        const telemX = w * (0.1 + 0.8 * tVal);
        const telemY = h * (0.68 + 0.22 * Math.sin(tVal * Math.PI * 3));

        particles.push({
          id: i,
          layer,
          depth,
          color,
          baseSize,
          alpha: layer === 0 ? 0.35 + Math.random() * 0.25 : layer === 1 ? 0.6 + Math.random() * 0.3 : 0.85 + Math.random() * 0.15,
          x: ambientX,
          y: ambientY,
          vx: (Math.random() - 0.5) * 0.4,
          vy: (Math.random() - 0.5) * 0.4,
          ambientX,
          ambientY,
          vortexAngle,
          vortexRadius,
          starX: star.x,
          starY: star.y,
          splitX,
          splitY,
          telemX,
          telemY,
          seed: Math.random() * 1000,
          orbitSpeed: (0.004 + Math.random() * 0.008) * (i % 2 === 0 ? 1 : -1),
        });
      }

      stateRef.current.particles = particles;
    }

    // Initialize flowing photon ribbons
    function initRibbons(w, h) {
      const ribbons = [
        {
          color: 'rgba(250, 208, 116, 0.45)', // Warm gold
          width: 2.2,
          phase: 0,
          speed: 0.012,
          yRatio: 0.48,
          amplitude: h * 0.18,
          freq: 0.0018,
        },
        {
          color: 'rgba(155, 109, 255, 0.4)', // Violet
          width: 1.8,
          phase: 2.1,
          speed: 0.009,
          yRatio: 0.52,
          amplitude: h * 0.22,
          freq: 0.0014,
        },
        {
          color: 'rgba(222, 176, 200, 0.35)', // Magenta/soft pink
          width: 1.5,
          phase: 4.2,
          speed: 0.015,
          yRatio: 0.56,
          amplitude: h * 0.14,
          freq: 0.0022,
        }
      ];
      stateRef.current.ribbons = ribbons;
    }

    // Handle resize
    function handleResize() {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);

      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;

      ctx.scale(dpr, dpr);

      stateRef.current.width = w;
      stateRef.current.height = h;
      stateRef.current.dpr = dpr;

      initParticles(w, h);
      initRibbons(w, h);
    }

    handleResize();
    window.addEventListener('resize', handleResize);

    // Animation loop
    let animId;
    function render() {
      const state = stateRef.current;
      const { width: w, height: h, isReducedMotion } = state;
      if (!w || !h) {
        animId = requestAnimationFrame(render);
        return;
      }

      state.time += 0.016;
      // Smooth lerp scroll progress for silk-smooth interpolation
      state.currScroll += (state.targetScroll - state.currScroll) * 0.1;
      const p = Math.max(0, Math.min(1, state.currScroll));
      const t = state.time;

      // Clear with dark atmospheric fade
      ctx.clearRect(0, 0, w, h);

      // Deep celestial radial background gradients matching VERA palette
      // #0A071A -> #140E31 -> #221443
      const bgGrad = ctx.createRadialGradient(
        w * 0.5 + Math.sin(t * 0.5) * 30,
        h * 0.45 + Math.cos(t * 0.4) * 20,
        50,
        w * 0.5,
        h * 0.5,
        Math.max(w, h) * 0.85
      );
      bgGrad.addColorStop(0, '#1E1442');
      bgGrad.addColorStop(0.35, '#130C2E');
      bgGrad.addColorStop(0.75, '#0B071A');
      bgGrad.addColorStop(1, '#060410');

      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, w, h);

      // Secondary ambient glow orbs (breathing)
      const orbAlpha = 0.15 + 0.08 * Math.sin(t * 0.8);
      const orbGrad = ctx.createRadialGradient(w * 0.3, h * 0.35, 10, w * 0.3, h * 0.35, w * 0.45);
      orbGrad.addColorStop(0, `rgba(155, 109, 255, ${orbAlpha})`);
      orbGrad.addColorStop(0.5, `rgba(100, 75, 161, ${orbAlpha * 0.5})`);
      orbGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = orbGrad;
      ctx.fillRect(0, 0, w, h);

      const orb2Grad = ctx.createRadialGradient(w * 0.75, h * 0.65, 10, w * 0.75, h * 0.65, w * 0.4);
      orb2Grad.addColorStop(0, `rgba(226, 140, 116, ${orbAlpha * 0.6})`);
      orb2Grad.addColorStop(1, 'transparent');
      ctx.fillStyle = orb2Grad;
      ctx.fillRect(0, 0, w, h);

      // Draw Luminous Ribbon Waves (weaves in and out based on scroll progress)
      // Ribbons visible throughout, especially active during vortex (p: 0.15-0.4) and telemetry (p > 0.75)
      const ribbonVisibility = p < 0.1 ? p * 10 : p > 0.6 && p < 0.75 ? 1 - (p - 0.6) * 4 : p >= 0.75 ? (p - 0.75) * 4 : 1.0;
      if (ribbonVisibility > 0.05 && !isReducedMotion) {
        state.ribbons.forEach((ribbon) => {
          ctx.save();
          ctx.beginPath();
          ctx.lineWidth = ribbon.width;
          ctx.strokeStyle = ribbon.color;
          ctx.globalAlpha = Math.max(0, Math.min(1, ribbonVisibility * 0.8));

          const baseY = h * ribbon.yRatio;
          const amp = ribbon.amplitude * (1 + 0.3 * Math.sin(t * 0.5));
          const points = [];
          const step = 25;

          for (let x = -20; x <= w + 20; x += step) {
            // Ribbon wave with Bézier flow
            const yOffset = Math.sin(x * ribbon.freq + t * ribbon.speed * 20 + ribbon.phase) * amp;
            // Morph ribbon towards center during vortex state
            let morphOffset = 0;
            if (p >= 0.18 && p <= 0.55) {
              const vortexFactor = Math.sin(((p - 0.18) / 0.37) * Math.PI);
              const distFromCenter = Math.abs(x - w / 2) / (w / 2);
              morphOffset = (h / 2 - (baseY + yOffset)) * vortexFactor * (1 - distFromCenter * 0.5);
            }
            points.push({ x, y: baseY + yOffset + morphOffset });
          }

          if (points.length > 0) {
            ctx.moveTo(points[0].x, points[0].y);
            for (let i = 1; i < points.length - 1; i++) {
              const xc = (points[i].x + points[i + 1].x) / 2;
              const yc = (points[i].y + points[i + 1].y) / 2;
              ctx.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
            }
            ctx.stroke();
          }
          ctx.restore();
        });
      }

      // Central Energy Core Glow (Forms in Phase 2 & 3: p: 0.25 -> 0.65)
      if (p > 0.2 && p < 0.75) {
        const coreFactor = p < 0.45 ? (p - 0.2) / 0.25 : 1 - (p - 0.45) / 0.3;
        const coreAlpha = Math.max(0, Math.min(0.9, coreFactor * 0.85));
        const coreRadius = (40 + 35 * Math.sin(t * 3)) * (0.8 + 0.5 * coreFactor);

        const coreGrad = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, coreRadius * 2.5);
        coreGrad.addColorStop(0, `rgba(255, 235, 175, ${coreAlpha})`);
        coreGrad.addColorStop(0.35, `rgba(155, 109, 255, ${coreAlpha * 0.75})`);
        coreGrad.addColorStop(0.7, `rgba(100, 75, 161, ${coreAlpha * 0.3})`);
        coreGrad.addColorStop(1, 'transparent');

        ctx.fillStyle = coreGrad;
        ctx.beginPath();
        ctx.arc(w / 2, h / 2, coreRadius * 2.5, 0, Math.PI * 2);
        ctx.fill();

        // Orbital golden glowing rings (Keyframe 60 & Keyframe 80)
        if (p > 0.35 && p < 0.65) {
          const ringProgress = Math.sin(((p - 0.35) / 0.3) * Math.PI);
          ctx.save();
          ctx.translate(w / 2, h / 2);
          ctx.rotate(-0.35 + Math.sin(t * 0.4) * 0.05);
          ctx.beginPath();
          ctx.ellipse(0, 0, starRadiusX(w) * 1.3, starRadiusX(w) * 0.35, 0, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(250, 208, 116, ${ringProgress * 0.75})`;
          ctx.lineWidth = 1.6;
          ctx.shadowColor = '#FFD166';
          ctx.shadowBlur = 12;
          ctx.stroke();

          // Second intersecting ring
          ctx.beginPath();
          ctx.ellipse(0, 0, starRadiusX(w) * 1.1, starRadiusX(w) * 0.28, Math.PI * 0.22, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(222, 176, 200, ${ringProgress * 0.5})`;
          ctx.lineWidth = 1.2;
          ctx.stroke();
          ctx.restore();
        }
      }

      function starRadiusX(winW) {
        return Math.min(winW, h) * 0.22;
      }

      // Mouse interaction metrics
      const mouse = state.currMouse;
      const influenceRadius = 180;

      // Update and Draw Particles
      const cx = w / 2;
      const cy = h / 2;

      // Draw particle connectivity in midground (Intelligence Network)
      // Only draw between closest neighbors to preserve 60 FPS
      if (p > 0.15 && p < 0.8 && !isReducedMotion) {
        ctx.lineWidth = 0.6;
        ctx.strokeStyle = 'rgba(155, 109, 255, 0.12)';
        const sampleStep = 8;
        for (let i = 0; i < state.particles.length; i += sampleStep) {
          const p1 = state.particles[i];
          if (p1.layer !== 1) continue;
          for (let j = i + sampleStep; j < state.particles.length; j += sampleStep * 2) {
            const p2 = state.particles[j];
            const dx = p1.x - p2.x;
            const dy = p1.y - p2.y;
            const distSq = dx * dx + dy * dy;
            if (distSq < 7500) { // ~86px
              ctx.beginPath();
              ctx.moveTo(p1.x, p1.y);
              ctx.lineTo(p2.x, p2.y);
              ctx.stroke();
            }
          }
        }
      }

      for (let i = 0; i < state.particles.length; i++) {
        const pt = state.particles[i];

        // 1. Calculate Target Position based on normalized Scroll Progress (p)
        // Stage 0: 0.00 -> 0.18 (Ambient quiet drift)
        // Stage 1: 0.18 -> 0.38 (Vortex streams)
        // Stage 2: 0.38 -> 0.58 (Star logo formation)
        // Stage 3: 0.58 -> 0.78 (Outward parting for login card)
        // Stage 4: 0.78 -> 1.00 (Telemetry ribbon flow & finale burst)
        let targetX = pt.ambientX;
        let targetY = pt.ambientY;

        // Ambient gentle harmonic drift
        const driftX = Math.sin(t * 0.5 + pt.seed) * (15 * pt.depth);
        const driftY = Math.cos(t * 0.4 + pt.seed) * (12 * pt.depth);
        targetX += driftX;
        targetY += driftY;

        if (p < 0.18) {
          // Pure quiet ambient state with gentle drift
          // targetX and targetY already set
        } else if (p < 0.38) {
          // Interpolate to Vortex Stream (Stage 1)
          const subP = (p - 0.18) / 0.2;
          const currAngle = pt.vortexAngle + t * pt.orbitSpeed * 35;
          const currRad = pt.vortexRadius * (1 - subP * 0.35);
          const vx = cx + Math.cos(currAngle) * currRad;
          const vy = cy + Math.sin(currAngle) * currRad;
          targetX = lerp(targetX, vx, smoothstep(subP));
          targetY = lerp(targetY, vy, smoothstep(subP));
        } else if (p < 0.58) {
          // Interpolate to Star Logo (Stage 2)
          const subP = (p - 0.38) / 0.2;
          // Micro-shimmer on star facet points
          const shimmer = Math.sin(t * 3 + pt.seed) * (2.5 * pt.depth);
          const sx = pt.starX + shimmer;
          const sy = pt.starY + shimmer;
          // Fast transition from vortex to star
          targetX = lerp(targetX, sx, smoothstep(subP));
          targetY = lerp(targetY, sy, smoothstep(subP));
        } else if (p < 0.78) {
          // Interpolate to Outward Split for Login Card (Stage 3)
          const subP = (p - 0.58) / 0.2;
          const px = pt.splitX + Math.sin(t + pt.seed) * 15;
          const py = pt.splitY + Math.cos(t * 0.8 + pt.seed) * 15;
          targetX = lerp(pt.starX, px, smoothstep(subP));
          targetY = lerp(pt.starY, py, smoothstep(subP));
        } else {
          // Telemetry Ribbon Highway & Finale Stage (Stage 4)
          const subP = (p - 0.78) / 0.22;
          const tx = pt.telemX + Math.sin(t * 2 + pt.seed) * 20;
          const ty = pt.telemY + Math.cos(t * 1.5 + pt.seed) * 20;
          targetX = lerp(pt.splitX, tx, smoothstep(subP));
          targetY = lerp(pt.splitY, ty, smoothstep(subP));

          // Finale flare burst at p > 0.96 (Frame 240)
          if (p > 0.95) {
            const burst = (p - 0.95) / 0.05;
            const burstAngle = Math.atan2(pt.y - cy, pt.x - cx);
            targetX += Math.cos(burstAngle) * burst * w * 0.5;
            targetY += Math.sin(burstAngle) * burst * h * 0.5;
          }
        }

        // 2. Spring Physics towards Target
        const spring = 0.05 + pt.depth * 0.04;
        pt.vx += (targetX - pt.x) * spring;
        pt.vy += (targetY - pt.y) * spring;

        // 3. Mouse Interaction (Magnetic Intelligence Field)
        if (mouse.isHovering && !isReducedMotion) {
          const dx = pt.x - mouse.x;
          const dy = pt.y - mouse.y;
          const dist = Math.hypot(dx, dy);

          if (dist < influenceRadius && dist > 1) {
            const force = (1 - dist / influenceRadius) * 4.0 * pt.depth;
            const normX = dx / dist;
            const normY = dy / dist;

            // Tangential swirl along cursor direction
            const tangentX = -normY;
            const tangentY = normX;
            const mouseSpeed = Math.hypot(mouse.vx, mouse.vy);

            // Deflection + gentle swirl + momentum impulse
            pt.vx += normX * force * 1.2 + tangentX * (mouse.vx * 0.15) + (mouse.vx * 0.12);
            pt.vy += normY * force * 1.2 + tangentY * (mouse.vy * 0.15) + (mouse.vy * 0.12);
          }
        }

        // 4. Damping & Integration
        pt.vx *= 0.90; // Natural inertia decay
        pt.vy *= 0.90;
        pt.x += pt.vx;
        pt.y += pt.vy;

        // 5. Draw Particle with Glow
        const { r, g, b } = pt.color;
        const currentAlpha = pt.alpha * (p > 0.97 ? 1 - (p - 0.97) * 20 : 1.0);
        const radius = pt.baseSize * (p > 0.38 && p < 0.58 && pt.layer === 2 ? 1.35 : 1.0);

        ctx.beginPath();
        ctx.arc(pt.x, pt.y, radius, 0, Math.PI * 2);

        // Foreground and highlight particles receive radiant halo glow
        if (pt.layer === 2 || (r === 255 && g === 209)) {
          ctx.shadowColor = `rgb(${r}, ${g}, ${b})`;
          ctx.shadowBlur = 8;
          ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${currentAlpha})`;
          ctx.fill();
          ctx.shadowBlur = 0; // reset for performance
        } else {
          ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${currentAlpha})`;
          ctx.fill();
        }
      }

      // 6. Finale Lens Flare Burst (Keyframe 240)
      if (p > 0.93) {
        const flareProgress = (p - 0.93) / 0.07;
        const flareAlpha = Math.min(1, flareProgress * 1.2);
        const flareX = w * 0.75;
        const flareY = h * 0.55;
        const flareR = Math.max(w, h) * (0.3 + 0.7 * flareProgress);

        const flareGrad = ctx.createRadialGradient(flareX, flareY, 0, flareX, flareY, flareR);
        flareGrad.addColorStop(0, `rgba(255, 255, 255, ${flareAlpha * 0.95})`);
        flareGrad.addColorStop(0.2, `rgba(250, 208, 116, ${flareAlpha * 0.75})`);
        flareGrad.addColorStop(0.5, `rgba(155, 109, 255, ${flareAlpha * 0.45})`);
        flareGrad.addColorStop(1, 'transparent');

        ctx.fillStyle = flareGrad;
        ctx.fillRect(0, 0, w, h);

        // Radiant spikes
        ctx.save();
        ctx.translate(flareX, flareY);
        ctx.rotate(t * 0.2);
        ctx.strokeStyle = `rgba(255, 255, 255, ${flareAlpha * 0.6})`;
        ctx.lineWidth = 1.5;
        for (let a = 0; a < 8; a++) {
          ctx.beginPath();
          ctx.moveTo(-flareR * 0.8, 0);
          ctx.lineTo(flareR * 0.8, 0);
          ctx.stroke();
          ctx.rotate(Math.PI / 8);
        }
        ctx.restore();
      }

      animId = requestAnimationFrame(render);
    }

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none z-0"
      aria-hidden="true"
    />
  );
}

// Math utilities
function lerp(a, b, t) {
  return a + (b - a) * t;
}

function smoothstep(x) {
  const c = Math.max(0, Math.min(1, x));
  return c * c * (3 - 2 * c);
}
