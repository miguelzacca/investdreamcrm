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
  { id: 'NEW_LEAD',          title: 'Novo Lead',        color: '#64748b' },
  { id: 'CONTACTED',         title: 'Contato Feito',    color: '#3b82f6' },
  { id: 'VIEWING_SCHEDULED', title: 'Visita Agendada',  color: '#8b5cf6' },
  { id: 'PROPOSAL',          title: 'Proposta',         color: '#f59e0b' },
  { id: 'NEGOTIATION',       title: 'Negociação',       color: '#e11d48' },
  { id: 'CLOSED_WON',        title: 'Fechado ✓',        color: '#059669' },
];

export function KanbanBoard({ initialLeads }: KanbanBoardProps) {
  const [leads, setLeads] = useState(initialLeads);
  const [draggedLeadId, setDraggedLeadId] = useState<string | null>(null);
  const [layout, setLayout] = useState<'horizontal' | 'vertical'>('horizontal');
  
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
    <div className={styles.container}>
      <div className={styles.controls}>
        <div className={styles.layoutToggle}>
          <button
            onClick={() => setLayout('horizontal')}
            className={`${styles.toggleBtn} ${layout === 'horizontal' ? styles.active : ''}`}
            title="Visualização em Colunas"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="9" y1="3" x2="9" y2="21"></line>
              <line x1="15" y1="3" x2="15" y2="21"></line>
            </svg>
          </button>
          <button
            onClick={() => setLayout('vertical')}
            className={`${styles.toggleBtn} ${layout === 'vertical' ? styles.active : ''}`}
            title="Visualização em Linhas"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="3" y1="9" x2="21" y2="9"></line>
              <line x1="3" y1="15" x2="21" y2="15"></line>
            </svg>
          </button>
        </div>
      </div>
      <div className={`${styles.board} ${layout === 'vertical' ? styles.vertical : ''}`}>
        {STAGES.map(stage => {
          const stageLeads = leads.filter(l => l.funnelStage === stage.id);
          const isDragOver = dragOverStage === stage.id;

          return (
            <div
              key={stage.id}
              className={`${styles.column} ${isDragOver ? styles.dragOver : ''}`}
              onDragOver={(e) => handleDragOver(e, stage.id)}
              onDrop={(e) => handleDrop(e, stage.id)}
              style={{ '--stage-color': stage.color } as React.CSSProperties}
            >
              <div className={styles.columnHeader}>
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
    </div>
  );
}
