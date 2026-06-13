"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { usePageTransition } from "@/lib/TransitionContext";
import styles from "./Login.module.css";

/* ─────────────────────────────────────────────
   SVG Chart path data – realistic upward trend
───────────────────────────────────────────── */
const CHART_LINE =
  "M 0,128 C 18,122 30,134 52,114 S 88,90 112,94 S 148,76 172,70 S 208,62 232,58 S 268,50 292,46 S 328,38 352,34 S 392,24 416,28 S 456,16 480,13 L 520,10";

const CHART_AREA =
  "M 0,150 L 0,128 C 18,122 30,134 52,114 S 88,90 112,94 S 148,76 172,70 S 208,62 232,58 S 268,50 292,46 S 328,38 352,34 S 392,24 416,28 S 456,16 480,13 L 520,10 L 520,150 Z";

const DOT_POSITIONS: [number, number][] = [
  [52, 114], [112, 94], [232, 58], [352, 34], [480, 13],
];

const STATS = [
  { label: "VGV Total",  value: "R$ 4.8M", badge: "↑ +18.4%",    color: "#34d399", delay: "0.55s" },
  { label: "Contratos",  value: "128",      badge: "Ativos agora", color: "#818cf8", delay: "0.72s" },
  { label: "Captação",   value: "+24.3%",   badge: "Trimestral",   color: "#fbbf24", delay: "0.90s" },
];

/* ─────────────────────────────────────────────
   EASING CURVES

   LEFT PANEL EXIT → [0.32, 0, 0.67, 0]  (expo-in)
   Hard acceleration — the brand panel doesn't
   drift, it gets *sucked away*. Authority vanishes.

   FORM ITEMS EXIT → [0.55, 0, 1, 0.45]  (back-in)
   Slight anticipation then explosive exit.
   Each element feels spring-loaded.

   The stagger of 65ms between form items creates
   a waterfall deconstruction — information
   dissolving in reading order.
───────────────────────────────────────────── */
const EXPO_IN  = [0.32, 0, 0.67, 0]   as const;
const BACK_IN  = [0.55, 0, 1.00, 0.45] as const;

/* ── Variants ── */
const leftPanelVariants = {
  initial: { opacity: 1, scale: 1, x: 0, filter: "blur(0px)" },
  exit: {
    opacity: 0,
    scale: 0.78,
    x: -60,
    rotateY: -18,
    filter: "blur(20px)",
    transition: { duration: 1.0, ease: EXPO_IN },
  },
};

/* Each form item exits toward alternating sides with stagger */
function formItemExit(index: number) {
  const directions = [-380, 380, -380, 380, -380, 380, 0];
  return {
    opacity: 0,
    x: directions[index % directions.length],
    y: index === 6 ? 40 : 0,      // trust row falls down instead
    scale: 0.88,
    filter: "blur(12px)",
    transition: {
      duration: 0.75,
      delay: index * 0.065,
      ease: BACK_IN,
    },
  };
}

const logoExitVariants = {
  initial: { opacity: 1, scale: 1, filter: "blur(0px)" },
  exit: {
    scale: 36,
    opacity: 0,
    filter: "blur(40px)",
    transition: { duration: 1.6, delay: 0.35, ease: EXPO_IN },
  },
};

