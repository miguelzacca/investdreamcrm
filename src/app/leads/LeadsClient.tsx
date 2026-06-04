"use client";

import React, { useState } from 'react';
import { Lead } from '@prisma/client';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { KanbanBoard } from '@/components/kanban/KanbanBoard';
import { NewLeadModal } from '@/components/leads/NewLeadModal';
import styles from './LeadsClient.module.css';

interface LeadsClientProps {
  initialLeads: Lead[];
}

export default function LeadsClient({ initialLeads }: LeadsClientProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className={styles.container}>
      <div className={styles.toolbar}>
        <div className={styles.stats}>
          <span className={styles.statItem}>
            <strong>{initialLeads.length}</strong> leads ativos
          </span>
          <span className={styles.statDivider} />
          <span className={styles.statItem}>
            <strong>{initialLeads.filter(l => l.temperature === 'HOT').length}</strong> quentes 🔥
          </span>
        </div>

        <Button onClick={() => setIsModalOpen(true)} id="btn-new-lead">
          <Plus size={16} style={{ marginRight: '0.375rem' }} />
          Novo Lead
        </Button>
      </div>

      <KanbanBoard initialLeads={initialLeads} />

      <NewLeadModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}
