"use client";

import React, { useState, useTransition } from 'react';
import { Lead, Deal } from '@prisma/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Phone, Home, Thermometer,
  Tag, Calendar, CheckCircle2, Archive, Clock, Pencil, Copy,
  MessageCircle, User, TrendingUp, AlertTriangle, Info,
  BadgeCheck, ChevronRight
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { TemperatureBadge, StageBadge } from '@/components/ui/Badge';
import { updateLead, archiveLead, scheduleFollowUp } from '../actions';
import { trackLeadContact } from '@/lib/tracking';
import styles from './LeadDetailClient.module.css';

type LeadWithDeals = Lead & { deals: Deal[] };

const STAGES = [
  { value: 'NEW_LEAD',          label: 'Novo Lead',       icon: '🆕' },
  { value: 'CONTACTED',         label: 'Contato Feito',   icon: '📞' },
  { value: 'VIEWING_SCHEDULED', label: 'Visita Agendada', icon: '🏠' },
  { value: 'NEGOTIATION',       label: 'Negociação',      icon: '🤝' },
  { value: 'CLOSED_WON',        label: 'Fechado/Ganho',   icon: '🏆' },
];

const TEMPERATURES = [
  { value: 'COLD', label: '🧊 Frio' },
  { value: 'WARM', label: '🌤 Morno' },
  { value: 'HOT',  label: '🔥 Quente' },
];

const getWhatsAppLink = (phone: string) => {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10 || digits.length === 11) return `https://wa.me/55${digits}`;
  return `https://wa.me/${digits}`;
};

const getInitials = (name: string) =>
  name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();

const getAvatarColor = (name: string) => {
  const colors = [
    ['#4f46e5', '#7c3aed'],
    ['#0891b2', '#0e7490'],
    ['#059669', '#047857'],
    ['#d97706', '#b45309'],
    ['#dc2626', '#b91c1c'],
  ];
  const idx = name.charCodeAt(0) % colors.length;
  return colors[idx];
};

import { CloseDealModal } from '@/components/modals/CloseDealModal';

/* ── Archive Modal ── */
interface ArchiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  isPending: boolean;
}

function ArchiveModal({ isOpen, onClose, onConfirm, isPending }: ArchiveModalProps) {
  const [reason, setReason] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) return;
    onConfirm(reason.trim());
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="📦 Arquivar Lead">
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div className={styles.modalInfoBox} style={{ borderLeftColor: 'var(--text-tertiary)' }}>
          <AlertTriangle size={14} style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} />
          <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
            Informe o motivo do arquivamento. Este registro ficará visível para o administrador.
          </p>
        </div>
        <Textarea
          label="Motivo do arquivamento *"
          placeholder="Ex: Cliente não tem interesse no momento, comprou com outro corretor..."
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
          required
          autoFocus
        />
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
          <Button type="button" variant="secondary" onClick={onClose} disabled={isPending}>Cancelar</Button>
          <Button type="submit" variant="danger" isLoading={isPending} disabled={!reason.trim()}>
            <Archive size={14} style={{ marginRight: '0.25rem' }} />
            Arquivar Lead
          </Button>
        </div>
      </form>
    </Modal>
  );
}

/* ── Follow-up Modal ── */
interface FollowUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (date: Date) => void;
  isPending: boolean;
}

function FollowUpModal({ isOpen, onClose, onConfirm, isPending }: FollowUpModalProps) {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const year  = tomorrow.getFullYear();
  const month = String(tomorrow.getMonth() + 1).padStart(2, '0');
  const day   = String(tomorrow.getDate()).padStart(2, '0');
  const tomorrowStr = `${year}-${month}-${day}`;

  const [dateStr, setDateStr] = useState(tomorrowStr);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dateStr) return;
    onConfirm(new Date(dateStr + 'T00:00:00'));
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="🔁 Agendar Follow-up">
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div className={styles.modalInfoBox} style={{ borderLeftColor: '#3b82f6' }}>
          <Info size={14} style={{ color: '#3b82f6', flexShrink: 0 }} />
          <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
            O lead será removido do kanban e voltará automaticamente para{' '}
            <strong>Novo Lead</strong> na data selecionada.
          </p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
          <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
            Data do follow-up *
          </label>
          <input
            type="date"
            value={dateStr}
            min={tomorrowStr}
            onChange={(e) => setDateStr(e.target.value)}
            required
            className={styles.dateInput}
          />
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
          <Button type="button" variant="secondary" onClick={onClose} disabled={isPending}>Cancelar</Button>
          <Button type="submit" isLoading={isPending} disabled={!dateStr}>
            <Clock size={14} style={{ marginRight: '0.25rem' }} />
            Confirmar Follow-up
          </Button>
        </div>
      </form>
    </Modal>
  );
}

