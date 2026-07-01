"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Mail, Pencil, X, Check, AlertCircle, Trash2,
  GripVertical, ToggleLeft, ToggleRight,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { updateAgentQueueSettings } from "./actions";
import styles from "./TeamPage.module.css";
import editStyles from "./EditEmail.module.css";

type Agent = {
  id: string;
  name: string;
  username: string;
  email: string | null;
  whatsApp: string | null;
  role: string;
  queueOrder: number;
  inAutoQueue: boolean;
  lastLeadReceivedAt: string | null;
  activeLeads: number;
  hotLeads: number;
  closedWon: number;
  totalDeals: number;
  totalCommission: number;
  avgResponseTimeMins: number | null;
};

const formatCurrency = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const formatTMA = (mins: number | null) => {
  if (mins === null) return "—";
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  const remainingMins = mins % 60;
  return `${hours}h ${remainingMins}m`;
};

/* ─── Email edit cell ────────────────────────────────────────────── */
function EmailEditCell({ agent }: { agent: Agent }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(agent.email ?? "");
  const [saved, setSaved] = useState(agent.email ?? "");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleSave = () => {
    setError("");
    startTransition(async () => {
      try {
        const res = await fetch(`/api/admin/users/${agent.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: value || null }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error ?? "Erro ao salvar.");
          return;
        }
        setSaved(data.email ?? "");
        setEditing(false);
      } catch {
        setError("Erro de conexão.");
      }
    });
  };

  const handleCancel = () => {
    setValue(saved);
    setError("");
    setEditing(false);
  };

  if (!editing) {
    return (
      <div className={editStyles.emailCell}>
        {saved ? (
          <span className={editStyles.emailValue}>
            <Mail size={13} className={editStyles.emailIcon} />
            {saved}
          </span>
        ) : (
          <span className={editStyles.noEmail}>Sem email</span>
        )}
        <button
          className={editStyles.editBtn}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setEditing(true);
          }}
          title="Editar email"
        >
          <Pencil size={13} />
        </button>
      </div>
    );
  }

  return (
    <div className={editStyles.editRow} onClick={(e) => e.preventDefault()}>
      <div className={editStyles.inputWrapper}>
        <input
          className={editStyles.emailInput}
          type="email"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setError("");
          }}
          placeholder="email@corretor.com"
          disabled={isPending}
          autoFocus
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSave();
            if (e.key === "Escape") handleCancel();
          }}
        />
        {error && (
          <div className={editStyles.errorHint}>
            <AlertCircle size={11} /> {error}
          </div>
        )}
      </div>
      <button className={editStyles.saveBtn} onClick={handleSave} disabled={isPending} title="Salvar">
        <Check size={14} />
      </button>
      <button className={editStyles.cancelBtn} onClick={handleCancel} disabled={isPending} title="Cancelar">
        <X size={14} />
      </button>
    </div>
  );
}

/* ─── WhatsApp edit cell ────────────────────────────────────────────── */
function WhatsAppEditCell({ agent }: { agent: Agent }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(agent.whatsApp ?? "");
  const [saved, setSaved] = useState(agent.whatsApp ?? "");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleSave = () => {
    setError("");
    startTransition(async () => {
      try {
        const res = await fetch(`/api/admin/users/${agent.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ whatsApp: value || null }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error ?? "Erro ao salvar.");
          return;
        }
        setSaved(data.whatsApp ?? "");
        setEditing(false);
      } catch {
        setError("Erro de conexão.");
      }
    });
  };

  const handleCancel = () => {
    setValue(saved);
    setError("");
    setEditing(false);
  };

  if (!editing) {
    return (
      <div className={editStyles.emailCell}>
        {saved ? (
          <span className={editStyles.emailValue}>
            📱 {saved}
          </span>
        ) : (
          <span className={editStyles.noEmail}>Sem WA</span>
        )}
        <button
          className={editStyles.editBtn}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setEditing(true);
          }}
          title="Editar WhatsApp"
        >
          <Pencil size={13} />
        </button>
      </div>
    );
  }

  return (
    <div className={editStyles.editRow} onClick={(e) => e.preventDefault()}>
      <div className={editStyles.inputWrapper}>
        <input
          className={editStyles.emailInput}
          type="text"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setError("");
          }}
          placeholder="Ex: 5511999999999"
          disabled={isPending}
          autoFocus
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSave();
            if (e.key === "Escape") handleCancel();
          }}
        />
        {error && (
          <div className={editStyles.errorHint}>
            <AlertCircle size={11} /> {error}
          </div>
        )}
      </div>
      <button className={editStyles.saveBtn} onClick={handleSave} disabled={isPending} title="Salvar">
        <Check size={14} />
      </button>
      <button className={editStyles.cancelBtn} onClick={handleCancel} disabled={isPending} title="Cancelar">
        <X size={14} />
      </button>
    </div>
  );
}

