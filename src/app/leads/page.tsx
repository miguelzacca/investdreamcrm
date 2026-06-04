import React from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { getActiveLeads } from './actions';
import LeadsClient from './LeadsClient';

export default async function LeadsPage() {
  const leads = await getActiveLeads();

  return (
    <AppLayout title="Leads — Funil de Vendas">
      <LeadsClient initialLeads={leads} />
    </AppLayout>
  );
}
