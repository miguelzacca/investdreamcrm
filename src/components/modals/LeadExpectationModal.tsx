"use client";

import React, { useState, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { updateLeadExpectationAndStage } from '@/app/leads/actions';
import { FunnelStage } from '@prisma/client';
import styles from './LeadExpectationModal.module.css';

interface LeadExpectationModalProps {
  isOpen: boolean;
  onClose: () => void;
  leadId: string;
  targetStage: FunnelStage;
  initialRentAmount?: number | null;
  initialCommission?: number | null;
  onSuccess?: () => void;
}

export function LeadExpectationModal({ 
  isOpen, 
  onClose, 
  leadId, 
  targetStage,
  initialRentAmount,
  initialCommission,
  onSuccess 
}: LeadExpectationModalProps) {
  const [isPending, startTransition] = useTransition();
  const [rentAmount, setRentAmount] = useState(initialRentAmount ? initialRentAmount.toString() : '');
  const [commissionPct, setCommissionPct] = useState('50');
  const [commission, setCommission] = useState(initialCommission ? initialCommission.toString() : '');
  const router = useRouter();

  // If rentAmount or commissionPct changes, recalculate commission unless manually set
  // To keep it simple, we auto-calculate when rent amount changes
  useEffect(() => {
    if (rentAmount) {
      const rent = parseFloat(rentAmount);
      if (!isNaN(rent)) {
        if (commissionPct) {
          const pct = parseFloat(commissionPct);
          if (!isNaN(pct)) setCommission((rent * (pct / 100)).toFixed(2));
        }
      }
    }
  }, [rentAmount, commissionPct]);

  // Se o modal for aberto novamente, inicializamos os estados (importante se mudarmos de lead ou de modal)
  useEffect(() => {
    if (isOpen) {
      setRentAmount(initialRentAmount ? initialRentAmount.toString() : '');
      setCommission(initialCommission ? initialCommission.toString() : '');
      setCommissionPct('50'); // reset default pct
    }
  }, [isOpen, initialRentAmount, initialCommission]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      await updateLeadExpectationAndStage(
        leadId, 
        targetStage,
        rentAmount ? parseFloat(rentAmount) : null,
        commission ? parseFloat(commission) : null
      );
      if (onSuccess) {
        onSuccess();
      }
      onClose();
    });
  };

  const isNegociacao = targetStage === 'NEGOTIATION';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isNegociacao ? "🤝 Negociação: Valores" : "📅 Visita: Valores"}>
      <form onSubmit={handleSubmit} className={styles.expectationForm}>
        <p className={styles.expectationDesc}>
          {isNegociacao 
            ? "Para mover para Negociação, informe a expectativa de valores atualizados."
            : "Para agendar a visita, informe o valor estimado do aluguel."}
        </p>
        
        <Input
          label="Valor Bruto Estimado do Aluguel (R$)"
          type="number"
          placeholder="Ex: 5000.00"
          value={rentAmount}
          onChange={(e) => setRentAmount(e.target.value)}
          step="0.01"
          min="0"
          required
        />
        
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'end' }}>
          <Input
            label="% Com. Estimada"
            type="number"
            placeholder="Ex: 50"
            value={commissionPct}
            onChange={(e) => setCommissionPct(e.target.value)}
            step="0.1"
            min="0"
            style={{ width: '100px' }}
          />
          <Input
            label="Comissão Estimada (R$)"
            type="number"
            placeholder="Ex: 2500.00"
            value={commission}
            onChange={(e) => {
              setCommission(e.target.value);
              setCommissionPct(''); // override manual
            }}
            step="0.01"
            min="0"
            style={{ flex: 1 }}
          />
        </div>

        <div className={styles.expectationFooter}>
          <Button type="button" variant="secondary" onClick={onClose} disabled={isPending}>
            Cancelar Movimentação
          </Button>
          <Button type="submit" isLoading={isPending}>
            Mover Lead e Salvar
          </Button>
        </div>
      </form>
    </Modal>
  );
}
