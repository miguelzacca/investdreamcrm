'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './AdsBanner.module.css';

interface Ad {
  id: string;
  brand: string;
  tagline: string;
  description: string;
  cta: string;
  url: string;
  theme: 'dark' | 'light';
  accentColor: string;
  accentColor2: string;
  bgFrom: string;
  bgTo: string;
  logo: React.ReactNode;
  badge?: string;
  particles?: string[];
}

const ads: Ad[] = [
  {
    id: 'imobhunter',
    brand: 'ImobHunter',
    tagline: 'Ache o Dono de Qualquer Imóvel em 5seg.',
    description:
      'Nome completo, CPF e celular real do proprietário — puxado direto da Prefeitura e cruzado com big data.',
    cta: 'Começar agora',
    url: 'https://www.imobhunter.com.br',
    theme: 'dark',
    accentColor: '#38bdf8',
    accentColor2: '#818cf8',
    bgFrom: '#0b1120',
    bgTo: '#0f1f3d',
    badge: '📍 Exclusivo Itapema-SC',
    particles: ['🏠', '🔍', '📱', '📋'],
    logo: (
      <svg viewBox="0 0 148 32" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ height: 28 }}>
        <circle cx="13" cy="13" r="10" fill="#38bdf8" opacity="0.2" />
        <circle cx="13" cy="10" r="5" fill="#38bdf8" />
        <path d="M13 15 Q5 22 13 28 Q21 22 13 15Z" fill="#38bdf8" />
        <text x="28" y="21" fontFamily="system-ui, sans-serif" fontWeight="800" fontSize="16" fill="white">Imob</text>
        <text x="68" y="21" fontFamily="system-ui, sans-serif" fontWeight="800" fontSize="16" fill="#38bdf8">Hunter</text>
      </svg>
    ),
  },
  {
    id: 'obsidion',
    brand: 'Obsidion',
    tagline: 'Pesquise qualquer pessoa ou empresa.',
    description:
      'Sistema de inteligência de dados que conecta CPF, CNPJ, telefone, e-mail e endereço em uma única plataforma.',
    cta: 'Começar grátis',
    url: 'https://www.obsidion.com.br',
    theme: 'light',
    accentColor: '#7c3aed',
    accentColor2: '#ec4899',
    bgFrom: '#f0f0ff',
    bgTo: '#fce7f3',
    badge: '⚡ Dados em tempo real',
    particles: ['👤', '🏢', '📞', '✉️'],
    logo: (
      <svg viewBox="0 0 130 32" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ height: 28 }}>
        <polygon points="13,2 22,8 22,20 13,26 4,20 4,8" fill="none" stroke="#7c3aed" strokeWidth="2" />
        <polygon points="13,7 19,11 19,19 13,23 7,19 7,11" fill="#7c3aed" opacity="0.4" />
        <circle cx="13" cy="15" r="3" fill="#7c3aed" />
        <text x="30" y="21" fontFamily="system-ui, sans-serif" fontWeight="800" fontSize="16" fill="#1e1b4b">
          obsidion
        </text>
      </svg>
    ),
  },
];

const slideVariants = {
  enter: (dir: number) => ({
    x: dir > 0 ? '100%' : '-100%',
    opacity: 0,
    scale: 0.97,
  }),
  center: {
    x: 0,
    opacity: 1,
    scale: 1,
    transition: { duration: 0.55, ease: 'easeInOut' as const },
  },
  exit: (dir: number) => ({
    x: dir < 0 ? '100%' : '-100%',
    opacity: 0,
    scale: 0.97,
    transition: { duration: 0.45, ease: 'easeInOut' as const },
  }),
};

const AUTOPLAY_INTERVAL = 6000;

