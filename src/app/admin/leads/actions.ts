"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { Temperature } from "@prisma/client";
import { sendNewLeadEmail } from "@/lib/mailer";
import { LeadInput, createLeadRoundRobin, pickNextQueueAgent } from "@/lib/leads";
import { getInstanceStatus, sendText, ADMIN_INSTANCE_NAME } from "@/lib/evolution";
import { generateLeadNotificationMessage } from "@/lib/ai-message";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    throw new Error("Acesso negado. Apenas administradores.");
  }
  return session;
}

export async function getAdminLeads(opts?: {
  agentId?: string;
  archived?: boolean;
}) {
  await requireAdmin();

  return prisma.lead.findMany({
    where: {
      ...(opts?.agentId ? { agentId: opts.agentId } : {}),
      isArchived: opts?.archived ?? false,
    },
    include: {
      agent: { select: { id: true, name: true, username: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getAllAgents() {
  await requireAdmin();
  return prisma.user.findMany({
    where: { role: "AGENT" },
    select: { id: true, name: true, username: true, role: true },
    orderBy: { name: "asc" },
  });
}

/** Admin creates a lead and assigns it directly to a specific agent. */
export async function adminCreateLeadForAgent(
  agentId: string,
  data: LeadInput
) {
  await requireAdmin();

  if (!agentId) throw new Error("Corretor não informado.");

  const lead = await prisma.lead.create({
    data: {
      ...data,
      agentId,
      funnelStage: "NEW_LEAD",
    },
  });

  // Busca dados do agente para notificações
  const agent = await prisma.user.findUnique({
    where: { id: agentId },
    select: {
      email: true,
      name: true,
      whatsApp: true,
      pushSubscriptions: true,
    },
  });

  // Notifica por email
  if (agent?.email) {
    sendNewLeadEmail({
      agentEmail: agent.email,
      agentName: agent.name,
      leadName: lead.name,
      leadWhatsApp: lead.whatsApp,
      leadInterest: lead.interest,
      leadSource: lead.source,
      isFollowUp: false,
    }).catch((err) => console.error("[adminCreateLeadForAgent] email send error:", err));
  }

  // Notifica por push
  if (agent?.pushSubscriptions && agent.pushSubscriptions.length > 0) {
    const { sendWebPushNotification } = await import("@/lib/webpush");
    const payload = JSON.stringify({
      title: "Novo Lead!",
      body: `${lead.name} demonstrou interesse. Clique para ver.`,
      url: `/leads`,
    });
    for (const sub of agent.pushSubscriptions) {
      sendWebPushNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        payload
      ).catch((err) => console.error("[adminCreateLeadForAgent] push send error:", err));
    }
  }

  // Notifica por WhatsApp
  if (agent?.whatsApp) {
    try {
      const status = await getInstanceStatus(ADMIN_INSTANCE_NAME);
      const instanceState = status?.instance?.state ?? status?.state;
      if (instanceState === 'open') {
        const leadUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/leads/${lead.id}`;
        const aiMessage = await generateLeadNotificationMessage(
          lead.name,
          lead.interest,
          agent.name,
          leadUrl,
        );
        await sendText(ADMIN_INSTANCE_NAME, agent.whatsApp, aiMessage);
      } else {
        console.warn('[adminCreateLeadForAgent] WA instance not open, state:', instanceState);
      }
    } catch (err) {
      console.error('[adminCreateLeadForAgent] whatsapp notification error:', err);
    }
  }

  revalidatePath("/admin/leads");
  revalidatePath("/admin/team");
  revalidatePath("/leads");
  revalidatePath("/dashboard");
}

/**
 * Admin creates a lead via sequential round-robin queue.
 * Passes to the next agent in order regardless of how many active leads they have.
 */
export async function adminCreateLeadRoundRobin(data: LeadInput) {
  await requireAdmin();

  const result = await createLeadRoundRobin(data);

  revalidatePath("/admin/leads");
  revalidatePath("/admin/team");
  revalidatePath("/leads");
  revalidatePath("/dashboard");

  return { assignedTo: result.assignedTo };
}

/** Preview: returns who would receive the NEXT round-robin lead (read-only). */
export async function getNextRoundRobinAgent() {
  await requireAdmin();

  const target = await pickNextQueueAgent();
  if (!target) return null;

  return {
    id: target.id,
    name: target.name,
  };
}

export async function adminDeleteLead(leadId: string) {
  await requireAdmin();

  await prisma.lead.delete({
    where: { id: leadId },
  });

  revalidatePath("/admin/leads");
  revalidatePath("/admin/team");
}

export async function adminClearArchivedLeads() {
  await requireAdmin();

  await prisma.lead.deleteMany({
    where: { isArchived: true },
  });

  revalidatePath("/admin/leads");
  revalidatePath("/admin/team");
}
