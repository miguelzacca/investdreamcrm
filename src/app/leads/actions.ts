"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { FunnelStage, Temperature } from "@prisma/client";

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

  await prisma.lead.create({
    data: {
      ...data,
      agentId: session.user.id,
      funnelStage: "NEW_LEAD",
    }
  });

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
  }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("Não autorizado");

  await prisma.lead.update({
    where: { id: leadId, agentId: session.user.id },
    data,
  });

  revalidatePath("/leads");
  revalidatePath(`/leads/${leadId}`);
  revalidatePath("/dashboard");
}

export async function updateLeadStage(leadId: string, newStage: FunnelStage) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("Não autorizado");

  await prisma.lead.update({
    where: { id: leadId },
    data: { funnelStage: newStage }
  });

  revalidatePath("/leads");
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
