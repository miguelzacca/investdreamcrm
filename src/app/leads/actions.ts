"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { FunnelStage, Temperature } from "@prisma/client";
import { sendNewLeadEmail } from "@/lib/mailer";
import { reassignLead } from "@/lib/leads";

export async function getActiveLeads() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("Não autorizado");

  const leads = await prisma.lead.findMany({
    where: {
      agentId: session.user.id,
      isArchived: false,
    },
    orderBy: { createdAt: 'desc' }
  });

  return leads;
}

/** Admin only: returns all agents (AGENT role) ordered by queueOrder */
export async function getAgentsForAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    throw new Error("Acesso negado.");
  }

  return prisma.user.findMany({
    where: { role: "AGENT" },
    select: { id: true, name: true, username: true, role: true },
    orderBy: [{ queueOrder: "asc" }, { name: "asc" }],
  });
}

/** Admin only: returns active leads for a specific agent */
export async function getActiveLeadsByAgent(agentId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    throw new Error("Acesso negado.");
  }

  return prisma.lead.findMany({
    where: {
      agentId,
      isArchived: false,
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getLead(leadId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("Não autorizado");

  const isAdmin = session.user.role === "ADMIN";

  const lead = await prisma.lead.findFirst({
    where: {
      id: leadId,
      // Admins can see any lead; agents only see their own
      ...(!isAdmin ? { agentId: session.user.id } : {}),
    },
    include: { deals: true },
  });

  return lead;
}


export async function createLead(data: {
  name: string;
  whatsApp: string;
  interest: string;
  temperature: Temperature;
  source: string;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("Não autorizado");

  const lead = await prisma.lead.create({
    data: {
      ...data,
      agentId: session.user.id,
      funnelStage: "NEW_LEAD",
    }
  });

  // Fire-and-forget email notification
  prisma.user
    .findUnique({ where: { id: session.user.id }, select: { email: true, name: true } })
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
        });
      }
    })
    .catch((err) => console.error("[createLead] email error:", err));

  revalidatePath("/leads");
  revalidatePath("/dashboard");
}

export async function updateLead(
  leadId: string,
  data: {
    name?: string;
    whatsApp?: string;
    interest?: string;
    temperature?: Temperature;
    source?: string;
    funnelStage?: FunnelStage;
    expectedRentAmount?: number | null;
    expectedCommission?: number | null;
  }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("Não autorizado");

  const isAdmin = session.user.role === "ADMIN";

  await prisma.lead.update({
    where: isAdmin ? { id: leadId } : { id: leadId, agentId: session.user.id },
    data,
  });

  revalidatePath("/leads");
  revalidatePath(`/leads/${leadId}`);
  revalidatePath("/dashboard");
}

export async function updateLeadStage(leadId: string, newStage: FunnelStage) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("Não autorizado");

  const lead = await prisma.lead.update({
    where: { id: leadId },
    data: { funnelStage: newStage },
    include: { agent: { select: { email: true, name: true } } },
  });

  // Send notification when a lead is moved (back) to NEW_LEAD
  if (newStage === "NEW_LEAD" && lead.agent.email) {
    sendNewLeadEmail({
      agentEmail: lead.agent.email,
      agentName: lead.agent.name,
      leadName: lead.name,
      leadWhatsApp: lead.whatsApp,
      leadInterest: lead.interest,
      leadSource: lead.source,
      isFollowUp: lead.isFollowUp,
    }).catch((err) => console.error("[updateLeadStage] email error:", err));
  }

  revalidatePath("/leads");
}

export async function updateLeadExpectationAndStage(
  leadId: string, 
  newStage: FunnelStage, 
  expectedRentAmount: number | null, 
  expectedCommission: number | null
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("Não autorizado");

  const isAdmin = session.user.role === "ADMIN";

  const lead = await prisma.lead.update({
    where: isAdmin ? { id: leadId } : { id: leadId, agentId: session.user.id },
    data: { 
      funnelStage: newStage,
      expectedRentAmount,
      expectedCommission
    },
    include: { agent: { select: { email: true, name: true } } },
  });

  revalidatePath("/leads");
  revalidatePath(`/leads/${leadId}`);
  revalidatePath("/dashboard");
}

export async function archiveLead(leadId: string, reason: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("Não autorizado");

  await prisma.lead.update({
    where: { id: leadId },
    data: { isArchived: true, archiveReason: reason },
  });

  revalidatePath("/leads");
  revalidatePath("/dashboard");
}

export async function scheduleFollowUp(leadId: string, followUpDate: Date) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("Não autorizado");

  const isAdmin = session.user.role === "ADMIN";

  await prisma.lead.update({
    where: isAdmin ? { id: leadId } : { id: leadId, agentId: session.user.id },
    data: {
      isFollowUp: true,
      followUpDate,
      funnelStage: "NEW_LEAD",
    },
  });

  revalidatePath("/leads");
  revalidatePath(`/leads/${leadId}`);
  revalidatePath("/dashboard");
}

export async function getArchivedLeads() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("Não autorizado");

  return prisma.lead.findMany({
    where: { agentId: session.user.id, isArchived: true },
    orderBy: { updatedAt: "desc" },
  });
}


export async function createDeal(data: {
  leadId: string;
  firstMonthCommission?: number;
  recurringManagementFee?: number;
  rentAmount?: number;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("Não autorizado");

  await prisma.$transaction(async (tx) => {
    await tx.deal.create({
      data: {
        leadId: data.leadId,
        agentId: session.user.id,
        firstMonthCommission: data.firstMonthCommission ?? null,
        recurringManagementFee: data.recurringManagementFee ?? null,
        rentAmount: data.rentAmount ?? null,
      }
    });

    // Move lead to CLOSED_WON
    await tx.lead.update({
      where: { id: data.leadId },
      data: { funnelStage: "CLOSED_WON" },
    });
  });

  revalidatePath("/leads");
  revalidatePath(`/leads/${data.leadId}`);
  revalidatePath("/dashboard");
}

export async function reassignLeadToAgent(leadId: string, newAgentId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    throw new Error("Acesso negado. Apenas administradores podem reatribuir leads.");
  }

  const lead = await prisma.lead.update({
    where: { id: leadId },
    data: { 
      agentId: newAgentId,
      funnelStage: "NEW_LEAD",
      isFollowUp: false,
      followUpDate: null,
    },
    include: { agent: { select: { email: true, name: true } } },
  });

  if (lead.agent.email) {
    sendNewLeadEmail({
      agentEmail: lead.agent.email,
      agentName: lead.agent.name,
      leadName: lead.name,
      leadWhatsApp: lead.whatsApp,
      leadInterest: lead.interest,
      leadSource: lead.source,
      isFollowUp: false,
    }).catch((err) => console.error("[reassignLeadToAgent] email error:", err));
  }

  revalidatePath("/leads");
  revalidatePath(`/leads/${leadId}`);
  revalidatePath("/dashboard");
}

export async function reassignLeadToQueue(leadId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    throw new Error("Acesso negado. Apenas administradores podem reatribuir leads.");
  }

  // reassignLead takes care of picking the next agent, updating the pointer,
  // and sending email, push and whatsapp notifications.
  const result = await reassignLead(leadId);

  // We also ensure it's set to NEW_LEAD and clear follow-up state
  await prisma.lead.update({
    where: { id: leadId },
    data: {
      funnelStage: "NEW_LEAD",
      isFollowUp: false,
      followUpDate: null,
    }
  });

  revalidatePath("/leads");
  revalidatePath(`/leads/${leadId}`);
  revalidatePath("/dashboard");

  return { newAgentId: result.lead.agentId };
}
