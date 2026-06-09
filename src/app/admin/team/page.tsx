import React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card } from '@/components/ui/Card';
import { getTeamStats } from './actions';
import { TeamPageClient } from './TeamPageClient';
import styles from './TeamPage.module.css';

const formatCurrency = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export default async function TeamPage() {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== 'ADMIN') redirect('/dashboard');

  const team = await getTeamStats();

  return (
    <AppLayout title="Equipe — Visão Admin">
      <div className={styles.page}>
        <TeamPageClient team={team} />
      </div>
    </AppLayout>
  );
}
