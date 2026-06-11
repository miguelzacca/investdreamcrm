import { prisma } from "@/lib/prisma";
import { sendNewLeadEmail } from "@/lib/mailer";
import { Temperature } from "@prisma/client";
import { sendWebPushNotification } from "@/lib/webpush";

export type LeadInput = {
  name: string;
  whatsApp: string;
  interest?: string;
  temperature: Temperature;
  source?: string;
};

/**
 * Picks the next agent in the sequential round-robin queue.
 * Priority:
 *  1. Only agents with inAutoQueue = true are considered.
 *  2. Agents that have NEVER received a lead go first, ordered by queueOrder ASC.
 *  3. Among agents who have received leads, the one whose lastLeadReceivedAt
 *     is the oldest goes next (strict sequential rotation).
 *  4. Ties broken by queueOrder ASC.
 */
export async function pickNextQueueAgent() {
  const agents = await prisma.user.findMany({
    where: { role: "AGENT", inAutoQueue: true },
    select: {
      id: true,
      name: true,
      email: true,
      queueOrder: true,
      lastLeadReceivedAt: true,
    },
  });

  if (agents.length === 0) return null;

  // Sort: null lastLeadReceivedAt (never received) → first, ordered by queueOrder
  // Then by lastLeadReceivedAt ASC (oldest first), ties broken by queueOrder ASC
  const sorted = [...agents].sort((a, b) => {
    const aNull = a.lastLeadReceivedAt === null;
    const bNull = b.lastLeadReceivedAt === null;

    if (aNull && bNull) return a.queueOrder - b.queueOrder;
    if (aNull) return -1;
    if (bNull) return 1;

    const timeDiff =
      a.lastLeadReceivedAt!.getTime() - b.lastLeadReceivedAt!.getTime();
    if (timeDiff !== 0) return timeDiff;
    return a.queueOrder - b.queueOrder;
  });

  return sorted[0];
}

/**
 * Creates a lead via sequential round-robin queue.
 * Passes to the next agent in order regardless of how many active leads they have.
 */
export async function createLeadRoundRobin(data: LeadInput) {
  const target = await pickNextQueueAgent();

  if (!target) {
    throw new Error("Nenhum corretor disponível na fila automática.");
  }

  const now = new Date();

  const lead = await prisma.lead.create({
    data: {
      ...data,
      agentId: target.id,
      funnelStage: "NEW_LEAD",
    },
  });

  // Advance the queue pointer
  await prisma.user.update({
    where: { id: target.id },
    data: { lastLeadReceivedAt: now },
  });

  // Notifica o corretor (Email)
  if (target.email) {
    sendNewLeadEmail({
      agentEmail: target.email,
      agentName: target.name,
      leadName: lead.name,
      leadWhatsApp: lead.whatsApp,
      leadInterest: lead.interest,
      leadSource: lead.source,
      isFollowUp: false,
    }).catch((err) => console.error("[createLeadRoundRobin] email send error:", err));
  }

  // Notifica o corretor (Push)
  try {
    const pushSubscriptions = await prisma.pushSubscription.findMany({
      where: { userId: target.id },
    });

    if (pushSubscriptions.length > 0) {
      const payload = JSON.stringify({
        title: "Novo Lead!",
        body: `${lead.name} demonstrou interesse. Clique para ver.`,
        url: `/dashboard/leads?search=${encodeURIComponent(lead.name)}`, // ou a rota correta
      });

      for (const sub of pushSubscriptions) {
        await sendWebPushNotification(
          {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh,
              auth: sub.auth,
            },
          },
          payload
        );
      }
    }
  } catch (err) {
    console.error("[createLeadRoundRobin] push notification error:", err);
  }

  return { assignedTo: target.name, lead };
}
