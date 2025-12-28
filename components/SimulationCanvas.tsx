
import React, { useRef, useEffect } from 'react';
import { PlanetData, Star } from '../types';
import { STAR_COUNT, MAX_STAR_SPEED } from '../constants';

interface SimulationCanvasProps {
  planet: PlanetData;
  hyperdrive: boolean;
  shipY: number; // 0-100
}

const SimulationCanvas: React.FC<SimulationCanvasProps> = ({ planet, hyperdrive, shipY }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const starsRef = useRef<Star[]>([]);
  const rotationRef = useRef(0);

  // Initialize stars
  useEffect(() => {
    const stars: Star[] = [];
    for (let i = 0; i < STAR_COUNT; i++) {
      stars.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        size: Math.random() * 2,
        opacity: Math.random(),
        speed: Math.random() * MAX_STAR_SPEED
      });
    }
    starsRef.current = stars;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', resize);
    resize();

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Subtle vertical parallax offset based on ship position
      // As ship goes up (shipY decreases), background moves slightly down
      const vOffset = (shipY - 50) * 0.5;

      // 1. Draw Space Background Gradient
      const bgGrad = ctx.createRadialGradient(
        canvas.width / 2, canvas.height / 2 + vOffset, 0,
        canvas.width / 2, canvas.height / 2 + vOffset, canvas.width
      );
      bgGrad.addColorStop(0, '#0f172a');
      bgGrad.addColorStop(1, '#020617');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // 2. Draw Stars with Parallax
      const speedMult = hyperdrive ? 20 : 1;
      starsRef.current.forEach(star => {
        star.x -= star.speed * speedMult;
        
        // Add vertical star parallax based on ship movement
        const starVPos = star.y - (vOffset * star.speed * 0.5);

        if (star.x < 0) {
          star.x = canvas.width;
          star.y = Math.random() * canvas.height;
        }

        ctx.beginPath();
        ctx.arc(star.x, starVPos, star.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${star.opacity})`;
        ctx.fill();
        
        if (hyperdrive) {
          ctx.beginPath();
          ctx.moveTo(star.x, starVPos);
          ctx.lineTo(star.x + star.size * 15, starVPos);
          ctx.strokeStyle = `rgba(255, 255, 255, ${star.opacity * 0.5})`;
          ctx.lineWidth = star.size;
          ctx.stroke();
        }
      });

      // 3. Draw Planet
      if (!hyperdrive) {
        const cx = canvas.width / 2;
        const cy = canvas.height / 2 - vOffset; // Move planet opposite of ship
        rotationRef.current += planet.rotationSpeed;

        // Atmosphere Glow
        const atmosGrad = ctx.createRadialGradient(cx, cy, planet.radius * 0.8, cx, cy, planet.radius * 1.5);
        atmosGrad.addColorStop(0, planet.atmosphereColor + '66');
        atmosGrad.addColorStop(1, 'transparent');
        ctx.fillStyle = atmosGrad;
        ctx.beginPath();
        ctx.arc(cx, cy, planet.radius * 1.5, 0, Math.PI * 2);
        ctx.fill();

        // Planet Body
        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, cy, planet.radius, 0, Math.PI * 2);
        ctx.clip();

        // Procedural "Texture"
        ctx.fillStyle = planet.baseColor;
        ctx.fillRect(cx - planet.radius, cy - planet.radius, planet.radius * 2, planet.radius * 2);

        // Shadow/Depth
        const shadowGrad = ctx.createRadialGradient(
          cx - planet.radius / 3, cy - planet.radius / 3, planet.radius / 10,
          cx, cy, planet.radius
        );
        shadowGrad.addColorStop(0, 'rgba(255, 255, 255, 0.1)');
        shadowGrad.addColorStop(1, 'rgba(0, 0, 0, 0.8)');
        ctx.fillStyle = shadowGrad;
        ctx.fillRect(cx - planet.radius, cy - planet.radius, planet.radius * 2, planet.radius * 2);

        // Rotating surface features
        ctx.globalAlpha = 0.3;
        ctx.fillStyle = '#ffffff';
        for (let i = 0; i < 5; i++) {
            const shift = (rotationRef.current * 100 * (i + 1)) % (planet.radius * 4);
            ctx.beginPath();
            ctx.ellipse(cx - planet.radius * 2 + shift, cy - planet.radius + (i * planet.radius * 0.4), planet.radius * 0.5, planet.radius * 0.1, 0, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();

        if (planet.type.toLowerCase().includes('gas')) {
            ctx.beginPath();
            ctx.ellipse(cx, cy, planet.radius * 2.2, planet.radius * 0.4, Math.PI / 10, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
            ctx.lineWidth = 10;
            ctx.stroke();
        }
      }

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resize);
    };
  }, [planet, hyperdrive, shipY]);

  return <canvas ref={canvasRef} className="absolute inset-0 z-0" />;
};

export default SimulationCanvas;
