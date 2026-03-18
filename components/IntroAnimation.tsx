import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface IntroAnimationProps {
  onComplete: () => void;
}

const NOTES = ['♪', '♫', '♬', '♩', '♪', '♫', '♬', '♩', '♪', '♫'];

const IntroAnimation: React.FC<IntroAnimationProps> = ({ onComplete }) => {
  const particles = useMemo(() =>
    NOTES.map((note, i) => {
      const angle = (i / NOTES.length) * Math.PI * 2;
      const distance = 120 + Math.random() * 80;
      return {
        note,
        x: Math.cos(angle) * distance,
        y: Math.sin(angle) * distance,
        rotate: Math.random() * 360,
        scale: 0.6 + Math.random() * 0.6,
      };
    }), []);

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
          background: 'radial-gradient(ellipse at 50% 40%, rgba(139,92,246,0.22), transparent 60%), linear-gradient(160deg, #0a0618, #120b2e 45%, #1a1040)',
          willChange: 'opacity, transform',
        }}
        initial={{ opacity: 1 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0, scale: 1.05 }}
        transition={{ duration: 0.6 }}
        onAnimationComplete={() => {}}
      >
        {/* Ghost Mascot */}
        <motion.div
          style={{ position: 'relative', willChange: 'transform, opacity' }}
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', damping: 8, stiffness: 120, delay: 0.2 }}
        >
          <motion.img
            src="/brand/songghost-logo.png"
            alt="SongGhost"
            style={{ width: 180, height: 180, objectFit: 'contain' }}
            initial={{ filter: 'drop-shadow(0 0 0px rgba(167,139,250,0))' }}
            animate={{ filter: 'drop-shadow(0 0 40px rgba(167,139,250,0.4))' }}
            transition={{ delay: 0.8, duration: 0.8 }}
          />

          {/* Music Note Particles */}
          {particles.map((p, i) => (
            <motion.span
              key={i}
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                fontSize: `${14 + p.scale * 10}px`,
                color: 'rgba(167,139,250,0.7)',
                pointerEvents: 'none',
                willChange: 'transform, opacity',
              }}
              initial={{ x: 0, y: 0, opacity: 0, rotate: 0 }}
              animate={{
                x: p.x,
                y: p.y,
                opacity: [0, 0.8, 0],
                rotate: p.rotate,
              }}
              transition={{
                delay: 1.5 + i * 0.06,
                duration: 1.2,
                ease: 'easeOut',
              }}
            >
              {p.note}
            </motion.span>
          ))}
        </motion.div>

        {/* SongGhost Text */}
        <motion.div
          style={{
            marginTop: 28,
            display: 'flex',
            gap: 2,
            fontFamily: '"Unbounded", system-ui, sans-serif',
            fontWeight: 800,
            fontSize: 'clamp(2rem, 6vw, 3.5rem)',
            letterSpacing: '-0.03em',
            willChange: 'opacity',
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.5 }}
        >
          {'SongGhost'.split('').map((char, i) => (
            <motion.span
              key={i}
              style={{
                display: 'inline-block',
                background: 'linear-gradient(130deg, #38bdf8, #a78bfa, #f472b6)',
                backgroundSize: '300% 100%',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                animation: 'shimmer 2.5s ease-in-out infinite',
                textShadow: 'none',
              }}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 + i * 0.05, duration: 0.4, ease: 'easeOut' }}
            >
              {char}
            </motion.span>
          ))}
        </motion.div>

        {/* Subtitle */}
        <motion.p
          style={{
            marginTop: 12,
            fontFamily: '"Manrope", system-ui, sans-serif',
            fontSize: 13,
            fontWeight: 700,
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            color: '#a89bc4',
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.8, duration: 0.6 }}
        >
          Write. Refine. Release.
        </motion.p>

        {/* Auto-dismiss after animation */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0 }}
          transition={{ delay: 3.5 }}
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
