import { useEffect, useRef } from 'react';

interface ParticleFieldProps { density?: number }

export function ParticleField({ density = 120 }: ParticleFieldProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let raf = 0;
    let width = 0;
    let height = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const particles = Array.from({ length: density }, (_, i) => ({
      x: Math.random(), y: Math.random(), z: Math.random(), speed: 0.05 + Math.random() * 0.2, phase: i * 0.73
    }));

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      width = rect.width; height = rect.height;
      canvas.width = Math.max(1, Math.floor(width * dpr));
      canvas.height = Math.max(1, Math.floor(height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const observer = new ResizeObserver(resize); observer.observe(canvas);

    const render = (time: number) => {
      ctx.clearRect(0, 0, width, height);
      ctx.globalCompositeOperation = 'lighter';
      for (const p of particles) {
        const t = time * 0.00002 * p.speed + p.phase;
        const x = ((p.x + Math.sin(t) * 0.02) * width + width) % width;
        const y = ((p.y + Math.cos(t * 1.3) * 0.02) * height + height) % height;
        const r = 0.5 + p.z * 1.4;
        ctx.fillStyle = `rgba(45, 216, 255, ${0.12 + p.z * 0.35})`;
        ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
      }
      raf = requestAnimationFrame(render);
    };
    raf = requestAnimationFrame(render);
    return () => { cancelAnimationFrame(raf); observer.disconnect(); };
  }, [density]);

  return <canvas className="particle-field" ref={canvasRef} aria-hidden="true" />;
}
