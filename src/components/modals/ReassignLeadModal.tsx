"use client";

import React, { useState, useTransition } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { reassignLeadToAgent, reassignLeadToQueue } from "@/app/leads/actions";

interface Agent {
  id: string;
  name: string;
}

interface ReassignLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  leadId: string;
  currentAgentId?: string;
  agents: Agent[];
  onSuccess: (leadId: string, newAgentId: string) => void;
}

export function ReassignLeadModal({
  isOpen,
  onClose,
  leadId,
  currentAgentId,
  agents,
  onSuccess,
}: ReassignLeadModalProps) {
  const [selectedAgentId, setSelectedAgentId] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedAgentId) return;

    startTransition(async () => {
      try {
        if (selectedAgentId === "AUTO") {
          const result = await reassignLeadToQueue(leadId);
          onSuccess(leadId, result.newAgentId);
        } else {
          await reassignLeadToAgent(leadId, selectedAgentId);
          onSuccess(leadId, selectedAgentId);
        }
        onClose();
      } catch (error: any) {
        console.error("Erro ao reatribuir lead", error);
        alert(error.message || "Ocorreu um erro ao reatribuir o lead.");
      }
    });
  }

  const availableAgents = agents.filter((a) => a.id !== currentAgentId);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Reatribuir Lead">
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: "1rem" }}>
          <label htmlFor="agent-select" style={{ display: "block", marginBottom: "0.5rem" }}>
            Selecione o novo corretor:
          </label>
          <select
            id="agent-select"
            value={selectedAgentId}
            onChange={(e) => setSelectedAgentId(e.target.value)}
            style={{ width: "100%", padding: "0.5rem", borderRadius: "0.375rem", border: "1px solid #ccc" }}
            required
          >
            <option value="" disabled>Selecione um corretor ou opção</option>
            <option value="AUTO" style={{ fontWeight: "bold" }}>🔄 Fila Automática (Seguir a roda)</option>
            {availableAgents.map((agent) => (
              <option key={agent.id} value={agent.id}>
                {agent.name}
              </option>
            ))}
          </select>
          <p style={{ marginTop: "0.5rem", fontSize: "0.875rem", color: "#666" }}>
            O lead será removido do corretor atual e movido para a coluna "Novo Lead" do corretor selecionado.
          </p>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem" }}>
          <Button type="button" variant="ghost" onClick={onClose} disabled={isPending}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isPending || !selectedAgentId}>
            {isPending ? "Reatribuindo..." : "Confirmar"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
