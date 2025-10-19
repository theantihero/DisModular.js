/* eslint-env browser, node */
/**
 * Space Background Component
 * Animated canvas-based space environment with stars, nebulas, galaxies, and planets
 * @author fkndean_
 * @date 2025-01-18
 */

import { useEffect, useRef, useState } from 'react';

export function SpaceBackground() {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  // Space objects data
  const starsRef = useRef([]);
  const nebulasRef = useRef([]);
  const galaxiesRef = useRef([]);
  const planetsRef = useRef([]);
  const shootingStarsRef = useRef([]);

  // Check for reduced motion preference
  useEffect(() => {
    if (!window.matchMedia) return;
    
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (e) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handleChange);

    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  useEffect(() => {
    const updateDimensions = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  useEffect(() => {
    if (!dimensions.width || !dimensions.height) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    canvas.width = dimensions.width;
    canvas.height = dimensions.height;

    // Initialize space objects
    initializeSpaceObjects();

    // Start animation loop (skip if reduced motion is preferred)
    const animate = () => {
      drawSpace(ctx, canvas.width, canvas.height, prefersReducedMotion);
      if (!prefersReducedMotion) {
        // eslint-disable-next-line no-undef
        animationRef.current = requestAnimationFrame(animate);
      }
    };

    animate();

    return () => {
      if (animationRef.current) {
        // eslint-disable-next-line no-undef
        cancelAnimationFrame(animationRef.current);
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dimensions]);

  const initializeSpaceObjects = () => {
    // Initialize stars (3 layers for parallax)
    starsRef.current = [
      // Far stars (small, slow)
      ...Array.from({ length: 150 }, () => {
        const size = Math.random() * 1 + 0.5;
        const glowRadius = size * 3;
        const margin = 5;
        const safeZone = glowRadius + margin;
        
        return {
          x: Math.random() * (dimensions.width - safeZone * 2) + safeZone,
          y: Math.random() * (dimensions.height - safeZone * 2) + safeZone,
          size: size,
          speed: 0.1,
          opacity: Math.random() * 0.6 + 0.2,
          twinkleSpeed: Math.random() * 0.02 + 0.01,
          twinklePhase: Math.random() * Math.PI * 2
        };
      }),
      // Mid stars (medium, medium speed)
      ...Array.from({ length: 100 }, () => {
        const size = Math.random() * 2 + 1;
        const glowRadius = size * 3;
        const margin = 5;
        const safeZone = glowRadius + margin;
        
        return {
          x: Math.random() * (dimensions.width - safeZone * 2) + safeZone,
          y: Math.random() * (dimensions.height - safeZone * 2) + safeZone,
          size: size,
          speed: 0.3,
          opacity: Math.random() * 0.8 + 0.3,
          twinkleSpeed: Math.random() * 0.03 + 0.02,
          twinklePhase: Math.random() * Math.PI * 2
        };
      }),
      // Near stars (large, fast)
      ...Array.from({ length: 50 }, () => {
        const size = Math.random() * 3 + 2;
        const glowRadius = size * 3;
        const margin = 5;
        const safeZone = glowRadius + margin;
        
        return {
          x: Math.random() * (dimensions.width - safeZone * 2) + safeZone,
          y: Math.random() * (dimensions.height - safeZone * 2) + safeZone,
          size: size,
          speed: 0.5,
          opacity: Math.random() * 0.9 + 0.5,
          twinkleSpeed: Math.random() * 0.04 + 0.03,
          twinklePhase: Math.random() * Math.PI * 2
        };
      })
    ];

    // Initialize nebulas (gas clouds)
    nebulasRef.current = Array.from({ length: 4 }, () => ({
      x: Math.random() * (dimensions.width + 400) - 200,
      y: Math.random() * (dimensions.height + 400) - 200,
      width: Math.random() * 400 + 300, // Larger clouds
      height: Math.random() * 300 + 250,
      opacity: Math.random() * 0.2 + 0.1, // Much more subtle opacity
      color: [
        { r: 255, g: 182, b: 193 }, // Pink gas cloud
        { r: 135, g: 206, b: 250 }, // Sky blue gas cloud
        { r: 221, g: 160, b: 221 }, // Plum gas cloud
        { r: 255, g: 218, b: 185 }, // Peach gas cloud
        { r: 176, g: 224, b: 230 }, // Powder blue gas cloud
        { r: 255, g: 192, b: 203 }  // Light pink gas cloud
      ][Math.floor(Math.random() * 6)],
      driftX: (Math.random() - 0.5) * 0.15, // Slower drift
      driftY: (Math.random() - 0.5) * 0.15,
      phase: Math.random() * Math.PI * 2
    }));

    // Initialize galaxies
    galaxiesRef.current = Array.from({ length: 2 }, () => ({
      x: Math.random() * dimensions.width * 0.8 + dimensions.width * 0.1,
      y: Math.random() * dimensions.height * 0.8 + dimensions.height * 0.1,
      size: Math.random() * 80 + 60,
      rotation: 0,
      rotationSpeed: Math.random() * 0.005 + 0.002,
      opacity: Math.random() * 0.4 + 0.2,
      arms: Math.floor(Math.random() * 3) + 2
    }));

    // Initialize planets
    planetsRef.current = Array.from({ length: 3 }, () => {
      const maxOrbitRadius = 80 + 40; // Maximum possible orbit radius
      const planetSize = Math.random() * 40 + 20;
      const glowRadius = planetSize * 2.5; // Full glow radius
      const margin = 10; // Extra margin
      const safeZone = maxOrbitRadius + glowRadius + margin;
      
      return {
        x: Math.random() * (dimensions.width - safeZone * 2) + safeZone,
        y: Math.random() * (dimensions.height - safeZone * 2) + safeZone,
        size: planetSize,
        rotation: 0,
        rotationSpeed: Math.random() * 0.01 + 0.005,
        color: [
          { r: 139, g: 69, b: 19 },   // Brown
          { r: 70, g: 130, b: 180 },  // Steel blue
          { r: 255, g: 140, b: 0 }    // Orange
        ][Math.floor(Math.random() * 3)],
        orbitRadius: Math.random() * 80 + 40,
        orbitSpeed: Math.random() * 0.002 + 0.001,
        orbitPhase: Math.random() * Math.PI * 2
      };
    });

    // Initialize shooting stars
    shootingStarsRef.current = [];
  };

  const drawSpace = (ctx, width, height, _reducedMotion = false) => {
    // Clear canvas with extended area to prevent glow cutoff
    ctx.fillStyle = '#0a0a0f';
    ctx.fillRect(-width * 0.5, -height * 0.5, width * 2, height * 2);

    // Draw nebulas (gas clouds)
    nebulasRef.current.forEach(nebula => {
      ctx.save();
      ctx.globalAlpha = nebula.opacity;
      
      // Create multiple overlapping gradients for realistic gas cloud effect
      const centerX = nebula.x;
      const centerY = nebula.y;
      const cloudRadius = nebula.width / 2;
      
      // Main cloud gradient
      const mainGradient = ctx.createRadialGradient(
        centerX, centerY, 0,
        centerX, centerY, cloudRadius
      );
      mainGradient.addColorStop(0, `rgba(${nebula.color.r}, ${nebula.color.g}, ${nebula.color.b}, 0.3)`);
      mainGradient.addColorStop(0.3, `rgba(${nebula.color.r}, ${nebula.color.g}, ${nebula.color.b}, 0.15)`);
      mainGradient.addColorStop(0.7, `rgba(${nebula.color.r}, ${nebula.color.g}, ${nebula.color.b}, 0.08)`);
      mainGradient.addColorStop(1, `rgba(${nebula.color.r}, ${nebula.color.g}, ${nebula.color.b}, 0)`);
      
      // Draw main cloud
      ctx.fillStyle = mainGradient;
      ctx.fillRect(
        centerX - cloudRadius,
        centerY - cloudRadius,
        cloudRadius * 2,
        cloudRadius * 2
      );
      
      // Add secondary cloud layers for depth
      for (let i = 0; i < 3; i++) {
        const offsetX = (Math.sin(nebula.phase + i) * cloudRadius * 0.3);
        const offsetY = (Math.cos(nebula.phase + i * 0.7) * cloudRadius * 0.3);
        const layerRadius = cloudRadius * (0.6 + Math.random() * 0.4);
        
        const layerGradient = ctx.createRadialGradient(
          centerX + offsetX, centerY + offsetY, 0,
          centerX + offsetX, centerY + offsetY, layerRadius
        );
        layerGradient.addColorStop(0, `rgba(${nebula.color.r}, ${nebula.color.g}, ${nebula.color.b}, 0.12)`);
        layerGradient.addColorStop(0.5, `rgba(${nebula.color.r}, ${nebula.color.g}, ${nebula.color.b}, 0.05)`);
        layerGradient.addColorStop(1, `rgba(${nebula.color.r}, ${nebula.color.g}, ${nebula.color.b}, 0)`);
        
        ctx.fillStyle = layerGradient;
        ctx.fillRect(
          centerX + offsetX - layerRadius,
          centerY + offsetY - layerRadius,
          layerRadius * 2,
          layerRadius * 2
        );
      }
      
      ctx.restore();

      // Update nebula position
      nebula.x += nebula.driftX;
      nebula.y += nebula.driftY;
      nebula.phase += 0.01;

      // Allow nebulas to extend beyond viewport for seamless glow
      if (nebula.x < -nebula.width * 2) nebula.x = width + nebula.width * 2;
      if (nebula.x > width + nebula.width * 2) nebula.x = -nebula.width * 2;
      if (nebula.y < -nebula.height * 2) nebula.y = height + nebula.height * 2;
      if (nebula.y > height + nebula.height * 2) nebula.y = -nebula.height * 2;
    });

    // Draw galaxies
    galaxiesRef.current.forEach(galaxy => {
      ctx.save();
      ctx.translate(galaxy.x, galaxy.y);
      ctx.rotate(galaxy.rotation);
      ctx.globalAlpha = galaxy.opacity;

      // Draw galaxy spiral
      for (let i = 0; i < galaxy.arms; i++) {
        const armAngle = (i * Math.PI * 2) / galaxy.arms;
        ctx.beginPath();
        ctx.strokeStyle = `rgba(139, 69, 255, 0.6)`;
        ctx.lineWidth = 2;
        
        for (let r = 0; r < galaxy.size; r += 2) {
          const angle = armAngle + (r / galaxy.size) * Math.PI * 4;
          const x = Math.cos(angle) * r;
          const y = Math.sin(angle) * r;
          
          if (r === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        ctx.stroke();
      }

      // Draw galaxy center
      ctx.beginPath();
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.arc(0, 0, 5, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();

      galaxy.rotation += galaxy.rotationSpeed;
    });

    // Draw planets
    planetsRef.current.forEach(planet => {
      ctx.save();
      
      // Calculate orbit position
      const orbitX = planet.x + Math.cos(planet.orbitPhase) * planet.orbitRadius;
      const orbitY = planet.y + Math.sin(planet.orbitPhase) * planet.orbitRadius;
      
      // Check if planet would be cut off at edges - ensure full orb visibility
      const planetRadius = planet.size * 2.5; // Include full glow radius with margin
      const margin = 10; // Extra margin to ensure no cutoff
      
      if (orbitX - planetRadius - margin < 0 || orbitX + planetRadius + margin > width ||
          orbitY - planetRadius - margin < 0 || orbitY + planetRadius + margin > height) {
        ctx.restore();
        planet.rotation += planet.rotationSpeed;
        planet.orbitPhase += planet.orbitSpeed;
        return; // Skip drawing this planet if it would be cut off
      }
      
      ctx.translate(orbitX, orbitY);
      ctx.rotate(planet.rotation);

      // Draw planet
      ctx.beginPath();
      ctx.fillStyle = `rgb(${planet.color.r}, ${planet.color.g}, ${planet.color.b})`;
      ctx.arc(0, 0, planet.size, 0, Math.PI * 2);
      ctx.fill();

      // Add planet glow
      const glowGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, planet.size * 2);
      glowGradient.addColorStop(0, `rgba(${planet.color.r}, ${planet.color.g}, ${planet.color.b}, 0.3)`);
      glowGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
      
      ctx.fillStyle = glowGradient;
      ctx.fillRect(-planet.size * 2, -planet.size * 2, planet.size * 4, planet.size * 4);

      ctx.restore();

      planet.rotation += planet.rotationSpeed;
      planet.orbitPhase += planet.orbitSpeed;
    });

    // Draw stars
    starsRef.current.forEach(star => {
      ctx.save();
      
      // Update twinkle
      star.twinklePhase += star.twinkleSpeed;
      const twinkleOpacity = star.opacity * (0.5 + 0.5 * Math.sin(star.twinklePhase));
      
      // Check if star would be cut off at edges - ensure full visibility
      const starRadius = star.size * 3; // Include glow radius
      const margin = 5; // Extra margin for stars
      
      if (star.x - starRadius - margin < 0 || star.x + starRadius + margin > width ||
          star.y - starRadius - margin < 0 || star.y + starRadius + margin > height) {
        ctx.restore();
        return; // Skip drawing this star if it would be cut off
      }
      
      ctx.globalAlpha = twinkleOpacity;
      ctx.fillStyle = '#ffffff';
      
      // Draw star
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
      ctx.fill();

      // Add star glow for larger stars
      if (star.size > 2) {
        const glowGradient = ctx.createRadialGradient(
          star.x, star.y, 0,
          star.x, star.y, star.size * 3
        );
        glowGradient.addColorStop(0, `rgba(255, 255, 255, ${twinkleOpacity * 0.3})`);
        glowGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        
        ctx.fillStyle = glowGradient;
        ctx.fillRect(
          star.x - star.size * 3,
          star.y - star.size * 3,
          star.size * 6,
          star.size * 6
        );
      }

      ctx.restore();

      // Update star position (parallax scrolling)
      star.x -= star.speed;
      if (star.x < -star.size) {
        star.x = dimensions.width + star.size;
        star.y = Math.random() * dimensions.height;
      }
    });

    // Draw shooting stars (occasionally)
    if (Math.random() < 0.001) { // 0.1% chance per frame
      shootingStarsRef.current.push({
        x: Math.random() * width,
        y: Math.random() * height * 0.3,
        vx: Math.random() * 10 + 5,
        vy: Math.random() * 5 + 2,
        life: 1,
        decay: Math.random() * 0.02 + 0.01
      });
    }

    // Update and draw shooting stars
    shootingStarsRef.current = shootingStarsRef.current.filter(star => {
      ctx.save();
      ctx.globalAlpha = star.life;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      
      ctx.beginPath();
      ctx.moveTo(star.x, star.y);
      ctx.lineTo(star.x - star.vx * 2, star.y - star.vy * 2);
      ctx.stroke();
      
      ctx.restore();

      star.x += star.vx;
      star.y += star.vy;
      star.life -= star.decay;

      return star.life > 0 && star.x < width && star.y < height;
    });
  };

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none z-0"
      style={{ background: 'transparent' }}
    />
  );
}

export default SpaceBackground;
