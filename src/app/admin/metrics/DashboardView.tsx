"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import { DollarSign, Users, Target, Activity, Filter, ArrowRight, UserX, UserCheck, TrendingUp, PieChart as PieChartIcon } from 'lucide-react';
import { DashboardMetrics } from './actions';
import styles from './page.module.css';

interface DashboardViewProps {
  initialMetrics: DashboardMetrics;
  currentPeriod: string;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

export default function DashboardView({ initialMetrics, currentPeriod }: DashboardViewProps) {
  const router = useRouter();
  const [isNavigating, setIsNavigating] = useState(false);
  const metrics = initialMetrics;

  const handlePeriodChange = (period: string) => {
    setIsNavigating(true);
    router.push(`?period=${period}`);
    // Next.js transition will remove isNavigating when done implicitly or we can just let it be fast
    setTimeout(() => setIsNavigating(false), 500); 
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
  };

  const getInitials = (name: string) => name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();

  return (
    <motion.div 
      className={styles.page}
      variants={containerVariants}
      initial="hidden"
      animate="show"
      style={{ opacity: isNavigating ? 0.6 : 1, transition: 'opacity 0.3s ease' }}
    >
      <motion.div className={styles.header} variants={itemVariants}>
        <h1 className={styles.title}>Centro de Inteligência</h1>
        <div className={styles.periodFilter}>
          <Filter size={16} className="text-muted ml-2" />
          <button 
            onClick={() => handlePeriodChange('30')}
            className={`${styles.filterButton} ${currentPeriod === '30' ? styles.filterButtonActive : ''}`}
          >
            30 Dias
          </button>
          <button 
            onClick={() => handlePeriodChange('90')}
            className={`${styles.filterButton} ${currentPeriod === '90' ? styles.filterButtonActive : ''}`}
          >
            90 Dias
          </button>
          <button 
            onClick={() => handlePeriodChange('365')}
            className={`${styles.filterButton} ${currentPeriod === '365' ? styles.filterButtonActive : ''}`}
          >
            Este Ano
          </button>
          <button 
            onClick={() => handlePeriodChange('all')}
            className={`${styles.filterButton} ${currentPeriod === 'all' ? styles.filterButtonActive : ''}`}
          >
            Geral
          </button>
        </div>
      </motion.div>

      {/* KPI Cards */}
      <motion.div className={styles.kpiGrid} variants={itemVariants}>
        <div className={styles.kpiCard}>
          <div className={styles.kpiHeader}>
            <span className={styles.kpiTitle}>Volume Negociado</span>
            <div className={styles.kpiIcon}><Activity size={20} className={styles.textPurple} /></div>
          </div>
          <div className={styles.kpiValue}>{formatCurrency(metrics.totalRentAmount)}</div>
          <div className={styles.kpiSubtitle}>
            <TrendingUp size={14} className={styles.textGreen} />
            Bruto Total do período
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiHeader}>
            <span className={styles.kpiTitle}>Comissões e Taxas</span>
            <div className={styles.kpiIcon}><DollarSign size={20} className={styles.textGreen} /></div>
          </div>
          <div className={`${styles.kpiValue} ${styles.textGreen}`}>{formatCurrency(metrics.totalCommission)}</div>
          <div className={styles.kpiSubtitle}>
            Faturamento líquido agência
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiHeader}>
            <span className={styles.kpiTitle}>Conversões de Venda</span>
            <div className={styles.kpiIcon}><Target size={20} className={styles.textBlue} /></div>
          </div>
          <div className={styles.kpiValue}>{metrics.totalDeals}</div>
          <div className={styles.kpiSubtitle}>
            Taxa Conversão Geral: {((metrics.totalDeals / Math.max(metrics.totalLeads, 1)) * 100).toFixed(1)}%
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiHeader}>
            <span className={styles.kpiTitle}>Saúde dos Leads</span>
            <div className={styles.kpiIcon}><Users size={20} className={styles.textOrange} /></div>
          </div>
          <div className={styles.kpiValue}>{metrics.totalActiveLeads}</div>
          <div className={styles.kpiSubtitle}>
            <span className={styles.textRed}>{metrics.totalArchivedLeads} perdidos</span> no período
          </div>
        </div>
      </motion.div>

      {/* Charts Row 1: Funnel & Sources */}
      <motion.div className={styles.chartsGrid} variants={itemVariants}>
        {/* Real Funnel Conversions */}
        <div className={`${styles.chartCard} ${styles.chartCardWide}`}>
          <h3 className={styles.chartTitle}><Filter size={20} className={styles.textPurple} /> Funil Real de Conversão (Considerando Histórico)</h3>
          <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
            <div className={styles.chartContainer} style={{ flex: 2, minWidth: '300px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={[
                  { stage: 'Total Leads', count: metrics.conversionMetrics.total },
                  { stage: 'Visitas', count: metrics.conversionMetrics.visited },
                  { stage: 'Negociações', count: metrics.conversionMetrics.negotiated },
                  { stage: 'Fechados', count: metrics.conversionMetrics.closed },
                ]} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                  <XAxis dataKey="stage" stroke="var(--text-secondary)" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--text-secondary)" fontSize={12} tickLine={false} axisLine={false} />
                  <RechartsTooltip contentStyle={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                  <Area type="monotone" dataKey="count" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorCount)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className={styles.funnelStats} style={{ flex: 1, minWidth: '200px' }}>
              <div className={styles.funnelRow}>
                <span className={styles.funnelLabel}>Leads para Visita</span>
                <div>
                  <span className={styles.funnelValue}>{metrics.conversionMetrics.visited}</span>
                  <span className={styles.funnelPercent}>{((metrics.conversionMetrics.visited / Math.max(metrics.conversionMetrics.total, 1)) * 100).toFixed(0)}%</span>
                </div>
              </div>
              <div className={styles.funnelRow}>
                <span className={styles.funnelLabel}>Visita para Negociação</span>
                <div>
                  <span className={styles.funnelValue}>{metrics.conversionMetrics.negotiated}</span>
                  <span className={styles.funnelPercent}>{((metrics.conversionMetrics.negotiated / Math.max(metrics.conversionMetrics.visited, 1)) * 100).toFixed(0)}%</span>
                </div>
              </div>
              <div className={styles.funnelRow}>
                <span className={styles.funnelLabel}>Negociação para Fechado</span>
                <div>
                  <span className={styles.funnelValue}>{metrics.conversionMetrics.closed}</span>
                  <span className={styles.funnelPercent}>{((metrics.conversionMetrics.closed / Math.max(metrics.conversionMetrics.negotiated, 1)) * 100).toFixed(0)}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Lead Sources */}
        <div className={styles.chartCard}>
          <h3 className={styles.chartTitle}><PieChartIcon size={20} className={styles.textBlue} /> Origem dos Leads</h3>
          <div className={styles.chartContainer}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={metrics.sourceMetrics}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {metrics.sourceMetrics.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <RechartsTooltip contentStyle={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)', borderRadius: '12px' }} />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </motion.div>

      {/* Charts Row 2 */}
      <motion.div className={styles.chartsGrid} variants={itemVariants} style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
        {/* Monthly Revenue Trend */}
        <div className={styles.chartCard}>
          <h3 className={styles.chartTitle}><TrendingUp size={20} className={styles.textGreen} /> Faturamento Agência (Últimos 6 Meses)</h3>
          <div className={styles.chartContainer}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={metrics.monthlyTrends}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis dataKey="month" stroke="var(--text-secondary)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis 
                  stroke="var(--text-secondary)" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false}
                  tickFormatter={(value) => `R$${(value/1000).toFixed(0)}k`}
                />
                <RechartsTooltip 
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)', borderRadius: '12px' }}
                />
                <Legend />
                <Line type="monotone" dataKey="revenue" name="Volume Alugado Bruto" stroke="#10b981" strokeWidth={4} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Deals Trend */}
        <div className={styles.chartCard}>
          <h3 className={styles.chartTitle}><Target size={20} className={styles.textOrange} /> Contratos Fechados (Últimos 6 Meses)</h3>
          <div className={styles.chartContainer}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={metrics.monthlyTrends}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis dataKey="month" stroke="var(--text-secondary)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--text-secondary)" fontSize={12} tickLine={false} axisLine={false} />
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)', borderRadius: '12px' }}
                  cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                />
                <Bar dataKey="deals" name="Negócios" fill="#f59e0b" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </motion.div>

      {/* Deep Broker Performance Table */}
      <motion.div className={styles.tableCard} variants={itemVariants}>
        <h3 className={styles.chartTitle} style={{ marginBottom: '1.5rem' }}><Users size={20} className={styles.textBlue} /> Desempenho Profundo por Corretor</h3>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Corretor</th>
              <th>Carga (Leads)</th>
              <th>Status Atual</th>
              <th>Eficiência (Visita &rarr; Fechado)</th>
              <th>Tíquete Médio</th>
              <th>Comissão Gerada</th>
            </tr>
          </thead>
          <tbody>
            {metrics.brokerPerformance.map((broker) => (
              <tr key={broker.id}>
                <td>
                  <div className={styles.agentName}>
                    <div className={styles.agentAvatar}>{getInitials(broker.name)}</div>
                    {broker.name}
                  </div>
                </td>
                <td>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                    <span style={{ fontWeight: 600 }}>{broker.totalLeadsReceived} Recebidos</span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{broker.visitedLeads} levaram à visita</span>
                  </div>
                </td>
                <td>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <span className={styles.badge} style={{ color: '#3b82f6', backgroundColor: 'rgba(59, 130, 246, 0.1)' }}>
                      <UserCheck size={12} style={{ marginRight: '4px' }} /> {broker.activeLeads} Ativos
                    </span>
                    <span className={styles.badge} style={{ color: '#ef4444', backgroundColor: 'rgba(239, 68, 68, 0.1)' }}>
                      <UserX size={12} style={{ marginRight: '4px' }} /> {broker.archivedLeads} Perdidos
                    </span>
                  </div>
                </td>
                <td>
                  <div className={styles.progressBarContainer}>
                    <div className={styles.progressText}>
                      <span>{broker.conversionRateVisitToClosed.toFixed(1)}%</span>
                      <span className={styles.textGreen}>{broker.closedDeals} fechados</span>
                    </div>
                    <div className={styles.progressBar}>
                      <div 
                        className={styles.progressFill} 
                        style={{ 
                          width: `${Math.min(broker.conversionRateVisitToClosed, 100)}%`, 
                          backgroundColor: broker.conversionRateVisitToClosed >= 20 ? '#10b981' : (broker.conversionRateVisitToClosed > 5 ? '#f59e0b' : '#ef4444') 
                        }} 
                      />
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                      Geral: {broker.conversionRate.toFixed(1)}%
                    </div>
                  </div>
                </td>
                <td style={{ fontWeight: 600 }}>{formatCurrency(broker.avgRentVolume)}</td>
                <td>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ color: '#10b981', fontWeight: 800, fontSize: '1.1rem' }}>{formatCurrency(broker.totalCommission)}</span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Volume: {formatCurrency(broker.totalRentVolume)}</span>
                  </div>
                </td>
              </tr>
            ))}
            {metrics.brokerPerformance.length === 0 && (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '3rem' }}>
                  Nenhum dado de corretor disponível no período.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </motion.div>
    </motion.div>
  );
}
