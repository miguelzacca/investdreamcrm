"use client";

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import styles from './Login.module.css';

/* ─────────────────────────────────────────────
   SVG Chart path data – realistic upward trend
───────────────────────────────────────────── */
const CHART_LINE =
  'M 0,128 C 18,122 30,134 52,114 S 88,90 112,94 S 148,76 172,70 S 208,62 232,58 S 268,50 292,46 S 328,38 352,34 S 392,24 416,28 S 456,16 480,13 L 520,10';

const CHART_AREA =
  'M 0,150 L 0,128 C 18,122 30,134 52,114 S 88,90 112,94 S 148,76 172,70 S 208,62 232,58 S 268,50 292,46 S 328,38 352,34 S 392,24 416,28 S 456,16 480,13 L 520,10 L 520,150 Z';

const DOT_POSITIONS: [number, number][] = [
  [52, 114], [112, 94], [232, 58], [352, 34], [480, 13],
];

/* ─────────────────────────────────────────────
   Floating stat cards data
───────────────────────────────────────────── */
const STATS = [
  { label: 'VGV Total',  value: 'R$ 4.8M', badge: '↑ +18.4%',    color: '#34d399', delay: '0.55s' },
  { label: 'Contratos',  value: '128',      badge: 'Ativos agora', color: '#818cf8', delay: '0.72s' },
  { label: 'Captação',   value: '+24.3%',   badge: 'Trimestral',   color: '#fbbf24', delay: '0.90s' },
];

