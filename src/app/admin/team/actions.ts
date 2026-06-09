"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    throw new Error("Acesso negado. Apenas administradores.");
  }
  return session;
}

export async function getTeamStats() {
  await requireAdmin();

  const agents = await prisma.user.findMany({
    include: {
      leads: {
        where: { isArchived: false },
      },
      deals: true,
    },
    orderBy: [
      { queueOrder: "asc" },
      { name: "asc" },
    ],
  });

  return agents.map((agent) => {
    const hotLeads = agent.leads.filter((l) => l.temperature === "HOT").length;
    const closedWon = agent.leads.filter((l) => l.funnelStage === "CLOSED_WON").length;
    const totalCommission = agent.deals.reduce(
      (sum, d) => sum + (d.firstMonthCommission ?? 0),
      0
    );
    return {
      id: agent.id,
      name: agent.name,
      username: agent.username,
      email: agent.email,
      role: agent.role,
      queueOrder: agent.queueOrder,
      inAutoQueue: agent.inAutoQueue,
      lastLeadReceivedAt: agent.lastLeadReceivedAt?.toISOString() ?? null,
      activeLeads: agent.leads.length,
      hotLeads,
      closedWon,
      totalDeals: agent.deals.length,
      totalCommission,
    };
  });
}

export async function getAgentDetail(agentId: string) {
  await requireAdmin();

  const agent = await prisma.user.findUnique({
    where: { id: agentId },
    include: {
      leads: {
        orderBy: { createdAt: "desc" },
      },
      deals: true,
    },
  });

  if (!agent) return null;

  const activeLeads = agent.leads.filter((l) => !l.isArchived);
  const archivedLeads = agent.leads.filter((l) => l.isArchived);
  const hotLeads = activeLeads.filter((l) => l.temperature === "HOT").length;
  const closedWon = activeLeads.filter((l) => l.funnelStage === "CLOSED_WON").length;
  const totalCommission = agent.deals.reduce(
    (sum, d) => sum + (d.firstMonthCommission ?? 0),
    0
  );

  return {
    id: agent.id,
    name: agent.name,
    username: agent.username,
    role: agent.role,
    activeLeads,
    archivedLeads,
    hotLeads,
    closedWon,
    totalDeals: agent.deals.length,
    totalCommission,
  };
}

/** Updates queue settings (order and/or active status) for a specific agent. */
export async function updateAgentQueueSettings(
  agentId: string,
  data: { queueOrder?: number; inAutoQueue?: boolean }
) {
  await requireAdmin();

  await prisma.user.update({
    where: { id: agentId },
    data,
  });

  revalidatePath("/admin/team");
  return { success: true };
}
