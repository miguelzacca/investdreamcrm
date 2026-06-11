import webpush from "web-push";

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
  } catch (error) {
    console.error("Error sending web push notification:", error);
    // You might want to handle Gone (410) errors here to clean up old subscriptions
    return false;
  }
}

export { webpush };
