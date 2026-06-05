import React from 'react';
import Link from 'next/link';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { TemperatureBadge, StageBadge } from '@/components/ui/Badge';
import { getDashboardStats } from './actions';
import styles from './Dashboard.module.css';

const formatCurrency = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export default async function DashboardPage() {
  const stats = await getDashboardStats();

  return (
    <AppLayout title="Dashboard">
      <div className={styles.page}>
        {/* KPI Cards */}
        <div className={styles.kpiGrid}>
          <div className={`${styles.kpiCard} ${styles.kpiPrimary}`}>
            <div className={styles.kpiIcon}>💰</div>
            <div className={styles.kpiValue}>{formatCurrency(stats.commissionThisMonth)}</div>
            <div className={styles.kpiLabel}>Comissões (Este Mês)</div>
          </div>

          <div className={`${styles.kpiCard} ${styles.kpiSuccess}`}>
            <div className={styles.kpiIcon}>🏠</div>
            <div className={styles.kpiValue}>{stats.dealsThisMonth}</div>
            <div className={styles.kpiLabel}>Negócios Este Mês</div>
          </div>

          <div className={`${styles.kpiCard} ${styles.kpiBlue}`}>
            <div className={styles.kpiIcon}>👥</div>
            <div className={styles.kpiValue}>{stats.activeLeads}</div>
            <div className={styles.kpiLabel}>Leads Ativos</div>
          </div>

          <div className={`${styles.kpiCard} ${styles.kpiWarm}`}>
            <div className={styles.kpiIcon}>🔥</div>
            <div className={styles.kpiValue}>{stats.hotLeads}</div>
            <div className={styles.kpiLabel}>Leads Quentes</div>
          </div>
        </div>

        {/* Total summary */}
        <div className={styles.summaryRow}>
          <Card className={styles.summaryCard}>
            <CardContent className={styles.summaryContent}>
              <span className={styles.summaryLabel}>Total de Negócios Fechados</span>
              <strong className={styles.summaryValue}>{stats.totalDeals}</strong>
            </CardContent>
          </Card>
          <Card className={styles.summaryCard}>
            <CardContent className={styles.summaryContent}>
              <span className={styles.summaryLabel}>Total Alugado Bruto</span>
              <strong className={`${styles.summaryValue}`}>
                {formatCurrency(stats.totalRentAmount)}
              </strong>
            </CardContent>
          </Card>
          <Card className={styles.summaryCard}>
            <CardContent className={styles.summaryContent}>
              <span className={styles.summaryLabel}>Comissão Total Acumulada (1º Mês + Taxas)</span>
              <strong className={`${styles.summaryValue} ${styles.summaryGreen}`}>
                {formatCurrency(stats.totalCommission + stats.totalRecurringFee)}
              </strong>
            </CardContent>
          </Card>
        </div>

        {/* Recent leads */}
        <div>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Últimos Leads</h2>
            <Link href="/leads" className={styles.sectionLink}>Ver todos →</Link>
          </div>

          {stats.recentLeads.length === 0 ? (
            <Card>
              <CardContent className={styles.emptyState}>
                <p>Nenhum lead ainda.</p>
                <Link href="/leads" className={styles.emptyLink}>Ir para Leads para criar o primeiro →</Link>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <div className={styles.table}>
                <div className={styles.tableHeader}>
                  <span>Nome</span>
                  <span>WhatsApp</span>
                  <span>Temperatura</span>
                  <span>Etapa</span>
                  <span></span>
                </div>
                {stats.recentLeads.map(lead => (
                  <div key={lead.id} className={styles.tableRow}>
                    <span className={styles.leadName}>{lead.name}</span>
                    <span className={styles.leadPhone}>{lead.whatsApp}</span>
                    <span><TemperatureBadge temperature={lead.temperature} /></span>
                    <span><StageBadge stage={lead.funnelStage} /></span>
                    <Link href={`/leads/${lead.id}`} className={styles.viewLink}>Ver</Link>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
