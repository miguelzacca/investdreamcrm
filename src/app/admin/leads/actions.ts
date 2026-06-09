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
 * Admin creates a lead via round-robin queue.
 * The lead is assigned to the AGENT with the fewest active leads.
 * Ties broken alphabetically by name for a stable, predictable order.
 */
export async function adminCreateLeadRoundRobin(data: LeadInput) {
  await requireAdmin();

  // Fetch all agents and their active lead counts in one query
  const agents = await prisma.user.findMany({
    where: { role: "AGENT" },
    select: {
      id: true,
      name: true,
      email: true,
      _count: {
        select: { leads: { where: { isArchived: false } } },
      },
    },
    orderBy: { name: "asc" },
  });

  if (agents.length === 0) {
    throw new Error("Nenhum corretor disponível para receber leads.");
  }

  // Pick agent with the least active leads (stable sort: name is already alphabetical)
  const target = agents.reduce((min, a) =>
    a._count.leads < min._count.leads ? a : min
  );

  const lead = await prisma.lead.create({
    data: {
      ...data,
      agentId: target.id,
      funnelStage: "NEW_LEAD",
    },
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

  const agents = await prisma.user.findMany({
    where: { role: "AGENT" },
    select: {
      id: true,
      name: true,
      username: true,
      _count: {
        select: { leads: { where: { isArchived: false } } },
      },
    },
    orderBy: { name: "asc" },
  });

  if (agents.length === 0) return null;

  const target = agents.reduce((min, a) =>
    a._count.leads < min._count.leads ? a : min
  );

  return {
    id: target.id,
    name: target.name,
    username: target.username,
    activeLeads: target._count.leads,
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
