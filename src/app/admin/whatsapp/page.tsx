"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Loader2, QrCode, LogOut, CheckCircle2, AlertTriangle, RefreshCcw } from "lucide-react";

export default function WhatsAppAdminPage() {
  const [status, setStatus] = useState<string>("loading");
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const pollIntervalRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const errorCountRef = useRef(0);

  const fetchStatus = async () => {
    try {
      const res = await fetch("/api/evolution?action=status");
      if (res.ok) {
        const data = await res.json();
        if (data?.instance?.state) {
          setStatus(data.instance.state); // 'open', 'connecting', 'close'
        } else {
          setStatus("disconnected");
        }
        errorCountRef.current = 0; // reset backoff on success
      } else {
        setStatus("disconnected");
        errorCountRef.current = 0;
      }
    } catch (err) {
      console.error(err);
      setStatus("error");
      errorCountRef.current += 1;
    } finally {
      setLoading(false);
    }
  };

  const scheduleNextPoll = () => {
    if (pollIntervalRef.current) clearTimeout(pollIntervalRef.current);
    // Backoff: 15s normally, doubles on errors up to 60s max
    const delay = Math.min(15000 * Math.pow(2, errorCountRef.current), 60000);
    pollIntervalRef.current = setTimeout(async () => {
      await fetchStatus();
      scheduleNextPoll();
    }, delay);
  };

  useEffect(() => {
    fetchStatus().then(scheduleNextPoll);
    return () => {
      if (pollIntervalRef.current) clearTimeout(pollIntervalRef.current);
    };
  }, []);

  const handleConnect = async () => {
    setLoading(true);
    setQrCode(null);
    setError(null);
    try {
      const res = await fetch("/api/evolution?action=connect");
      if (res.ok) {
        const data = await res.json();
        if (data?.base64) {
          setQrCode(data.base64);
        } else {
          await fetchStatus();
        }
      } else {
        const err = await res.json();
        setError(err?.error || "Erro ao conectar. Tente novamente.");
      }
    } catch (err) {
      console.error(err);
      setError("Erro de rede ao conectar.");
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/evolution?action=logout");
      const data = await res.json();
      setQrCode(null);
      // Force disconnected immediately — the Evolution API may still briefly return
      // 'open' after deletion, so we can't rely on fetchStatus() alone.
      setStatus("disconnected");
      if (data?.fallbackDelete) {
        setError("Sessão travada detectada. A instância foi redefinida. Clique em 'Gerar QR Code' para reconectar.");
      }
      await fetchStatus();
    } catch (err) {
      console.error(err);
      setError("Erro ao desconectar. Tente o Reset Forçado abaixo.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    setLoading(true);
    setError(null);
    setQrCode(null);
    setStatus("disconnected"); // Force UI update immediately
    try {
      await fetch("/api/evolution?action=reset");
    } catch (err) {
      console.error(err);
      setError("Erro ao resetar a instância.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">WhatsApp (Admin)</h1>
        <p className="text-muted-foreground mt-2">
          Conecte o seu número de WhatsApp corporativo. Ele será usado pela inteligência artificial para notificar os corretores sobre a chegada de novos leads (prevenção anti-ban ativa).
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Status da Conexão</CardTitle>
          <CardDescription>Gerencie a instância da Evolution API.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center space-x-4">
            <div className="flex-1 space-y-1">
              <p className="text-sm font-medium leading-none">
                Estado Atual
              </p>
              <p className="text-sm text-muted-foreground capitalize">
                {loading && status === "loading" ? "Carregando..." : status === "open" ? "Conectado" : "Desconectado"}
              </p>
            </div>
            {status === "open" ? (
              <CheckCircle2 className="h-6 w-6 text-green-500" />
            ) : status === "connecting" ? (
              <Loader2 className="h-6 w-6 animate-spin text-yellow-500" />
            ) : (
              <div className="h-4 w-4 rounded-full bg-red-500" />
            )}
          </div>

          {error && (
            <div className="flex items-start gap-2 rounded-md border border-yellow-500/40 bg-yellow-500/10 p-3 text-sm text-yellow-700 dark:text-yellow-400">
              <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {status === "open" ? (
            <div className="flex flex-wrap gap-3">
              <Button variant="danger" onClick={handleDisconnect} disabled={loading}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LogOut className="mr-2 h-4 w-4" />}
                Desconectar WhatsApp
              </Button>
              <Button variant="outline" onClick={handleReset} disabled={loading}>
                <RefreshCcw className="mr-2 h-4 w-4" />
                Reset Forçado
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-3">
                <Button onClick={handleConnect} disabled={loading || !!qrCode}>
                  {loading && !qrCode ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <QrCode className="mr-2 h-4 w-4" />
                  )}
                  Gerar QR Code
                </Button>
                <Button variant="outline" onClick={handleReset} disabled={loading}>
                  <RefreshCcw className="mr-2 h-4 w-4" />
                  Reset Forçado
                </Button>
              </div>

              {qrCode && (
                <div className="mt-4 p-4 border rounded-md bg-white w-fit mx-auto">
                  <Image src={qrCode} alt="WhatsApp QR Code" width={250} height={250} />
                  <p className="text-center text-sm text-gray-500 mt-2">
                    Escaneie com o seu WhatsApp
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
