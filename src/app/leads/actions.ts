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

export async function createLead(data: { name: string, whatsApp: string, interest: string, temperature: Temperature, source: string }) {
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

export async function updateLeadStage(leadId: string, newStage: FunnelStage) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("Não autorizado");

  await prisma.lead.update({
    where: { id: leadId },
    data: { funnelStage: newStage }
  });

  revalidatePath("/leads");
}

export async function archiveLead(leadId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("Não autorizado");

  await prisma.lead.update({
    where: { id: leadId },
    data: { isArchived: true }
  });

  revalidatePath("/leads");
  revalidatePath("/dashboard");
}
