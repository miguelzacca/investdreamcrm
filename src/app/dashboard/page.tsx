"use client";

import React from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';

export default function DashboardPage() {
  return (
    <AppLayout title="Dashboard">
      <div className="grid gap-6 grid-cols-1 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Comissões (Este Mês)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-success">R$ 0,00</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Negócios Fechados</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">0</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Leads Ativos</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">0</p>
          </CardContent>
        </Card>
      </div>
      
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Meus Últimos Leads</h2>
        <Card>
          <CardContent className="p-8 text-center text-muted">
            Nenhum lead encontrado. Vá para a aba "Leads" para adicionar um.
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
