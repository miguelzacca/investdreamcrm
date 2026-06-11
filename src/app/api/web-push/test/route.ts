import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendWebPushNotification } from "@/lib/webpush";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const subs = await prisma.pushSubscription.findMany({
      where: { userId: session.user.id },
    });

    if (subs.length === 0) {
      return NextResponse.json({
        status: "no_subscriptions",
        userId: session.user.id,
        message: "Nenhuma subscription encontrada para este usuário. Recarregue a página e aceite a permissão.",
      });
    }

    // Tenta enviar notificação de teste
    const results = [];
    for (const sub of subs) {
      const payload = JSON.stringify({
        title: "🔔 Teste de Notificação",
        body: "Se você está vendo isso, as notificações push estão funcionando!",
        url: "/dashboard",
      });

      const success = await sendWebPushNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        payload
      );
      results.push({ endpoint: sub.endpoint.substring(0, 50) + "...", success });
    }

    return NextResponse.json({
      status: "ok",
      userId: session.user.id,
      subscriptionCount: subs.length,
      results,
      vapidConfigured: !!(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY),
    });
  } catch (error: any) {
    return NextResponse.json({ status: "error", message: error.message, stack: error.stack }, { status: 500 });
  }
}
