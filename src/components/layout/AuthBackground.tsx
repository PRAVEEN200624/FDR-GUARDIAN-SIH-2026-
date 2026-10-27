import React from 'react';

export const AuthBackground: React.FC = () => {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden select-none z-0">
      {/* Precision Micro Security Blueprint Grid */}
      <div
        className="absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage: `
            linear-gradient(to right, #93c5fd 1px, transparent 1px),
            linear-gradient(to bottom, #93c5fd 1px, transparent 1px)
          `,
          backgroundSize: '36px 36px',
        }}
      />

      {/* Subtle Fine Dot Matrix Overlay */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)',
          backgroundSize: '18px 18px',
        }}
      />

      {/* Atmospheric Radial Color Blooms */}
      <div className="absolute -top-32 -left-32 w-[550px] h-[550px] rounded-full bg-blue-600/15 blur-[120px]" />
      <div className="absolute top-1/4 -right-32 w-[500px] h-[500px] rounded-full bg-amber-500/10 blur-[130px]" />
      <div className="absolute -bottom-32 left-1/4 w-[600px] h-[600px] rounded-full bg-indigo-700/15 blur-[140px]" />

      {/* Center Security Guilloche & Concentric Cryptographic Ring Watermark */}
      <svg
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[850px] h-[850px] text-blue-400/[0.045]"
        viewBox="0 0 800 800"
        fill="none"
        stroke="currentColor"
        aria-hidden="true"
      >
        {/* Outer security dashed boundary */}
        <circle cx="400" cy="400" r="380" strokeWidth="1" strokeDasharray="6 8" />
        <circle cx="400" cy="400" r="360" strokeWidth="0.75" />
        {/* Mid concentric rings */}
        <circle cx="400" cy="400" r="300" strokeWidth="1.5" strokeDasharray="2 6" />
        <circle cx="400" cy="400" r="250" strokeWidth="1" />
        <circle cx="400" cy="400" r="190" strokeWidth="1.5" strokeDasharray="10 10" />
        <circle cx="400" cy="400" r="140" strokeWidth="1" />
        {/* Subtle crosshairs */}
        <line x1="400" y1="20" x2="400" y2="780" strokeWidth="0.5" strokeDasharray="4 6" opacity="0.4" />
        <line x1="20" y1="400" x2="780" y2="400" strokeWidth="0.5" strokeDasharray="4 6" opacity="0.4" />
      </svg>

      {/* Subtle Vignette Gradient Mask to soften edges */}
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(circle at 50% 45%, transparent 20%, rgba(8, 19, 37, 0.45) 80%, rgba(8, 19, 37, 0.85) 100%)',
        }}
      />
    </div>
  );
};
