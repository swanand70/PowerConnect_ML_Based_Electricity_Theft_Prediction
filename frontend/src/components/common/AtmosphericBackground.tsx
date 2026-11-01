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
  showParticles: _showParticles = false,
  showRays: _showRays = false,
}) => {
  const intensityOpacity = intensity === 'subtle' ? 'opacity-30' : intensity === 'vibrant' ? 'opacity-70' : 'opacity-50';

  return (
    <div
      className={`absolute inset-0 overflow-hidden pointer-events-none select-none z-0 ${className}`}
      aria-hidden="true"
    >
      {/* Restrained subtle depth vignette */}
      <div
        className={`absolute inset-0 transition-opacity duration-500 ${intensityOpacity}`}
        style={{
          background: `
            radial-gradient(ellipse 70% 45% at 50% 0%, rgba(37, 99, 235, 0.08) 0%, rgba(15, 23, 42, 0) 70%)
          `,
        }}
      />
    </div>
  );
};
