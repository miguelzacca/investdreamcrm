import React from 'react';
import Link from 'next/link';
import { AppLayout } from '@/components/layout/AppLayout';
import { TemperatureBadge, StageBadge } from '@/components/ui/Badge';
import { AdsBanner } from '@/components/ui/AdsBanner';
import { getDashboardStats } from './actions';
import styles from './Dashboard.module.css';

const formatCurrency = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const formatCurrencyShort = (v: number) => {
  if (v >= 1_000_000) return `R$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `R$${(v / 1_000).toFixed(0)}K`;
  return formatCurrency(v);
};

const AVATAR_COLORS = [
  'linear-gradient(135deg,#667eea,#764ba2)',
  'linear-gradient(135deg,#f093fb,#f5576c)',
  'linear-gradient(135deg,#4facfe,#00f2fe)',
  'linear-gradient(135deg,#43e97b,#38f9d7)',
  'linear-gradient(135deg,#fa709a,#fee140)',
  'linear-gradient(135deg,#a18cd1,#fbc2eb)',
];

const getInitials = (name: string) =>
  name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();

const RANK_MEDALS = ['🥇', '🥈', '🥉'];

export default async function DashboardPage() {
  const stats = await getDashboardStats();

  /* ─────────────── ADMIN VIEW ─────────────── */
  if (stats.isAdmin) {
    const today = new Date();
    const monthName = today.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

    return (
      <AppLayout title="Dashboard — Visão Geral da Equipe">
        <div className={styles.page}>

          {/* ── Header Banner ── */}
          <div className={styles.pageHeader}>
            <div className={styles.pageHeaderLeft}>
              <h1 className={styles.pageTitle}>Visão Geral da Equipe</h1>
              <p className={styles.pageSubtitle}>Acompanhamento em tempo real · {monthName}</p>
            </div>
            <div className={styles.pageHeaderRight}>
              <span className={styles.headerBadge}>
                <span className={styles.headerBadgeDot} />
                Ao vivo
              </span>
              <Link href="/admin/metrics" className={styles.sectionLink} style={{ background: 'rgba(255,255,255,0.18)', color: '#fff', borderColor: 'rgba(255,255,255,0.25)' }}>
                Métricas avançadas →
              </Link>
            </div>
          </div>

          {/* ── KPI Cards ── */}
          <div className={styles.kpiGrid}>
            <div className={`${styles.kpiCard} ${styles.kpiPrimary}`}>
              <div className={styles.kpiIconWrap}>💰</div>
              <div className={styles.kpiContent}>
                <div className={styles.kpiValue}>{formatCurrencyShort(stats.commissionThisMonth)}</div>
                <div className={styles.kpiLabel}>Comissões da Equipe (Mês)</div>
              </div>
              <div className={styles.kpiTrend}>
                ↑ Mês atual
              </div>
            </div>

            <div className={`${styles.kpiCard} ${styles.kpiSuccess}`}>
              <div className={styles.kpiIconWrap}>🏠</div>
              <div className={styles.kpiContent}>
                <div className={styles.kpiValue}>{stats.dealsThisMonth}</div>
                <div className={styles.kpiLabel}>Negócios Este Mês</div>
              </div>
              <div className={styles.kpiTrend}>
                Total acumulado: {stats.totalDeals}
              </div>
            </div>

            <div className={`${styles.kpiCard} ${styles.kpiBlue}`}>
              <div className={styles.kpiIconWrap}>👥</div>
              <div className={styles.kpiContent}>
                <div className={styles.kpiValue}>{stats.activeLeads}</div>
                <div className={styles.kpiLabel}>Leads Ativos</div>
              </div>
              <div className={styles.kpiTrend}>
                Toda a equipe
              </div>
            </div>

            <div className={`${styles.kpiCard} ${styles.kpiWarm}`}>
              <div className={styles.kpiIconWrap}>🔥</div>
              <div className={styles.kpiContent}>
                <div className={styles.kpiValue}>{stats.hotLeads}</div>
                <div className={styles.kpiLabel}>Leads Quentes</div>
              </div>
              <div className={styles.kpiTrend}>
                Alta prioridade
              </div>
            </div>
          </div>

          {/* ── Ad Banner ── */}
          <AdsBanner />

          {/* ── Totais Acumulados ── */}
          <div>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>
                <span className={styles.sectionTitleIcon}>📊</span>
                Resultados Acumulados
              </h2>
            </div>
            <div className={styles.summaryRow}>
              <div className={styles.summaryContent}>
                <span className={styles.summaryIcon}>🤝</span>
                <div className={styles.summaryLabel}>Total de Negócios Fechados</div>
                <strong className={styles.summaryValue}>{stats.totalDeals}</strong>
              </div>
              <div className={styles.summaryContent}>
                <span className={styles.summaryIcon}>🏢</span>
                <div className={styles.summaryLabel}>Volume Bruto Alugado</div>
                <strong className={styles.summaryValue}>{formatCurrencyShort(stats.totalRentAmount)}</strong>
              </div>
              <div className={styles.summaryContent}>
                <span className={styles.summaryIcon}>💎</span>
                <div className={styles.summaryLabel}>Comissão Total Acumulada</div>
                <strong className={`${styles.summaryValue} ${styles.summaryGreen}`}>
                  {formatCurrencyShort(stats.totalCommission + stats.totalRecurringFee)}
                </strong>
              </div>
            </div>
          </div>

          {/* ── Previsões do Funil ── */}
          <div>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>
                <span className={styles.sectionTitleIcon}>📈</span>
                Previsões do Funil (Equipe)
              </h2>
            </div>
            <div className={styles.summaryRow}>
              <div className={styles.forecastCard}>
                <div className={styles.forecastLabel}>Previsão de Ganho Bruto</div>
                <div className={styles.forecastValue}>{formatCurrency(stats.expectedRentAmount)}</div>
                <div className={styles.forecastBadge}>📅 Visitas + Negociações em aberto</div>
              </div>
              <div className={styles.forecastCard}>
                <div className={styles.forecastLabel}>Previsão de Comissões</div>
                <div className={`${styles.forecastValue} ${styles.forecastBlue}`}>{formatCurrency(stats.expectedCommission)}</div>
                <div className={styles.forecastBadge}>💡 Estimativa do funil atual</div>
              </div>
              <div />
            </div>
          </div>

          {/* ── Ranking de Corretores ── */}
          {stats.agentRanking.length > 0 && (
            <div>
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>
                  <span className={styles.sectionTitleIcon}>🏆</span>
                  Ranking de Corretores
                </h2>
                <Link href="/admin/team" className={styles.sectionLink}>Ver equipe completa →</Link>
              </div>
              <div className={styles.tableCard}>
                <div className={styles.table}>
                  <div className={`${styles.tableHeader} ${styles.rankingHeader}`}>
                    <span>#</span>
                    <span>Corretor</span>
                    <span>Leads Ativos</span>
                    <span>Negócios</span>
                    <span>Comissão Total</span>
                  </div>
                  {stats.agentRanking.map((agent, index) => (
                    <div
                      key={agent.id}
                      className={`${styles.tableRow} ${styles.rankingRow} ${
                        index === 0 ? styles.rankRow1 : index === 1 ? styles.rankRow2 : index === 2 ? styles.rankRow3 : ''
                      }`}
                    >
                      <span className={styles.rankPosition}>
                        {index < 3 ? RANK_MEDALS[index] : `#${index + 1}`}
                      </span>
                      <span className={styles.rankNameCell}>
                        <span
                          className={styles.rankAvatar}
                          style={{ background: AVATAR_COLORS[index % AVATAR_COLORS.length] }}
                        >
                          {getInitials(agent.name)}
                        </span>
                        <span className={styles.leadName}>{agent.name}</span>
                      </span>
                      <span className={styles.rankStat}>{agent.activeLeads}</span>
                      <span className={styles.rankStat}>{agent.totalDeals}</span>
                      <span className={`${styles.rankStat} ${styles.summaryGreen}`}>
                        {formatCurrency(agent.totalCommission)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── Últimos Leads da Equipe ── */}
          <div>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>
                <span className={styles.sectionTitleIcon}>👤</span>
                Últimos Leads da Equipe
              </h2>
              <Link href="/admin/leads" className={styles.sectionLink}>Ver todos →</Link>
            </div>

            {stats.recentLeads.length === 0 ? (
              <div className={styles.tableCard}>
                <div className={styles.emptyState}>
                  <div className={styles.emptyIcon}>📭</div>
                  <p>Nenhum lead ainda.</p>
                  <Link href="/admin/leads" className={styles.emptyLink}>Ir para Leads para criar o primeiro →</Link>
                </div>
              </div>
            ) : (
              <div className={styles.tableCard}>
                <div className={styles.table}>
                  <div className={`${styles.tableHeader} ${styles.adminLeadHeader}`}>
                    <span>Nome</span>
                    <span>Corretor</span>
                    <span>Temperatura</span>
                    <span>Etapa</span>
                    <span></span>
                  </div>
                  {stats.recentLeads.map(lead => (
                    <div key={lead.id} className={`${styles.tableRow} ${styles.adminLeadRow}`}>
                      <span className={styles.leadName}>{lead.name}</span>
                      <span className={styles.leadPhone}>
                        {'agent' in lead && lead.agent ? (lead.agent as { name: string }).name : '—'}
                      </span>
                      <span><TemperatureBadge temperature={lead.temperature} /></span>
                      <span><StageBadge stage={lead.funnelStage} /></span>
                      <Link href={`/leads/${lead.id}`} className={styles.viewLink}>Ver</Link>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

        </div>
      </AppLayout>
    );
  }

  /* ─────────────── CORRETOR VIEW ─────────────── */
  const today = new Date();
  const monthName = today.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

  return (
    <AppLayout title="Meu Dashboard">
      <div className={styles.page}>

        {/* ── Header Banner ── */}
        <div className={styles.pageHeader}>
          <div className={styles.pageHeaderLeft}>
            <h1 className={styles.pageTitle}>Meu Dashboard</h1>
            <p className={styles.pageSubtitle}>Performance individual · {monthName}</p>
          </div>
          <div className={styles.pageHeaderRight}>
            <span className={styles.headerBadge}>
              <span className={styles.headerBadgeDot} />
              Atualizado agora
            </span>
          </div>
        </div>

        {/* ── KPI Cards ── */}
        <div className={styles.kpiGrid}>
          <div className={`${styles.kpiCard} ${styles.kpiPrimary}`}>
            <div className={styles.kpiIconWrap}>💰</div>
            <div className={styles.kpiContent}>
              <div className={styles.kpiValue}>{formatCurrencyShort(stats.commissionThisMonth)}</div>
              <div className={styles.kpiLabel}>Comissões (Este Mês)</div>
            </div>
            <div className={styles.kpiTrend}>Mês atual</div>
          </div>

          <div className={`${styles.kpiCard} ${styles.kpiSuccess}`}>
            <div className={styles.kpiIconWrap}>🏠</div>
            <div className={styles.kpiContent}>
              <div className={styles.kpiValue}>{stats.dealsThisMonth}</div>
              <div className={styles.kpiLabel}>Negócios Este Mês</div>
            </div>
            <div className={styles.kpiTrend}>Total: {stats.totalDeals} fechados</div>
          </div>

          <div className={`${styles.kpiCard} ${styles.kpiBlue}`}>
            <div className={styles.kpiIconWrap}>👥</div>
            <div className={styles.kpiContent}>
              <div className={styles.kpiValue}>{stats.activeLeads}</div>
              <div className={styles.kpiLabel}>Leads Ativos</div>
            </div>
            <div className={styles.kpiTrend}>Na sua carteira</div>
          </div>

          <div className={`${styles.kpiCard} ${styles.kpiWarm}`}>
            <div className={styles.kpiIconWrap}>🔥</div>
            <div className={styles.kpiContent}>
              <div className={styles.kpiValue}>{stats.hotLeads}</div>
              <div className={styles.kpiLabel}>Leads Quentes</div>
            </div>
            <div className={styles.kpiTrend}>Alta prioridade</div>
          </div>
        </div>

        {/* ── Ad Banner ── */}
        <AdsBanner />

        {/* ── Totais Acumulados ── */}
        <div>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>
              <span className={styles.sectionTitleIcon}>📊</span>
              Meus Resultados
            </h2>
          </div>
          <div className={styles.summaryRow}>
            <div className={styles.summaryContent}>
              <span className={styles.summaryIcon}>🤝</span>
              <div className={styles.summaryLabel}>Total de Negócios Fechados</div>
              <strong className={styles.summaryValue}>{stats.totalDeals}</strong>
            </div>
            <div className={styles.summaryContent}>
              <span className={styles.summaryIcon}>🏢</span>
              <div className={styles.summaryLabel}>Total Alugado Bruto</div>
              <strong className={styles.summaryValue}>{formatCurrencyShort(stats.totalRentAmount)}</strong>
            </div>
            <div className={styles.summaryContent}>
              <span className={styles.summaryIcon}>💎</span>
              <div className={styles.summaryLabel}>Comissão Total Acumulada</div>
              <strong className={`${styles.summaryValue} ${styles.summaryGreen}`}>
                {formatCurrencyShort(stats.totalCommission + stats.totalRecurringFee)}
              </strong>
            </div>
          </div>
        </div>

        {/* ── Previsões do Funil ── */}
        <div>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>
              <span className={styles.sectionTitleIcon}>📈</span>
              Minhas Previsões (Visitas e Negociações)
            </h2>
          </div>
          <div className={styles.summaryRow}>
            <div className={styles.forecastCard}>
              <div className={styles.forecastLabel}>Previsão de Ganho Bruto</div>
              <div className={styles.forecastValue}>{formatCurrency(stats.expectedRentAmount)}</div>
              <div className={styles.forecastBadge}>📅 Pipeline em aberto</div>
            </div>
            <div className={styles.forecastCard}>
              <div className={styles.forecastLabel}>Previsão de Comissões Pendentes</div>
              <div className={`${styles.forecastValue} ${styles.forecastBlue}`}>{formatCurrency(stats.expectedCommission)}</div>
              <div className={styles.forecastBadge}>💡 Estimativa do funil</div>
            </div>
            <div />
          </div>
        </div>

        {/* ── Últimos Leads ── */}
        <div>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>
              <span className={styles.sectionTitleIcon}>👤</span>
              Últimos Leads
            </h2>
            <Link href="/leads" className={styles.sectionLink}>Ver todos →</Link>
          </div>

          {stats.recentLeads.length === 0 ? (
            <div className={styles.tableCard}>
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>📭</div>
                <p>Nenhum lead ainda.</p>
                <Link href="/leads" className={styles.emptyLink}>Ir para Leads para criar o primeiro →</Link>
              </div>
            </div>
          ) : (
            <div className={styles.tableCard}>
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
            </div>
          )}
        </div>

      </div>
    </AppLayout>
  );
}
