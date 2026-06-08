"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { Lead } from "@prisma/client";
import { AdminNewLeadModal } from "@/components/leads/AdminNewLeadModal";
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
  PROPOSAL: "Proposta",
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
  const [leads, setLeads] = useState(initialLeads);
  const [showArchived, setShowArchived] = useState(initialArchived);
  const [agentId, setAgentId] = useState(initialAgentId);
  const [isPending, startTransition] = useTransition();
  const [isAddLeadOpen, setIsAddLeadOpen] = useState(false);

  const applyFilters = (newAgentId: string, newArchived: boolean) => {
    startTransition(async () => {
      const params = new URLSearchParams();
      if (newAgentId) params.set("agentId", newAgentId);
      if (newArchived) params.set("archived", "1");

      // Fetch via server-action re-fetch approach: navigate with search params
      // We do a client-side fetch of the page data
      const res = await fetch(`/admin/leads/data?${params.toString()}`);
      if (res.ok) {
        const data: LeadWithAgent[] = await res.json();
        setLeads(data);
      }
    });
  };

  const handleAgentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setAgentId(val);
    applyFilters(val, showArchived);
  };

  const handleArchivedToggle = () => {
    const next = !showArchived;
    setShowArchived(next);
    applyFilters(agentId, next);
  };

  const formatDate = (d: Date | string) =>
    new Date(d).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

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
            value={agentId}
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
          className={`${styles.toggleBtn} ${showArchived ? styles.toggleActive : ""}`}
          onClick={handleArchivedToggle}
          disabled={isPending}
        >
          {showArchived ? "📦 Arquivados" : "✅ Ativos"}
        </button>

        <span className={styles.countBadge}>
          {isPending ? "..." : `${leads.length} lead${leads.length !== 1 ? "s" : ""}`}
        </span>

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
          <span>Temp.</span>
          <span>Corretor</span>
          <span>Data</span>
          {showArchived && <span>Motivo</span>}
        </div>

        {leads.length === 0 && (
          <div className={styles.empty}>
            {isPending
              ? "Carregando..."
              : showArchived
              ? "Nenhum lead arquivado encontrado."
              : "Nenhum lead ativo encontrado."}
          </div>
        )}

        {leads.map((lead) => (
          <Link
            key={lead.id}
            href={`/leads/${lead.id}`}
            className={`${styles.tableRow} ${isPending ? styles.pending : ""}`}
          >
            <span className={styles.leadName}>{lead.name}</span>
            <span className={styles.phone}>{lead.whatsApp}</span>
            <span className={styles.stage}>{STAGE_LABELS[lead.funnelStage] ?? lead.funnelStage}</span>
            <span className={styles.temp}>{TEMP_LABELS[lead.temperature] ?? lead.temperature}</span>
            <span className={styles.agentCell}>
              <span className={styles.agentName}>{lead.agent.name}</span>
              <span className={styles.agentUser}>@{lead.agent.username}</span>
            </span>
            <span className={styles.date}>{formatDate(lead.createdAt)}</span>
            {showArchived && (
              <span className={styles.archiveReason}>
                {lead.archiveReason ?? "—"}
              </span>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
