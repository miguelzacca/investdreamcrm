"use client";

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { createDeal } from '@/app/leads/actions';
import styles from './CloseDealModal.module.css';

interface CloseDealModalProps {
  isOpen: boolean;
  onClose: () => void;
  leadId: string;
  onSuccess?: () => void;
}

export function CloseDealModal({ isOpen, onClose, leadId, onSuccess }: CloseDealModalProps) {
  const [isPending, startTransition] = useTransition();
  const [rentAmount, setRentAmount] = useState('');
  const [firstMonthPct, setFirstMonthPct] = useState('50');
  const [commission, setCommission] = useState('');
  const [recurringPct, setRecurringPct] = useState('10');
  const [fee, setFee] = useState('');
  const router = useRouter();

  React.useEffect(() => {
    if (rentAmount) {
      const rent = parseFloat(rentAmount);
      if (!isNaN(rent)) {
        if (firstMonthPct) {
          const pct = parseFloat(firstMonthPct);
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
      if (onSuccess) {
        onSuccess();
      }
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
