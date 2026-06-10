"use client";

import React, { useState, useTransition } from 'react';
import { Lead } from '@prisma/client';
import { KanbanBoard } from '@/components/kanban/KanbanBoard';
import { getActiveLeadsByAgent } from './actions';
import { AdminNewLeadModal } from '@/components/leads/AdminNewLeadModal';
import { Plus, Users } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import styles from './AdminLeadsClient.module.css';

interface Agent {
  id: string;
  name: string;
  username: string;
  role: string;
}

interface AdminLeadsClientProps {
  agents: Agent[];
  initialAgentId: string | null;
  initialLeads: Lead[];
}

export default function AdminLeadsClient({
  agents,
  initialAgentId,
  initialLeads,
}: AdminLeadsClientProps) {
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(initialAgentId);
  const [leads, setLeads] = useState<Lead[]>(initialLeads);
  const [isPending, startTransition] = useTransition();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const selectedAgent = agents.find(a => a.id === selectedAgentId) ?? null;

  function handleSelectAgent(agentId: string) {
    if (agentId === selectedAgentId) return;
    setSelectedAgentId(agentId);
    startTransition(async () => {
      const freshLeads = await getActiveLeadsByAgent(agentId);
      setLeads(freshLeads);
    });
  }

  if (agents.length === 0) {
    return (
      <div className={styles.emptyState}>
        <Users size={48} />
        <p>Nenhum corretor cadastrado ainda.</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <Users size={16} className={styles.headerIcon} />
          <span className={styles.headerLabel}>Kanban do corretor:</span>
        </div>

        <Button onClick={() => setIsModalOpen(true)} id="btn-admin-new-lead">
          <Plus size={16} style={{ marginRight: '0.375rem' }} />
          Novo Lead
        </Button>
      </div>

      {/* Agent tabs */}
      <div className={styles.tabBar} role="tablist">
        {agents.map(agent => {
          const isActive = agent.id === selectedAgentId;
          return (
            <button
              key={agent.id}
              role="tab"
              aria-selected={isActive}
              onClick={() => handleSelectAgent(agent.id)}
              className={`${styles.tab} ${isActive ? styles.tabActive : ''}`}
              id={`tab-agent-${agent.id}`}
            >
              <span className={styles.tabAvatar}>
                {agent.name.charAt(0).toUpperCase()}
              </span>
              <span className={styles.tabName}>{agent.name}</span>
              {isActive && (
                <span className={styles.tabLeadCount}>
                  {leads.length}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Stats bar */}
      {selectedAgent && (
        <div className={styles.statsBar}>
          <span className={styles.statChip}>
            <strong>{leads.length}</strong> leads ativos
          </span>
          <span className={styles.statDivider} />
          <span className={styles.statChip}>
            <strong>{leads.filter(l => l.temperature === 'HOT').length}</strong> quentes 🔥
          </span>
          <span className={styles.statDivider} />
          <span className={styles.statChip}>
            <strong>{leads.filter(l => l.funnelStage === 'CLOSED_WON').length}</strong> fechados ✅
          </span>
        </div>
      )}

      {/* Kanban */}
      <div className={`${styles.boardWrapper} ${isPending ? styles.loading : ''}`}>
        {isPending && (
          <div className={styles.loadingOverlay}>
            <div className={styles.spinner} />
          </div>
        )}
        <KanbanBoard initialLeads={leads} key={selectedAgentId ?? 'empty'} />
      </div>

      {/* Modal */}
      <AdminNewLeadModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        agents={agents}
      />
    </div>
  );
}
