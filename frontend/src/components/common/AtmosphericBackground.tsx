import React from 'react';

interface AtmosphericBackgroundProps {
  className?: string;
  intensity?: 'subtle' | 'medium' | 'vibrant';
  showParticles?: boolean;
  showRays?: boolean;
}

export const AtmosphericBackground: React.FC<AtmosphericBackgroundProps> = ({
  className = '',
  intensity = 'medium',
  showParticles = true,
  showRays = true,
}) => {
  // Opacity multipliers based on intensity
  const opacityMap = {
    subtle: { bloom: 'opacity-40', rays: 'opacity-20', particles: 'opacity-30' },
    medium: { bloom: 'opacity-70', rays: 'opacity-35', particles: 'opacity-60' },
    vibrant: { bloom: 'opacity-90', rays: 'opacity-50', particles: 'opacity-80' },
  };

  const currentOpacity = opacityMap[intensity];

  return (
    <div
      className={`absolute inset-0 overflow-hidden pointer-events-none select-none z-0 ${className}`}
      aria-hidden="true"
    >
      {/* 1. Deep Indigo & Violet Multi-point Atmospheric Radial Glow */}
      <div
        className={`absolute inset-0 transition-opacity duration-700 ${currentOpacity.bloom}`}
        style={{
          background: `
            radial-gradient(ellipse 65% 55% at 50% 25%, rgba(99, 102, 241, 0.22) 0%, rgba(139, 92, 246, 0.12) 40%, rgba(15, 23, 42, 0) 75%),
            radial-gradient(circle 40% at 85% 15%, rgba(124, 58, 237, 0.16) 0%, transparent 60%),
            radial-gradient(circle 45% at 15% 45%, rgba(67, 56, 202, 0.18) 0%, transparent 65%),
            radial-gradient(ellipse 80% 50% at 50% 100%, rgba(30, 27, 75, 0.4) 0%, transparent 70%)
          `,
        }}
      />

      {/* 2. Concentric Radial Grid Rings & Optical Radial Light Trails */}
      {showRays && (
        <svg
          className={`absolute w-full h-full inset-0 ${currentOpacity.rays}`}
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="xMidYMid slice"
          viewBox="0 0 1440 900"
        >
          <defs>
            <radialGradient id="rayGradient" cx="50%" cy="30%" r="60%">
              <stop offset="0%" stopColor="#a78bfa" stopOpacity="0.6" />
              <stop offset="35%" stopColor="#818cf8" stopOpacity="0.3" />
              <stop offset="70%" stopColor="#4f46e5" stopOpacity="0.08" />
              <stop offset="100%" stopColor="#1e1b4b" stopOpacity="0" />
            </radialGradient>
            <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#818cf8" stopOpacity="0.25" />
              <stop offset="50%" stopColor="#c084fc" stopOpacity="0.1" />
              <stop offset="100%" stopColor="#6366f1" stopOpacity="0.02" />
            </linearGradient>
          </defs>

          {/* Focal Central Glow */}
          <circle cx="720" cy="270" r="140" fill="url(#rayGradient)" filter="blur(30px)" />

          {/* Concentric Telemetric Circles (Power Grid Dispersion) */}
          <circle cx="720" cy="270" r="90" fill="none" stroke="url(#ringGrad)" strokeWidth="1" strokeDasharray="4 6" opacity="0.6" />
          <circle cx="720" cy="270" r="190" fill="none" stroke="url(#ringGrad)" strokeWidth="1" strokeDasharray="6 8" opacity="0.45" />
          <circle cx="720" cy="270" r="320" fill="none" stroke="url(#ringGrad)" strokeWidth="1" strokeDasharray="3 7" opacity="0.35" />
          <circle cx="720" cy="270" r="480" fill="none" stroke="url(#ringGrad)" strokeWidth="1" strokeDasharray="8 12" opacity="0.25" />
          <circle cx="720" cy="270" r="680" fill="none" stroke="url(#ringGrad)" strokeWidth="1.2" strokeDasharray="12 16" opacity="0.15" />

          {/* Fine Radial Coordinate Lines (Vector Trails) */}
          <line x1="720" y1="270" x2="0" y2="0" stroke="url(#rayGradient)" strokeWidth="0.8" opacity="0.3" />
          <line x1="720" y1="270" x2="1440" y2="0" stroke="url(#rayGradient)" strokeWidth="0.8" opacity="0.3" />
          <line x1="720" y1="270" x2="720" y2="900" stroke="url(#rayGradient)" strokeWidth="0.8" opacity="0.25" />
          <line x1="720" y1="270" x2="0" y2="550" stroke="url(#rayGradient)" strokeWidth="0.8" opacity="0.25" />
          <line x1="720" y1="270" x2="1440" y2="550" stroke="url(#rayGradient)" strokeWidth="0.8" opacity="0.25" />
          <line x1="720" y1="270" x2="280" y2="900" stroke="url(#rayGradient)" strokeWidth="0.7" opacity="0.2" />
          <line x1="720" y1="270" x2="1160" y2="900" stroke="url(#rayGradient)" strokeWidth="0.7" opacity="0.2" />
        </svg>
      )}

      {/* 3. Soft Luminous Lighter Particles (Subtle Electrical Energy Motifs) */}
      {showParticles && (
        <div className={`absolute inset-0 ${currentOpacity.particles}`}>
          {/* Luminous floating nodes */}
          <div className="absolute top-[22%] left-[28%] w-2 h-2 rounded-full bg-indigo-400 blur-[1px] animate-pulse" style={{ animationDuration: '4s' }} />
          <div className="absolute top-[35%] right-[24%] w-2.5 h-2.5 rounded-full bg-violet-400 blur-[1px] animate-pulse" style={{ animationDuration: '5.5s', animationDelay: '1s' }} />
          <div className="absolute top-[18%] right-[38%] w-1.5 h-1.5 rounded-full bg-purple-300 blur-[0.5px] animate-pulse" style={{ animationDuration: '3.5s', animationDelay: '0.5s' }} />
          <div className="absolute top-[48%] left-[16%] w-2 h-2 rounded-full bg-blue-400 blur-[1px] animate-pulse" style={{ animationDuration: '6s', animationDelay: '2s' }} />
          <div className="absolute top-[58%] right-[32%] w-1.5 h-1.5 rounded-full bg-indigo-300 blur-[0.5px] animate-pulse" style={{ animationDuration: '4.5s', animationDelay: '1.5s' }} />
          <div className="absolute top-[28%] left-[48%] w-3 h-3 rounded-full bg-indigo-300/60 blur-[2px] animate-pulse" style={{ animationDuration: '5s', animationDelay: '0.2s' }} />
        </div>
      )}

      {/* 4. Fine Atmospheric Grain Mask */}
      <div
        className="absolute inset-0 bg-radial from-transparent via-[#0B0C0E]/30 to-[#0B0C0E]"
        aria-hidden="true"
      />
    </div>
  );
};
