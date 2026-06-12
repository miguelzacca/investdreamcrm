"use client";

import React, { useState } from 'react';
import { Lead } from '@prisma/client';
import { KanbanBoard } from '@/components/kanban/KanbanBoard';
import { NewLeadModal } from '@/components/leads/NewLeadModal';
import styles from './LeadsClient.module.css';

interface LeadsClientProps {
  initialLeads: Lead[];
}

export default function LeadsClient({ initialLeads }: LeadsClientProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const hotCount  = initialLeads.filter(l => l.temperature === 'HOT').length;
  const warmCount = initialLeads.filter(l => l.temperature === 'WARM').length;
  const coldCount = initialLeads.filter(l => l.temperature === 'COLD').length;

  return (
    <div className={styles.container}>
      {/* ── Toolbar ── */}
      <div className={styles.toolbar}>
        <div className={styles.stats}>
          <div className={styles.statChip}>
            <span className={styles.statChipDot} style={{ background: '#3b82f6' }} />
            <span className={styles.statChipValue}>{initialLeads.length}</span>
            <span>leads ativos</span>
          </div>

          <div className={styles.statDivider} />

          <div className={styles.statChip}>
            <span className={styles.statChipDot} style={{ background: '#ef4444' }} />
            <span className={styles.statChipValue}>{hotCount}</span>
            <span>🔥 quentes</span>
          </div>

          <div className={styles.statChip}>
            <span className={styles.statChipDot} style={{ background: '#f59e0b' }} />
            <span className={styles.statChipValue}>{warmCount}</span>
            <span>🌤 mornos</span>
          </div>

          <div className={styles.statChip}>
            <span className={styles.statChipDot} style={{ background: '#64748b' }} />
            <span className={styles.statChipValue}>{coldCount}</span>
            <span>🧊 frios</span>
          </div>
        </div>

        <div className={styles.actions}>
          <button
            id="btn-new-lead"
            className={styles.newLeadBtn}
            onClick={() => setIsModalOpen(true)}
          >
            {/* <span className={styles.newLeadIcon}>+</span> */}
            Novo Lead
          </button>
        </div>
      </div>

      {/* ── Kanban Board ── */}
      <KanbanBoard initialLeads={initialLeads} />

      {/* ── Modal ── */}
      <NewLeadModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}
