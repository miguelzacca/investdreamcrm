import React from 'react';
import styles from './Badge.module.css';

type BadgeVariant = 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'cold' | 'warm' | 'hot';

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

export function Badge({ variant = 'default', children, className = '' }: BadgeProps) {
  return (
    <span className={`${styles.badge} ${styles[variant]} ${className}`}>
      {children}
    </span>
  );
}

export function TemperatureBadge({ temperature }: { temperature: 'COLD' | 'WARM' | 'HOT' }) {
  const labels = { COLD: '🧊 Frio', WARM: '🌤 Morno', HOT: '🔥 Quente' };
  const variants: Record<string, BadgeVariant> = { COLD: 'cold', WARM: 'warm', HOT: 'hot' };
  return <Badge variant={variants[temperature]}>{labels[temperature]}</Badge>;
}

export function StageBadge({ stage }: { stage: string }) {
  const stageMap: Record<string, string> = {
    NEW_LEAD: 'Novo',
    CONTACTED: 'Contatado',
    VIEWING_SCHEDULED: 'Visita Agendada',
    NEGOTIATION: 'Em Negociação',
    CLOSED_WON: 'Fechado',
  };
  const variant = stage === 'CLOSED_WON' ? 'success' : 'primary';
  return <Badge variant={variant}>{stageMap[stage] || stage}</Badge>;
}
