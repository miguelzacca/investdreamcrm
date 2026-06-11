import { prisma } from '@/lib/prisma';
import { FunnelStage, Temperature, Role } from '@prisma/client';

export interface DashboardMetrics {
  totalLeads: number;
  totalActiveLeads: number;
  totalArchivedLeads: number;
  totalDeals: number;
  totalRentAmount: number;
  totalCommission: number;
  
  conversionMetrics: {
    total: number;
    visited: number;
    negotiated: number;
    closed: number;
  };
  
  funnelMetrics: { stage: string; count: number }[];
  temperatureMetrics: { name: string; value: number }[];
  sourceMetrics: { name: string; value: number; fill: string }[];
  
  brokerPerformance: {
    id: string;
    name: string;
    totalLeadsReceived: number;
    activeLeads: number;
    archivedLeads: number;
    visitedLeads: number;
    closedDeals: number;
    conversionRate: number; // Total to closed
    conversionRateVisitToClosed: number;
    totalRentVolume: number;
    totalCommission: number;
    avgRentVolume: number;
  }[];

  monthlyTrends: {
    month: string;
    deals: number;
    revenue: number;
  }[];
}

export async function getAdminMetrics(periodDays: number = 30): Promise<DashboardMetrics> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - periodDays);

  const leadsInPeriod = await prisma.lead.findMany({
    where: { createdAt: { gte: startDate } }
  });

  const dealsInPeriod = await prisma.deal.findMany({
    where: { closedAt: { gte: startDate } },
    include: { lead: true }
  });

  const totalLeads = leadsInPeriod.length;
  const totalArchivedLeads = leadsInPeriod.filter(l => l.isArchived).length;
  const totalActiveLeads = totalLeads - totalArchivedLeads - dealsInPeriod.length; // Approximate active
  const totalDeals = dealsInPeriod.length;
  const totalRentAmount = dealsInPeriod.reduce((sum, deal) => sum + (deal.rentAmount || 0), 0);
  const totalCommission = dealsInPeriod.reduce((sum, deal) => sum + (deal.firstMonthCommission || 0) + (deal.recurringManagementFee || 0), 0);

  // Conversion Metrics (True Funnel progression)
  const visitedLeads = leadsInPeriod.filter(l => 
    ['VIEWING_SCHEDULED', 'NEGOTIATION', 'CLOSED_WON'].includes(l.funnelStage)
  ).length;
  
  const negotiatedLeads = leadsInPeriod.filter(l => 
    ['NEGOTIATION', 'CLOSED_WON'].includes(l.funnelStage)
  ).length;

  const conversionMetrics = {
    total: totalLeads,
    visited: visitedLeads,
    negotiated: negotiatedLeads,
    closed: totalDeals
  };

  // Current Funnel Snapshot
  const stageNames: Record<FunnelStage, string> = {
    NEW_LEAD: 'Novo Lead',
    CONTACTED: 'Contatado',
    VIEWING_SCHEDULED: 'Visita',
    NEGOTIATION: 'Negociação',
    CLOSED_WON: 'Fechado'
  };

  const funnelCount: Record<FunnelStage, number> = {
    NEW_LEAD: 0,
    CONTACTED: 0,
    VIEWING_SCHEDULED: 0,
    NEGOTIATION: 0,
    CLOSED_WON: 0
  };

  // For the bar chart we want only active ones in the stage, or all? Usually current snapshot.
  leadsInPeriod.filter(l => !l.isArchived).forEach(l => {
    if (funnelCount[l.funnelStage] !== undefined) {
      funnelCount[l.funnelStage]++;
    }
  });

  const funnelMetrics = Object.entries(funnelCount).map(([stage, count]) => ({
    stage: stageNames[stage as FunnelStage],
    count
  }));

  // Temperature Metrics
  const tempCount = { HOT: 0, WARM: 0, COLD: 0 };
  leadsInPeriod.forEach(l => {
    if (tempCount[l.temperature] !== undefined) tempCount[l.temperature]++;
  });

  const temperatureMetrics = [
    { name: 'Quente', value: tempCount.HOT, fill: '#ef4444' }, // red
    { name: 'Morno', value: tempCount.WARM, fill: '#f59e0b' }, // yellow
    { name: 'Frio', value: tempCount.COLD, fill: '#3b82f6' }   // blue
  ];

  // Source Metrics
  const sourceCount: Record<string, number> = {};
  leadsInPeriod.forEach(l => {
    const src = l.source || 'Desconhecido';
    sourceCount[src] = (sourceCount[src] || 0) + 1;
  });

  const COLORS = ['#8b5cf6', '#ec4899', '#10b981', '#f59e0b', '#3b82f6', '#64748b'];
  const sourceMetrics = Object.entries(sourceCount)
    .map(([name, value], i) => ({
      name,
      value,
      fill: COLORS[i % COLORS.length]
    }))
    .sort((a, b) => b.value - a.value);

  // Broker Performance
  const brokers = await prisma.user.findMany({
    where: { role: Role.AGENT }
  });

  const brokerPerformance = brokers.map(broker => {
    const brokerLeads = leadsInPeriod.filter(l => l.agentId === broker.id);
    const brokerDeals = dealsInPeriod.filter(d => d.agentId === broker.id);
    
    const totalLeadsReceived = brokerLeads.length;
    const archivedLeads = brokerLeads.filter(l => l.isArchived).length;
    const activeLeads = brokerLeads.filter(l => !l.isArchived && l.funnelStage !== 'CLOSED_WON').length;
    
    const brokerVisitedLeads = brokerLeads.filter(l => 
      ['VIEWING_SCHEDULED', 'NEGOTIATION', 'CLOSED_WON'].includes(l.funnelStage)
    ).length;

    const closedDealsCount = brokerDeals.length;
    const conversionRate = totalLeadsReceived > 0 ? (closedDealsCount / totalLeadsReceived) * 100 : 0;
    const conversionRateVisitToClosed = brokerVisitedLeads > 0 ? (closedDealsCount / brokerVisitedLeads) * 100 : 0;
    
    const brokerRentVolume = brokerDeals.reduce((sum, deal) => sum + (deal.rentAmount || 0), 0);
    const brokerCommission = brokerDeals.reduce((sum, deal) => sum + (deal.firstMonthCommission || 0) + (deal.recurringManagementFee || 0), 0);
    const avgRentVolume = closedDealsCount > 0 ? brokerRentVolume / closedDealsCount : 0;

    return {
      id: broker.id,
      name: broker.name,
      totalLeadsReceived,
      activeLeads,
      archivedLeads,
      visitedLeads: brokerVisitedLeads,
      closedDeals: closedDealsCount,
      conversionRate,
      conversionRateVisitToClosed,
      totalRentVolume: brokerRentVolume,
      totalCommission: brokerCommission,
      avgRentVolume
    };
  }).sort((a, b) => b.totalCommission - a.totalCommission); // Sort by commission

  // Monthly Trends (last 6 months based on end of period? or just absolute last 6 months?)
  // Let's stick to the last 6 months regardless of period to show a macro view, or map it properly.
  // We'll show absolute last 6 months for trends.
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  sixMonthsAgo.setDate(1);

  const dealsForTrends = await prisma.deal.findMany({
    where: { closedAt: { gte: sixMonthsAgo } }
  });

  const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  
  const monthlyTrendsMap: Record<string, { deals: number, revenue: number }> = {};
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const key = `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
    monthlyTrendsMap[key] = { deals: 0, revenue: 0 };
  }

  dealsForTrends.forEach(deal => {
    const d = new Date(deal.closedAt);
    const key = `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
    if (monthlyTrendsMap[key]) {
      monthlyTrendsMap[key].deals++;
      monthlyTrendsMap[key].revenue += (deal.rentAmount || 0);
    }
  });

  const monthlyTrends = Object.entries(monthlyTrendsMap).map(([month, data]) => ({
    month,
    deals: data.deals,
    revenue: data.revenue
  }));

  return {
    totalLeads,
    totalActiveLeads,
    totalArchivedLeads,
    totalDeals,
    totalRentAmount,
    totalCommission,
    conversionMetrics,
    funnelMetrics,
    temperatureMetrics,
    sourceMetrics,
    brokerPerformance,
    monthlyTrends
  };
}