/* ═══════════════════════════════════════════════
   COMPONENT
═══════════════════════════════════════════════ */
export default function LoginPage() {
  const router = useRouter();
  const { triggerLoginTransition } = usePageTransition();
  const prefersReducedMotion = useReducedMotion();

  const [username,  setUsername]  = useState("");
  const [password,  setPassword]  = useState("");
  const [error,     setError]     = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [mounted,   setMounted]   = useState(false);
  const [revealed,  setRevealed]  = useState(false);

  /* Parallax refs */
  const card0   = useRef<HTMLDivElement>(null);
  const card1   = useRef<HTMLDivElement>(null);
  const card2   = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);

  /* Mount */
  useEffect(() => {
    setMounted(true);
    const t = setTimeout(() => setRevealed(true), 60);
    return () => clearTimeout(t);
  }, []);

  /* Mouse parallax — skipped on reduced motion */
  useEffect(() => {
    if (prefersReducedMotion) return;

    const refs  = [card0, card1, card2];
    const DEPTH = [14, -10, 18];

    const onMove = (e: MouseEvent) => {
      const nx = (e.clientX / window.innerWidth  - 0.5) * 2;
      const ny = (e.clientY / window.innerHeight - 0.5) * 2;

      refs.forEach((ref, i) => {
        if (!ref.current) return;
        const d = DEPTH[i];
        ref.current.style.transform = `translate(${nx * d}px, ${ny * (d * 0.6)}px)`;
      });

      if (heroRef.current) {
        heroRef.current.style.transform = `translate(${nx * 6}px, ${ny * 4}px)`;
      }
    };

    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, [prefersReducedMotion]);

  /* ── Submit ── */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const res = await signIn("credentials", { username, password, redirect: false });

      if (res?.error) {
        setError(res.error);
        setIsLoading(false);
        return;
      }

      /* ✅ SUCCESS — Act 1: trigger form collapse, then Act 2: sweep */
      setIsSuccess(true);

      if (prefersReducedMotion) {
        // Accessibility fallback: simple fade then navigate
        setTimeout(() => {
          router.push("/dashboard");
          router.refresh();
        }, 400);
        return;
      }

      // Wait for form deconstruction (Act 1: ~700ms) then fire the sweep (Act 2)
      setTimeout(() => {
        triggerLoginTransition(() => {
          router.push("/dashboard");
          router.refresh();
        });
      }, 550);

    } catch (err) {
      console.error(err);
      setError("Ocorreu um erro ao fazer login. Tente novamente.");
      setIsLoading(false);
    }
  };

  if (!mounted) return null;

  /* Reduced-motion: simple fade-in/fade-out, no choreography */
  if (prefersReducedMotion) {
    return (
      <motion.div
        className={`${styles.root} ${revealed ? styles.rootIn : ""}`}
        animate={{ opacity: isSuccess ? 0 : 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className={styles.left}><div className={styles.hero} /></div>
        <div className={styles.right}>
          <FormPanel
            username={username} setUsername={setUsername}
            password={password} setPassword={setPassword}
            error={error} isLoading={isLoading}
            onSubmit={handleSubmit}
          />
        </div>
      </motion.div>
    );
  }

  return (
    <div className={`${styles.root} ${revealed ? styles.rootIn : ""}`}>
      <AnimatePresence>
        {!isSuccess && (
          <>
            {/* ══════════════════════════════════════
                LEFT — Brand panel (Act 1 collapse)
            ══════════════════════════════════════ */}
            <motion.div
              className={styles.left}
              key="login-left"
              variants={leftPanelVariants}
              initial="initial"
              exit="exit"
              style={{ perspective: 1000 }}
            >
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

              {/* Animated SVG chart */}
              <div className={styles.chartOuter}>
                <div className={styles.chartYAxis}>
                  {["+24%", "+16%", "+8%", "0%"].map((l) => (
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

                    {[38, 76, 114].map((y) => (
                      <line key={y} x1="0" y1={y} x2="520" y2={y}
                        stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                    ))}

                    <path d={CHART_AREA} fill="url(#lg-area)" className={styles.chartArea} />
                    <path
                      d={CHART_LINE}
                      stroke="url(#lg-line)"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className={styles.chartLine}
                    />

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

                  <div className={styles.chartXAxis}>
                    {["Jan", "Mar", "Mai", "Jul", "Set", "Nov"].map((m) => (
                      <span key={m}>{m}</span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Bottom strip */}
              <footer className={styles.leftFooter}>
                <span className={styles.footerDot} />
                © 2025 Invest Dream — Plataforma exclusiva
              </footer>
            </motion.div>

            {/* ══════════════════════════════════════
                RIGHT — Form panel
            ══════════════════════════════════════ */}
            <div className={styles.right}>
              <div className={styles.cornerDeco} aria-hidden />

              {/* Climax Logo */}
              <motion.div
                variants={logoExitVariants}
                initial="initial"
                exit="exit"
                className={styles.rightHeader}
              >
                <div className={styles.logoChip}>
                  <Image src="/image.png" alt="Invest Dream" width={26} height={26} />
                </div>
                <span className={styles.logoChipLabel}>Invest Dream</span>
              </motion.div>

              {/* Form items — each individually animated out */}
              <div className={styles.formWrap}>
                {/* Heading block */}
                <motion.div
                  className={styles.formHead}
                  initial={{ opacity: 1, x: 0, scale: 1, filter: "blur(0px)" }}
                  exit={formItemExit(0)}
                >
                  <p className={styles.formEyebrow}>Portal de Gestão</p>
                  <h1 className={styles.formTitle}>
                    Acesse<br />sua conta
                  </h1>
                  <p className={styles.formDesc}>
                    Plataforma de gestão exclusiva para parceiros certificados.
                  </p>
                </motion.div>

                {/* Divider */}
                <motion.div
                  className={styles.divider}
                  initial={{ opacity: 1, x: 0, scale: 1, filter: "blur(0px)" }}
                  exit={formItemExit(1)}
                />

                {/* Error */}
                {error && (
                  <motion.div
                    className={styles.errorBox}
                    role="alert"
                    initial={{ opacity: 1, x: 0, scale: 1 }}
                    exit={formItemExit(2)}
                  >
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <circle cx="7" cy="7" r="6.5" stroke="#be123c" />
                      <path d="M7 4v3.5" stroke="#be123c" strokeWidth="1.5" strokeLinecap="round" />
                      <circle cx="7" cy="10" r="0.75" fill="#be123c" />
                    </svg>
                    {error}
                  </motion.div>
                )}

                <form onSubmit={handleSubmit} className={styles.form} noValidate>
                  {/* Username */}
                  <motion.div
                    className={styles.field}
                    initial={{ opacity: 1, x: 0, scale: 1, filter: "blur(0px)" }}
                    exit={formItemExit(2)}
                  >
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
                  </motion.div>

                  {/* Password */}
                  <motion.div
                    className={styles.field}
                    initial={{ opacity: 1, x: 0, scale: 1, filter: "blur(0px)" }}
                    exit={formItemExit(3)}
                  >
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
                  </motion.div>

                  {/* Submit button */}
                  <motion.button
                    type="submit"
                    disabled={isLoading}
                    className={`${styles.submitBtn} ${isSuccess ? styles.submitBtnSuccess : ""}`}
                    id="login-submit"
                    initial={{ opacity: 1, x: 0, scale: 1, filter: "blur(0px)" }}
                    exit={formItemExit(4)}
                    /* Tactile press feedback */
                    whileTap={!isLoading ? { scale: 0.97 } : {}}
                    whileHover={!isLoading ? { scale: 1.01 } : {}}
                  >
                    <span className={styles.submitBg} aria-hidden />
                    <span className={styles.submitContent}>
                      {isLoading ? (
                        <span className={styles.spinner} />
                      ) : isSuccess ? (
                        /* Morphs to a checkmark on success */
                        <motion.span
                          key="check"
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ type: "spring", stiffness: 300, damping: 18 }}
                        >
                          <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                            <motion.path
                              d="M4 11l5 5 9-9"
                              stroke="currentColor"
                              strokeWidth="2.2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              initial={{ pathLength: 0 }}
                              animate={{ pathLength: 1 }}
                              transition={{ duration: 0.45, ease: "easeOut" }}
                            />
                          </svg>
                        </motion.span>
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
                  </motion.button>
                </form>

                {/* Trust row */}
                <motion.div
                  className={styles.trust}
                  initial={{ opacity: 1, x: 0, scale: 1, filter: "blur(0px)" }}
                  exit={formItemExit(6)}
                >
                  <div className={styles.trustItem}>
                    <span className={styles.trustDot} style={{ background: "#10b981" }} />
                    Conexão SSL segura
                  </div>
                  <span className={styles.trustSep} />
                  <div className={styles.trustItem}>
                    <span className={styles.trustDot} style={{ background: "#6366f1" }} />
                    Acesso restrito
                  </div>
                </motion.div>
              </div>
            </div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── Reduced-motion form panel (lightweight) ── */
function FormPanel({
  username, setUsername,
  password, setPassword,
  error, isLoading, onSubmit,
}: {
  username: string; setUsername: (v: string) => void;
  password: string; setPassword: (v: string) => void;
  error: string; isLoading: boolean;
  onSubmit: (e: React.FormEvent) => void;
}) {
  return (
    <div style={{ padding: "3rem 2rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
      <h1 style={{ fontSize: "1.75rem", fontWeight: 800, color: "#0f172a" }}>
        Acesse sua conta
      </h1>
      {error && <p role="alert" style={{ color: "#be123c", fontSize: "0.875rem" }}>{error}</p>}
      <form onSubmit={onSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <input
          type="text" value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Usuário" required disabled={isLoading}
          style={{ padding: "0.75rem 1rem", borderRadius: "0.5rem", border: "1px solid #e2e8f0" }}
        />
        <input
          type="password" value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Senha" required disabled={isLoading}
          style={{ padding: "0.75rem 1rem", borderRadius: "0.5rem", border: "1px solid #e2e8f0" }}
        />
        <button type="submit" disabled={isLoading}
          style={{ padding: "0.875rem", background: "#4f46e5", color: "#fff", border: "none", borderRadius: "0.5rem", fontWeight: 700, cursor: "pointer" }}>
          {isLoading ? "Entrando…" : "Entrar"}
        </button>
      </form>
    </div>
  );
}
