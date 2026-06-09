import React from "react";
import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { AppLayout } from "@/components/layout/AppLayout";
import { getAgentDetail } from "../actions";
import styles from "./AgentDetailPage.module.css";
import { ArrowLeft } from "lucide-react";

const STAGE_LABELS: Record<string, string> = {
  NEW_LEAD: "Novo Lead",
  CONTACTED: "Contato Feito",
  VIEWING_SCHEDULED: "Visita Agendada",
  NEGOTIATION: "Negociação",
  CLOSED_WON: "Fechado/Ganho",
};

const TEMP_LABELS: Record<string, string> = {
  COLD: "🧊 Frio",
  WARM: "🌤 Morno",
  HOT: "🔥 Quente",
};

const formatCurrency = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const formatDate = (d: Date | string) =>
  new Date(d).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

export default async function AgentDetailPage({
  params,
}: {
  params: Promise<{ agentId: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") redirect("/dashboard");

  const { agentId } = await params;
  const agent = await getAgentDetail(agentId);
  if (!agent) notFound();

  const initials = agent.name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  return (
    <AppLayout title={`Corretor: ${agent.name}`}>
      <div className={styles.page}>
        {/* Back link */}
        <Link href="/admin/team" className={styles.backLink}>
          <ArrowLeft size={15} />
          Voltar à Equipe
        </Link>

        {/* Agent header */}
        <div className={styles.agentHeader}>
          <div className={styles.avatar}>{initials}</div>
          <div className={styles.agentInfo}>
            <div className={styles.agentName}>{agent.name}</div>
            <div className={styles.agentMeta}>@{agent.username}</div>
          </div>
          <span className={agent.role === "ADMIN" ? styles.badgeAdmin : styles.badgeAgent}>
            {agent.role === "ADMIN" ? "Admin" : "Corretor"}
          </span>
        </div>

        {/* Stats */}
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <span className={styles.statIcon}>📋</span>
            <span className={styles.statNum}>{agent.activeLeads.length}</span>
            <span className={styles.statLabel}>Leads Ativos</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statIcon}>🔥</span>
            <span className={styles.statNum}>{agent.hotLeads}</span>
            <span className={styles.statLabel}>Leads Quentes</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statIcon}>🏠</span>
            <span className={styles.statNum}>{agent.closedWon}</span>
            <span className={styles.statLabel}>Fechados/Ganho</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statIcon}>📦</span>
            <span className={styles.statNum}>{agent.archivedLeads.length}</span>
            <span className={styles.statLabel}>Arquivados</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statIcon}>💰</span>
            <span className={styles.statNum} style={{ fontSize: "1.05rem" }}>
              {formatCurrency(agent.totalCommission)}
            </span>
            <span className={styles.statLabel}>Comissão Total</span>
          </div>
        </div>

        {/* Active leads table */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>
            Leads Ativos
            <span className={styles.sectionCount}>{agent.activeLeads.length}</span>
          </h2>

          <div className={styles.leadTable}>
            <div className={styles.leadTableHead}>
              <span>Nome</span>
              <span>WhatsApp</span>
              <span>Etapa</span>
              <span>Temp.</span>
              <span>Criado em</span>
            </div>

            {agent.activeLeads.length === 0 && (
              <div className={styles.empty}>Nenhum lead ativo.</div>
            )}

            {agent.activeLeads.map((lead) => (
              <Link key={lead.id} href={`/leads/${lead.id}`} className={styles.leadRow}>
                <span className={styles.leadName}>{lead.name}</span>
                <span className={styles.leadPhone}>{lead.whatsApp}</span>
                <span className={styles.leadStage}>{STAGE_LABELS[lead.funnelStage] ?? lead.funnelStage}</span>
                <span className={styles.leadTemp}>{TEMP_LABELS[lead.temperature] ?? lead.temperature}</span>
                <span className={styles.leadDate}>{formatDate(lead.createdAt)}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Archived leads table */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>
            Leads Arquivados
            <span className={styles.sectionCount}>{agent.archivedLeads.length}</span>
          </h2>

          <div className={styles.leadTable}>
            <div className={`${styles.leadTableHead} ${styles.leadTableHeadArchived}`}>
              <span>Nome</span>
              <span>WhatsApp</span>
              <span>Etapa</span>
              <span>Temp.</span>
              <span>Arquivado em</span>
              <span>Motivo</span>
            </div>

            {agent.archivedLeads.length === 0 && (
              <div className={styles.empty}>Nenhum lead arquivado.</div>
            )}

            {agent.archivedLeads.map((lead) => (
              <Link
                key={lead.id}
                href={`/leads/${lead.id}`}
                className={`${styles.leadRow} ${styles.leadRowArchived}`}
              >
                <span className={styles.leadName}>{lead.name}</span>
                <span className={styles.leadPhone}>{lead.whatsApp}</span>
                <span className={styles.leadStage}>{STAGE_LABELS[lead.funnelStage] ?? lead.funnelStage}</span>
                <span className={styles.leadTemp}>{TEMP_LABELS[lead.temperature] ?? lead.temperature}</span>
                <span className={styles.leadDate}>{formatDate(lead.updatedAt)}</span>
                <span className={styles.leadReason}>{lead.archiveReason ?? "—"}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
