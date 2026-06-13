"use client";

import React, { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { usePageTransition } from "@/lib/TransitionContext";

/* ─────────────────────────────────────────────
   Custom easing curves — the soul of "premium"
   
   SWEEP IN  → cubic-bezier(0.55, 0, 0.1, 1)
   Starts measured, then BLASTS to cover screen.
   The deceleration at the end = satisfying thud.

   SWEEP OUT → cubic-bezier(0.9, 0, 0.3, 1)
   Rips off fast, long tail — like a curtain being
   pulled away in one fluid motion.
───────────────────────────────────────────── */
const EASE_IN  = [0.55, 0, 0.10, 1] as const;
const EASE_OUT = [0.90, 0, 0.30, 1] as const;

/* Clip-path keyframes */
const CLIP_HIDDEN  = "circle(0% at 50% 50%)";
const CLIP_COVERED = "circle(142% at 50% 50%)"; // √2×100% covers all corners
const CLIP_EXITED  = "circle(0% at 50% -5%)";   // contracts toward top

export function PageTransitionOverlay() {
  const { phase, onSweepInComplete } = usePageTransition();
  const hasCompletedSweepIn = useRef(false);

  // Reset the guard whenever a new sweep-in starts
  useEffect(() => {
    if (phase === "sweeping-in") {
      hasCompletedSweepIn.current = false;
    }
  }, [phase]);

  const visible = phase !== "idle";

  return (
    <>
      {/* ── Hidden SVG gooey filter ─────────────────── */}
      <svg
        aria-hidden
        style={{ position: "absolute", width: 0, height: 0, overflow: "hidden" }}
      >
        <defs>
          <filter id="gooey-edge" colorInterpolationFilters="sRGB">
            <feGaussianBlur in="SourceGraphic" stdDeviation="14" result="blur" />
            <feColorMatrix
              in="blur"
              mode="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 32 -14"
              result="gooey"
            />
            <feBlend in="SourceGraphic" in2="gooey" />
          </filter>
        </defs>
      </svg>

      <AnimatePresence>
        {visible && (
          <motion.div
            key="page-transition-overlay"
            aria-hidden
            initial={{ clipPath: CLIP_HIDDEN }}
            animate={{
              clipPath:
                phase === "sweeping-out" ? CLIP_EXITED : CLIP_COVERED,
            }}
            transition={{
              clipPath: {
                duration: phase === "sweeping-out" ? 0.85 : 0.80,
                ease: phase === "sweeping-out" ? EASE_OUT : EASE_IN,
              },
            }}
            onAnimationComplete={() => {
              if (phase === "sweeping-in" && !hasCompletedSweepIn.current) {
                hasCompletedSweepIn.current = true;
                onSweepInComplete();
              }
            }}
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 99998,
              background:
                "linear-gradient(160deg, #0d1117 0%, #0f172a 40%, #1e1b4b 70%, #0f172a 100%)",
              pointerEvents: "none",
              willChange: "clip-path",
              /* Apply gooey filter for liquid-edge on the expanding front */
              filter: phase !== "sweeping-out" ? "url(#gooey-edge)" : "none",
            }}
          >
            {/* ── Ambient glows inside the overlay ─────── */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                background:
                  "radial-gradient(ellipse 60% 40% at 50% 50%, rgba(99,102,241,0.18) 0%, transparent 70%)",
                pointerEvents: "none",
              }}
            />

            {/* ── Center logo + pulse ring ─────────────── */}
            <AnimatePresence>
              {phase === "holding" && (
                <motion.div
                  key="overlay-logo"
                  initial={{ opacity: 0, scale: 0.6 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.4 }}
                  transition={{ duration: 0.4, ease: [0.34, 1.56, 0.64, 1] }}
                  style={{
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexDirection: "column",
                    gap: "1rem",
                  }}
                >
                  {/* Pulse rings */}
                  <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {[0, 1, 2].map((i) => (
                      <motion.div
                        key={i}
                        style={{
                          position: "absolute",
                          width: 72,
                          height: 72,
                          borderRadius: "50%",
                          border: "1px solid rgba(139,92,246,0.6)",
                        }}
                        animate={{ scale: [1, 2.8], opacity: [0.7, 0] }}
                        transition={{
                          duration: 1.6,
                          ease: "easeOut",
                          repeat: Infinity,
                          delay: i * 0.52,
                        }}
                      />
                    ))}

                    {/* Logo chip */}
                    <motion.div
                      animate={{ rotate: [0, 360] }}
                      transition={{ duration: 8, ease: "linear", repeat: Infinity }}
                      style={{
                        width: 72,
                        height: 72,
                        borderRadius: "50%",
                        background: "linear-gradient(135deg, #4f46e5, #a855f7)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        boxShadow:
                          "0 0 40px rgba(139,92,246,0.6), 0 0 80px rgba(79,70,229,0.3)",
                        position: "relative",
                        zIndex: 1,
                      }}
                    >
                      <Image src="/image.png" alt="InvestDream" width={36} height={36} />
                    </motion.div>
                  </div>

                  {/* Label */}
                  <motion.p
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15, duration: 0.4 }}
                    style={{
                      color: "rgba(255,255,255,0.55)",
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      letterSpacing: "0.18em",
                      textTransform: "uppercase",
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                    }}
                  >
                    Carregando plataforma…
                  </motion.p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
