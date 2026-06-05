"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function getDashboardStats() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("Não autorizado");

  const agentId = session.user.id;

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [activeLeads, hotLeads, dealsThisMonth, allDeals, recentLeads] =
    await Promise.all([
      prisma.lead.count({
        where: { agentId, isArchived: false },
      }),
      prisma.lead.count({
        where: { agentId, isArchived: false, temperature: "HOT" },
      }),
      prisma.deal.findMany({
        where: {
          agentId,
          closedAt: { gte: startOfMonth },
        },
      }),
      prisma.deal.findMany({ where: { agentId } }),
      prisma.lead.findMany({
        where: { agentId, isArchived: false },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
    ]);

  const commissionThisMonth = dealsThisMonth.reduce(
    (sum, d) => sum + (d.firstMonthCommission ?? 0),
    0
  );

  const rentAmountThisMonth = dealsThisMonth.reduce(
    (sum, d) => sum + (d.rentAmount ?? 0),
    0
  );

  const recurringFeeThisMonth = dealsThisMonth.reduce(
    (sum, d) => sum + (d.recurringManagementFee ?? 0),
    0
  );

  const totalCommission = allDeals.reduce(
    (sum, d) => sum + (d.firstMonthCommission ?? 0),
    0
  );

  const totalRentAmount = allDeals.reduce(
    (sum, d) => sum + (d.rentAmount ?? 0),
    0
  );

  const totalRecurringFee = allDeals.reduce(
    (sum, d) => sum + (d.recurringManagementFee ?? 0),
    0
  );

  return {
    activeLeads,
    hotLeads,
    dealsThisMonth: dealsThisMonth.length,
    commissionThisMonth,
    rentAmountThisMonth,
    recurringFeeThisMonth,
    totalDeals: allDeals.length,
    totalCommission,
    totalRentAmount,
    totalRecurringFee,
    recentLeads,
  };
}