export function AdsBanner() {
  const [[index, dir], setSlide] = useState([0, 1]);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);

  const goTo = useCallback(
    (next: number, direction?: number) => {
      const d = direction ?? (next > index ? 1 : -1);
      setSlide([((next % ads.length) + ads.length) % ads.length, d]);
      setProgress(0);
    },
    [index]
  );

  const next = useCallback(() => goTo(index + 1, 1), [goTo, index]);
  const prev = useCallback(() => goTo(index - 1, -1), [goTo, index]);

  // Autoplay with progress bar
  useEffect(() => {
    if (isPaused) return;
    const step = 50;
    const interval = setInterval(() => {
      setProgress(p => {
        if (p >= 100) {
          next();
          return 0;
        }
        return p + (step / AUTOPLAY_INTERVAL) * 100;
      });
    }, step);
    return () => clearInterval(interval);
  }, [isPaused, next]);

  const ad = ads[index];
  const isDark = ad.theme === 'dark';

  return (
    <div
      className={styles.wrapper}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      aria-label="Anúncios de parceiros"
    >
      {/* Label */}
      <div className={styles.adLabel}>
        <span className={styles.adLabelDot} />
        Parceiros
      </div>

      {/* Carousel track */}
      <div className={styles.track}>
        <AnimatePresence custom={dir} mode="popLayout">
          <motion.div
            key={ad.id}
            custom={dir}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            className={styles.slide}
            style={{
              background: `linear-gradient(135deg, ${ad.bgFrom} 0%, ${ad.bgTo} 100%)`,
            }}
          >
            {/* Animated orb background */}
            <motion.div
              className={styles.orb}
              style={{ background: ad.accentColor }}
              animate={{ scale: [1, 1.2, 1], opacity: [0.15, 0.25, 0.15] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            />
            <motion.div
              className={styles.orb2}
              style={{ background: ad.accentColor2 }}
              animate={{ scale: [1.2, 1, 1.2], opacity: [0.1, 0.2, 0.1] }}
              transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
            />

            {/* Floating particles */}
            {ad.particles?.map((p, i) => (
              <motion.span
                key={i}
                className={styles.particle}
                style={{
                  left: `${15 + i * 20}%`,
                  top: `${20 + (i % 2) * 40}%`,
                  fontSize: `${14 + i * 2}px`,
                }}
                animate={{
                  y: [0, -12, 0],
                  rotate: [0, 10, -10, 0],
                  opacity: [0.4, 0.8, 0.4],
                }}
                transition={{
                  duration: 3 + i * 0.5,
                  repeat: Infinity,
                  delay: i * 0.4,
                  ease: 'easeInOut',
                }}
              >
                {p}
              </motion.span>
            ))}

            {/* Content */}
            <div className={styles.content}>
              {/* Left section */}
              <div className={styles.left}>
                {/* Logo */}
                <motion.div
                  className={styles.logoWrap}
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1, duration: 0.4 }}
                >
                  {ad.logo}
                </motion.div>

                {/* Badge */}
                {ad.badge && (
                  <motion.span
                    className={styles.badge}
                    style={{
                      background: isDark ? 'rgba(56,189,248,0.12)' : 'rgba(124,58,237,0.1)',
                      color: ad.accentColor,
                      borderColor: ad.accentColor + '40',
                    }}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.15, duration: 0.35 }}
                  >
                    {ad.badge}
                  </motion.span>
                )}

                {/* Tagline */}
                <motion.h3
                  className={styles.tagline}
                  style={{ color: isDark ? '#fff' : '#1e1b4b' }}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.4 }}
                >
                  {ad.tagline.split(' ').map((word, i) => {
                    const isHighlight =
                      i === ad.tagline.split(' ').length - 1 ||
                      i === ad.tagline.split(' ').length - 2;
                    return (
                      <span
                        key={i}
                        style={
                          isHighlight
                            ? {
                                background: `linear-gradient(90deg, ${ad.accentColor}, ${ad.accentColor2})`,
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                              }
                            : {}
                        }
                      >
                        {word}{' '}
                      </span>
                    );
                  })}
                </motion.h3>

                {/* Description */}
                <motion.p
                  className={styles.description}
                  style={{ color: isDark ? 'rgba(255,255,255,0.65)' : 'rgba(30,27,75,0.65)' }}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.28, duration: 0.4 }}
                >
                  {ad.description}
                </motion.p>

                {/* CTA */}
                <motion.a
                  href={ad.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.cta}
                  style={{
                    background: `linear-gradient(135deg, ${ad.accentColor}, ${ad.accentColor2})`,
                  }}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.36, duration: 0.4 }}
                  whileHover={{ scale: 1.05, boxShadow: `0 8px 30px ${ad.accentColor}60` }}
                  whileTap={{ scale: 0.97 }}
                >
                  {ad.cta}
                  <motion.span
                    animate={{ x: [0, 4, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    →
                  </motion.span>
                </motion.a>
              </div>

              {/* Right illustration */}
              <div className={styles.right}>
                {ad.id === 'imobhunter' ? (
                  <ImobHunterIllustration accentColor={ad.accentColor} accentColor2={ad.accentColor2} />
                ) : (
                  <ObsidionIllustration accentColor={ad.accentColor} accentColor2={ad.accentColor2} />
                )}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Arrow buttons */}
        <button
          className={`${styles.arrow} ${styles.arrowLeft}`}
          onClick={prev}
          aria-label="Anúncio anterior"
          style={{ color: isDark ? '#fff' : '#1e1b4b' }}
        >
          ‹
        </button>
        <button
          className={`${styles.arrow} ${styles.arrowRight}`}
          onClick={next}
          aria-label="Próximo anúncio"
          style={{ color: isDark ? '#fff' : '#1e1b4b' }}
        >
          ›
        </button>
      </div>

      {/* Bottom controls */}
      <div className={styles.controls}>
        {/* Dot indicators */}
        <div className={styles.dots}>
          {ads.map((a, i) => (
            <button
              key={a.id}
              className={styles.dot}
              aria-label={`Ir para anúncio ${i + 1}`}
              onClick={() => goTo(i)}
              style={{
                background: i === index ? ad.accentColor : 'rgba(150,150,170,0.3)',
                width: i === index ? 24 : 8,
              }}
            />
          ))}
        </div>

        {/* Progress bar */}
        <div className={styles.progressTrack}>
          <div
            className={styles.progressBar}
            style={{ background: ad.accentColor, width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}

/* ── ImobHunter custom illustration ── */
function ImobHunterIllustration({
  accentColor,
  accentColor2,
}: {
  accentColor: string;
  accentColor2: string;
}) {
  return (
    <div className={styles.illustration}>
      {/* Animated house SVG */}
      <motion.div
        style={{ position: 'absolute', left: '8%', top: '50%', transform: 'translateY(-50%)' }}
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      >
        <svg width="88" height="88" viewBox="0 0 88 88" fill="none">
          {/* Glow */}
          <defs>
            <radialGradient id="houseGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={accentColor} stopOpacity="0.3" />
              <stop offset="100%" stopColor={accentColor} stopOpacity="0" />
            </radialGradient>
            <linearGradient id="roofGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor={accentColor} />
              <stop offset="100%" stopColor={accentColor2} />
            </linearGradient>
          </defs>
          <circle cx="44" cy="44" r="44" fill="url(#houseGlow)" />
          {/* Roof */}
          <polygon points="44,14 72,40 16,40" fill="url(#roofGrad)" opacity="0.9" />
          {/* Walls */}
          <rect x="22" y="40" width="44" height="34" rx="2" fill={accentColor} opacity="0.15" stroke={accentColor} strokeWidth="1" strokeOpacity="0.4" />
          {/* Door */}
          <rect x="38" y="56" width="12" height="18" rx="2" fill={accentColor} opacity="0.5" />
          {/* Windows */}
          <rect x="26" y="46" width="10" height="9" rx="1" fill={accentColor2} opacity="0.5" />
          <rect x="52" y="46" width="10" height="9" rx="1" fill={accentColor2} opacity="0.5" />
        </svg>
      </motion.div>

      {/* Scan line over house */}
      <motion.div
        style={{
          position: 'absolute',
          left: '8%',
          width: 88,
          height: 6,
          background: `linear-gradient(90deg, transparent, ${accentColor}90, transparent)`,
          borderRadius: 3,
          top: '50%',
        }}
        animate={{ top: ['30%', '75%', '30%'] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Info card */}
      <motion.div
        className={styles.illusCard}
        style={{ borderColor: accentColor + '40', background: 'rgba(255,255,255,0.07)', right: 0, top: '10%' }}
        initial={{ opacity: 0, scale: 0.7, x: 10 }}
        animate={{ opacity: 1, scale: 1, x: 0 }}
        transition={{ delay: 0.5, duration: 0.5, type: 'spring' }}
      >
        <span className={styles.illusCardDot} style={{ background: accentColor }} />
        <div className={styles.illusCardLines}>
          <div className={styles.illusLine} style={{ background: accentColor + '80', width: '70%' }} />
          <div className={styles.illusLine} style={{ background: 'rgba(255,255,255,0.2)', width: '50%' }} />
          <div className={styles.illusLine} style={{ background: 'rgba(255,255,255,0.2)', width: '60%' }} />
        </div>
        <motion.span
          className={styles.illusCheck}
          style={{ background: `linear-gradient(135deg, ${accentColor}, ${accentColor2})` }}
          animate={{ scale: [1, 1.15, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          ✓
        </motion.span>
      </motion.div>
    </div>
  );
}

/* ── Obsidion custom illustration ── */
function ObsidionIllustration({
  accentColor,
  accentColor2,
}: {
  accentColor: string;
  accentColor2: string;
}) {
  return (
    <div className={styles.illustration}>
      {/* Hexagon/gem SVG — Obsidion's icon motif */}
      <motion.div
        style={{ position: 'absolute', left: '10%', top: '50%', transform: 'translateY(-50%)' }}
        animate={{ rotate: [0, 10, -10, 0], y: [0, -4, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
      >
        <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
          <defs>
            <radialGradient id="gemGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={accentColor} stopOpacity="0.4" />
              <stop offset="100%" stopColor={accentColor2} stopOpacity="0" />
            </radialGradient>
            <linearGradient id="gemGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor={accentColor} />
              <stop offset="100%" stopColor={accentColor2} />
            </linearGradient>
          </defs>
          <circle cx="40" cy="40" r="40" fill="url(#gemGlow)" />
          {/* Hexagon */}
          <polygon points="40,10 62,23 62,57 40,70 18,57 18,23" fill="none" stroke="url(#gemGrad)" strokeWidth="2" />
          <polygon points="40,18 56,27 56,53 40,62 24,53 24,27" fill={accentColor} fillOpacity="0.12" />
          {/* Search icon */}
          <circle cx="38" cy="38" r="10" stroke="url(#gemGrad)" strokeWidth="2" fill="none" />
          <line x1="45" y1="45" x2="54" y2="54" stroke="url(#gemGrad)" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      </motion.div>

      {/* Data cards floating */}
      {['CPF', 'CNPJ', 'Tel'].map((label, i) => (
        <motion.div
          key={label}
          className={styles.illusDataCard}
          style={{
            background: `linear-gradient(135deg, ${accentColor}15, ${accentColor2}15)`,
            borderColor: accentColor + '40',
            top: `${12 + i * 28}%`,
            right: i % 2 === 0 ? '-2%' : '8%',
          }}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 + i * 0.15, duration: 0.5, type: 'spring' }}
        >
          <span style={{ color: accentColor, fontWeight: 700, fontSize: 11 }}>{label}</span>
          <div className={styles.illusLine} style={{ background: `linear-gradient(90deg, ${accentColor}60, ${accentColor2}60)`, width: '80%', marginTop: 4 }} />
        </motion.div>
      ))}
    </div>
  );
}
