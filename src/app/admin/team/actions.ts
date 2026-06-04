"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

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
    orderBy: { name: "asc" },
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
      role: agent.role,
      activeLeads: agent.leads.length,
      hotLeads,
      closedWon,
      totalDeals: agent.deals.length,
      totalCommission,
    };
  });
}