/* ── Edit Lead Modal ── */
interface EditLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  lead: Lead;
  isAdmin?: boolean;
}

function EditLeadModal({ isOpen, onClose, lead, isAdmin }: EditLeadModalProps) {
  const [isPending, startTransition] = useTransition();
  const [name,     setName]     = useState(lead.name);
  const [whatsApp, setWhatsApp] = useState(lead.whatsApp);
  const [interest, setInterest] = useState(lead.interest || '');
  const [source,   setSource]   = useState(lead.source   || '');
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      await updateLead(lead.id, {
        name,
        whatsApp,
        interest: interest || undefined,
        source: source || undefined,
      });
      onClose();
      router.refresh();
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="✏️ Editar Lead">
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <Input label="Nome *" value={name} onChange={(e) => setName(e.target.value)} required />
        <Input
          label="WhatsApp *"
          value={whatsApp}
          onChange={(e) => setWhatsApp(e.target.value)}
          required
          disabled={!isAdmin}
        />
        <Input label="Interesse" value={interest} onChange={(e) => setInterest(e.target.value)} />
        <Input label="Origem"    value={source}   onChange={(e) => setSource(e.target.value)} />
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
          <Button type="button" variant="secondary" onClick={onClose} disabled={isPending}>Cancelar</Button>
          <Button type="submit" isLoading={isPending}>Salvar Alterações</Button>
        </div>
      </form>
    </Modal>
  );
}

