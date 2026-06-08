import React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card } from '@/components/ui/Card';
import { getTeamStats } from './actions';
import styles from './TeamPage.module.css';

const formatCurrency = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export default async function TeamPage() {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== 'ADMIN') redirect('/dashboard');

  const team = await getTeamStats();

  const totalLeads = team.reduce((s, a) => s + a.activeLeads, 0);
  const totalDeals = team.reduce((s, a) => s + a.totalDeals, 0);
  const totalCommission = team.reduce((s, a) => s + a.totalCommission, 0);

  return (
    <AppLayout title="Equipe — Visão Admin">
      <div className={styles.page}>
        {/* Summary */}
        <div className={styles.summaryGrid}>
          <div className={styles.summaryCard}>
            <span className={styles.summaryIcon}>👥</span>
            <span className={styles.summaryNum}>{team.length}</span>
            <span className={styles.summaryLabel}>Agentes</span>
          </div>
          <div className={styles.summaryCard}>
            <span className={styles.summaryIcon}>📋</span>
            <span className={styles.summaryNum}>{totalLeads}</span>
            <span className={styles.summaryLabel}>Leads Ativos (total)</span>
          </div>
          <div className={styles.summaryCard}>
            <span className={styles.summaryIcon}>🏠</span>
            <span className={styles.summaryNum}>{totalDeals}</span>
            <span className={styles.summaryLabel}>Negócios Fechados</span>
          </div>
          <div className={styles.summaryCard}>
            <span className={styles.summaryIcon}>💰</span>
            <span className={styles.summaryNum}>{formatCurrency(totalCommission)}</span>
            <span className={styles.summaryLabel}>Comissão Total</span>
          </div>
        </div>

        {/* Actions bar */}
        <div className={styles.toolbar}>
          <h2 className={styles.sectionTitle}>Agentes</h2>
          <Link href="/admin/users/new" className={styles.newUserBtn}>
            + Novo Agente
          </Link>
        </div>

        {/* Table */}
        <Card>
          <div className={styles.table}>
            <div className={styles.tableHeader}>
              <span>Nome</span>
              <span>Usuário</span>
              <span>Perfil</span>
              <span>Leads Ativos</span>
              <span>🔥 Quentes</span>
              <span>Fechados</span>
              <span>Comissão Total</span>
            </div>
            {team.map(agent => (
              <Link key={agent.id} href={`/admin/team/${agent.id}`} className={styles.tableRow}>
                <span className={styles.agentName}>{agent.name}</span>
                <span className={styles.agentUsername}>@{agent.username}</span>
                <span>
                  <span className={agent.role === 'ADMIN' ? styles.badgeAdmin : styles.badgeAgent}>
                    {agent.role === 'ADMIN' ? 'Admin' : 'Corretor'}
                  </span>
                </span>
                <span className={styles.num}>{agent.activeLeads}</span>
                <span className={styles.num}>{agent.hotLeads}</span>
                <span className={styles.num}>{agent.closedWon}</span>
                <span className={styles.commission}>{formatCurrency(agent.totalCommission)}</span>
              </Link>
            ))}
            {team.length === 0 && (
              <div className={styles.emptyState}>Nenhum agente encontrado.</div>
            )}
          </div>
        </Card>
      </div>
    </AppLayout>
  );
}
