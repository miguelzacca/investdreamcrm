"use client";

import { useReducedMotion } from "framer-motion";

/* ─────────────────────────────────────────────
   useDashboardReveal
   
   Returns an `isRevealed` boolean that flips to
   true on mount (with optional delay), letting
   consumers drive staggered CSS/Framer anims.

   Also returns `prefersReducedMotion` so callers
   can fall back to a simple opacity-only enter.
───────────────────────────────────────────── */
/**
 * Returns the user's reduced-motion preference.
 * Variants are exported directly below — consume them
 * via the useDashboardReveal hook or import individually.
 */
export function useDashboardReveal() {
  const prefersReducedMotion = useReducedMotion();
  return { prefersReducedMotion };
}

/* ─────────────────────────────────────────────
   Framer Motion variant factories
   
   These produce pre-tuned variant objects.
   The physics rationale for each:

   SIDEBAR (sidebarReveal):
     stiffness 80 / damping 18 / mass 1.1
     → Gentle undershoot on X axis gives the
       sidebar a sense of *weight* sliding in.
       Feels mechanical, not floaty.

   HEADER (headerReveal):
     stiffness 120 / damping 20
     → Stiffer spring = snappier. Header should
       feel authoritative, not bouncy.

   CARDS (cardReveal with stagger):
     stiffness 100 / damping 15
     → Slight overshoot + the blur clearing as
       cards arrive = "materialising" sensation.
       Each card at +100ms stagger = information
       hierarchy made tangible.

   TEXT (textReveal):
     y: 24 → 0 with clipPath mask = classic
     editorial "rise up" text reveal.
───────────────────────────────────────────── */

export const sidebarReveal = {
  hidden: {
    opacity: 0,
    x: -80,
    skewX: "2deg",
  },
  show: {
    opacity: 1,
    x: 0,
    skewX: "0deg",
    transition: {
      type: "spring" as const,
      stiffness: 80,
      damping: 18,
      mass: 1.1,
      delay: 0.05,
    },
  },
};

export const headerReveal = {
  hidden: { opacity: 0, y: -44 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring" as const,
      stiffness: 120,
      damping: 20,
      delay: 0.18,
    },
  },
};

export function cardReveal(index: number, reducedMotion = false) {
  if (reducedMotion) {
    return {
      hidden: { opacity: 0 },
      show: {
        opacity: 1,
        transition: { duration: 0.3, delay: index * 0.05 },
      },
    };
  }
  return {
    hidden: {
      opacity: 0,
      y: 56,
      scale: 0.94,
    },
    show: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: "spring" as const,
        stiffness: 100,
        damping: 15,
        delay: 0.28 + index * 0.09,
      },
    },
  };
}

export const contentReveal = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.35,
    },
  },
};

export const contentItemReveal = {
  hidden: { opacity: 0, y: 40 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring" as const,
      stiffness: 110,
      damping: 16,
    },
  },
};

export const reducedSidebarReveal = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.25 } },
};

export const reducedContentReveal = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.04, delayChildren: 0.1 },
  },
};

export const reducedItemReveal = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.2 } },
};
