"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Bell, X, AlertTriangle } from "lucide-react";

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
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) return;

    const perm = Notification.permission;
    setPermission(perm);

    if (perm === "default" || perm === "denied") {
      setShowPrompt(true);
      // small delay so animation is visible
      setTimeout(() => setVisible(true), 100);
    } else if (perm === "granted" && session?.user) {
      subscribeToPush();
    }
  }, [session]);

  const subscribeToPush = async () => {
    if (!("serviceWorker" in navigator)) return;
    try {
      setIsSubscribing(true);
      await navigator.serviceWorker.register("/sw.js");
      const readyRegistration = await navigator.serviceWorker.ready;

      const response = await fetch("/api/web-push/vapid-public-key");
      const { publicKey } = await response.json();
      if (!publicKey) throw new Error("No public key");

      const convertedVapidKey = urlBase64ToUint8Array(publicKey);
      const subscription = await readyRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedVapidKey,
      });

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

  const handleClose = () => {
    setVisible(false);
    setTimeout(() => setIsClosed(true), 300);
  };

  if (!session?.user || isClosed || !showPrompt) return null;

  const bannerStyle: React.CSSProperties = {
    position: "fixed",
    bottom: "1.5rem",
    right: "1.5rem",
    left: "1.5rem",
    maxWidth: "24rem",
    marginLeft: "auto",
    zIndex: 9999,
    background: permission === "denied"
      ? "linear-gradient(135deg, #fff1f2 0%, #ffe4e6 100%)"
      : "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
    border: `1px solid ${permission === "denied" ? "#fecdd3" : "#334155"}`,
    borderRadius: "1rem",
    padding: "1.25rem",
    boxShadow: "0 20px 60px rgba(0,0,0,0.4), 0 4px 16px rgba(0,0,0,0.2)",
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
    transition: "opacity 0.3s ease, transform 0.3s ease",
    opacity: visible ? 1 : 0,
    transform: visible ? "translateY(0)" : "translateY(20px)",
  };

  const iconWrapStyle: React.CSSProperties = {
    width: "2.5rem",
    height: "2.5rem",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    background: permission === "denied"
      ? "rgba(239,68,68,0.15)"
      : "rgba(99,102,241,0.2)",
    color: permission === "denied" ? "#ef4444" : "#818cf8",
  };

  const titleStyle: React.CSSProperties = {
    fontWeight: 600,
    fontSize: "0.9375rem",
    color: permission === "denied" ? "#7f1d1d" : "#f1f5f9",
    margin: 0,
  };

  const bodyStyle: React.CSSProperties = {
    fontSize: "0.8125rem",
    color: permission === "denied" ? "#b91c1c" : "#94a3b8",
    margin: "0.25rem 0 0",
    lineHeight: 1.5,
  };

  const btnStyle: React.CSSProperties = {
    width: "100%",
    padding: "0.625rem",
    borderRadius: "0.625rem",
    border: "none",
    cursor: isSubscribing ? "not-allowed" : "pointer",
    fontWeight: 600,
    fontSize: "0.875rem",
    background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
    color: "#fff",
    opacity: isSubscribing ? 0.6 : 1,
    transition: "opacity 0.2s",
  };

  const closeStyle: React.CSSProperties = {
    position: "absolute",
    top: "0.75rem",
    right: "0.75rem",
    background: "none",
    border: "none",
    cursor: "pointer",
    color: permission === "denied" ? "#ef4444" : "#64748b",
    display: "flex",
    alignItems: "center",
    padding: "0.25rem",
    borderRadius: "0.25rem",
  };

  return (
    <div style={bannerStyle}>
      <button onClick={handleClose} style={closeStyle}>
        <X size={16} />
      </button>

      <div style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem" }}>
        <div style={iconWrapStyle}>
          {permission === "denied"
            ? <AlertTriangle size={18} />
            : <Bell size={18} />
          }
        </div>
        <div>
          <h3 style={titleStyle}>
            {permission === "denied" ? "Notificações Bloqueadas" : "Ativar Notificações"}
          </h3>
          <p style={bodyStyle}>
            {permission === "denied"
              ? "Você não receberá alertas de novos leads. Clique no ícone de cadeado na barra de endereços e permita as notificações."
              : "Receba alertas instantâneos quando um novo lead for atribuído a você — mesmo com o site fechado."
            }
          </p>
        </div>
      </div>

      {permission === "default" && (
        <button
          onClick={handleRequestPermission}
          disabled={isSubscribing}
          style={btnStyle}
        >
          {isSubscribing ? "Ativando..." : "🔔 Permitir Notificações"}
        </button>
      )}
    </div>
  );
}
