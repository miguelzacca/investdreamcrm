import webpush from "web-push";
import { prisma } from "@/lib/prisma";

const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "";
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY || "";
const vapidSubject = process.env.VAPID_SUBJECT || "mailto:admin@example.com";

if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
}

export async function sendWebPushNotification(
  subscription: webpush.PushSubscription,
  payload: string
) {
  try {
    await webpush.sendNotification(subscription, payload);
    return true;
  } catch (error: any) {
    // 410 Gone = subscription expirada/inválida → remove do banco
    if (error?.statusCode === 410 || error?.statusCode === 404) {
      console.log("[webpush] Removendo subscription expirada:", subscription.endpoint.substring(0, 60));
      await prisma.pushSubscription.deleteMany({
        where: { endpoint: subscription.endpoint },
      }).catch(() => {});
    } else {
      console.error("[webpush] Erro ao enviar notificação:", error?.statusCode, error?.message);
    }
    return false;
  }
}
