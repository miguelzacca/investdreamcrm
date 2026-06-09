"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { Lead, FunnelStage } from '@prisma/client';
import { updateLeadStage } from '@/app/leads/actions';
import { TemperatureBadge } from '@/components/ui/Badge';
import { useEffect } from 'react';
import styles from './KanbanBoard.module.css';

interface KanbanBoardProps {
  initialLeads: Lead[];
}

const STAGES: { id: FunnelStage; title: string; color: string }[] = [
  { id: 'NEW_LEAD', title: 'Novo Lead', color: '#94a3b8' },
  { id: 'CONTACTED', title: 'Contato Feito', color: '#3b82f6' },
  { id: 'VIEWING_SCHEDULED', title: 'Visita Agendada', color: '#8b5cf6' },
  { id: 'PROPOSAL', title: 'Proposta', color: '#f59e0b' },
  { id: 'NEGOTIATION', title: 'Negociação', color: '#ef4444' },
  { id: 'CLOSED_WON', title: 'Fechado ✓', color: '#10b981' },
];

export function KanbanBoard({ initialLeads }: KanbanBoardProps) {
  const [leads, setLeads] = useState(initialLeads);
  const [draggedLeadId, setDraggedLeadId] = useState<string | null>(null);
  
  useEffect(() => {
    setLeads(initialLeads);
  }, [initialLeads]);
  const [dragOverStage, setDragOverStage] = useState<FunnelStage | null>(null);

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedLeadId(id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, stage: FunnelStage) => {
    e.preventDefault();
    setDragOverStage(stage);
  };

  const handleDrop = async (e: React.DragEvent, stage: FunnelStage) => {
    e.preventDefault();
    setDragOverStage(null);

    if (draggedLeadId) {
      const lead = leads.find(l => l.id === draggedLeadId);
      if (lead && lead.funnelStage !== stage) {
        setLeads(prev => prev.map(l => l.id === draggedLeadId ? { ...l, funnelStage: stage } : l));
        await updateLeadStage(draggedLeadId, stage);
      }
    }
    setDraggedLeadId(null);
  };

  const handleDragEnd = () => {
    setDraggedLeadId(null);
    setDragOverStage(null);
  };

  return (
    <div className={styles.board}>
      {STAGES.map(stage => {
        const stageLeads = leads.filter(l => l.funnelStage === stage.id);
        const isDragOver = dragOverStage === stage.id;

        return (
          <div
            key={stage.id}
            className={`${styles.column} ${isDragOver ? styles.dragOver : ''}`}
            onDragOver={(e) => handleDragOver(e, stage.id)}
            onDrop={(e) => handleDrop(e, stage.id)}
          >
            <div className={styles.columnHeader} style={{ borderTop: `3px solid ${stage.color}` }}>
              <span className={styles.columnTitle}>{stage.title}</span>
              <span className={styles.columnCount}>{stageLeads.length}</span>
            </div>

            <div className={`${styles.columnContent} ${isDragOver ? styles.dropActive : ''}`}>
              {stageLeads.length === 0 && (
                <div className={styles.emptyColumn}>
                  Arraste um lead aqui
                </div>
              )}
              {stageLeads.map(lead => (
                <div
                  key={lead.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, lead.id)}
                  onDragEnd={handleDragEnd}
                  className={`${styles.leadCard} ${draggedLeadId === lead.id ? styles.dragging : ''}`}
                >
                  <Link href={`/leads/${lead.id}`} className={styles.leadName}>
                    {lead.name}
                  </Link>
                  <div className={styles.leadInfo}>
                    <span>📞 {lead.whatsApp}</span>
                    {lead.interest && <span>🏠 {lead.interest}</span>}
                  </div>
                  <div className={styles.leadFooter}>
                    <TemperatureBadge temperature={lead.temperature} />
                    {lead.isFollowUp && lead.followUpDate && (
                      <span className={styles.followUpBadge}>
                        🔁 {new Date(lead.followUpDate).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                      </span>
                    )}
                    {lead.source && (
                      <span className={styles.source}>{lead.source}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
