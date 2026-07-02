"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import styles from "../Login.module.css";
import fpStyles from "./ForgotPassword.module.css";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [mounted, setMounted] = useState(false);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    setMounted(true);
    const t = setTimeout(() => setRevealed(true), 60);
    return () => clearTimeout(t);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    setMessage("");

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        setStatus("error");
        setMessage(data.error ?? "Erro ao enviar. Tente novamente.");
      } else {
        setStatus("success");
        setMessage(data.message);
      }
    } catch {
      setStatus("error");
      setMessage("Erro ao enviar. Tente novamente.");
    }
  };

  if (!mounted) return null;

  return (
    <div className={`${styles.root} ${revealed ? styles.rootIn : ""}`}>
      {/* LEFT — Brand panel (static, no exit animation needed here) */}
      <div className={styles.left}>
        <div className={styles.grain} aria-hidden />
        <div className={styles.glow1} aria-hidden />
        <div className={styles.glow2} aria-hidden />
        <div className={styles.glow3} aria-hidden />

        <div className={styles.liveBadge}>
          <span className={styles.liveDot} />
          Sistema Ativo
        </div>

        <div className={styles.hero}>
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

        <footer className={styles.leftFooter}>
          <span className={styles.footerDot} />
          © 2025 Invest Dream — Plataforma exclusiva
        </footer>
      </div>

      {/* RIGHT — Forgot password form */}
      <div className={styles.right}>
        <div className={styles.cornerDeco} aria-hidden />

        {/* Logo header */}
        <div className={styles.rightHeader}>
          <div className={styles.logoChip}>
            <Image src="/image.png" alt="Invest Dream" width={26} height={26} />
          </div>
          <span className={styles.logoChipLabel}>Invest Dream</span>
        </div>

        <div className={styles.formWrap}>
          {/* Heading */}
          <div className={styles.formHead}>
            <p className={styles.formEyebrow}>Recuperação de acesso</p>
            <h1 className={styles.formTitle}>
              Esqueci<br />minha senha
            </h1>
            <p className={styles.formDesc}>
              Informe o e-mail cadastrado na sua conta e enviaremos um link para criar uma nova senha.
            </p>
          </div>

          <div className={styles.divider} />

          <AnimatePresence mode="wait">
            {status === "success" ? (
              /* ✅ Success state */
              <motion.div
                key="success"
                className={fpStyles.successBox}
                initial={{ opacity: 0, scale: 0.94, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 22 }}
              >
                <div className={fpStyles.successIcon}>
                  <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                    <circle cx="14" cy="14" r="13" stroke="#10b981" strokeWidth="2" />
                    <motion.path
                      d="M8 14l4.5 4.5 7.5-9"
                      stroke="#10b981"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 0.5, ease: "easeOut" }}
                    />
                  </svg>
                </div>
                <div>
                  <p className={fpStyles.successTitle}>E-mail enviado!</p>
                  <p className={fpStyles.successDesc}>{message}</p>
                </div>
                <Link href="/login" className={fpStyles.backLink}>
                  ← Voltar para o login
                </Link>
              </motion.div>
            ) : (
              /* 📧 Form state */
              <motion.div key="form" initial={{ opacity: 1 }} exit={{ opacity: 0 }}>
                {/* Error message */}
                {status === "error" && (
                  <motion.div
                    className={styles.errorBox}
                    role="alert"
                    initial={{ opacity: 0, y: -8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                  >
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <circle cx="7" cy="7" r="6.5" stroke="#be123c" />
                      <path d="M7 4v3.5" stroke="#be123c" strokeWidth="1.5" strokeLinecap="round" />
                      <circle cx="7" cy="10" r="0.75" fill="#be123c" />
                    </svg>
                    {message}
                  </motion.div>
                )}

                <form onSubmit={handleSubmit} className={styles.form} noValidate>
                  {/* Email field */}
                  <div className={styles.field}>
                    <label htmlFor="fp-email" className={styles.fieldLabel}>
                      E-mail
                    </label>
                    <div className={styles.fieldWrap}>
                      <span className={styles.fieldIcon}>
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                          <rect x="1.5" y="3.5" width="13" height="9" rx="2" stroke="currentColor" strokeWidth="1.5" />
                          <path d="M1.5 6l5.67 3.5a1.5 1.5 0 0 0 1.66 0L14.5 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                        </svg>
                      </span>
                      <input
                        id="fp-email"
                        type="email"
                        className={styles.fieldInput}
                        placeholder="seu@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        disabled={status === "loading"}
                        autoComplete="email"
                      />
                    </div>
                  </div>

                  {/* Submit */}
                  <motion.button
                    type="submit"
                    disabled={status === "loading"}
                    className={styles.submitBtn}
                    id="fp-submit"
                    whileTap={status !== "loading" ? { scale: 0.97 } : {}}
                    whileHover={status !== "loading" ? { scale: 1.01 } : {}}
                  >
                    <span className={styles.submitBg} aria-hidden />
                    <span className={styles.submitContent}>
                      {status === "loading" ? (
                        <span className={styles.spinner} />
                      ) : (
                        <>
                          <span>Enviar link de recuperação</span>
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

                {/* Back to login */}
                <div className={fpStyles.footer}>
                  <Link href="/login" className={fpStyles.backLink}>
                    ← Voltar para o login
                  </Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
