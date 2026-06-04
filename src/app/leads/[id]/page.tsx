import React from 'react';
import { notFound } from 'next/navigation';
import { AppLayout } from '@/components/layout/AppLayout';
import { getLead } from '../actions';
import LeadDetailClient from './LeadDetailClient';

interface LeadDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function LeadDetailPage({ params }: LeadDetailPageProps) {
  const { id } = await params;
  const lead = await getLead(id);

  if (!lead) notFound();

  return (
    <AppLayout title={lead.name}>
      <LeadDetailClient lead={lead} />
    </AppLayout>
  );
}
