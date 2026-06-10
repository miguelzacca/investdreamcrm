import React from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { getActiveLeads, getAgentsForAdmin, getActiveLeadsByAgent } from './actions';
import LeadsClient from './LeadsClient';
import AdminLeadsClient from './AdminLeadsClient';

export default async function LeadsPage() {
  const session = await getServerSession(authOptions);
  const isAdmin = session?.user?.role === 'ADMIN';

  if (isAdmin) {
    const agents = await getAgentsForAdmin();
    // Pre-load leads for the first agent (if any)
    const firstAgentLeads = agents.length > 0 ? await getActiveLeadsByAgent(agents[0].id) : [];

    return (
      <AppLayout title="Leads — Funil de Vendas">
        <AdminLeadsClient agents={agents} initialAgentId={agents[0]?.id ?? null} initialLeads={firstAgentLeads} />
      </AppLayout>
    );
  }

  const leads = await getActiveLeads();

  return (
    <AppLayout title="Leads — Funil de Vendas">
      <LeadsClient initialLeads={leads} />
    </AppLayout>
  );
}
