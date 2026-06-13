"use client";

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Lead, FunnelStage } from '@prisma/client';
import { updateLeadStage, updateLead } from '@/app/leads/actions';
import { TemperatureBadge } from '@/components/ui/Badge';
import { CloseDealModal } from '@/components/modals/CloseDealModal';
import { LeadExpectationModal } from '@/components/modals/LeadExpectationModal';
import { FollowUpModal } from '@/components/modals/FollowUpModal';
import { trackLeadContact } from '@/lib/tracking';
import { KanbanPopups } from './KanbanPopups';
import styles from './KanbanBoard.module.css';

interface KanbanBoardProps {
  initialLeads: Lead[];
}

const STAGES: { id: FunnelStage; title: string; color: string; emoji: string }[] = [
  { id: 'NEW_LEAD',          title: 'Novo Lead',        color: '#64748b', emoji: '🌱' },
  { id: 'CONTACTED',         title: 'Contato Feito',    color: '#3b82f6', emoji: '📞' },
  { id: 'VIEWING_SCHEDULED', title: 'Visita Agendada',  color: '#8b5cf6', emoji: '🏠' },
  { id: 'NEGOTIATION',       title: 'Negociação',       color: '#e11d48', emoji: '🤝' },
  { id: 'CLOSED_WON',        title: 'Fechado',          color: '#059669', emoji: '✅' },
];

const TEMP_CYCLE = ['COLD', 'WARM', 'HOT'] as const;
type Temperature = typeof TEMP_CYCLE[number];

const TEMP_LABEL: Record<Temperature, string> = {
  COLD: '🧊 Frio',
  WARM: '🌤 Morno',
  HOT:  '🔥 Quente',
};

const getWhatsAppLink = (phone: string) => {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10 || digits.length === 11) {
    return `https://wa.me/55${digits}`;
  }
  return `https://wa.me/${digits}`;
};



/* ─── Lead Card ─── */
interface LeadCardProps {
  lead: Lead;
  isDragging: boolean;
  isGhost?: boolean;
  stageColor: string;
  onDragStart: (e: React.DragEvent, id: string) => void;
  onDragEnd: () => void;
  onInterestSave: (leadId: string, interest: string) => Promise<void>;
  onTemperatureCycle: (leadId: string, next: Temperature) => Promise<void>;
}

