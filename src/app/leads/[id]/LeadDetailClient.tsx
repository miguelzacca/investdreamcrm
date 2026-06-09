"use client";

import React, { useState, useTransition } from 'react';
import { Lead, Deal } from '@prisma/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Phone, Home, Thermometer,
  Tag, Calendar, CheckCircle2, Archive, Clock, Pencil
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { TemperatureBadge, StageBadge } from '@/components/ui/Badge';
import { updateLead, archiveLead, createDeal, scheduleFollowUp } from '../actions';
import styles from './LeadDetailClient.module.css';

type LeadWithDeals = Lead & { deals: Deal[] };

const STAGES = [
  { value: 'NEW_LEAD', label: 'Novo Lead' },
  { value: 'CONTACTED', label: 'Contato Feito' },
  { value: 'VIEWING_SCHEDULED', label: 'Visita Agendada' },
  { value: 'NEGOTIATION', label: 'Negociação' },
  { value: 'CLOSED_WON', label: 'Fechado/Ganho' },
];

const TEMPERATURES = [
  { value: 'COLD', label: '🧊 Frio' },
  { value: 'WARM', label: '🌤 Morno' },
  { value: 'HOT', label: '🔥 Quente' },
];

const getWhatsAppLink = (phone: string) => {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10 || digits.length === 11) {
    return `https://wa.me/55${digits}`;
  }
  return `https://wa.me/${digits}`;
};

interface CloseDealModalProps {
  isOpen: boolean;
  onClose: () => void;
  leadId: string;
}

function CloseDealModal({ isOpen, onClose, leadId }: CloseDealModalProps) {
  const [isPending, startTransition] = useTransition();
  const [rentAmount, setRentAmount] = useState('');
  const [firstMonthPct, setFirstMonthPct] = useState('50');
  const [commission, setCommission] = useState('');
  const [recurringPct, setRecurringPct] = useState('10');
  const [fee, setFee] = useState('');
  const router = useRouter();

  // Auto-calculate values when rentAmount or percentages change
  React.useEffect(() => {
    if (rentAmount) {
      const rent = parseFloat(rentAmount);
      if (!isNaN(rent)) {
        if (firstMonthPct) {
          const pct = parseFloat(firstMonthPct);
          // eslint-disable-next-line react-hooks/set-state-in-effect
          if (!isNaN(pct)) setCommission((rent * (pct / 100)).toFixed(2));
        }
        if (recurringPct) {
          const pct = parseFloat(recurringPct);
          if (!isNaN(pct)) setFee((rent * (pct / 100)).toFixed(2));
        }
      }
    }
  }, [rentAmount, firstMonthPct, recurringPct]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      await createDeal({
        leadId,
        rentAmount: rentAmount ? parseFloat(rentAmount) : undefined,
        firstMonthCommission: commission ? parseFloat(commission) : undefined,
        recurringManagementFee: fee ? parseFloat(fee) : undefined,
      });
      onClose();
      router.refresh();
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="🎉 Fechar Negócio">
      <form onSubmit={handleSubmit} className={styles.dealForm}>
        <p className={styles.dealDesc}>
          Registre os valores da locação e comissões.
        </p>
        <Input
          label="Valor Bruto do Aluguel (R$)"
          type="number"
          placeholder="Ex: 6000.00"
          value={rentAmount}
          onChange={(e) => setRentAmount(e.target.value)}
          step="0.01"
          min="0"
          required
        />
        
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'end' }}>
          <Input
            label="% Com. 1º Mês"
            type="number"
            placeholder="Ex: 50"
            value={firstMonthPct}
            onChange={(e) => setFirstMonthPct(e.target.value)}
            step="0.1"
            min="0"
            style={{ width: '100px' }}
          />
          <Input
            label="Comissão Primeiro Mês (R$)"
            type="number"
            placeholder="Ex: 3000.00"
            value={commission}
            onChange={(e) => {
              setCommission(e.target.value);
              setFirstMonthPct(''); // manual override
            }}
            step="0.01"
            min="0"
            style={{ flex: 1 }}
          />
        </div>

        <div style={{ display: 'flex', gap: '1rem', alignItems: 'end' }}>
          <Input
            label="% Adm Mensal"
            type="number"
            placeholder="Ex: 10"
            value={recurringPct}
            onChange={(e) => setRecurringPct(e.target.value)}
            step="0.1"
            min="0"
            style={{ width: '100px' }}
          />
          <Input
            label="Taxa de Adm. Mensal (R$)"
            type="number"
            placeholder="Ex: 600.00"
            value={fee}
            onChange={(e) => {
              setFee(e.target.value);
              setRecurringPct(''); // manual override
            }}
            step="0.01"
            min="0"
            style={{ flex: 1 }}
          />
        </div>

        <div className={styles.dealFooter}>
          <Button type="button" variant="secondary" onClick={onClose} disabled={isPending}>
            Cancelar
          </Button>
          <Button type="submit" isLoading={isPending}>
            Confirmar Fechamento
          </Button>
        </div>
      </form>
    </Modal>
  );
}

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
        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: 0 }}>
          Informe o motivo do arquivamento. Este registro ficará visível para o administrador.
        </p>
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
          <Button type="button" variant="secondary" onClick={onClose} disabled={isPending}>
            Cancelar
          </Button>
          <Button type="submit" variant="danger" isLoading={isPending} disabled={!reason.trim()}>
            <Archive size={14} style={{ marginRight: '0.25rem' }} />
            Arquivar
          </Button>
        </div>
      </form>
    </Modal>
  );
}

