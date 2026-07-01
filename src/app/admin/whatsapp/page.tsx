"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, QrCode, LogOut, CheckCircle2 } from "lucide-react";

export default function WhatsAppAdminPage() {
  const [status, setStatus] = useState<string>("loading");
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

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
      } else {
        setStatus("disconnected");
      }
    } catch (err) {
      console.error(err);
      setStatus("error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleConnect = async () => {
    setLoading(true);
    setQrCode(null);
    try {
      const res = await fetch("/api/evolution?action=connect");
      if (res.ok) {
        const data = await res.json();
        if (data?.base64) {
          setQrCode(data.base64);
        } else {
          await fetchStatus();
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    setLoading(true);
    try {
      await fetch("/api/evolution?action=logout");
      setQrCode(null);
      await fetchStatus();
    } catch (err) {
      console.error(err);
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

          {status === "open" ? (
            <Button variant="danger" onClick={handleDisconnect} disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LogOut className="mr-2 h-4 w-4" />}
              Desconectar WhatsApp
            </Button>
          ) : (
            <div className="space-y-4">
              <Button onClick={handleConnect} disabled={loading || !!qrCode}>
                {loading && !qrCode ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <QrCode className="mr-2 h-4 w-4" />
                )}
                Gerar QR Code
              </Button>

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