function LeadCard({
  lead, isDragging, isGhost = false, stageColor,
  onDragStart, onDragEnd, onInterestSave, onTemperatureCycle
}: LeadCardProps) {
  const [isEditingInterest, setIsEditingInterest] = useState(false);
  const [interestDraft, setInterestDraft] = useState('');
  const [isSavingInterest, setIsSavingInterest] = useState(false);
  const [isCycling, setIsCycling] = useState(false);
  const interestInputRef = useRef<HTMLInputElement>(null);

  function cycleTemperature(e: React.MouseEvent) {
    e.stopPropagation();
    e.preventDefault();
    if (isCycling || isGhost) return;
    const currentIdx = TEMP_CYCLE.indexOf(lead.temperature as Temperature);
    const next = TEMP_CYCLE[(currentIdx + 1) % TEMP_CYCLE.length];
    setIsCycling(true);
    onTemperatureCycle(lead.id, next).finally(() => setIsCycling(false));
  }

  function startEditInterest(e: React.MouseEvent) {
    e.stopPropagation();
    e.preventDefault();
    setInterestDraft(lead.interest || '');
    setIsEditingInterest(true);
    setTimeout(() => {
      interestInputRef.current?.focus();
      interestInputRef.current?.select();
    }, 20);
  }

  function cancelEditInterest() {
    setIsEditingInterest(false);
  }

  async function saveInterest() {
    if (isSavingInterest) return;
    setIsSavingInterest(true);
    await onInterestSave(lead.id, interestDraft.trim());
    setIsSavingInterest(false);
    setIsEditingInterest(false);
  }

  function handleInterestKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') { e.preventDefault(); saveInterest(); }
    if (e.key === 'Escape') { e.preventDefault(); cancelEditInterest(); }
  }

  const daysUntil = isGhost && lead.followUpDate
    ? Math.ceil((new Date(lead.followUpDate).getTime() - Date.now()) / 86400000)
    : null;

  return (
    <div
      draggable={!isGhost && !isEditingInterest}
      onDragStart={isGhost || isEditingInterest ? undefined : (e) => onDragStart(e, lead.id)}
      onDragEnd={isGhost ? undefined : onDragEnd}
      className={`${styles.leadCard} ${isDragging ? styles.dragging : ''} ${isGhost ? styles.ghostCard : ''}`}
      style={{ '--stage-color': stageColor } as React.CSSProperties}
      title={isGhost && lead.followUpDate ? `Follow-up: ${new Date(lead.followUpDate).toLocaleDateString('pt-BR')}` : undefined}
    >

      {/* Ghost banner */}
      {isGhost && (
        <div className={styles.ghostBanner}>
          <span className={styles.ghostIcon}>🕐</span>
          <span className={styles.ghostLabel}>
            {daysUntil === 0 ? 'Follow-up hoje' : daysUntil === 1 ? 'Em 1 dia' : `Em ${daysUntil} dias`}
          </span>
          {lead.followUpDate && (
            <span className={styles.ghostDate}>
              {new Date(lead.followUpDate).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
            </span>
          )}
        </div>
      )}

      {/* Card top: name */}
      <div className={styles.cardTop}>
        <Link href={`/leads/${lead.id}`} className={styles.leadName}>
          {lead.name}
        </Link>
      </div>

      {/* Info section */}
      <div className={styles.leadInfo}>

        {/* Phone row */}
        <div className={styles.leadPhoneRow}>
          <span className={styles.leadPhone}>
            <span className={styles.phoneIcon}>📞</span>
            {lead.whatsApp}
          </span>
          {!isGhost && (
            <div className={styles.waBtnGroup}>
              <button
                type="button"
                className={`${styles.waBtn} ${styles.waBtnCopy}`}
                title="Copiar número"
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  navigator.clipboard.writeText(lead.whatsApp);
                  trackLeadContact(lead.id);
                }}
              >
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                </svg>
              </button>
              <a
                href={getWhatsAppLink(lead.whatsApp)}
                target="_blank"
                rel="noopener noreferrer"
                className={`${styles.waBtn} ${styles.waBtnWa}`}
                title="Abrir WhatsApp"
                onClick={(e) => {
                  e.stopPropagation();
                  trackLeadContact(lead.id);
                }}
              >
                <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                WA
              </a>
            </div>
          )}
        </div>

        {/* Interest row — inline edit */}
        <div className={`${styles.leadInterestRow} ${isEditingInterest ? styles.leadInterestRowEditing : ''}`}>
          {isEditingInterest ? (
            <>
              <input
                ref={interestInputRef}
                type="text"
                className={styles.interestInlineInput}
                value={interestDraft}
                onChange={(e) => setInterestDraft(e.target.value)}
                onKeyDown={handleInterestKeyDown}
                onBlur={saveInterest}
                placeholder="Ex: Apto 2 quartos, Zona Sul..."
                disabled={isSavingInterest}
                onClick={(e) => e.stopPropagation()}
              />
              <button
                type="button"
                className={styles.interestInlineSave}
                onMouseDown={(e) => { e.preventDefault(); saveInterest(); }}
                disabled={isSavingInterest}
                title="Salvar (Enter)"
              >
                ✓
              </button>
              <button
                type="button"
                className={styles.interestInlineCancel}
                onMouseDown={(e) => { e.preventDefault(); cancelEditInterest(); }}
                title="Cancelar (Esc)"
              >
                ✕
              </button>
            </>
          ) : (
            <>
              {lead.interest ? (
                <span className={styles.leadInterestText}>🏠 {lead.interest}</span>
              ) : (
                <span className={styles.leadInterestEmpty}>Sem interesse registrado</span>
              )}
              {!isGhost && (
                <button
                  type="button"
                  className={styles.interestEditBtn}
                  title="Editar interesse"
                  onClick={startEditInterest}
                >
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
                </button>
              )}
            </>
          )}
        </div>

      </div>

      {/* Footer */}
      <div className={styles.leadFooter}>
        <div className={styles.footerLeft}>
          <button
            type="button"
            className={`${styles.tempCycleBtn} ${isCycling ? styles.tempCycling : ''}`}
            onClick={cycleTemperature}
            disabled={isGhost}
            title={isGhost ? undefined : `${TEMP_LABEL[lead.temperature as Temperature] ?? lead.temperature} — clique para mudar`}
          >
            <TemperatureBadge temperature={lead.temperature} />
          </button>

          {lead.firstContactedAt ? (
            <span className={styles.contactedBadge}>✓ Contatado</span>
          ) : (
            <span className={styles.pendingBadge}>⏳ Pendente</span>
          )}
        </div>

        {lead.source && (
          <span className={styles.source}>{lead.source}</span>
        )}
      </div>
    </div>
  );
}

