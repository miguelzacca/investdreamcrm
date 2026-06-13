"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

/* ─────────────────────────────────────────────
   Phase machine:
   idle → sweeping-in → holding → sweeping-out → idle
───────────────────────────────────────────── */
export type TransitionPhase =
  | "idle"
  | "sweeping-in"
  | "holding"
  | "sweeping-out";

interface TransitionContextValue {
  phase: TransitionPhase;
  /** Call from login page with the navigate callback. */
  triggerLoginTransition: (navigate: () => void) => void;
  /** Called by the overlay once the sweep-in animation finishes. */
  onSweepInComplete: () => void;
  /** Called by AppLayout on first mount after a login transition. */
  onDashboardMount: () => void;
}

const TransitionContext = createContext<TransitionContextValue>({
  phase: "idle",
  triggerLoginTransition: () => {},
  onSweepInComplete: () => {},
  onDashboardMount: () => {},
});

export function TransitionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [phase, setPhase] = useState<TransitionPhase>("idle");
  const phaseRef = useRef<TransitionPhase>("idle");
  const navigateFnRef = useRef<(() => void) | null>(null);

  // Keep ref in sync for use inside callbacks (avoids stale closures).
  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  const triggerLoginTransition = useCallback((navigate: () => void) => {
    navigateFnRef.current = navigate;
    setPhase("sweeping-in");
  }, []);

  const onSweepInComplete = useCallback(() => {
    setPhase("holding");
    navigateFnRef.current?.();
    navigateFnRef.current = null;
  }, []);

  const onDashboardMount = useCallback(() => {
    if (phaseRef.current !== "holding") return;
    // Small rAF gap lets the dashboard paint before we reveal it.
    requestAnimationFrame(() => {
      setPhase("sweeping-out");
    });
    // After the 850ms sweep-out animation finishes, go back to idle.
    setTimeout(() => setPhase("idle"), 950);
  }, []);


  return (
    <TransitionContext.Provider
      value={{ phase, triggerLoginTransition, onSweepInComplete, onDashboardMount }}
    >
      {children}
    </TransitionContext.Provider>
  );
}

export const usePageTransition = () => useContext(TransitionContext);
