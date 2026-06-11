"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Bell, X, AlertTriangle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, "+")
    .replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function PushNotificationManager() {
  const { data: session } = useSession();
  const [permission, setPermission] = useState<NotificationPermission | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [isClosed, setIsClosed] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setPermission(Notification.permission);
      if (Notification.permission === "default" || Notification.permission === "denied") {
        setShowPrompt(true);
      } else if (Notification.permission === "granted" && session?.user) {
        // Ensure subscription is active
        subscribeToPush();
      }
    }
  }, [session]);

  const subscribeToPush = async () => {
    if (!("serviceWorker" in navigator)) return;

    try {
      setIsSubscribing(true);
      const registration = await navigator.serviceWorker.register("/sw.js");

      // Wait for service worker to be ready
      const readyRegistration = await navigator.serviceWorker.ready;

      // Get VAPID public key
      const response = await fetch("/api/web-push/vapid-public-key");
      const { publicKey } = await response.json();

      if (!publicKey) throw new Error("No public key");

      const convertedVapidKey = urlBase64ToUint8Array(publicKey);

      // Subscribe
      const subscription = await readyRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedVapidKey,
      });

      // Send to backend
      await fetch("/api/web-push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(subscription),
      });

      setPermission("granted");
      setShowPrompt(false);
    } catch (error) {
      console.error("Error subscribing to push:", error);
    } finally {
      setIsSubscribing(false);
    }
  };

  const handleRequestPermission = async () => {
    const result = await Notification.requestPermission();
    setPermission(result);
    if (result === "granted") {
      await subscribeToPush();
    }
  };

  // Only show for logged in agents/admins, and if not closed in this session
  if (!session?.user || isClosed) return null;

  return (
    <AnimatePresence>
      {showPrompt && permission === "default" && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl rounded-2xl p-5 z-50 flex flex-col gap-4"
        >
          <button onClick={() => setIsClosed(true)} className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-600 transition">
            <X size={18} />
          </button>
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 text-blue-600 p-2 rounded-full">
              <Bell size={20} />
            </div>
            <div>
              <h3 className="font-semibold text-zinc-900 dark:text-white">Ativar Notificações</h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-tight mt-1">
                Receba alertas instantâneos quando um novo lead for atribuído a você.
              </p>
            </div>
          </div>
          <button
            onClick={handleRequestPermission}
            disabled={isSubscribing}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition disabled:opacity-50"
          >
            {isSubscribing ? "Ativando..." : "Permitir Notificações"}
          </button>
        </motion.div>
      )}

      {showPrompt && permission === "denied" && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-red-50 border border-red-200 shadow-2xl rounded-2xl p-5 z-50 flex flex-col gap-3"
        >
          <button onClick={() => setIsClosed(true)} className="absolute top-4 right-4 text-red-400 hover:text-red-600 transition">
            <X size={18} />
          </button>
          <div className="flex items-start gap-3">
            <div className="mt-0.5 text-red-600">
              <AlertTriangle size={20} />
            </div>
            <div>
              <h3 className="font-semibold text-red-900">Notificações Bloqueadas</h3>
              <p className="text-sm text-red-700 leading-tight mt-1">
                Você não receberá alertas de novos leads. Para ativar, clique no ícone de cadeado na barra de endereços do seu navegador e permita as notificações.
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