/* ═══════════════════════════════════════════════
   COMPONENT
═══════════════════════════════════════════════ */
export default function LoginPage() {
  const router = useRouter();

  const [username,  setUsername]  = useState('');
  const [password,  setPassword]  = useState('');
  const [error,     setError]     = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [mounted,   setMounted]   = useState(false);
  const [revealed,  setRevealed]  = useState(false);

  /* refs for parallax */
  const card0 = useRef<HTMLDivElement>(null);
  const card1 = useRef<HTMLDivElement>(null);
  const card2 = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);

  /* mount */
  useEffect(() => {
    setMounted(true);
    const t = setTimeout(() => setRevealed(true), 60);
    return () => clearTimeout(t);
  }, []);

  /* mouse parallax */
  useEffect(() => {
    const refs  = [card0, card1, card2];
    const DEPTH = [14, -10, 18];   // px movement per side for each card

    const onMove = (e: MouseEvent) => {
      const nx = (e.clientX / window.innerWidth  - 0.5) * 2;  // -1 → 1
      const ny = (e.clientY / window.innerHeight - 0.5) * 2;  // -1 → 1

      refs.forEach((ref, i) => {
        if (!ref.current) return;
        const d = DEPTH[i];
        ref.current.style.transform =
          `translate(${nx * d}px, ${ny * (d * 0.6)}px)`;
      });

      /* subtle hero text tilt */
      if (heroRef.current) {
        heroRef.current.style.transform =
          `translate(${nx * 6}px, ${ny * 4}px)`;
      }
    };

    window.addEventListener('mousemove', onMove);
    return () => window.removeEventListener('mousemove', onMove);
  }, []);

  /* form submit */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      const res = await signIn('credentials', { username, password, redirect: false });
      if (res?.error) {
        setError(res.error);
      } else {
        router.push('/dashboard');
        router.refresh();
      }
    } catch (err) {
      console.error(err);
      setError('Ocorreu um erro ao fazer login. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!mounted) return null;

  return (
    <div className={`${styles.root} ${revealed ? styles.rootIn : ''}`}>

      {/* ══════════════════════════════════════
          LEFT — Brand panel
      ══════════════════════════════════════ */}
      <div className={styles.left}>
        {/* Grain texture */}
        <div className={styles.grain} aria-hidden />

        {/* Background mesh glows */}
        <div className={styles.glow1} aria-hidden />
        <div className={styles.glow2} aria-hidden />
        <div className={styles.glow3} aria-hidden />

        {/* Top badge */}
        <div className={styles.liveBadge}>
          <span className={styles.liveDot} />
          Sistema Ativo
        </div>

        {/* HERO TEXT */}
        <div className={styles.hero} ref={heroRef}>
          <div className={styles.heroRow}>
            <span className={styles.heroOutline}>INVEST</span>
          </div>
          <div className={styles.heroRow}>
            <span className={styles.heroFilled}>DREAM</span>
          </div>
          <div className={styles.heroTag}>
            CRM — Gestão Exclusiva de Aluguéis Anuais
          </div>
        </div>

        {/* ── Animated SVG chart ── */}
        <div className={styles.chartOuter}>
          <div className={styles.chartYAxis}>
            {['+24%', '+16%', '+8%', '0%'].map((l) => (
              <span key={l}>{l}</span>
            ))}
          </div>

          <div className={styles.chartSvgWrap}>
            <svg
              viewBox="0 0 520 150"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className={styles.chartSvg}
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient id="lg-line" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%"   stopColor="#818cf8" />
                  <stop offset="55%"  stopColor="#a78bfa" />
                  <stop offset="100%" stopColor="#22d3ee" />
                </linearGradient>
                <linearGradient id="lg-area" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor="#818cf8" stopOpacity="0.28" />
                  <stop offset="100%" stopColor="#818cf8" stopOpacity="0"   />
                </linearGradient>
              </defs>

              {/* Horizontal grid */}
              {[38, 76, 114].map((y) => (
                <line key={y} x1="0" y1={y} x2="520" y2={y}
                  stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
              ))}

              {/* Area fill */}
              <path d={CHART_AREA} fill="url(#lg-area)" className={styles.chartArea} />

              {/* Line */}
              <path
                d={CHART_LINE}
                stroke="url(#lg-line)"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={styles.chartLine}
              />

              {/* Data points */}
              {DOT_POSITIONS.map(([x, y], i) => (
                <g key={i}>
                  <circle cx={x} cy={y} r="4.5" fill="#a78bfa"
                    className={styles.chartDot}
                    style={{ animationDelay: `${1.4 + i * 0.2}s` }} />
                  <circle cx={x} cy={y} r="11" fill="none"
                    stroke="#a78bfa" strokeWidth="1"
                    className={styles.chartRing}
                    style={{ animationDelay: `${1.6 + i * 0.2}s` }} />
                </g>
              ))}
            </svg>

            {/* X-axis labels */}
            <div className={styles.chartXAxis}>
              {['Jan', 'Mar', 'Mai', 'Jul', 'Set', 'Nov'].map((m) => (
                <span key={m}>{m}</span>
              ))}
            </div>
          </div>
        </div>

        {/* ── Floating stat cards ── */}
        {/* {STATS.map((s, i) => (
          <div
            key={i}
            className={`${styles.floatCard} ${styles[`floatCard${i}`]}`}
            ref={[card0, card1, card2][i]}
            style={{ transitionDelay: s.delay } as React.CSSProperties}
          >
            <p className={styles.floatLabel}>{s.label}</p>
            <p className={styles.floatValue}>{s.value}</p>
            <p className={styles.floatBadge} style={{ color: s.color }}>
              {s.badge}
            </p>
          </div>
        ))} */}

        {/* Bottom strip */}
        <footer className={styles.leftFooter}>
          <span className={styles.footerDot} />
          © 2025 Invest Dream — Plataforma exclusiva
        </footer>
      </div>

      {/* ══════════════════════════════════════
          RIGHT — Form panel
      ══════════════════════════════════════ */}
      <div className={styles.right}>
        {/* Subtle corner decoration */}
        <div className={styles.cornerDeco} aria-hidden />

        {/* Logo */}
        <div className={styles.rightHeader}>
          <div className={styles.logoChip}>
            <Image src="/image.png" alt="Invest Dream" width={26} height={26} />
          </div>
          <span className={styles.logoChipLabel}>Invest Dream</span>
        </div>

        {/* Form container */}
        <div className={styles.formWrap}>
          <div className={styles.formHead}>
            <p className={styles.formEyebrow}>Portal de Gestão</p>
            <h1 className={styles.formTitle}>
              Acesse<br />sua conta
            </h1>
            <p className={styles.formDesc}>
              Plataforma de gestão exclusiva para parceiros certificados.
            </p>
          </div>

          {/* Divider */}
          <div className={styles.divider} />

          {error && (
            <div className={styles.errorBox} role="alert">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <circle cx="7" cy="7" r="6.5" stroke="#be123c" />
                <path d="M7 4v3.5" stroke="#be123c" strokeWidth="1.5" strokeLinecap="round" />
                <circle cx="7" cy="10" r="0.75" fill="#be123c" />
              </svg>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className={styles.form} noValidate>
            {/* Username field */}
            <div className={styles.field}>
              <label htmlFor="login-username" className={styles.fieldLabel}>
                Usuário
              </label>
              <div className={styles.fieldWrap}>
                <span className={styles.fieldIcon}>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <circle cx="8" cy="5.5" r="2.5" stroke="currentColor" strokeWidth="1.5" />
                    <path d="M2.5 13.5C2.5 11.015 5.015 9 8 9s5.5 2.015 5.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </span>
                <input
                  id="login-username"
                  type="text"
                  className={styles.fieldInput}
                  placeholder="Digite seu usuário"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  disabled={isLoading}
                  autoComplete="username"
                />
              </div>
            </div>

            {/* Password field */}
            <div className={styles.field}>
              <label htmlFor="login-password" className={styles.fieldLabel}>
                Senha
              </label>
              <div className={styles.fieldWrap}>
                <span className={styles.fieldIcon}>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <rect x="2.75" y="7" width="10.5" height="7.25" rx="2" stroke="currentColor" strokeWidth="1.5" />
                    <path d="M5 7V5a3 3 0 0 1 6 0v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    <circle cx="8" cy="10.5" r="1" fill="currentColor" />
                  </svg>
                </span>
                <input
                  id="login-password"
                  type="password"
                  className={styles.fieldInput}
                  placeholder="Digite sua senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  autoComplete="current-password"
                />
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className={styles.submitBtn}
              id="login-submit"
            >
              <span className={styles.submitBg} aria-hidden />
              <span className={styles.submitContent}>
                {isLoading ? (
                  <span className={styles.spinner} />
                ) : (
                  <>
                    <span>Entrar na Plataforma</span>
                    <span className={styles.submitArrow}>
                      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                        <path d="M3.5 9h11M10 4.5l4.5 4.5-4.5 4.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </span>
                  </>
                )}
              </span>
            </button>
          </form>

          {/* Trust row */}
          <div className={styles.trust}>
            <div className={styles.trustItem}>
              <span className={styles.trustDot} style={{ background: '#10b981' }} />
              Conexão SSL segura
            </div>
            <span className={styles.trustSep} />
            <div className={styles.trustItem}>
              <span className={styles.trustDot} style={{ background: '#6366f1' }} />
              Acesso restrito
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
