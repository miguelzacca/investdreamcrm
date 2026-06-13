"use client";

import { SessionProvider } from "next-auth/react";
import { PushNotificationManager } from "./PushNotificationManager";
import { TransitionProvider } from "@/lib/TransitionContext";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <TransitionProvider>
        {children}
        <PushNotificationManager />
      </TransitionProvider>
    </SessionProvider>
  );
}
