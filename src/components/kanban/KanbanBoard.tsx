"use client";

import React, { useState } from 'react';
import { Lead, FunnelStage } from '@prisma/client';
import { updateLeadStage, archiveLead } from '@/app/leads/actions';
import styles from './KanbanBoard.module.css';

interface KanbanBoardProps {
  initialLeads: Lead[];
}

const STAGES: { id: FunnelStage; title: string }[] = [
  { id: 'NEW_LEAD', title: 'Novo Lead' },
  { id: 'CONTACTED', title: 'Contato Feito' },
  { id: 'VIEWING_SCHEDULED', title: 'Visita Agendada' },
  { id: 'PROPOSAL', title: 'Proposta' },
  { id: 'NEGOTIATION', title: 'Negociação' },
  { id: 'CLOSED_WON', title: 'Fechado/Ganha' },
];

export function KanbanBoard({ initialLeads }: KanbanBoardProps) {
  const [leads, setLeads] = useState(initialLeads);
  const [draggedLeadId, setDraggedLeadId] = useState<string | null>(null);
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
        // Update local state immediately for fast UX
        setLeads(prev => prev.map(l => l.id === draggedLeadId ? { ...l, funnelStage: stage } : l));
        
        // Update server
        await updateLeadStage(draggedLeadId, stage);
      }
    }
    setDraggedLeadId(null);
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
            <div className={styles.columnHeader}>
              <span>{stage.title}</span>
              <span className={styles.columnCount}>{stageLeads.length}</span>
            </div>
            
            <div className={`${styles.columnContent} ${styles.dropZone} ${isDragOver ? styles.dragOver : ''}`}>
              {stageLeads.map(lead => (
                <div
                  key={lead.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, lead.id)}
                  className={`${styles.leadCard} ${draggedLeadId === lead.id ? styles.dragging : ''}`}
                >
                  <div className={styles.leadName}>{lead.name}</div>
                  <div className={styles.leadInfo}>
                    <span>📞 {lead.whatsApp}</span>
                    {lead.interest && <span>🏠 {lead.interest}</span>}
                    <div style={{ marginTop: '0.25rem' }}>
                      <span className={`${styles.badge} ${
                        lead.temperature === 'HOT' ? styles.tempHot :
                        lead.temperature === 'WARM' ? styles.tempWarm :
                        styles.tempCold
                      }`}>
                        {lead.temperature}
                      </span>
                    </div>
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
