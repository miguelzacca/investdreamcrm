"use client";

import React, { useState, useTransition } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { createLead } from '@/app/leads/actions';
import {
  User, Phone, Home, Tag, AlertCircle,
  Camera, Share2, Globe, MessageCircle,
  Users, HelpCircle, Search
} from 'lucide-react';
import styles from './NewLeadModal.module.css';

interface NewLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const TEMPERATURE_OPTIONS = [
  {
    value: 'COLD' as const,
    label: 'Frio',
    emoji: '🧊',
    desc: 'Pouco interesse',
    color: '#64748b',
    bg: 'rgba(100,116,139,0.08)',
    border: 'rgba(100,116,139,0.25)',
    activeBg: 'rgba(100,116,139,0.15)',
    activeBorder: '#64748b',
  },
  {
    value: 'WARM' as const,
    label: 'Morno',
    emoji: '🌤',
    desc: 'Interesse moderado',
    color: '#d97706',
    bg: 'rgba(245,158,11,0.08)',
    border: 'rgba(245,158,11,0.25)',
    activeBg: 'rgba(245,158,11,0.15)',
    activeBorder: '#f59e0b',
  },
  {
    value: 'HOT' as const,
    label: 'Quente',
    emoji: '🔥',
    desc: 'Alta intenção de compra',
    color: '#dc2626',
    bg: 'rgba(239,68,68,0.08)',
    border: 'rgba(239,68,68,0.25)',
    activeBg: 'rgba(239,68,68,0.15)',
    activeBorder: '#ef4444',
  },
];

const SOURCE_OPTIONS = [
  { value: 'indicacao', label: 'Indicação', Icon: Users },
  { value: 'instagram', label: 'Instagram', Icon: Camera },
  { value: 'facebook', label: 'Facebook', Icon: Share2 },
  { value: 'google', label: 'Google', Icon: Search },
  { value: 'site', label: 'Site', Icon: Globe },
  { value: 'whatsapp', label: 'WhatsApp', Icon: MessageCircle },
  { value: 'outro', label: 'Outro', Icon: HelpCircle },
];

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

  const [touched, setTouched] = useState({ name: false, whatsApp: false });

  const nameError = touched.name && !form.name.trim() ? 'Nome obrigatório' : '';
  const whatsError = touched.whatsApp && !form.whatsApp.trim() ? 'WhatsApp obrigatório' : '';

  const handleChange = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleClose = () => {
    setForm({ name: '', whatsApp: '', interest: '', temperature: 'COLD', source: '' });
    setTouched({ name: false, whatsApp: false });
    setError('');
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ name: true, whatsApp: true });
    setError('');

    if (!form.name.trim() || !form.whatsApp.trim()) {
      setError('Nome e WhatsApp são obrigatórios.');
      return;
    }

    startTransition(async () => {
      try {
        await createLead(form);
        setForm({ name: '', whatsApp: '', interest: '', temperature: 'COLD', source: '' });
        setTouched({ name: false, whatsApp: false });
        onClose();
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Erro ao criar lead.');
      }
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="✨ Novo Lead" size="md">
      <form onSubmit={handleSubmit} className={styles.form} noValidate>

        {/* Error Banner */}
        {error && (
          <div className={styles.errorBanner}>
            <AlertCircle size={15} />
            {error}
          </div>
        )}

        {/* Section: Identificação */}
        <div className={styles.section}>
          <div className={styles.sectionLabel}>
            <User size={13} />
            Identificação
          </div>
          <div className={styles.row}>
            <div className={styles.inputGroup}>
              <Input
                label="Nome completo *"
                placeholder="Ex: João da Silva"
                value={form.name}
                onChange={(e) => handleChange('name', e.target.value)}
                onBlur={() => setTouched(p => ({ ...p, name: true }))}
                error={nameError}
                required
                autoFocus
              />
            </div>
            <div className={styles.inputGroup}>
              <Input
                label="WhatsApp *"
                placeholder="(11) 99999-9999"
                value={form.whatsApp}
                onChange={(e) => handleChange('whatsApp', e.target.value)}
                onBlur={() => setTouched(p => ({ ...p, whatsApp: true }))}
                error={whatsError}
                required
              />
            </div>
          </div>
        </div>

        {/* Section: Interesse */}
        <div className={styles.section}>
          <div className={styles.sectionLabel}>
            <Home size={13} />
            Interesse
          </div>
          <Input
            label="Imóvel / Interesse"
            placeholder="Ex: Apartamento 2 quartos, Bairro X, até R$ 2.000/mês"
            value={form.interest}
            onChange={(e) => handleChange('interest', e.target.value)}
          />
        </div>

        {/* Section: Temperatura */}
        <div className={styles.section}>
          <div className={styles.sectionLabel}>
            <span style={{ fontSize: '0.8rem' }}>🌡️</span>
            Temperatura do Lead
          </div>
          <div className={styles.tempGrid}>
            {TEMPERATURE_OPTIONS.map(opt => {
              const isActive = form.temperature === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  className={styles.tempChip}
                  onClick={() => handleChange('temperature', opt.value)}
                  style={{
                    background: isActive ? opt.activeBg : opt.bg,
                    borderColor: isActive ? opt.activeBorder : opt.border,
                    color: isActive ? opt.color : 'var(--text-secondary)',
                    transform: isActive ? 'translateY(-1px)' : 'none',
                    boxShadow: isActive ? `0 4px 12px ${opt.color}22` : 'none',
                  }}
                  aria-pressed={isActive}
                >
                  <span className={styles.tempEmoji}>{opt.emoji}</span>
                  <span className={styles.tempLabel}>{opt.label}</span>
                  <span className={styles.tempDesc}>{opt.desc}</span>
                  {isActive && <span className={styles.tempCheck}>✓</span>}
                </button>
              );
            })}
          </div>
        </div>

        {/* Section: Origem */}
        <div className={styles.section}>
          <div className={styles.sectionLabel}>
            <Tag size={13} />
            Origem do Lead
          </div>
          <div className={styles.sourceGrid}>
            {SOURCE_OPTIONS.map(({ value, label, Icon }) => {
              const isActive = form.source === value;
              return (
                <button
                  key={value}
                  type="button"
                  className={styles.sourceChip}
                  onClick={() => handleChange('source', isActive ? '' : value)}
                  aria-pressed={isActive}
                  style={{
                    background: isActive ? 'var(--primary-light)' : 'var(--bg-main)',
                    borderColor: isActive ? 'var(--primary)' : 'var(--border)',
                    color: isActive ? 'var(--primary)' : 'var(--text-secondary)',
                  }}
                >
                  <Icon size={14} />
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className={styles.footer}>
          <Button type="button" variant="secondary" onClick={handleClose} disabled={isPending}>
            Cancelar
          </Button>
          <Button
            type="submit"
            isLoading={isPending}
            disabled={isPending}
          >
            <Phone size={14} style={{ marginRight: '0.35rem' }} />
            Criar Lead
          </Button>
        </div>
      </form>
    </Modal>
  );
}
