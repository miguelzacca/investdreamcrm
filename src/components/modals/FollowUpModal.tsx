"use client";

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Clock, Info } from 'lucide-react';
import { scheduleFollowUp } from '@/app/leads/actions';
import styles from './FollowUpModal.module.css';

interface FollowUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  leadId: string;
  onSuccess?: () => void;
}

export function FollowUpModal({ isOpen, onClose, leadId, onSuccess }: FollowUpModalProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

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
    startTransition(async () => {
      await scheduleFollowUp(leadId, new Date(dateStr + 'T00:00:00'));
      if (onSuccess) {
        onSuccess();
      }
      onClose();
      router.refresh();
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="🔁 Agendar Follow-up">
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div className={styles.modalInfoBox}>
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