/* ─── Main Board ─── */
export function KanbanBoard({ initialLeads }: KanbanBoardProps) {
  const [leads, setLeads] = useState(initialLeads);
  const [draggedLeadId, setDraggedLeadId] = useState<string | null>(null);
  const [expandedColumns, setExpandedColumns] = useState<Record<string, boolean>>({});

  const boardRef = useRef<HTMLDivElement>(null);
  const [isScrolling, setIsScrolling] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  useEffect(() => {
    setLeads(initialLeads);
  }, [initialLeads]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('kanbanExpandedColumns');
      if (saved) setExpandedColumns(JSON.parse(saved));
    } catch (e) {
      console.error('Failed to load expanded columns preference', e);
    }
  }, []);

  const [dragOverStage, setDragOverStage] = useState<FunnelStage | null>(null);
  const [pendingCloseDealLeadId, setPendingCloseDealLeadId] = useState<string | null>(null);
  const [pendingExpectationLeadId, setPendingExpectationLeadId] = useState<string | null>(null);
  const [pendingExpectationStage, setPendingExpectationStage] = useState<FunnelStage | null>(null);
  const [pendingFollowUpLeadId, setPendingFollowUpLeadId] = useState<string | null>(null);

  const toggleExpandColumn = (stageId: string) => {
    setExpandedColumns(prev => {
      const next = { ...prev, [stageId]: !prev[stageId] };
      try { localStorage.setItem('kanbanExpandedColumns', JSON.stringify(next)); } catch {}
      return next;
    });
  };

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
        if (stage === 'CLOSED_WON') {
          setPendingCloseDealLeadId(draggedLeadId);
        } else if (stage === 'VIEWING_SCHEDULED' || stage === 'NEGOTIATION') {
          setPendingExpectationLeadId(draggedLeadId);
          setPendingExpectationStage(stage);
        } else {
          setLeads(prev => prev.map(l => l.id === draggedLeadId ? { ...l, funnelStage: stage } : l));
          await updateLeadStage(draggedLeadId, stage);
        }
      }
    }
    setDraggedLeadId(null);
  };

  const handleDragEnd = () => {
    setDraggedLeadId(null);
    setDragOverStage(null);
  };

  // Drag-to-scroll
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!boardRef.current) return;
    const target = e.target as HTMLElement;
    if (target.closest(`.${styles.leadCard}`) || target.closest('button') || target.closest('a')) return;
    setIsScrolling(true);
    setStartX(e.pageX - boardRef.current.offsetLeft);
    setScrollLeft(boardRef.current.scrollLeft);
  };

  const handleMouseLeave = () => setIsScrolling(false);
  const handleMouseUp = () => setIsScrolling(false);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isScrolling || !boardRef.current) return;
    e.preventDefault();
    const x = e.pageX - boardRef.current.offsetLeft;
    boardRef.current.scrollLeft = scrollLeft - (x - startX) * 1.5;
  };

  const handleInterestSave = async (leadId: string, interest: string) => {
    setLeads(prev => prev.map(l => l.id === leadId ? { ...l, interest } : l));
    await updateLead(leadId, { interest });
  };

  const handleTemperatureCycle = async (leadId: string, next: Temperature) => {
    setLeads(prev => prev.map(l => l.id === leadId ? { ...l, temperature: next } : l));
    await updateLead(leadId, { temperature: next });
  };

  return (
    <div className={styles.container}>
      <KanbanPopups />

      <div
        ref={boardRef}
        className={`${styles.board} ${isScrolling ? styles.isScrolling : ''}`}
        onMouseDown={handleMouseDown}
        onMouseLeave={handleMouseLeave}
        onMouseUp={handleMouseUp}
        onMouseMove={handleMouseMove}
      >
        {STAGES.map(stage => {
          const now = new Date();
          const allStageLeads = leads.filter(l => l.funnelStage === stage.id);
          const activeLeads = allStageLeads.filter(
            l => !(l.isFollowUp && l.followUpDate && new Date(l.followUpDate) > now)
          );
          const ghostLeads = allStageLeads.filter(
            l => l.isFollowUp && l.followUpDate && new Date(l.followUpDate) > now
          );
          const isDragOver = dragOverStage === stage.id;
          const isExpanded = expandedColumns[stage.id];

          return (
            <div
              key={stage.id}
              className={`${styles.column} ${isDragOver ? styles.dragOver : ''} ${isExpanded ? styles.expandedColumn : ''}`}
              onDragOver={(e) => handleDragOver(e, stage.id)}
              onDrop={(e) => handleDrop(e, stage.id)}
              style={{ '--stage-color': stage.color } as React.CSSProperties}
            >
              {/* Column header */}
              <div className={styles.columnHeader}>
                <div className={styles.columnHeaderLeft}>
                  <span className={styles.columnDot} />
                  <span className={styles.columnTitle}>{stage.title}</span>
                  <span className={styles.columnCount}>{activeLeads.length}</span>
                  {ghostLeads.length > 0 && (
                    <span className={styles.ghostCount} title={`${ghostLeads.length} aguardando follow-up`}>
                      🕐 {ghostLeads.length}
                    </span>
                  )}
                </div>
                {isExpanded && (
                  <button
                    onClick={() => toggleExpandColumn(stage.id)}
                    className={styles.collapseColumnBtn}
                    title="Recolher coluna"
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 14h6v6"/><path d="M20 10h-6V4"/>
                      <path d="M14 10l7-7"/><path d="M3 21l7-7"/>
                    </svg>
                  </button>
                )}
              </div>

              {/* Column content */}
              <div className={`${styles.columnContent} ${isDragOver ? styles.dropActive : ''} ${isExpanded ? styles.expandedContent : ''}`}>

                {/* Expand prompt */}
                {activeLeads.length >= 4 && !isExpanded && (
                  <div className={styles.expandPromptPopup}>
                    <span className={styles.expandPromptText}>Coluna cheia</span>
                    <button
                      type="button"
                      onClick={() => toggleExpandColumn(stage.id)}
                      className={styles.expandPromptBtn}
                    >
                      Expandir
                    </button>
                  </div>
                )}

                {/* Empty state */}
                {activeLeads.length === 0 && ghostLeads.length === 0 && (
                  <div className={styles.emptyColumn}>
                    <span className={styles.emptyColumnIcon}>{stage.emoji}</span>
                    Arraste um lead aqui
                  </div>
                )}

                {/* Active leads */}
                {activeLeads.map(lead => (
                  <div key={lead.id} className={styles.cardWrapper}>
                    <LeadCard
                      lead={lead}
                      isDragging={draggedLeadId === lead.id}
                      stageColor={stage.color}
                      onDragStart={handleDragStart}
                      onDragEnd={handleDragEnd}
                      onInterestSave={handleInterestSave}
                      onTemperatureCycle={handleTemperatureCycle}
                    />
                    {/* Floating action pills */}
                    <div className={styles.cardActions}>
                      {/* Follow-up pill */}
                      <button
                        type="button"
                        className={styles.cardActionBtn}
                        data-variant="followup"
                        title="Agendar Follow-up"
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          setPendingFollowUpLeadId(lead.id);
                        }}
                      >
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                          <line x1="16" y1="2" x2="16" y2="6"/>
                          <line x1="8" y1="2" x2="8" y2="6"/>
                          <line x1="3" y1="10" x2="21" y2="10"/>
                          <line x1="12" y1="14" x2="12" y2="18"/>
                          <line x1="10" y1="16" x2="14" y2="16"/>
                        </svg>
                        <span>Follow-up</span>
                      </button>
                      {/* AI pill */}
                      <button
                        type="button"
                        className={styles.cardActionBtn}
                        data-variant="ai"
                        title="Gerar mensagem com IA"
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          const msg = lead.interest
                            ? `Gere uma mensagem de follow-up persuasiva para o lead ${lead.name}, que tem interesse em: ${lead.interest}.`
                            : `Gere uma mensagem de follow-up persuasiva para o lead ${lead.name}.`;
                          window.dispatchEvent(new CustomEvent('ai-chat-open', { detail: { message: msg } }));
                        }}
                      >
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <path d="M12 3L13.5 8.5L19 10L13.5 11.5L12 17L10.5 11.5L5 10L10.5 8.5Z"/>
                          <path d="M19 3L19.75 5.25L22 6L19.75 6.75L19 9L18.25 6.75L16 6L18.25 5.25Z"/>
                          <path d="M5 17L5.5 18.5L7 19L5.5 19.5L5 21L4.5 19.5L3 19L4.5 18.5Z"/>
                        </svg>
                        <span>IA</span>
                      </button>
                    </div>
                  </div>
                ))}

                {/* Ghost leads */}
                {ghostLeads.length > 0 && (
                  <>
                    <div className={styles.ghostDivider}>
                      <span>🕐 Follow-up ({ghostLeads.length})</span>
                    </div>
                    {ghostLeads.map(lead => (
                      <div key={lead.id} className={styles.cardWrapper}>
                        <LeadCard
                          lead={lead}
                          isDragging={false}
                          isGhost
                          stageColor={stage.color}
                          onDragStart={handleDragStart}
                          onDragEnd={handleDragEnd}
                          onInterestSave={handleInterestSave}
                          onTemperatureCycle={handleTemperatureCycle}
                        />
                      </div>
                    ))}
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modals */}
      {pendingCloseDealLeadId && (
        <CloseDealModal
          isOpen={true}
          onClose={() => setPendingCloseDealLeadId(null)}
          leadId={pendingCloseDealLeadId}
          onSuccess={() => {
            setLeads(prev => prev.map(l =>
              l.id === pendingCloseDealLeadId ? { ...l, funnelStage: 'CLOSED_WON' } : l
            ));
            setPendingCloseDealLeadId(null);
          }}
        />
      )}

      {pendingExpectationLeadId && pendingExpectationStage && (
        <LeadExpectationModal
          isOpen={true}
          onClose={() => {
            setPendingExpectationLeadId(null);
            setPendingExpectationStage(null);
          }}
          leadId={pendingExpectationLeadId}
          targetStage={pendingExpectationStage}
          initialRentAmount={(leads.find(l => l.id === pendingExpectationLeadId) as any)?.expectedRentAmount}
          initialCommission={(leads.find(l => l.id === pendingExpectationLeadId) as any)?.expectedCommission}
          onSuccess={() => {
            setLeads(prev => prev.map(l =>
              l.id === pendingExpectationLeadId ? { ...l, funnelStage: pendingExpectationStage! } : l
            ));
            setPendingExpectationLeadId(null);
            setPendingExpectationStage(null);
          }}
        />
      )}

      {pendingFollowUpLeadId && (
        <FollowUpModal
          isOpen={true}
          onClose={() => setPendingFollowUpLeadId(null)}
          leadId={pendingFollowUpLeadId}
          onSuccess={() => {
            setLeads(prev => prev.map(l =>
              l.id === pendingFollowUpLeadId ? { ...l, isFollowUp: true, funnelStage: 'NEW_LEAD' } : l
            ));
            setPendingFollowUpLeadId(null);
          }}
        />
      )}
    </div>
  );
}
