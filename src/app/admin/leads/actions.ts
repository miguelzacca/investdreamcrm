"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { Temperature } from "@prisma/client";
import { sendNewLeadEmail } from "@/lib/mailer";

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

type LeadInput = {
  name: string;
  whatsApp: string;
  interest?: string;
  temperature: Temperature;
  source?: string;
};

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

  // Notifica o corretor
  prisma.user
    .findUnique({ where: { id: agentId }, select: { email: true, name: true } })
    .then((agent) => {
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
    })
    .catch((err) => console.error("[adminCreateLeadForAgent] user fetch error:", err));


  revalidatePath("/admin/leads");
  revalidatePath("/admin/team");
  revalidatePath("/leads");
  revalidatePath("/dashboard");
}

/**
 * Picks the next agent in the sequential round-robin queue.
 * Priority:
 *  1. Only agents with inAutoQueue = true are considered.
 *  2. Agents that have NEVER received a lead go first, ordered by queueOrder ASC.
 *  3. Among agents who have received leads, the one whose lastLeadReceivedAt
 *     is the oldest goes next (strict sequential rotation).
 *  4. Ties broken by queueOrder ASC.
 */
async function pickNextQueueAgent() {
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
 * Admin creates a lead via sequential round-robin queue.
 * Passes to the next agent in order regardless of how many active leads they have.
 */
export async function adminCreateLeadRoundRobin(data: LeadInput) {
  await requireAdmin();

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

  // Notifica o corretor
  if (target.email) {
    sendNewLeadEmail({
      agentEmail: target.email,
      agentName: target.name,
      leadName: lead.name,
      leadWhatsApp: lead.whatsApp,
      leadInterest: lead.interest,
      leadSource: lead.source,
      isFollowUp: false,
    }).catch((err) => console.error("[adminCreateLeadRoundRobin] email send error:", err));
  }

  revalidatePath("/admin/leads");
  revalidatePath("/admin/team");
  revalidatePath("/leads");
  revalidatePath("/dashboard");

  return { assignedTo: target.name };
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
