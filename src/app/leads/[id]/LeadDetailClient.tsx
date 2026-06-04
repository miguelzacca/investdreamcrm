"use client";

import React, { useState, useTransition } from 'react';
import { Lead, Deal } from '@prisma/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Phone, Home, Thermometer,
  Tag, Calendar, CheckCircle2, Archive
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { TemperatureBadge, StageBadge } from '@/components/ui/Badge';
import { updateLead, archiveLead, createDeal } from '../actions';
import styles from './LeadDetailClient.module.css';

type LeadWithDeals = Lead & { deals: Deal[] };

const STAGES = [
  { value: 'NEW_LEAD', label: 'Novo Lead' },
  { value: 'CONTACTED', label: 'Contato Feito' },
  { value: 'VIEWING_SCHEDULED', label: 'Visita Agendada' },
  { value: 'PROPOSAL', label: 'Proposta' },
  { value: 'NEGOTIATION', label: 'Negociação' },
  { value: 'CLOSED_WON', label: 'Fechado/Ganho' },
];

const TEMPERATURES = [
  { value: 'COLD', label: '🧊 Frio' },
  { value: 'WARM', label: '🌤 Morno' },
  { value: 'HOT', label: '🔥 Quente' },
];

interface CloseDealModalProps {
  isOpen: boolean;
  onClose: () => void;
  leadId: string;
}

function CloseDealModal({ isOpen, onClose, leadId }: CloseDealModalProps) {
  const [isPending, startTransition] = useTransition();
  const [commission, setCommission] = useState('');
  const [fee, setFee] = useState('');
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      await createDeal({
        leadId,
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
          Registre os valores da comissão para este fechamento.
        </p>
        <Input
          label="Comissão Primeiro Mês (R$)"
          type="number"
          placeholder="Ex: 2500.00"
          value={commission}
          onChange={(e) => setCommission(e.target.value)}
          step="0.01"
          min="0"
        />
        <Input
          label="Taxa de Administração Mensal (R$)"
          type="number"
          placeholder="Ex: 150.00"
          value={fee}
          onChange={(e) => setFee(e.target.value)}
          step="0.01"
          min="0"
        />
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

export default function LeadDetailClient({ lead }: { lead: LeadWithDeals }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isDealModalOpen, setIsDealModalOpen] = useState(false);

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

  const handleArchive = () => {
    if (!confirm('Arquivar este lead? Ele não aparecerá mais no funil.')) return;
    startTransition(async () => {
      await archiveLead(lead.id);
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
          <Button
            variant="danger"
            size="sm"
            onClick={handleArchive}
            disabled={isPending}
          >
            <Archive size={14} style={{ marginRight: '0.25rem' }} />
            Arquivar
          </Button>
          {lead.funnelStage !== 'CLOSED_WON' && (
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

      <div className={styles.grid}>
        {/* Info Card */}
        <Card className={styles.infoCard}>
          <CardHeader>
            <CardTitle>Informações do Lead</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={styles.infoList}>
              <div className={styles.infoRow}>
                <Phone size={15} className={styles.infoIcon} />
                <div>
                  <span className={styles.infoLabel}>WhatsApp</span>
                  <a
                    href={`https://wa.me/${lead.whatsApp.replace(/\D/g, '')}`}
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
    </div>
  );
}
