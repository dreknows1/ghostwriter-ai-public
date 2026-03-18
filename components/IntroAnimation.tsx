import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface IntroAnimationProps {
  onComplete: () => void;
}

const NOTES = ['♪', '♫', '♬', '♩', '♪', '♫', '♬', '♩', '♪', '♫', '♬', '♩', '♪', '♫'];
const WORDS = ['LYRICS', 'MELODY', 'FLOW', 'WRITE', 'SONG', 'BEAT', 'RHYTHM', 'VIBE'];
const COLORS = [
  'rgba(249,115,22,0.8)',   // orange
  'rgba(56,189,248,0.8)',   // cyan
  'rgba(244,114,182,0.8)',  // pink
  'rgba(251,191,36,0.8)',   // amber
  'rgba(139,92,246,0.7)',   // violet
  'rgba(52,211,153,0.7)',   // emerald
  'rgba(96,165,250,0.8)',   // blue
  'rgba(248,113,113,0.7)',  // red
];

const IntroAnimation: React.FC<IntroAnimationProps> = ({ onComplete }) => {
  const particles = useMemo(() =>
    NOTES.map((note, i) => {
      const angle = (i / NOTES.length) * Math.PI * 2;
      const distance = 140 + Math.random() * 120;
      return {
        note,
        x: Math.cos(angle) * distance,
        y: Math.sin(angle) * distance,
        rotate: -180 + Math.random() * 360,
        scale: 0.5 + Math.random() * 0.8,
        color: COLORS[i % COLORS.length],
      };
    }), []);

  const wordParticles = useMemo(() =>
    WORDS.map((word, i) => {
      const angle = (i / WORDS.length) * Math.PI * 2 + 0.3;
      const distance = 200 + Math.random() * 100;
      return {
        word,
        x: Math.cos(angle) * distance,
        y: Math.sin(angle) * distance,
        rotate: -30 + Math.random() * 60,
        color: COLORS[(i + 3) % COLORS.length],
      };
    }), []);

  const orbitDots = useMemo(() =>
    Array.from({ length: 20 }, (_, i) => ({
      angle: (i / 20) * Math.PI * 2,
      radius: 160 + Math.random() * 80,
      size: 2 + Math.random() * 4,
      color: COLORS[i % COLORS.length],
      duration: 1.5 + Math.random() * 1.5,
    })), []);

  return (
    <AnimatePresence>
      <motion.div
        key="intro-overlay"
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          background: 'radial-gradient(ellipse at 50% 30%, rgba(139,92,246,0.30), transparent 55%), radial-gradient(ellipse at 20% 70%, rgba(249,115,22,0.18), transparent 50%), radial-gradient(ellipse at 80% 20%, rgba(236,72,153,0.15), transparent 50%), radial-gradient(ellipse at 60% 80%, rgba(56,189,248,0.12), transparent 45%), linear-gradient(160deg, #0c0a1d, #120e24 45%, #1a1535)',
          willChange: 'opacity, transform',
        }}
        initial={{ opacity: 1 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0, scale: 1.08 }}
        transition={{ duration: 0.8, ease: 'easeInOut' }}
      >
        {/* Ambient floating orbs */}
        {[
          { x: '15%', y: '20%', size: 300, color: 'rgba(139,92,246,0.15)', delay: 0 },
          { x: '80%', y: '30%', size: 250, color: 'rgba(249,115,22,0.12)', delay: 0.3 },
          { x: '50%', y: '75%', size: 350, color: 'rgba(56,189,248,0.10)', delay: 0.6 },
          { x: '25%', y: '65%', size: 200, color: 'rgba(244,114,182,0.10)', delay: 0.9 },
        ].map((orb, i) => (
          <motion.div
            key={`orb-${i}`}
            style={{
              position: 'absolute',
              left: orb.x,
              top: orb.y,
              width: orb.size,
              height: orb.size,
              borderRadius: '50%',
              background: `radial-gradient(circle, ${orb.color}, transparent 70%)`,
              filter: 'blur(40px)',
              pointerEvents: 'none',
            }}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: [0.5, 1.2, 1], y: [0, -20, 0] }}
            transition={{
              delay: orb.delay,
              duration: 3,
              ease: 'easeInOut',
              y: { repeat: Infinity, duration: 4, ease: 'easeInOut' },
            }}
          />
        ))}

        {/* Ghost Mascot with multi-stage animation */}
        <motion.div
          style={{ position: 'relative', willChange: 'transform, opacity' }}
          initial={{ opacity: 0, y: 80, scale: 0.6 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{
            type: 'spring',
            damping: 10,
            stiffness: 80,
            delay: 0.4,
            duration: 1.5,
          }}
        >
          {/* Glow ring behind mascot */}
          <motion.div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              width: 280,
              height: 280,
              marginTop: -140,
              marginLeft: -140,
              borderRadius: '50%',
              pointerEvents: 'none',
            }}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{
              opacity: [0, 0.6, 0.3, 0.6],
              scale: [0.5, 1.1, 0.95, 1.05],
              background: [
                'radial-gradient(circle, rgba(249,115,22,0.4), rgba(139,92,246,0.2), transparent 70%)',
                'radial-gradient(circle, rgba(56,189,248,0.4), rgba(244,114,182,0.2), transparent 70%)',
                'radial-gradient(circle, rgba(139,92,246,0.4), rgba(249,115,22,0.2), transparent 70%)',
                'radial-gradient(circle, rgba(244,114,182,0.4), rgba(56,189,248,0.2), transparent 70%)',
              ],
            }}
            transition={{ delay: 1.0, duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          />

          {/* Mascot image */}
          <motion.img
            src="/brand/songghost-logo.png"
            alt="SongGhost"
            style={{ width: 220, height: 220, objectFit: 'contain', position: 'relative', zIndex: 2 }}
            initial={{
              filter: 'drop-shadow(0 0 0px rgba(249,115,22,0)) brightness(0.7)',
            }}
            animate={{
              filter: [
                'drop-shadow(0 0 30px rgba(249,115,22,0.5)) brightness(1)',
                'drop-shadow(0 0 40px rgba(56,189,248,0.5)) brightness(1.05)',
                'drop-shadow(0 0 35px rgba(244,114,182,0.5)) brightness(1)',
                'drop-shadow(0 0 40px rgba(139,92,246,0.5)) brightness(1.05)',
              ],
              y: [0, -6, 0, -4, 0],
            }}
            transition={{
              delay: 1.2,
              duration: 4,
              ease: 'easeInOut',
              repeat: Infinity,
            }}
          />

          {/* Orbit dots - colorful particles circling the mascot */}
          {orbitDots.map((dot, i) => (
            <motion.div
              key={`orbit-${i}`}
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                width: dot.size,
                height: dot.size,
                borderRadius: '50%',
                backgroundColor: dot.color,
                pointerEvents: 'none',
                zIndex: 1,
              }}
              initial={{ opacity: 0, x: 0, y: 0 }}
              animate={{
                opacity: [0, 0.9, 0.5, 0.9, 0],
                x: Math.cos(dot.angle) * dot.radius,
                y: Math.sin(dot.angle) * dot.radius,
              }}
              transition={{
                delay: 2.0 + i * 0.08,
                duration: dot.duration,
                ease: 'easeOut',
              }}
            />
          ))}

          {/* Music Note Particles — first burst */}
          {particles.map((p, i) => (
            <motion.span
              key={`note-${i}`}
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                fontSize: `${16 + p.scale * 12}px`,
                color: p.color,
                pointerEvents: 'none',
                willChange: 'transform, opacity',
                zIndex: 3,
                textShadow: `0 0 10px ${p.color}`,
              }}
              initial={{ x: 0, y: 0, opacity: 0, rotate: 0, scale: 0 }}
              animate={{
                x: p.x,
                y: p.y,
                opacity: [0, 1, 0.8, 0],
                rotate: p.rotate,
                scale: [0, 1.2, 1, 0.5],
              }}
              transition={{
                delay: 2.2 + i * 0.07,
                duration: 1.8,
                ease: 'easeOut',
              }}
            >
              {p.note}
            </motion.span>
          ))}

          {/* Word particles — scattered keywords */}
          {wordParticles.map((wp, i) => (
            <motion.span
              key={`word-${i}`}
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                fontSize: '11px',
                fontWeight: 900,
                fontFamily: '"Unbounded", system-ui, sans-serif',
                letterSpacing: '0.15em',
                color: wp.color,
                pointerEvents: 'none',
                willChange: 'transform, opacity',
                zIndex: 3,
                textShadow: `0 0 8px ${wp.color}`,
              }}
              initial={{ x: 0, y: 0, opacity: 0, rotate: 0, scale: 0 }}
              animate={{
                x: wp.x,
                y: wp.y,
                opacity: [0, 0.9, 0.7, 0],
                rotate: wp.rotate,
                scale: [0, 1, 0.8, 0.3],
              }}
              transition={{
                delay: 3.0 + i * 0.1,
                duration: 2.0,
                ease: 'easeOut',
              }}
            >
              {wp.word}
            </motion.span>
          ))}
        </motion.div>

        {/* SongGhost Text — multi-color gradient with stagger */}
        <motion.div
          style={{
            marginTop: 32,
            display: 'flex',
            gap: 2,
            fontFamily: '"Unbounded", system-ui, sans-serif',
            fontWeight: 800,
            fontSize: 'clamp(2.2rem, 7vw, 4rem)',
            letterSpacing: '-0.03em',
            willChange: 'opacity',
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.6 }}
        >
          {'SongGhost'.split('').map((char, i) => (
            <motion.span
              key={i}
              style={{
                display: 'inline-block',
                background: 'linear-gradient(130deg, #f97316, #fb923c, #fbbf24, #38bdf8, #a78bfa, #f472b6)',
                backgroundSize: '400% 100%',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                animation: 'shimmer 3s ease-in-out infinite',
                textShadow: 'none',
              }}
              initial={{ opacity: 0, y: 25, scale: 0.5, rotate: -10 }}
              animate={{ opacity: 1, y: 0, scale: 1, rotate: 0 }}
              transition={{
                delay: 1.4 + i * 0.07,
                duration: 0.6,
                type: 'spring',
                damping: 12,
                stiffness: 200,
              }}
            >
              {char}
            </motion.span>
          ))}
        </motion.div>

        {/* Subtitle with color accent */}
        <motion.p
          style={{
            marginTop: 16,
            fontFamily: '"Manrope", system-ui, sans-serif',
            fontSize: 14,
            fontWeight: 800,
            letterSpacing: '0.25em',
            textTransform: 'uppercase',
          }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 2.8, duration: 0.8 }}
        >
          <span style={{ color: '#f97316' }}>Write</span>
          <span style={{ color: '#a89bc4' }}> · </span>
          <span style={{ color: '#38bdf8' }}>Refine</span>
          <span style={{ color: '#a89bc4' }}> · </span>
          <span style={{ color: '#f472b6' }}>Release</span>
        </motion.p>

        {/* Animated tagline bar */}
        <motion.div
          style={{
            marginTop: 24,
            height: 3,
            borderRadius: 2,
            overflow: 'hidden',
          }}
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: 200, opacity: 1 }}
          transition={{ delay: 3.4, duration: 1.2, ease: 'easeOut' }}
        >
          <motion.div
            style={{
              height: '100%',
              width: '100%',
              background: 'linear-gradient(90deg, #f97316, #fbbf24, #38bdf8, #a78bfa, #f472b6)',
              backgroundSize: '200% 100%',
            }}
            animate={{ backgroundPosition: ['0% center', '200% center'] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          />
        </motion.div>

        {/* Second particle burst — delayed for longer animation */}
        {particles.slice(0, 8).map((p, i) => (
          <motion.span
            key={`note2-${i}`}
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              fontSize: `${12 + p.scale * 8}px`,
              color: COLORS[(i + 4) % COLORS.length],
              pointerEvents: 'none',
              textShadow: `0 0 8px ${COLORS[(i + 4) % COLORS.length]}`,
            }}
            initial={{ x: 0, y: 0, opacity: 0 }}
            animate={{
              x: p.x * 1.3,
              y: p.y * 1.3,
              opacity: [0, 0.7, 0],
              rotate: -p.rotate,
            }}
            transition={{
              delay: 4.5 + i * 0.09,
              duration: 1.5,
              ease: 'easeOut',
            }}
          >
            {p.note}
          </motion.span>
        ))}

        {/* Auto-dismiss after full animation (~7s) */}
        <motion.div
          initial={{ opacity: 1 }}
          animate={{ opacity: 0 }}
          transition={{ delay: 6.5, duration: 0.5 }}
          onAnimationComplete={() => {
            sessionStorage.setItem('sg_intro_seen', '1');
            onComplete();
          }}
        />
      </motion.div>
    </AnimatePresence>
  );
};

export default IntroAnimation;
