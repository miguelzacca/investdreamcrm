"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function getDashboardStats() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("Não autorizado");

  const isAdmin = session.user.role === "ADMIN";
  const agentId = session.user.id;

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  if (isAdmin) {
    // Admin: métricas globais de toda a equipe
    // Executar queries sequencialmente para evitar pool connection timeout no db.prisma.io
    const activeLeads = await prisma.lead.count({ where: { isArchived: false } });
    const hotLeads = await prisma.lead.count({ where: { isArchived: false, temperature: "HOT" } });
    const dealsThisMonth = await prisma.deal.findMany({
      where: { closedAt: { gte: startOfMonth } },
    });
    const allDeals = await prisma.deal.findMany({});
    const recentLeads = await prisma.lead.findMany({
      where: { isArchived: false },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: {
        agent: { select: { id: true, name: true } },
      },
    });
    const agentStats = await prisma.user.findMany({
      where: { role: "AGENT" },
      select: {
        id: true,
        name: true,
        username: true,
        _count: {
          select: { leads: { where: { isArchived: false } } },
        },
        deals: {
          select: { firstMonthCommission: true, recurringManagementFee: true },
        },
      },
      orderBy: { name: "asc" },
    });
    const expectedAggregations = await prisma.lead.aggregate({
      where: { 
        isArchived: false,
        funnelStage: { in: ['VIEWING_SCHEDULED', 'NEGOTIATION'] }
      },
      _sum: { expectedRentAmount: true, expectedCommission: true }
    });
    const commissionThisMonth = dealsThisMonth.reduce(
      (sum, d) => sum + (d.firstMonthCommission ?? 0),
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

    const agentRanking = agentStats.map((a) => ({
      id: a.id,
      name: a.name,
      username: a.username,
      activeLeads: a._count.leads,
      totalDeals: a.deals.length,
      totalCommission: a.deals.reduce(
        (sum, d) => sum + (d.firstMonthCommission ?? 0),
        0
      ),
    })).sort((a, b) => b.totalCommission - a.totalCommission);

    return {
      isAdmin: true as const,
      activeLeads,
      hotLeads,
      dealsThisMonth: dealsThisMonth.length,
      commissionThisMonth,
      totalDeals: allDeals.length,
      totalCommission,
      totalRentAmount,
      totalRecurringFee,
      recentLeads,
      agentRanking,
      rentAmountThisMonth: dealsThisMonth.reduce((sum, d) => sum + (d.rentAmount ?? 0), 0),
      recurringFeeThisMonth: dealsThisMonth.reduce((sum, d) => sum + (d.recurringManagementFee ?? 0), 0),
      expectedRentAmount: expectedAggregations._sum.expectedRentAmount ?? 0,
      expectedCommission: expectedAggregations._sum.expectedCommission ?? 0,
    };
  }

  // Agent: métricas apenas do próprio agente (Sequencial para evitar timeouts)
  const activeLeads = await prisma.lead.count({
    where: { agentId, isArchived: false },
  });
  const hotLeads = await prisma.lead.count({
    where: { agentId, isArchived: false, temperature: "HOT" },
  });
  const dealsThisMonth = await prisma.deal.findMany({
    where: {
      agentId,
      closedAt: { gte: startOfMonth },
    },
  });
  const allDeals = await prisma.deal.findMany({ where: { agentId } });
  const recentLeads = await prisma.lead.findMany({
    where: { agentId, isArchived: false },
    orderBy: { createdAt: "desc" },
    take: 5,
  });
  const expectedAggregations = await prisma.lead.aggregate({
    where: { 
      agentId,
      isArchived: false,
      funnelStage: { in: ['VIEWING_SCHEDULED', 'NEGOTIATION'] }
    },
    _sum: { expectedRentAmount: true, expectedCommission: true }
  });

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
    isAdmin: false as const,
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
    agentRanking: [] as { id: string; name: string; username: string; activeLeads: number; totalDeals: number; totalCommission: number }[],
    expectedRentAmount: expectedAggregations._sum.expectedRentAmount ?? 0,
    expectedCommission: expectedAggregations._sum.expectedCommission ?? 0,
  };
}
