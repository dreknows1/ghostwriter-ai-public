import React from 'react';

/**
 * Rudy — the SongGhost mascot. A friendly blue ghost, used as the brand mark
 * and recurring character across the app (per Andre: "Rudy replaces everywhere").
 *
 * This is a vector placeholder that reads well at any size. When Andre drops the
 * final Rudy art at public/brand/rudy.png, swap `variant="art"` to render the
 * PNG; the vector stays as the crisp fallback / small-icon form.
 */
export const Rudy: React.FC<{
  size?: number;
  glow?: boolean;
  className?: string;
  /** 'art' (default) renders Andre's /brand/rudy.png; 'vector' draws the SVG fallback. */
  variant?: 'vector' | 'art';
}> = ({ size = 96, glow = false, className = '', variant = 'art' }) => {
  if (variant === 'art') {
    return (
      <img
        src="/brand/rudy.png"
        alt="Rudy the SongGhost"
        className={className}
        style={{
          width: size,
          height: 'auto',
          ...(glow ? { filter: 'drop-shadow(0 10px 26px rgba(63,120,255,.4))' } : {}),
        }}
      />
    );
  }
  return (
    <svg
      width={size}
      height={size * 1.1}
      viewBox="0 0 100 110"
      className={className}
      style={
        glow
          ? { filter: 'drop-shadow(0 0 22px rgba(63,120,255,.45)) drop-shadow(0 14px 30px rgba(63,120,255,.28))' }
          : undefined
      }
      aria-label="Rudy the SongGhost"
      role="img"
    >
      <defs>
        <linearGradient id="rudyBody" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#5b97ff" />
          <stop offset="1" stopColor="#2f5fe0" />
        </linearGradient>
      </defs>
      <path
        d="M50 5C24 5 16 30 16 55v39q0 9 6.5 4.3l9.5-6.4q4.2-2.9 8.3 1l6.2 6.1q4.3 4.2 8.6 0l6.2-6.1q4.1-3.9 8.3-1l9.5 6.4Q84 103 84 94V55C84 30 76 5 50 5Z"
        fill="url(#rudyBody)"
      />
      <ellipse cx="39.5" cy="49" rx="7" ry="9" fill="#fff" />
      <ellipse cx="60.5" cy="49" rx="7" ry="9" fill="#fff" />
      <circle cx="41.2" cy="51.2" r="3.4" fill="#12213f" />
      <circle cx="62.2" cy="51.2" r="3.4" fill="#12213f" />
      <path d="M42.5 67q7.5 7.5 15 0" stroke="#12213f" strokeWidth="3.2" fill="none" strokeLinecap="round" />
    </svg>
  );
};

export default Rudy;
