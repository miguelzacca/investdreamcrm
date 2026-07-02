"use client";

import React, { useState, useEffect, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import styles from "../Login.module.css";
import rpStyles from "./ResetPassword.module.css";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  // If no token in URL, show error immediately
  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Link inválido. Solicite um novo link de recuperação.");
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password.length < 6) {
      setStatus("error");
      setMessage("A senha deve ter pelo menos 6 caracteres.");
      return;
    }

    if (password !== confirm) {
      setStatus("error");
      setMessage("As senhas não coincidem.");
      return;
    }

    setStatus("loading");
    setMessage("");

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setStatus("error");
        setMessage(data.error ?? "Erro ao redefinir. Tente novamente.");
      } else {
        setStatus("success");
        setMessage(data.message);
        // Redirect to login after 3s
        setTimeout(() => router.push("/login"), 3000);
      }
    } catch {
      setStatus("error");
      setMessage("Erro ao conectar. Tente novamente.");
    }
  };

  /* Strength indicator */
  const strength = (() => {
    if (password.length === 0) return 0;
    let s = 0;
    if (password.length >= 6) s++;
    if (password.length >= 10) s++;
    if (/[A-Z]/.test(password)) s++;
    if (/[0-9]/.test(password)) s++;
    if (/[^A-Za-z0-9]/.test(password)) s++;
    return s;
  })();

  const strengthLabel = ["", "Fraca", "Razoável", "Boa", "Forte", "Excelente"][strength];
  const strengthColor = ["", "#ef4444", "#f59e0b", "#eab308", "#22c55e", "#10b981"][strength];

  return (
    <form onSubmit={handleSubmit} className={styles.form} noValidate>
      {/* Error banner */}
      <AnimatePresence>
        {status === "error" && (
          <motion.div
            className={styles.errorBox}
            role="alert"
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <circle cx="7" cy="7" r="6.5" stroke="#be123c" />
              <path d="M7 4v3.5" stroke="#be123c" strokeWidth="1.5" strokeLinecap="round" />
              <circle cx="7" cy="10" r="0.75" fill="#be123c" />
            </svg>
            {message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* New password */}
      <div className={styles.field}>
        <label htmlFor="rp-password" className={styles.fieldLabel}>
          Nova senha
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
            id="rp-password"
            type={showPass ? "text" : "password"}
            className={styles.fieldInput}
            placeholder="Mínimo 6 caracteres"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={status === "loading" || status === "success"}
            autoComplete="new-password"
          />
          <button
            type="button"
            className={rpStyles.eyeBtn}
            onClick={() => setShowPass((p) => !p)}
            tabIndex={-1}
            aria-label={showPass ? "Ocultar senha" : "Mostrar senha"}
          >
            {showPass ? (
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M2 8s2.5-5 6-5 6 5 6 5-2.5 5-6 5-6-5-6-5Z" stroke="currentColor" strokeWidth="1.5" />
                <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.5" />
                <path d="M2 2l12 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M2 8s2.5-5 6-5 6 5 6 5-2.5 5-6 5-6-5-6-5Z" stroke="currentColor" strokeWidth="1.5" />
                <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.5" />
              </svg>
            )}
          </button>
        </div>

        {/* Strength bar */}
        {password.length > 0 && (
          <div className={rpStyles.strengthRow}>
            <div className={rpStyles.strengthBars}>
              {[1, 2, 3, 4, 5].map((n) => (
                <div
                  key={n}
                  className={rpStyles.strengthBar}
                  style={{ background: n <= strength ? strengthColor : "#e2e8f0" }}
                />
              ))}
            </div>
            <span className={rpStyles.strengthLabel} style={{ color: strengthColor }}>
              {strengthLabel}
            </span>
          </div>
        )}
      </div>

      {/* Confirm password */}
      <div className={styles.field}>
        <label htmlFor="rp-confirm" className={styles.fieldLabel}>
          Confirmar nova senha
        </label>
        <div className={styles.fieldWrap}>
          <span className={styles.fieldIcon}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M3 8.5l3.5 3.5 7-7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          <input
            id="rp-confirm"
            type={showConfirm ? "text" : "password"}
            className={`${styles.fieldInput} ${
              confirm.length > 0 && confirm !== password ? rpStyles.inputError : ""
            }`}
            placeholder="Repita a nova senha"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
            disabled={status === "loading" || status === "success"}
            autoComplete="new-password"
          />
          <button
            type="button"
            className={rpStyles.eyeBtn}
            onClick={() => setShowConfirm((p) => !p)}
            tabIndex={-1}
            aria-label={showConfirm ? "Ocultar confirmação" : "Mostrar confirmação"}
          >
            {showConfirm ? (
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M2 8s2.5-5 6-5 6 5 6 5-2.5 5-6 5-6-5-6-5Z" stroke="currentColor" strokeWidth="1.5" />
                <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.5" />
                <path d="M2 2l12 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M2 8s2.5-5 6-5 6 5 6 5-2.5 5-6 5-6-5-6-5Z" stroke="currentColor" strokeWidth="1.5" />
                <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.5" />
              </svg>
            )}
          </button>
        </div>
        {confirm.length > 0 && confirm !== password && (
          <p className={rpStyles.mismatchHint}>As senhas não coincidem</p>
        )}
      </div>

      {/* Submit */}
      <motion.button
        type="submit"
        disabled={status === "loading" || status === "success" || !token}
        className={`${styles.submitBtn} ${status === "success" ? styles.submitBtnSuccess : ""}`}
        id="rp-submit"
        whileTap={status === "idle" || status === "error" ? { scale: 0.97 } : {}}
        whileHover={status === "idle" || status === "error" ? { scale: 1.01 } : {}}
      >
        <span className={styles.submitBg} aria-hidden />
        <span className={styles.submitContent}>
          {status === "loading" ? (
            <span className={styles.spinner} />
          ) : status === "success" ? (
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
              <span>Redefinir senha</span>
              <span className={styles.submitArrow}>
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <path d="M3.5 9h11M10 4.5l4.5 4.5-4.5 4.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
            </>
          )}
        </span>
      </motion.button>

      {status === "success" && (
        <motion.p
          className={rpStyles.successHint}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
        >
          ✅ {message} Redirecionando para o login…
        </motion.p>
      )}
    </form>
  );
}

export default function ResetPasswordPage() {
  const [mounted, setMounted] = useState(false);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    setMounted(true);
    const t = setTimeout(() => setRevealed(true), 60);
    return () => clearTimeout(t);
  }, []);

  if (!mounted) return null;

  return (
    <div className={`${styles.root} ${revealed ? styles.rootIn : ""}`}>
      {/* LEFT */}
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

      {/* RIGHT */}
      <div className={styles.right}>
        <div className={styles.cornerDeco} aria-hidden />

        <div className={styles.rightHeader}>
          <div className={styles.logoChip}>
            <Image src="/image.png" alt="Invest Dream" width={26} height={26} />
          </div>
          <span className={styles.logoChipLabel}>Invest Dream</span>
        </div>

        <div className={styles.formWrap}>
          <div className={styles.formHead}>
            <p className={styles.formEyebrow}>Recuperação de acesso</p>
            <h1 className={styles.formTitle}>
              Criar nova<br />senha
            </h1>
            <p className={styles.formDesc}>
              Escolha uma senha segura para proteger sua conta.
            </p>
          </div>

          <div className={styles.divider} />

          <Suspense fallback={<div className={styles.spinner} />}>
            <ResetPasswordForm />
          </Suspense>

          <div style={{ display: "flex", justifyContent: "center", marginTop: "1.5rem" }}>
            <Link
              href="/login"
              style={{
                fontSize: "0.8rem",
                fontWeight: 500,
                color: "#6366f1",
                textDecoration: "none",
              }}
            >
              ← Voltar para o login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