/* ─── Queue order edit cell ─────────────────────────────────────── */
function QueueOrderCell({ agent }: { agent: Agent }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(String(agent.queueOrder));
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  const handleSave = () => {
    const num = parseInt(value, 10);
    if (isNaN(num) || num < 0) {
      setError("Número inválido");
      return;
    }
    setError("");
    startTransition(async () => {
      await updateAgentQueueSettings(agent.id, { queueOrder: num });
      setEditing(false);
      router.refresh();
    });
  };

  const handleCancel = () => {
    setValue(String(agent.queueOrder));
    setError("");
    setEditing(false);
  };

  if (!editing) {
    return (
      <div className={styles.queueOrderCell}>
        <span className={styles.queueOrderBadge}>{agent.queueOrder}</span>
        <button
          className={styles.queueEditBtn}
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); setEditing(true); }}
          title="Editar posição na fila"
        >
          <Pencil size={12} />
        </button>
      </div>
    );
  }

  return (
    <div className={styles.queueOrderEditRow} onClick={(e) => e.preventDefault()}>
      <input
        className={styles.queueOrderInput}
        type="number"
        min="0"
        value={value}
        onChange={(e) => { setValue(e.target.value); setError(""); }}
        disabled={isPending}
        autoFocus
        onKeyDown={(e) => {
          if (e.key === "Enter") handleSave();
          if (e.key === "Escape") handleCancel();
        }}
      />
      {error && <span className={styles.queueError}>{error}</span>}
      <button className={editStyles.saveBtn} onClick={handleSave} disabled={isPending} title="Salvar"><Check size={14} /></button>
      <button className={editStyles.cancelBtn} onClick={handleCancel} disabled={isPending} title="Cancelar"><X size={14} /></button>
    </div>
  );
}

/* ─── In-queue toggle ────────────────────────────────────────────── */
function InQueueToggle({ agent }: { agent: Agent }) {
  const router = useRouter();
  const [active, setActive] = useState(agent.inAutoQueue);
  const [isPending, startTransition] = useTransition();

  const toggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const next = !active;
    setActive(next);
    startTransition(async () => {
      await updateAgentQueueSettings(agent.id, { inAutoQueue: next });
      router.refresh();
    });
  };

  return (
    <button
      className={`${styles.queueToggle} ${active ? styles.queueToggleOn : styles.queueToggleOff}`}
      onClick={toggle}
      disabled={isPending}
      title={active ? "Clique para remover da fila" : "Clique para adicionar à fila"}
    >
      {active ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
      <span>{active ? "Na fila" : "Pausado"}</span>
    </button>
  );
}

/* ─── Delete button ─────────────────────────────────────────────── */
function DeleteAgentButton({ agent }: { agent: Agent }) {
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    if (!confirm(`Tem certeza que deseja apagar o usuário ${agent.name}?`)) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/admin/users/${agent.id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Erro ao apagar usuário.");
      } else {
        router.refresh();
      }
    } catch {
      alert("Erro de conexão.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <button
      className={styles.deleteBtn}
      onClick={handleDelete}
      disabled={isDeleting}
      title="Apagar usuário"
    >
      <Trash2 size={16} />
    </button>
  );
}

