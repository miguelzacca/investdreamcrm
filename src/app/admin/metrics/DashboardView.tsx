"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, Variants, AnimatePresence } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend,
  ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area,
  RadialBarChart, RadialBar, ComposedChart
} from 'recharts';
import {
  DollarSign, Users, Target, Activity, Filter, TrendingUp, TrendingDown,
  PieChart as PieChartIcon, Award, Flame, Thermometer, BarChart2,
  UserX, UserCheck, ChevronUp, ChevronDown, Minus, Star, Trophy, Medal
} from 'lucide-react';
import { DashboardMetrics } from './actions';
import styles from './page.module.css';

interface DashboardViewProps {
  initialMetrics: DashboardMetrics;
  currentPeriod: string;
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

const formatCurrencyShort = (value: number) => {
  if (value >= 1_000_000) return `R$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `R$${(value / 1_000).toFixed(0)}K`;
  return formatCurrency(value);
};

// Animated counter hook
function useCountUp(target: number, duration = 1200) {
  const [value, setValue] = useState(0);
  const frameRef = useRef<number | null>(null);
  const startRef = useRef<number | null>(null);

  useEffect(() => {
    const animate = (timestamp: number) => {
      if (!startRef.current) startRef.current = timestamp;
      const progress = Math.min((timestamp - startRef.current) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3); // cubic ease-out
      setValue(Math.round(target * ease));
      if (progress < 1) frameRef.current = requestAnimationFrame(animate);
    };
    frameRef.current = requestAnimationFrame(animate);
    return () => { if (frameRef.current) cancelAnimationFrame(frameRef.current); };
  }, [target, duration]);

  return value;
}

function AnimatedNumber({ value, format = 'number' }: { value: number; format?: 'number' | 'currency' | 'percent' }) {
  const count = useCountUp(value);
  if (format === 'currency') return <>{formatCurrencyShort(count)}</>;
  if (format === 'percent') return <>{count.toFixed(1)}%</>;
  return <>{count.toLocaleString('pt-BR')}</>;
}

const getInitials = (name: string) =>
  name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();

const AVATAR_COLORS = [
  'linear-gradient(135deg, #667eea, #764ba2)',
  'linear-gradient(135deg, #f093fb, #f5576c)',
  'linear-gradient(135deg, #4facfe, #00f2fe)',
  'linear-gradient(135deg, #43e97b, #38f9d7)',
  'linear-gradient(135deg, #fa709a, #fee140)',
  'linear-gradient(135deg, #a18cd1, #fbc2eb)',
];

const rankIcon = (index: number) => {
  if (index === 0) return <Trophy size={16} style={{ color: '#f59e0b' }} />;
  if (index === 1) return <Medal size={16} style={{ color: '#94a3b8' }} />;
  if (index === 2) return <Medal size={16} style={{ color: '#cd7c3f' }} />;
  return <span style={{ color: 'var(--text-tertiary)', fontWeight: 700, fontSize: '0.85rem' }}>#{index + 1}</span>;
};

// Custom recharts tooltip style
const tooltipStyle = {
  backgroundColor: 'var(--bg-card)',
  borderColor: 'var(--border)',
  borderRadius: '12px',
  boxShadow: '0 10px 30px rgba(0,0,0,0.12)',
  fontSize: '13px',
};

export default function DashboardView({ initialMetrics, currentPeriod }: DashboardViewProps) {
  const router = useRouter();
  const [isNavigating, setIsNavigating] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'brokers' | 'trends'>('overview');
  const metrics = initialMetrics;

  const handlePeriodChange = (period: string) => {
    setIsNavigating(true);
    router.push(`?period=${period}`);
    setTimeout(() => setIsNavigating(false), 600);
  };

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.08 } }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 24 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 260, damping: 22 } }
  };

  const conversionRate = ((metrics.totalDeals / Math.max(metrics.totalLeads, 1)) * 100);

  // Derived data
  const temperatureData = metrics.temperatureMetrics.filter(t => t.value > 0);

  const funnelData = [
    { stage: 'Total', count: metrics.conversionMetrics.total, fill: '#8b5cf6' },
    { stage: 'Visita', count: metrics.conversionMetrics.visited, fill: '#3b82f6' },
    { stage: 'Negociação', count: metrics.conversionMetrics.negotiated, fill: '#f59e0b' },
    { stage: 'Fechado', count: metrics.conversionMetrics.closed, fill: '#10b981' },
  ];

  // Monthly with commission estimate (10% of revenue)
  const monthlyWithCommission = metrics.monthlyTrends.map(m => ({
    ...m,
    commission: m.revenue * 0.1,
    shortMonth: m.month.split(' ')[0],
  }));

  const maxCommission = Math.max(...metrics.brokerPerformance.map(b => b.totalCommission), 1);

  const TEMP_COLORS: Record<string, string> = {
    'Quente': '#ef4444',
    'Morno': '#f59e0b',
    'Frio': '#3b82f6',
  };

  return (
    <motion.div
      className={styles.page}
      variants={containerVariants}
      initial="hidden"
      animate="show"
      style={{ opacity: isNavigating ? 0.5 : 1, transition: 'opacity 0.3s ease' }}
    >
      {/* ── Header ── */}
      <motion.div className={styles.header} variants={itemVariants}>
        <div>
          <h1 className={styles.title}>Centro de Inteligência</h1>
          <p className={styles.subtitle}>Análise completa de desempenho e resultados</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap', position: 'relative', zIndex: 1 }}>
          {/* Tab pills */}
          <div className={styles.tabGroup}>
            {(['overview', 'brokers', 'trends'] as const).map(tab => (
              <button
                key={tab}
                className={`${styles.tabBtn} ${activeTab === tab ? styles.tabBtnActive : ''}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab === 'overview' ? '📊 Visão Geral' : tab === 'brokers' ? '👥 Corretores' : '📈 Tendências'}
              </button>
            ))}
          </div>
          {/* Period filter */}
          <div className={styles.periodFilter}>
            <Filter size={13} style={{ color: 'rgba(255,255,255,0.45)', margin: '0 0.2rem' }} />
            {[
              { key: '30', label: '30d' },
              { key: '90', label: '90d' },
              { key: '365', label: '1 Ano' },
              { key: 'all', label: 'Geral' },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => handlePeriodChange(key)}
                className={`${styles.filterButton} ${currentPeriod === key ? styles.filterButtonActive : ''}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* ── KPI Cards ── */}
      <motion.div className={styles.kpiGrid} variants={itemVariants}>
        {/* Volume Negociado */}
        <div className={`${styles.kpiCard} ${styles.kpiCardPurple}`}>
          <div className={styles.kpiGlow} />
          <div className={styles.kpiHeader}>
            <span className={styles.kpiTitle}>Volume Negociado</span>
            <div className={`${styles.kpiIconWrap} ${styles.kpiIconPurple}`}>
              <Activity size={18} />
            </div>
          </div>
          <div className={styles.kpiValue}>
            <AnimatedNumber value={metrics.totalRentAmount} format="currency" />
          </div>
          <div className={styles.kpiFooter}>
            <TrendingUp size={13} style={{ color: 'var(--success)' }} />
            <span>Bruto total do período</span>
          </div>
        </div>

        {/* Comissões */}
        <div className={`${styles.kpiCard} ${styles.kpiCardGreen}`}>
          <div className={styles.kpiGlow} />
          <div className={styles.kpiHeader}>
            <span className={styles.kpiTitle}>Comissões e Taxas</span>
            <div className={`${styles.kpiIconWrap} ${styles.kpiIconGreen}`}>
              <DollarSign size={18} />
            </div>
          </div>
          <div className={`${styles.kpiValue} ${styles.textGreen}`}>
            <AnimatedNumber value={metrics.totalCommission} format="currency" />
          </div>
          <div className={styles.kpiFooter}>
            <span>Faturamento líquido agência</span>
          </div>
        </div>

        {/* Conversões */}
        <div className={`${styles.kpiCard} ${styles.kpiCardBlue}`}>
          <div className={styles.kpiGlow} />
          <div className={styles.kpiHeader}>
            <span className={styles.kpiTitle}>Conversões de Venda</span>
            <div className={`${styles.kpiIconWrap} ${styles.kpiIconBlue}`}>
              <Target size={18} />
            </div>
          </div>
          <div className={styles.kpiValue}>
            <AnimatedNumber value={metrics.totalDeals} />
          </div>
          <div className={styles.kpiFooter}>
            <div className={styles.conversionBadge}>
              {conversionRate.toFixed(1)}% taxa geral
            </div>
          </div>
        </div>

        {/* Saúde dos Leads */}
        <div className={`${styles.kpiCard} ${styles.kpiCardOrange}`}>
          <div className={styles.kpiGlow} />
          <div className={styles.kpiHeader}>
            <span className={styles.kpiTitle}>Saúde dos Leads</span>
            <div className={`${styles.kpiIconWrap} ${styles.kpiIconOrange}`}>
              <Users size={18} />
            </div>
          </div>
          <div className={styles.kpiValue}>
            <AnimatedNumber value={metrics.totalActiveLeads} />
          </div>
          <div className={styles.kpiFooter}>
            <span className={styles.textRed}>{metrics.totalArchivedLeads} perdidos</span>
            <span style={{ color: 'var(--text-tertiary)' }}>&nbsp;·&nbsp;</span>
            <span>{metrics.totalLeads} total</span>
          </div>
        </div>
      </motion.div>

      <AnimatePresence mode="wait">
        {/* ══════════ TAB: OVERVIEW ══════════ */}
        {activeTab === 'overview' && (
          <motion.div
            key="overview"
            variants={containerVariants}
            initial="hidden"
            animate="show"
            exit={{ opacity: 0, y: -10 }}
            style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}
          >
            {/* Row 1: Funnel + Sources + Temperature */}
            <motion.div className={`${styles.chartsGrid} ${styles.threeCol}`} variants={itemVariants}>

              {/* Funnel */}
              <div className={`${styles.chartCard} ${styles.chartCardSpan2}`}>
                <h3 className={styles.chartTitle}>
                  <span className={styles.chartTitleIcon} style={{ background: 'rgba(79,70,229,0.1)' }}>
                    <Filter size={15} className={styles.textPurple} />
                  </span>
                  Funil Real de Conversão
                </h3>
                <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', flex: 1 }}>
                  <div style={{ flex: 2, minWidth: 220, minHeight: 240 }}>
                    <ResponsiveContainer width="100%" height={240}>
                      <BarChart data={funnelData} layout="vertical" barSize={22}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border)" />
                        <XAxis type="number" stroke="var(--text-secondary)" fontSize={11} tickLine={false} axisLine={false} />
                        <YAxis type="category" dataKey="stage" stroke="var(--text-secondary)" fontSize={12} tickLine={false} axisLine={false} width={70} />
                        <RechartsTooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(0,0,0,0.04)' }} />
                        <Bar dataKey="count" name="Leads" radius={[0, 6, 6, 0]}>
                          {funnelData.map((entry, i) => (
                            <Cell key={i} fill={entry.fill} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className={styles.funnelStats}>
                    {[
                      { label: 'Leads → Visita', val: metrics.conversionMetrics.visited, of: metrics.conversionMetrics.total, color: '#8b5cf6' },
                      { label: 'Visita → Negociação', val: metrics.conversionMetrics.negotiated, of: metrics.conversionMetrics.visited, color: '#3b82f6' },
                      { label: 'Neg. → Fechado', val: metrics.conversionMetrics.closed, of: metrics.conversionMetrics.negotiated, color: '#10b981' },
                    ].map(({ label, val, of: total, color }) => {
                      const pct = ((val / Math.max(total, 1)) * 100);
                      return (
                        <div key={label} className={styles.funnelRow}>
                          <span className={styles.funnelLabel}>{label}</span>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 110 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 700 }}>
                              <span>{val}</span>
                              <span style={{ color }}>{pct.toFixed(0)}%</span>
                            </div>
                            <div className={styles.progressBar}>
                              <div className={styles.progressFill} style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: color }} />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Lead Sources Pie */}
              <div className={styles.chartCard}>
                <h3 className={styles.chartTitle}>
                  <span className={styles.chartTitleIcon} style={{ background: 'rgba(8,145,178,0.1)' }}>
                    <PieChartIcon size={15} className={styles.textBlue} />
                  </span>
                  Origem dos Leads
                </h3>
                <div style={{ flex: 1, minHeight: 200 }}>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={metrics.sourceMetrics}
                        cx="50%" cy="45%"
                        innerRadius={55} outerRadius={78}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {metrics.sourceMetrics.map((entry, i) => (
                          <Cell key={i} fill={entry.fill} stroke="none" />
                        ))}
                      </Pie>
                      <RechartsTooltip contentStyle={tooltipStyle} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className={styles.legendList}>
                  {metrics.sourceMetrics.slice(0, 5).map((s, i) => (
                    <div key={i} className={styles.legendItem}>
                      <div className={styles.legendDot} style={{ backgroundColor: s.fill }} />
                      <span className={styles.legendLabel}>{s.name}</span>
                      <span className={styles.legendVal}>{s.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Row 2: Temperature + Monthly Revenue */}
            <motion.div className={`${styles.chartsGrid} ${styles.threeCol}`} variants={itemVariants}>
              {/* Temperature Donut */}
              <div className={styles.chartCard}>
                <h3 className={styles.chartTitle}>
                  <span className={styles.chartTitleIcon} style={{ background: 'rgba(217,119,6,0.1)' }}>
                    <Thermometer size={15} className={styles.textOrange} />
                  </span>
                  Temperatura dos Leads
                </h3>
                <div style={{ flex: 1, minHeight: 180 }}>
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <Pie
                        data={temperatureData.length ? temperatureData : [{ name: 'Sem dados', value: 1, fill: 'var(--border)' }]}
                        cx="50%" cy="50%"
                        innerRadius={50} outerRadius={70}
                        paddingAngle={3}
                        dataKey="value"
                        startAngle={90} endAngle={-270}
                      >
                        {(temperatureData.length ? temperatureData : [{ name: 'Sem dados', value: 1 }]).map((entry, i) => (
                          <Cell key={i} fill={TEMP_COLORS[entry.name] ?? 'var(--border)'} stroke="none" />
                        ))}
                      </Pie>
                      <RechartsTooltip contentStyle={tooltipStyle} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className={styles.legendList}>
                  {metrics.temperatureMetrics.map((t, i) => (
                    <div key={i} className={styles.legendItem}>
                      <div className={styles.legendDot} style={{ backgroundColor: TEMP_COLORS[t.name] || '#ccc' }} />
                      <span className={styles.legendLabel}>
                        {t.name === 'Quente' ? '🔥' : t.name === 'Morno' ? '☀️' : '❄️'} {t.name}
                      </span>
                      <span className={styles.legendVal}>{t.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Monthly Revenue */}
              <div className={`${styles.chartCard} ${styles.chartCardSpan2}`}>
                <h3 className={styles.chartTitle}>
                  <span className={styles.chartTitleIcon} style={{ background: 'rgba(5,150,105,0.1)' }}>
                    <TrendingUp size={15} className={styles.textGreen} />
                  </span>
                  Receita Mensal (Últimos 6 Meses)
                </h3>
                <div style={{ flex: 1, minHeight: 240 }}>
                  <ResponsiveContainer width="100%" height={240}>
                    <ComposedChart data={monthlyWithCommission}>
                      <defs>
                        <linearGradient id="gradRevenue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                      <XAxis dataKey="shortMonth" stroke="var(--text-secondary)" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis stroke="var(--text-secondary)" fontSize={11} tickLine={false} axisLine={false}
                        tickFormatter={v => formatCurrencyShort(v)} width={65} />
                      <RechartsTooltip
                        formatter={(value: any, name?: any) => [formatCurrency(Number(value)), name === 'revenue' ? 'Volume Bruto' : 'Comissão Est.']}
                        contentStyle={tooltipStyle}
                      />
                      <Legend formatter={(val) => val === 'revenue' ? 'Volume Bruto' : 'Comissão Est.'} />
                      <Area type="monotone" dataKey="revenue" fill="url(#gradRevenue)" stroke="#10b981" strokeWidth={3} dot={false} />
                      <Bar dataKey="commission" name="commission" fill="#8b5cf6" opacity={0.7} radius={[4, 4, 0, 0]} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* ══════════ TAB: BROKERS ══════════ */}
        {activeTab === 'brokers' && (
          <motion.div
            key="brokers"
            variants={containerVariants}
            initial="hidden"
            animate="show"
            exit={{ opacity: 0, y: -10 }}
            style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}
          >
            {/* Broker scorecards */}
            <motion.div className={styles.brokerCardsGrid} variants={itemVariants}>
              {metrics.brokerPerformance.slice(0, 3).map((broker, i) => (
                <div key={broker.id} className={`${styles.brokerScoreCard} ${i === 0 ? styles.topBroker : ''}`}>
                  <div className={styles.brokerCardRank}>{rankIcon(i)}</div>
                  <div className={styles.brokerCardAvatar} style={{ background: AVATAR_COLORS[i % AVATAR_COLORS.length] }}>
                    {getInitials(broker.name)}
                  </div>
                  <div className={styles.brokerCardName}>{broker.name}</div>
                  <div className={styles.brokerCardCommission}>{formatCurrency(broker.totalCommission)}</div>
                  <div className={styles.brokerCardMeta}>
                    <span>{broker.closedDeals} fechados</span>
                    <span>·</span>
                    <span>{broker.conversionRate.toFixed(1)}% conv.</span>
                  </div>
                </div>
              ))}
            </motion.div>

            {/* Full broker table */}
            <motion.div className={styles.tableCard} variants={itemVariants}>
              <h3 className={styles.chartTitle} style={{ marginBottom: '1.25rem' }}>
                <span className={styles.chartTitleIcon} style={{ background: 'rgba(8,145,178,0.1)' }}>
                  <Users size={15} className={styles.textBlue} />
                </span>
                Desempenho Detalhado por Corretor
              </h3>
              <div style={{ overflowX: 'auto' }}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Corretor</th>
                      <th>Leads</th>
                      <th>Status</th>
                      <th>Eficiência (Visita→Fechado)</th>
                      <th>Ticket Médio</th>
                      <th>Comissão Gerada</th>
                    </tr>
                  </thead>
                  <tbody>
                    {metrics.brokerPerformance.map((broker, i) => {
                      const relativeScore = (broker.totalCommission / maxCommission) * 100;
                      return (
                        <tr key={broker.id}>
                          <td style={{ width: 48 }}>{rankIcon(i)}</td>
                          <td>
                            <div className={styles.agentName}>
                              <div
                                className={styles.agentAvatar}
                                style={{ background: AVATAR_COLORS[i % AVATAR_COLORS.length] }}
                              >
                                {getInitials(broker.name)}
                              </div>
                              <span>{broker.name}</span>
                            </div>
                          </td>
                          <td>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                              <span style={{ fontWeight: 700 }}>{broker.totalLeadsReceived}</span>
                              <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{broker.visitedLeads} visitas</span>
                            </div>
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                              <span className={styles.badge} style={{ color: '#3b82f6', background: 'rgba(59,130,246,0.1)' }}>
                                <UserCheck size={11} /> {broker.activeLeads}
                              </span>
                              <span className={styles.badge} style={{ color: '#ef4444', background: 'rgba(239,68,68,0.1)' }}>
                                <UserX size={11} /> {broker.archivedLeads}
                              </span>
                            </div>
                          </td>
                          <td>
                            <div className={styles.progressBarContainer} style={{ width: 130 }}>
                              <div className={styles.progressText}>
                                <span style={{ fontWeight: 700 }}>{broker.conversionRateVisitToClosed.toFixed(1)}%</span>
                                <span className={styles.textGreen}>{broker.closedDeals} ✓</span>
                              </div>
                              <div className={styles.progressBar}>
                                <div
                                  className={styles.progressFill}
                                  style={{
                                    width: `${Math.min(broker.conversionRateVisitToClosed, 100)}%`,
                                    backgroundColor: broker.conversionRateVisitToClosed >= 20 ? '#10b981'
                                      : broker.conversionRateVisitToClosed > 5 ? '#f59e0b' : '#ef4444'
                                  }}
                                />
                              </div>
                            </div>
                          </td>
                          <td style={{ fontWeight: 600 }}>{formatCurrency(broker.avgRentVolume)}</td>
                          <td>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                              <span style={{ color: '#10b981', fontWeight: 800, fontSize: '1rem' }}>
                                {formatCurrency(broker.totalCommission)}
                              </span>
                              <div className={styles.progressBar} style={{ height: 4 }}>
                                <div className={styles.progressFill} style={{ width: `${relativeScore}%`, backgroundColor: '#10b981' }} />
                              </div>
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                Vol: {formatCurrencyShort(broker.totalRentVolume)}
                              </span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {metrics.brokerPerformance.length === 0 && (
                      <tr>
                        <td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '3rem' }}>
                          Nenhum dado disponível no período selecionado.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </motion.div>

            {/* Broker comparison bar chart */}
            {metrics.brokerPerformance.length > 0 && (
              <motion.div className={styles.chartCard} variants={itemVariants}>
                <h3 className={styles.chartTitle}>
                  <span className={styles.chartTitleIcon} style={{ background: 'rgba(79,70,229,0.1)' }}>
                    <BarChart2 size={15} className={styles.textPurple} />
                  </span>
                  Comparativo de Comissão por Corretor
                </h3>
                <div style={{ minHeight: 260 }}>
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={metrics.brokerPerformance} layout="vertical" barSize={18}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border)" />
                      <XAxis type="number" stroke="var(--text-secondary)" fontSize={11} tickLine={false} axisLine={false}
                        tickFormatter={v => formatCurrencyShort(v)} />
                      <YAxis type="category" dataKey="name" stroke="var(--text-secondary)" fontSize={12} tickLine={false} axisLine={false} width={100} />
                      <RechartsTooltip
                        formatter={(v: any) => [formatCurrency(Number(v)), 'Comissão']}
                        contentStyle={tooltipStyle}
                        cursor={{ fill: 'rgba(0,0,0,0.04)' }}
                      />
                      <Bar dataKey="totalCommission" name="Comissão" radius={[0, 6, 6, 0]}>
                        {metrics.brokerPerformance.map((_, i) => (
                          <Cell key={i} fill={i === 0 ? '#f59e0b' : i === 1 ? '#94a3b8' : i === 2 ? '#cd7c3f' : '#8b5cf6'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}

        {/* ══════════ TAB: TRENDS ══════════ */}
        {activeTab === 'trends' && (
          <motion.div
            key="trends"
            variants={containerVariants}
            initial="hidden"
            animate="show"
            exit={{ opacity: 0, y: -10 }}
            style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}
          >
            {/* Revenue trend */}
            <motion.div className={styles.chartCard} variants={itemVariants}>
              <h3 className={styles.chartTitle}>
                <span className={styles.chartTitleIcon} style={{ background: 'rgba(5,150,105,0.1)' }}>
                  <TrendingUp size={15} className={styles.textGreen} />
                </span>
                Evolução de Volume Bruto (6 meses)
              </h3>
              <div style={{ minHeight: 280 }}>
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={monthlyWithCommission}>
                    <defs>
                      <linearGradient id="gradRev2" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                    <XAxis dataKey="shortMonth" stroke="var(--text-secondary)" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="var(--text-secondary)" fontSize={11} tickLine={false} axisLine={false}
                      tickFormatter={v => formatCurrencyShort(v)} width={65} />
                    <RechartsTooltip
                      formatter={(v: any) => [formatCurrency(Number(v)), 'Volume']}
                      contentStyle={tooltipStyle}
                    />
                    <Area type="monotone" dataKey="revenue" name="Volume" stroke="#10b981" strokeWidth={3}
                      fill="url(#gradRev2)" dot={{ r: 5, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }}
                      activeDot={{ r: 8 }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </motion.div>

            {/* Deals trend */}
            <motion.div className={styles.chartCard} variants={itemVariants}>
              <h3 className={styles.chartTitle}>
                <span className={styles.chartTitleIcon} style={{ background: 'rgba(217,119,6,0.1)' }}>
                  <Target size={15} className={styles.textOrange} />
                </span>
                Contratos Fechados por Mês
              </h3>
              <div style={{ minHeight: 260 }}>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={monthlyWithCommission}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                    <XAxis dataKey="shortMonth" stroke="var(--text-secondary)" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="var(--text-secondary)" fontSize={12} tickLine={false} axisLine={false} />
                    <RechartsTooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(0,0,0,0.04)' }} />
                    <Bar dataKey="deals" name="Contratos" radius={[6, 6, 0, 0]}>
                      {monthlyWithCommission.map((_, i) => (
                        <Cell key={i} fill={`hsl(${220 + i * 20}, 80%, ${55 + i * 3}%)`} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </motion.div>

            {/* Funnel progression line */}
            <motion.div className={styles.chartCard} variants={itemVariants}>
              <h3 className={styles.chartTitle}>
                <span className={styles.chartTitleIcon} style={{ background: 'rgba(79,70,229,0.1)' }}>
                  <Activity size={15} className={styles.textPurple} />
                </span>
                Snapshot do Funil Atual
              </h3>
              <div style={{ minHeight: 240 }}>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={metrics.funnelMetrics} barSize={40}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                    <XAxis dataKey="stage" stroke="var(--text-secondary)" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="var(--text-secondary)" fontSize={12} tickLine={false} axisLine={false} />
                    <RechartsTooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(0,0,0,0.04)' }} />
                    <Bar dataKey="count" name="Leads" radius={[6, 6, 0, 0]}>
                      {metrics.funnelMetrics.map((_, i) => (
                        <Cell key={i} fill={['#8b5cf6', '#3b82f6', '#f59e0b', '#10b981', '#ef4444'][i % 5]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
