"use client";

import React, { useState, useTransition } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { createLead } from '@/app/leads/actions';
import styles from './NewLeadModal.module.css';

interface NewLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NewLeadModal({ isOpen, onClose }: NewLeadModalProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    name: '',
    whatsApp: '',
    interest: '',
    temperature: 'COLD' as 'COLD' | 'WARM' | 'HOT',
    source: '',
  });

  const handleChange = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!form.name.trim() || !form.whatsApp.trim()) {
      setError('Nome e WhatsApp são obrigatórios.');
      return;
    }

    startTransition(async () => {
      try {
        await createLead(form);
        setForm({ name: '', whatsApp: '', interest: '', temperature: 'COLD', source: '' });
        onClose();
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Erro ao criar lead.');
      }
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Novo Lead">
      <form onSubmit={handleSubmit} className={styles.form}>
        {error && <div className={styles.errorBanner}>{error}</div>}

        <div className={styles.row}>
          <Input
            label="Nome completo *"
            placeholder="Ex: João da Silva"
            value={form.name}
            onChange={(e) => handleChange('name', e.target.value)}
            required
          />
          <Input
            label="WhatsApp *"
            placeholder="(11) 99999-9999"
            value={form.whatsApp}
            onChange={(e) => handleChange('whatsApp', e.target.value)}
            required
          />
        </div>

        <Input
          label="Interesse / Imóvel"
          placeholder="Ex: Apartamento 2 quartos, Bairro X"
          value={form.interest}
          onChange={(e) => handleChange('interest', e.target.value)}
        />

        <div className={styles.row}>
          <Select
            label="Temperatura"
            value={form.temperature}
            onChange={(e) => handleChange('temperature', e.target.value)}
          >
            <option value="COLD">🧊 Frio</option>
            <option value="WARM">🌤 Morno</option>
            <option value="HOT">🔥 Quente</option>
          </Select>

          <Select
            label="Origem do Lead"
            value={form.source}
            onChange={(e) => handleChange('source', e.target.value)}
          >
            <option value="">Selecionar...</option>
            <option value="indicacao">Indicação</option>
            <option value="instagram">Instagram</option>
            <option value="facebook">Facebook</option>
            <option value="google">Google</option>
            <option value="site">Site</option>
            <option value="whatsapp">WhatsApp</option>
            <option value="outro">Outro</option>
          </Select>
        </div>

        <div className={styles.footer}>
          <Button type="button" variant="secondary" onClick={onClose} disabled={isPending}>
            Cancelar
          </Button>
          <Button type="submit" isLoading={isPending}>
            Criar Lead
          </Button>
        </div>
      </form>
    </Modal>
  );
}