/* ─── Main component ─────────────────────────────────────────────── */
export function TeamPageClient({ team }: { team: Agent[] }) {
  const totalLeads = team.reduce((s, a) => s + a.activeLeads, 0);
  const totalDeals = team.reduce((s, a) => s + a.totalDeals, 0);
  const totalCommission = team.reduce((s, a) => s + a.totalCommission, 0);

  // Agents sorted by queueOrder for the queue preview panel
  const queueAgents = team
    .filter((a) => a.role === "AGENT")
    .sort((a, b) => a.queueOrder - b.queueOrder);

  return (
    <>
      {/* Summary cards */}
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

      {/* Queue preview panel */}
      {queueAgents.length > 0 && (
        <Card>
          <div className={styles.queuePanel}>
            <div className={styles.queuePanelHeader}>
              <span className={styles.queuePanelTitle}>🔄 Fila Automática</span>
              <span className={styles.queuePanelHint}>
                A ordem abaixo é a sequência de distribuição. Use o número de posição na tabela para reordenar.
              </span>
            </div>
            <div className={styles.queueList}>
              {queueAgents.map((a, idx) => (
                <div
                  key={a.id}
                  className={`${styles.queueItem} ${!a.inAutoQueue ? styles.queueItemPaused : ""}`}
                >
                  <span className={styles.queuePos}>{idx + 1}º</span>
                  <GripVertical size={14} className={styles.queueGrip} />
                  <span className={styles.queueName}>{a.name}</span>
                  {!a.inAutoQueue && (
                    <span className={styles.pausedBadge}>Pausado</span>
                  )}
                  {a.lastLeadReceivedAt && (
                    <span className={styles.queueLastLead}>
                      Último lead:{" "}
                      {new Date(a.lastLeadReceivedAt).toLocaleDateString("pt-BR", {
                        day: "2-digit",
                        month: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

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
          <div className={styles.tableHeaderWithEmail}>
            <span>Nome</span>
            <span>Usuário</span>
            <span>Email de Notificação</span>
            <span>WhatsApp Bot</span>
            <span>Perfil</span>
            <span>Posição Fila</span>
            <span>Na Fila</span>
            <span>Leads Ativos</span>
            <span>🔥 Quentes</span>
            <span>Fechados</span>
            <span>Comissão Total</span>
            <span>TMA</span>
            <span></span>
          </div>
          {team.map((agent) => (
            <div key={agent.id} className={styles.tableRowWithEmail}>
              <Link href={`/admin/team/${agent.id}`} className={styles.agentName}>
                {agent.name}
              </Link>
              <span className={styles.agentUsername}>@{agent.username}</span>
              <EmailEditCell agent={agent} />
              <WhatsAppEditCell agent={agent} />
              <span>
                <span className={agent.role === "ADMIN" ? styles.badgeAdmin : styles.badgeAgent}>
                  {agent.role === "ADMIN" ? "Admin" : "Corretor"}
                </span>
              </span>
              {agent.role === "AGENT" ? (
                <>
                  <QueueOrderCell agent={agent} />
                  <InQueueToggle agent={agent} />
                </>
              ) : (
                <>
                  <span className={styles.naCell}>—</span>
                  <span className={styles.naCell}>—</span>
                </>
              )}
              <span className={styles.num}>{agent.activeLeads}</span>
              <span className={styles.num}>{agent.hotLeads}</span>
              <span className={styles.num}>{agent.closedWon}</span>
              <span className={styles.commission}>{formatCurrency(agent.totalCommission)}</span>
              <span className={styles.tma} style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                {formatTMA(agent.avgResponseTimeMins)}
              </span>
              <DeleteAgentButton agent={agent} />
            </div>
          ))}
          {team.length === 0 && (
            <div className={styles.emptyState}>Nenhum agente encontrado.</div>
          )}
        </div>
      </Card>
    </>
  );
}
