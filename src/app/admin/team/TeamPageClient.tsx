"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mail, Pencil, X, Check, AlertCircle, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/Card";
import styles from "./TeamPage.module.css";
import editStyles from "./EditEmail.module.css";

type Agent = {
  id: string;
  name: string;
  username: string;
  email: string | null;
  role: string;
  activeLeads: number;
  hotLeads: number;
  closedWon: number;
  totalDeals: number;
  totalCommission: number;
};

const formatCurrency = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

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
      <button
        className={editStyles.saveBtn}
        onClick={handleSave}
        disabled={isPending}
        title="Salvar"
      >
        <Check size={14} />
      </button>
      <button
        className={editStyles.cancelBtn}
        onClick={handleCancel}
        disabled={isPending}
        title="Cancelar"
      >
        <X size={14} />
      </button>
    </div>
  );
}

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
    } catch (err) {
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

export function TeamPageClient({ team }: { team: Agent[] }) {
  const totalLeads = team.reduce((s, a) => s + a.activeLeads, 0);
  const totalDeals = team.reduce((s, a) => s + a.totalDeals, 0);
  const totalCommission = team.reduce((s, a) => s + a.totalCommission, 0);

  return (
    <>
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
          <div className={styles.tableHeaderWithEmail}>
            <span>Nome</span>
            <span>Usuário</span>
            <span>Email de Notificação</span>
            <span>Perfil</span>
            <span>Leads Ativos</span>
            <span>🔥 Quentes</span>
            <span>Fechados</span>
            <span>Comissão Total</span>
            <span></span>
          </div>
          {team.map((agent) => (
            <div key={agent.id} className={styles.tableRowWithEmail}>
              <Link href={`/admin/team/${agent.id}`} className={styles.agentName}>
                {agent.name}
              </Link>
              <span className={styles.agentUsername}>@{agent.username}</span>
              <EmailEditCell agent={agent} />
              <span>
                <span className={agent.role === "ADMIN" ? styles.badgeAdmin : styles.badgeAgent}>
                  {agent.role === "ADMIN" ? "Admin" : "Corretor"}
                </span>
              </span>
              <span className={styles.num}>{agent.activeLeads}</span>
              <span className={styles.num}>{agent.hotLeads}</span>
              <span className={styles.num}>{agent.closedWon}</span>
              <span className={styles.commission}>{formatCurrency(agent.totalCommission)}</span>
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
