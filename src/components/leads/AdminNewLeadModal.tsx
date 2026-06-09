"use client";

import React, { useState, useTransition, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import {
  adminCreateLeadForAgent,
  adminCreateLeadRoundRobin,
  getNextRoundRobinAgent,
} from "@/app/admin/leads/actions";
import styles from "./AdminNewLeadModal.module.css";

interface Agent {
  id: string;
  name: string;
  username: string;
  role: string;
}

interface AdminNewLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  agents: Agent[];
}

type Mode = "direct" | "queue";

const EMPTY_FORM = {
  name: "",
  whatsApp: "",
  interest: "",
  temperature: "COLD" as "COLD" | "WARM" | "HOT",
  source: "",
};

export function AdminNewLeadModal({
  isOpen,
  onClose,
  agents,
}: AdminNewLeadModalProps) {
  const [mode, setMode] = useState<Mode>("queue");
  const [form, setForm] = useState(EMPTY_FORM);
  const [selectedAgentId, setSelectedAgentId] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Preview: who gets the next round-robin lead
  const [nextAgent, setNextAgent] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [loadingNext, setLoadingNext] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    if (mode !== "queue") return;

    let cancelled = false;
    setLoadingNext(true);
    getNextRoundRobinAgent().then((res) => {
      if (!cancelled) {
        setNextAgent(res);
        setLoadingNext(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [isOpen, mode, successMsg]); // refresh preview after each submission

  const handleChange = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const reset = () => {
    setForm(EMPTY_FORM);
    setSelectedAgentId("");
    setError("");
    setSuccessMsg("");
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");

    if (!form.name.trim() || !form.whatsApp.trim()) {
      setError("Nome e WhatsApp são obrigatórios.");
      return;
    }
    if (mode === "direct" && !selectedAgentId) {
      setError("Selecione um corretor.");
      return;
    }

    const payload = {
      name: form.name.trim(),
      whatsApp: form.whatsApp.trim(),
      interest: form.interest.trim() || undefined,
      temperature: form.temperature,
      source: form.source || undefined,
    };

    startTransition(async () => {
      try {
        if (mode === "direct") {
          await adminCreateLeadForAgent(selectedAgentId, payload);
          const agentName = agents.find((a) => a.id === selectedAgentId)?.name ?? "corretor";
          setSuccessMsg(`✅ Lead criado para ${agentName}!`);
        } else {
          const result = await adminCreateLeadRoundRobin(payload);
          setSuccessMsg(`✅ Lead criado e enviado para ${result.assignedTo}!`);
        }
        setForm(EMPTY_FORM);
        setSelectedAgentId("");
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Erro ao criar lead.");
      }
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Adicionar Lead" size="lg">
      {/* Mode Tabs */}
      <div className={styles.tabs}>
        <button
          type="button"
          id="tab-queue"
          className={`${styles.tab} ${mode === "queue" ? styles.tabActive : ""}`}
          onClick={() => { setMode("queue"); setError(""); setSuccessMsg(""); }}
        >
          <span className={styles.tabIcon}>🔄</span>
          Fila Automática
        </button>
        <button
          type="button"
          id="tab-direct"
          className={`${styles.tab} ${mode === "direct" ? styles.tabActive : ""}`}
          onClick={() => { setMode("direct"); setError(""); setSuccessMsg(""); }}
        >
          <span className={styles.tabIcon}>🎯</span>
          Corretor Específico
        </button>
      </div>

      {/* Queue preview */}
      {mode === "queue" && (
        <div className={styles.queuePreview}>
          <span className={styles.previewLabel}>Próximo da fila:</span>
          {loadingNext ? (
            <span className={styles.previewLoading}>Calculando...</span>
          ) : nextAgent ? (
            <span className={styles.previewAgent}>
              <span className={styles.previewAvatar}>
                {nextAgent.name.charAt(0).toUpperCase()}
              </span>
              <span>
                <strong>{nextAgent.name}</strong>
                <small>vez desta rodada</small>
              </span>
            </span>
          ) : (
            <span className={styles.previewEmpty}>Nenhum corretor disponível na fila</span>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} className={styles.form}>
        {/* Direct mode: agent select */}
        {mode === "direct" && (
          <div className={styles.agentSelect}>
            <label className={styles.agentLabel} htmlFor="admin-lead-agent">
              Corretor *
            </label>
            <select
              id="admin-lead-agent"
              className={styles.agentDropdown}
              value={selectedAgentId}
              onChange={(e) => setSelectedAgentId(e.target.value)}
              disabled={isPending}
              required
            >
              <option value="">Selecione um corretor...</option>
              {agents.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} (@{a.username})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Success banner */}
        {successMsg && (
          <div className={styles.successBanner}>{successMsg}</div>
        )}

        {/* Error banner */}
        {error && <div className={styles.errorBanner}>{error}</div>}

        <div className={styles.row}>
          <Input
            label="Nome completo *"
            placeholder="Ex: João da Silva"
            value={form.name}
            onChange={(e) => handleChange("name", e.target.value)}
            required
          />
          <Input
            label="WhatsApp *"
            placeholder="(11) 99999-9999"
            value={form.whatsApp}
            onChange={(e) => handleChange("whatsApp", e.target.value)}
            required
          />
        </div>

        <Input
          label="Interesse / Imóvel"
          placeholder="Ex: Apartamento 2 quartos, Bairro X"
          value={form.interest}
          onChange={(e) => handleChange("interest", e.target.value)}
        />

        <div className={styles.row}>
          <Select
            label="Temperatura"
            value={form.temperature}
            onChange={(e) => handleChange("temperature", e.target.value)}
          >
            <option value="COLD">🧊 Frio</option>
            <option value="WARM">🌤 Morno</option>
            <option value="HOT">🔥 Quente</option>
          </Select>

          <Select
            label="Origem do Lead"
            value={form.source}
            onChange={(e) => handleChange("source", e.target.value)}
          >
            <option value="">Selecionar...</option>
            <option value="indicacao">Indicação</option>
            <option value="instagram">Instagram</option>
            <option value="facebook">Facebook</option>
            <option value="google">Google</option>
            <option value="site">Site</option>
            <option value="whatsapp">WhatsApp</option>
            <option value="outro">Outro</option>
          </Select>
        </div>

        <div className={styles.footer}>
          <Button type="button" variant="secondary" onClick={handleClose} disabled={isPending}>
            Fechar
          </Button>
          <Button
            type="submit"
            isLoading={isPending}
            disabled={mode === "queue" && !nextAgent}
          >
            {mode === "queue" ? "Enviar para Fila" : "Criar Lead"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