/* ══════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════ */
export default function LeadDetailClient({ lead, isAdmin }: { lead: LeadWithDeals; isAdmin?: boolean }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isDealModalOpen,     setIsDealModalOpen]     = useState(false);
  const [isArchiveModalOpen,  setIsArchiveModalOpen]  = useState(false);
  const [isFollowUpModalOpen, setIsFollowUpModalOpen] = useState(false);
  const [isEditModalOpen,     setIsEditModalOpen]     = useState(false);
  const [copied, setCopied] = useState(false);

  const handleStageChange = (newStage: string) => {
    startTransition(async () => {
      await updateLead(lead.id, { funnelStage: newStage as Lead['funnelStage'] });
      router.refresh();
    });
  };

  const handleTempChange = (newTemp: string) => {
    startTransition(async () => {
      await updateLead(lead.id, { temperature: newTemp as Lead['temperature'] });
      router.refresh();
    });
  };

  const handleArchiveConfirm = (reason: string) => {
    startTransition(async () => {
      await archiveLead(lead.id, reason);
      router.push('/leads');
    });
  };

  const handleFollowUpConfirm = (date: Date) => {
    startTransition(async () => {
      await scheduleFollowUp(lead.id, date);
      router.push('/leads');
    });
  };

  const handleCopyPhone = () => {
    navigator.clipboard.writeText(lead.whatsApp);
    trackLeadContact(lead.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const totalCommission = lead.deals.reduce((sum, d) => sum + (d.firstMonthCommission ?? 0), 0);

  const formatCurrency = (v: number) =>
    v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const formatDate = (d: Date) =>
    new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });

  const currentStageIndex = STAGES.findIndex(s => s.value === lead.funnelStage);
  const [avatarFrom, avatarTo] = getAvatarColor(lead.name);
  const initials = getInitials(lead.name);

  return (
    <div className={styles.page}>

      {/* ── Top Bar ── */}
      <div className={styles.topBar}>
        <Link href="/leads" className={styles.backLink}>
          <ArrowLeft size={15} />
          Voltar aos Leads
        </Link>

        <div className={styles.actions}>
          {!lead.isArchived && (
            <Button variant="secondary" size="sm" onClick={() => setIsFollowUpModalOpen(true)} disabled={isPending}>
              <Clock size={13} style={{ marginRight: '0.2rem' }} />
              Follow-up
            </Button>
          )}
          {!lead.isArchived && (
            <Button variant="danger" size="sm" onClick={() => setIsArchiveModalOpen(true)} disabled={isPending}>
              <Archive size={13} style={{ marginRight: '0.2rem' }} />
              Arquivar
            </Button>
          )}
          {!lead.isArchived && lead.funnelStage !== 'CLOSED_WON' && (
            <Button size="sm" onClick={() => setIsDealModalOpen(true)} disabled={isPending}>
              <CheckCircle2 size={13} style={{ marginRight: '0.2rem' }} />
              Fechar Negócio
            </Button>
          )}
        </div>
      </div>

      {/* ── Status Banners ── */}
      {lead.isArchived && (
        <div className={`${styles.statusBanner} ${styles.bannerArchived}`}>
          <Archive size={15} />
          <div>
            <strong>Lead arquivado</strong>
            {lead.archiveReason && <span className={styles.bannerSub}>Motivo: {lead.archiveReason}</span>}
          </div>
        </div>
      )}

      {!lead.isArchived && lead.isFollowUp && lead.followUpDate && (
        <div className={`${styles.statusBanner} ${styles.bannerFollowUp}`}>
          <Clock size={15} />
          <div>
            <strong>Follow-up agendado</strong>
            <span className={styles.bannerSub}>
              Retorna ao kanban em{' '}
              <strong>
                {new Date(lead.followUpDate).toLocaleDateString('pt-BR', {
                  day: '2-digit', month: 'long', year: 'numeric',
                })}
              </strong>
            </span>
          </div>
        </div>
      )}

      {/* ── Hero Header ── */}
      <div className={styles.hero}>
        <div
          className={styles.heroAvatar}
          style={{ background: `linear-gradient(135deg, ${avatarFrom}, ${avatarTo})` }}
        >
          {initials}
        </div>
        <div className={styles.heroInfo}>
          <div className={styles.heroNameRow}>
            <h1 className={styles.heroName}>{lead.name}</h1>
            {lead.funnelStage === 'CLOSED_WON' && (
              <span className={styles.wonBadge}>
                <BadgeCheck size={14} />
                Negócio Fechado
              </span>
            )}
            {!lead.isArchived && (
              <button
                className={styles.editIconBtn}
                onClick={() => setIsEditModalOpen(true)}
                title="Editar lead"
                disabled={isPending}
              >
                <Pencil size={13} />
              </button>
            )}
          </div>
          <div className={styles.heroMeta}>
            <a
              href={getWhatsAppLink(lead.whatsApp)}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.heroPhone}
              onClick={() => trackLeadContact(lead.id)}
            >
              <MessageCircle size={13} />
              {lead.whatsApp}
            </a>
            <button className={styles.copyBtn} onClick={handleCopyPhone} title="Copiar número">
              <Copy size={12} />
              {copied ? 'Copiado!' : 'Copiar'}
            </button>
            {lead.source && (
              <span className={styles.heroTag}>
                <Tag size={11} />
                {lead.source}
              </span>
            )}
            <span className={styles.heroTag}>
              <Calendar size={11} />
              {formatDate(lead.createdAt)}
            </span>
          </div>
        </div>
        <div className={styles.heroBadges}>
          <TemperatureBadge temperature={lead.temperature} />
          <StageBadge stage={lead.funnelStage} />
        </div>
      </div>

      {/* ── Funnel Progress ── */}
      {!lead.isArchived && (
        <div className={styles.funnelBar}>
          {STAGES.map((stage, idx) => {
            const isDone    = idx < currentStageIndex;
            const isCurrent = idx === currentStageIndex;
            return (
              <React.Fragment key={stage.value}>
                <div
                  className={`${styles.funnelStep} ${isDone ? styles.funnelDone : ''} ${isCurrent ? styles.funnelCurrent : ''}`}
                  title={stage.label}
                >
                  <span className={styles.funnelEmoji}>{stage.icon}</span>
                  <span className={styles.funnelLabel}>{stage.label}</span>
                  {/* {isCurrent && <span className={styles.funnelDot} />} */}
                </div>
                {idx < STAGES.length - 1 && (
                  <ChevronRight size={14} className={`${styles.funnelArrow} ${isDone ? styles.funnelArrowDone : ''}`} />
                )}
              </React.Fragment>
            );
          })}
        </div>
      )}

      {/* ── Main Grid ── */}
      <div className={styles.grid}>

        {/* ── Info Card ── */}
        <Card className={styles.infoCard}>
          <CardHeader style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexDirection: 'row' }}>
            <CardTitle>
              <User size={15} style={{ display: 'inline', marginRight: '0.4rem', verticalAlign: 'middle', color: 'var(--primary)' }} />
              Informações do Lead
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={styles.infoList}>

              {/* WhatsApp */}
              <div className={styles.infoRow}>
                <div className={styles.infoIcon}>
                  <Phone size={14} />
                </div>
                <div className={styles.infoBody}>
                  <span className={styles.infoLabel}>WhatsApp</span>
                  <div className={styles.infoValueRow}>
                    <a
                      href={getWhatsAppLink(lead.whatsApp)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.infoLink}
                      onClick={() => trackLeadContact(lead.id)}
                    >
                      {lead.whatsApp}
                    </a>
                    <button className={styles.inlineCopyBtn} onClick={handleCopyPhone} title="Copiar">
                      <Copy size={12} />
                      {copied ? 'Copiado!' : 'Copiar'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Interesse */}
              {lead.interest && (
                <div className={styles.infoRow}>
                  <div className={styles.infoIcon}>
                    <Home size={14} />
                  </div>
                  <div className={styles.infoBody}>
                    <span className={styles.infoLabel}>Interesse / Imóvel</span>
                    <span className={styles.infoValue}>{lead.interest}</span>
                  </div>
                </div>
              )}

              {/* Origem */}
              {lead.source && (
                <div className={styles.infoRow}>
                  <div className={styles.infoIcon}>
                    <Tag size={14} />
                  </div>
                  <div className={styles.infoBody}>
                    <span className={styles.infoLabel}>Origem</span>
                    <span className={styles.infoValue}>{lead.source}</span>
                  </div>
                </div>
              )}

              {/* Criado em */}
              <div className={styles.infoRow}>
                <div className={styles.infoIcon}>
                  <Calendar size={14} />
                </div>
                <div className={styles.infoBody}>
                  <span className={styles.infoLabel}>Criado em</span>
                  <span className={styles.infoValue}>{formatDate(lead.createdAt)}</span>
                </div>
              </div>

              {/* Temperatura */}
              <div className={styles.infoRow}>
                <div className={styles.infoIcon}>
                  <Thermometer size={14} />
                </div>
                <div className={styles.infoBody}>
                  <span className={styles.infoLabel}>Temperatura</span>
                  <TemperatureBadge temperature={lead.temperature} />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── Side Stack ── */}
        <div className={styles.sideStack}>

          {/* Status / Funil */}
          <Card>
            <CardHeader>
              <CardTitle>
                <TrendingUp size={15} style={{ display: 'inline', marginRight: '0.4rem', verticalAlign: 'middle', color: 'var(--primary)' }} />
                Status no Funil
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={styles.currentBadge}>
                <StageBadge stage={lead.funnelStage} />
              </div>
              <Select
                label="Mover para etapa"
                value={lead.funnelStage}
                onChange={(e) => handleStageChange(e.target.value)}
                disabled={isPending}
              >
                {STAGES.map(s => (
                  <option key={s.value} value={s.value}>{s.icon} {s.label}</option>
                ))}
              </Select>
              <div className={styles.tempSelect}>
                <Select
                  label="Temperatura"
                  value={lead.temperature}
                  onChange={(e) => handleTempChange(e.target.value)}
                  disabled={isPending}
                >
                  {TEMPERATURES.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Deals Card */}
          {lead.deals.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>
                  <CheckCircle2 size={15} style={{ display: 'inline', marginRight: '0.4rem', verticalAlign: 'middle', color: 'var(--success)' }} />
                  Negócios Fechados ({lead.deals.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {lead.deals.map((deal) => (
                  <div key={deal.id} className={styles.dealItem}>
                    <div className={styles.dealDate}>{formatDate(deal.closedAt)}</div>
                    {deal.rentAmount != null && (
                      <div className={styles.dealRow}>
                        <span>Valor do Aluguel</span>
                        <strong>{formatCurrency(deal.rentAmount)}</strong>
                      </div>
                    )}
                    {deal.firstMonthCommission != null && (
                      <div className={styles.dealRow}>
                        <span>Comissão 1º mês</span>
                        <strong>{formatCurrency(deal.firstMonthCommission)}</strong>
                      </div>
                    )}
                    {deal.recurringManagementFee != null && (
                      <div className={styles.dealRow}>
                        <span>Taxa adm. mensal</span>
                        <strong>{formatCurrency(deal.recurringManagementFee)}</strong>
                      </div>
                    )}
                  </div>
                ))}
                {totalCommission > 0 && (
                  <div className={styles.totalRow}>
                    <span>Total de Comissões</span>
                    <strong className={styles.totalValue}>{formatCurrency(totalCommission)}</strong>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* ── Modals ── */}
      <CloseDealModal isOpen={isDealModalOpen} onClose={() => setIsDealModalOpen(false)} leadId={lead.id} />
      <ArchiveModal  isOpen={isArchiveModalOpen}  onClose={() => setIsArchiveModalOpen(false)}  onConfirm={handleArchiveConfirm}  isPending={isPending} />
      <FollowUpModal isOpen={isFollowUpModalOpen} onClose={() => setIsFollowUpModalOpen(false)} onConfirm={handleFollowUpConfirm} isPending={isPending} />
      <EditLeadModal isOpen={isEditModalOpen}     onClose={() => setIsEditModalOpen(false)}     lead={lead} isAdmin={isAdmin} />
    </div>
  );
}
