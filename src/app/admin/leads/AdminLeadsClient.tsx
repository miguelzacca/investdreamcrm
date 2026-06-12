"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Lead } from "@prisma/client";
import { AdminNewLeadModal } from "@/components/leads/AdminNewLeadModal";
import { adminDeleteLead, adminClearArchivedLeads } from "./actions";
import styles from "./AdminLeadsPage.module.css";

type LeadWithAgent = Lead & {
  agent: { id: string; name: string; username: string };
};

interface Agent {
  id: string;
  name: string;
  username: string;
  role: string;
}

interface AdminLeadsClientProps {
  initialLeads: LeadWithAgent[];
  agents: Agent[];
  initialArchived: boolean;
  initialAgentId: string;
}

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

export default function AdminLeadsClient({
  initialLeads,
  agents,
  initialArchived,
  initialAgentId,
}: AdminLeadsClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isAddLeadOpen, setIsAddLeadOpen] = useState(false);

  const applyFilters = (newAgentId: string, newArchived: boolean) => {
    startTransition(() => {
      const params = new URLSearchParams();
      if (newAgentId) params.set("agentId", newAgentId);
      if (newArchived) params.set("archived", "1");
      router.push(`?${params.toString()}`);
    });
  };

  const handleAgentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    applyFilters(e.target.value, initialArchived);
  };

  const handleArchivedToggle = () => {
    applyFilters(initialAgentId, !initialArchived);
  };

  const formatDate = (d: Date | string) =>
    new Date(d).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  const formatResponseTime = (createdAt: Date, contactedAt: Date | null) => {
    if (!contactedAt) return "—";
    const diffMs = new Date(contactedAt).getTime() - new Date(createdAt).getTime();
    const mins = Math.max(0, Math.round(diffMs / 60000));
    if (mins < 60) return `${mins}m`;
    const hours = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    return `${hours}h ${remainingMins}m`;
  };

  const handleClearArchived = () => {
    if (confirm("Tem certeza que deseja APAGAR TODOS os leads arquivados permanentemente? Esta ação não pode ser desfeita.")) {
      startTransition(async () => {
        try {
          await adminClearArchivedLeads();
        } catch (err: any) {
          alert(err.message || "Erro ao limpar arquivados");
        }
      });
    }
  };

  const handleDeleteLead = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (confirm("Tem certeza que deseja apagar permanentemente este lead arquivado?")) {
      startTransition(async () => {
        try {
          await adminDeleteLead(id);
        } catch (err: any) {
          alert(err.message || "Erro ao deletar lead");
        }
      });
    }
  };

  return (
    <div className={styles.page}>
      {/* Filters */}
      <div className={styles.filterBar}>
        <div className={styles.filterGroup}>
          <label className={styles.filterLabel} htmlFor="filter-agent">
            Corretor
          </label>
          <select
            id="filter-agent"
            className={styles.filterSelect}
            value={initialAgentId}
            onChange={handleAgentChange}
            disabled={isPending}
          >
            <option value="">Todos os corretores</option>
            {agents.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name} (@{a.username})
              </option>
            ))}
          </select>
        </div>

        <button
          id="toggle-archived"
          className={`${styles.toggleBtn} ${initialArchived ? styles.toggleActive : ""}`}
          onClick={handleArchivedToggle}
          disabled={isPending}
        >
          {initialArchived ? "📦 Arquivados" : "✅ Ativos"}
        </button>

        <span className={styles.countBadge}>
          {isPending ? "..." : `${initialLeads.length} lead${initialLeads.length !== 1 ? "s" : ""}`}
        </span>

        {initialArchived && initialLeads.length > 0 && (
          <button
            className={styles.clearArchivedBtn}
            onClick={handleClearArchived}
            disabled={isPending}
            title="Apagar todos os arquivados permanentemente"
          >
            Limpar Arquivados
          </button>
        )}

        <button
          id="btn-admin-add-lead"
          className={styles.addLeadBtn}
          onClick={() => setIsAddLeadOpen(true)}
        >
          + Adicionar Lead
        </button>
      </div>

      <AdminNewLeadModal
        isOpen={isAddLeadOpen}
        onClose={() => setIsAddLeadOpen(false)}
        agents={agents}
      />

      {/* Table */}
      <div className={styles.tableWrapper}>
        <div className={styles.tableHead}>
          <span>Nome</span>
          <span>WhatsApp</span>
          <span>Etapa</span>
          <span>Contatado</span>
          <span>Tempo</span>
          <span>Follow-up</span>
          <span>Temp.</span>
          <span>Corretor</span>
          <span>Data</span>
          {initialArchived && <span>Motivo</span>}
          {initialArchived && <span>Excluir</span>}
        </div>

        {initialLeads.length === 0 && (
          <div className={styles.empty}>
            {isPending
              ? "Carregando..."
              : initialArchived
              ? "Nenhum lead arquivado encontrado."
              : "Nenhum lead ativo encontrado."}
          </div>
        )}

        {initialLeads.map((lead) => (
          <Link
            key={lead.id}
            href={`/leads/${lead.id}`}
            className={`${styles.tableRow} ${isPending ? styles.pending : ""}`}
          >
            <span className={styles.leadName}>{lead.name}</span>
            <span className={styles.phone}>{lead.whatsApp}</span>
            <span className={styles.stage}>{STAGE_LABELS[lead.funnelStage] ?? lead.funnelStage}</span>
            <span className={styles.stage}>{lead.firstContactedAt ? '✅ Sim' : '❌ Não'}</span>
            <span className={styles.stage}>{formatResponseTime(lead.createdAt, lead.firstContactedAt)}</span>
            <span className={styles.stage}>
              {lead.isFollowUp && lead.followUpDate ? (
                <span style={{
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  color: '#3b82f6',
                  background: 'rgba(59,130,246,0.1)',
                  border: '1px solid rgba(59,130,246,0.25)',
                  borderRadius: '999px',
                  padding: '0.1rem 0.45rem',
                  whiteSpace: 'nowrap',
                }}>
                  🔁 {new Date(lead.followUpDate).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: '2-digit' })}
                </span>
              ) : (
                <span style={{ color: 'var(--text-tertiary)', fontSize: '0.8rem' }}>—</span>
              )}
            </span>
            <span className={styles.temp}>{TEMP_LABELS[lead.temperature] ?? lead.temperature}</span>
            <span className={styles.agentCell}>
              <span className={styles.agentName}>{lead.agent.name}</span>
              <span className={styles.agentUser}>@{lead.agent.username}</span>
            </span>
            <span className={styles.date}>{formatDate(lead.createdAt)}</span>
            {initialArchived && (
              <span className={styles.archiveReason}>
                {lead.archiveReason ?? "—"}
              </span>
            )}
            {initialArchived && (
              <button
                className={styles.deleteBtn}
                onClick={(e) => handleDeleteLead(lead.id, e)}
                disabled={isPending}
                title="Excluir Permanentemente"
              >
                🗑️
              </button>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