interface FollowUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (date: Date) => void;
  isPending: boolean;
}

function FollowUpModal({ isOpen, onClose, onConfirm, isPending }: FollowUpModalProps) {
  // Default date = tomorrow
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  const [dateStr, setDateStr] = useState(tomorrowStr);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dateStr) return;
    onConfirm(new Date(dateStr + 'T00:00:00'));
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="🔁 Agendar Follow-up">
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: 0 }}>
          O lead será removido do kanban e voltará automaticamente para{' '}
          <strong>Novo Lead</strong> na data selecionada.
        </p>
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
            style={{
              padding: '0.5rem 0.75rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border)',
              background: 'var(--bg-input, var(--bg-card))',
              color: 'var(--text-primary)',
              fontSize: '0.9375rem',
              outline: 'none',
              colorScheme: 'dark',
            }}
          />
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
          <Button type="button" variant="secondary" onClick={onClose} disabled={isPending}>
            Cancelar
          </Button>
          <Button type="submit" isLoading={isPending} disabled={!dateStr}>
            <Clock size={14} style={{ marginRight: '0.25rem' }} />
            Confirmar Follow-up
          </Button>
        </div>
      </form>
    </Modal>
  );
}

interface EditLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  lead: Lead;
}

function EditLeadModal({ isOpen, onClose, lead }: EditLeadModalProps) {
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState(lead.name);
  const [whatsApp, setWhatsApp] = useState(lead.whatsApp);
  const [interest, setInterest] = useState(lead.interest || '');
  const [source, setSource] = useState(lead.source || '');
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
        <Input
          label="Nome *"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <Input
          label="WhatsApp *"
          value={whatsApp}
          onChange={(e) => setWhatsApp(e.target.value)}
          required
        />
        <Input
          label="Interesse"
          value={interest}
          onChange={(e) => setInterest(e.target.value)}
        />
        <Input
          label="Origem"
          value={source}
          onChange={(e) => setSource(e.target.value)}
        />
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
          <Button type="button" variant="secondary" onClick={onClose} disabled={isPending}>
            Cancelar
          </Button>
          <Button type="submit" isLoading={isPending}>
            Salvar
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default function LeadDetailClient({ lead, isAdmin }: { lead: LeadWithDeals, isAdmin?: boolean }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isDealModalOpen, setIsDealModalOpen] = useState(false);
  const [isArchiveModalOpen, setIsArchiveModalOpen] = useState(false);
  const [isFollowUpModalOpen, setIsFollowUpModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

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

  const totalCommission = lead.deals.reduce(
    (sum, d) => sum + (d.firstMonthCommission ?? 0),
    0
  );

  const formatCurrency = (v: number) =>
    v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const formatDate = (d: Date) =>
    new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });

  return (
    <div className={styles.page}>
      {/* Back + actions */}
      <div className={styles.topBar}>
        <Link href="/leads" className={styles.backLink}>
          <ArrowLeft size={16} />
          Voltar aos Leads
        </Link>

        <div className={styles.actions}>
          {!lead.isArchived && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsFollowUpModalOpen(true)}
              disabled={isPending}
            >
              <Clock size={14} style={{ marginRight: '0.25rem' }} />
              Follow-up
            </Button>
          )}
          {!lead.isArchived && (
            <Button
              variant="danger"
              size="sm"
              onClick={() => setIsArchiveModalOpen(true)}
              disabled={isPending}
            >
              <Archive size={14} style={{ marginRight: '0.25rem' }} />
              Arquivar
            </Button>
          )}
          {!lead.isArchived && lead.funnelStage !== 'CLOSED_WON' && (
            <Button
              size="sm"
              onClick={() => setIsDealModalOpen(true)}
              disabled={isPending}
            >
              <CheckCircle2 size={14} style={{ marginRight: '0.25rem' }} />
              Fechar Negócio
            </Button>
          )}
        </div>
      </div>

      {/* Archived banner */}
      {lead.isArchived && (
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderLeft: '3px solid var(--text-tertiary)',
          borderRadius: 'var(--radius-md)',
          padding: '0.75rem 1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          fontSize: '0.875rem',
          color: 'var(--text-secondary)',
        }}>
          <Archive size={15} />
          <strong>Lead arquivado.</strong>
          {lead.archiveReason && <span>Motivo: {lead.archiveReason}</span>}
        </div>
      )}

      {/* Follow-up banner */}
      {!lead.isArchived && lead.isFollowUp && lead.followUpDate && (
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderLeft: '3px solid #3b82f6',
          borderRadius: 'var(--radius-md)',
          padding: '0.75rem 1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          fontSize: '0.875rem',
          color: 'var(--text-secondary)',
        }}>
          <Clock size={15} style={{ color: '#3b82f6' }} />
          <strong style={{ color: '#3b82f6' }}>Follow-up agendado.</strong>
          <span>
            Este lead voltará para o kanban em{' '}
            <strong>{new Date(lead.followUpDate).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}</strong>.
          </span>
        </div>
      )}

      <div className={styles.grid}>
        {/* Info Card */}
        <Card className={styles.infoCard}>
          <CardHeader style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexDirection: 'row' }}>
            <CardTitle>Informações do Lead</CardTitle>
            {isAdmin && !lead.isArchived && (
              <Button variant="secondary" size="sm" onClick={() => setIsEditModalOpen(true)} disabled={isPending}>
                <Pencil size={14} style={{ marginRight: '0.25rem' }} />
                Editar
              </Button>
            )}
          </CardHeader>
          <CardContent>
            <div className={styles.infoList}>
              <div className={styles.infoRow}>
                <Phone size={15} className={styles.infoIcon} />
                <div>
                  <span className={styles.infoLabel}>WhatsApp</span>
                  <a
                    href={getWhatsAppLink(lead.whatsApp)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.infoLink}
                  >
                    {lead.whatsApp}
                  </a>
                </div>
              </div>

              {lead.interest && (
                <div className={styles.infoRow}>
                  <Home size={15} className={styles.infoIcon} />
                  <div>
                    <span className={styles.infoLabel}>Interesse</span>
                    <span className={styles.infoValue}>{lead.interest}</span>
                  </div>
                </div>
              )}

              {lead.source && (
                <div className={styles.infoRow}>
                  <Tag size={15} className={styles.infoIcon} />
                  <div>
                    <span className={styles.infoLabel}>Origem</span>
                    <span className={styles.infoValue}>{lead.source}</span>
                  </div>
                </div>
              )}

              <div className={styles.infoRow}>
                <Calendar size={15} className={styles.infoIcon} />
                <div>
                  <span className={styles.infoLabel}>Criado em</span>
                  <span className={styles.infoValue}>{formatDate(lead.createdAt)}</span>
                </div>
              </div>

              <div className={styles.infoRow}>
                <Thermometer size={15} className={styles.infoIcon} />
                <div>
                  <span className={styles.infoLabel}>Temperatura</span>
                  <TemperatureBadge temperature={lead.temperature} />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Status Card */}
        <div className={styles.sideStack}>
          <Card>
            <CardHeader>
              <CardTitle>Status no Funil</CardTitle>
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
                  <option key={s.value} value={s.value}>{s.label}</option>
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
                <CardTitle>Negócios Fechados ({lead.deals.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {lead.deals.map((deal) => (
                  <div key={deal.id} className={styles.dealItem}>
                    <div className={styles.dealDate}>
                      {formatDate(deal.closedAt)}
                    </div>
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

      <CloseDealModal
        isOpen={isDealModalOpen}
        onClose={() => setIsDealModalOpen(false)}
        leadId={lead.id}
      />

      <ArchiveModal
        isOpen={isArchiveModalOpen}
        onClose={() => setIsArchiveModalOpen(false)}
        onConfirm={handleArchiveConfirm}
        isPending={isPending}
      />

      <FollowUpModal
        isOpen={isFollowUpModalOpen}
        onClose={() => setIsFollowUpModalOpen(false)}
        onConfirm={handleFollowUpConfirm}
        isPending={isPending}
      />

      <EditLeadModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        lead={lead}
      />
    </div>
  );
}
