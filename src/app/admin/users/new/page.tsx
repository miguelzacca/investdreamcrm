"use client";

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import styles from './NewUserPage.module.css';

export default function NewUserPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [form, setForm] = useState({
    name: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'AGENT',
    whatsApp: '',
  });

  const handleChange = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (form.password !== form.confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }

    if (form.password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.');
      return;
    }

    startTransition(async () => {
      try {
        const res = await fetch('/api/admin/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: form.name,
            username: form.username,
            email: form.email || undefined,
            password: form.password,
            role: form.role,
            whatsApp: form.whatsApp || null,
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          setError(data.error || 'Erro ao criar usuário.');
          return;
        }

        setSuccess(`Agente "${data.name}" criado com sucesso!`);
        setForm({ name: '', username: '', email: '', password: '', confirmPassword: '', role: 'AGENT', whatsApp: '' });
        setTimeout(() => router.push('/admin/team'), 1500);
      } catch {
        setError('Erro de conexão. Tente novamente.');
      }
    });
  };

  return (
    <AppLayout title="Novo Agente">
      <div className={styles.page}>
        <Link href="/admin/team" className={styles.backLink}>
          <ArrowLeft size={16} />
          Voltar à Equipe
        </Link>

        <div className={styles.formWrapper}>
          <Card>
            <CardHeader>
              <CardTitle>Criar Novo Agente</CardTitle>
            </CardHeader>
            <CardContent>
              {error && <div className={styles.errorBanner}>{error}</div>}
              {success && <div className={styles.successBanner}>{success}</div>}

              <form onSubmit={handleSubmit} className={styles.form}>
                <div className={styles.row}>
                  <Input
                    label="Nome completo *"
                    placeholder="Ex: Ana Souza"
                    value={form.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    required
                    disabled={isPending}
                  />
                  <Input
                    label="Usuário (login) *"
                    placeholder="Ex: ana.souza"
                    value={form.username}
                    onChange={(e) => handleChange('username', e.target.value)}
                    required
                    disabled={isPending}
                  />
                </div>

                <Input
                  label="Email para notificações"
                  type="email"
                  placeholder="Ex: ana.souza@imobiliaria.com"
                  value={form.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  disabled={isPending}
                />

                <Input
                  label="WhatsApp (com DDI e DDD)"
                  placeholder="Ex: 5511999999999"
                  value={form.whatsApp}
                  onChange={(e) => handleChange('whatsApp', e.target.value)}
                  disabled={isPending}
                />

                <div className={styles.row}>
                  <Input
                    label="Senha *"
                    type="password"
                    placeholder="Mínimo 6 caracteres"
                    value={form.password}
                    onChange={(e) => handleChange('password', e.target.value)}
                    required
                    disabled={isPending}
                  />
                  <Input
                    label="Confirmar Senha *"
                    type="password"
                    placeholder="Repita a senha"
                    value={form.confirmPassword}
                    onChange={(e) => handleChange('confirmPassword', e.target.value)}
                    required
                    disabled={isPending}
                  />
                </div>

                <Select
                  label="Perfil de Acesso"
                  value={form.role}
                  onChange={(e) => handleChange('role', e.target.value)}
                  disabled={isPending}
                >
                  <option value="AGENT">Corretor (Agente)</option>
                  <option value="ADMIN">Administrador</option>
                </Select>

                <div className={styles.footer}>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => router.push('/admin/team')}
                    disabled={isPending}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" isLoading={isPending}>
                    Criar Agente
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
