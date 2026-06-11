import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { AppLayout } from '@/components/layout/AppLayout';
import DashboardView from './DashboardView';
import { getAdminMetrics } from './actions';

export const metadata = {
  title: 'Métricas e Dashboard - Invest Dream CRM',
};

interface PageProps {
  searchParams: Promise<{ period?: string }>;
}

export default async function AdminMetricsPage({ searchParams }: PageProps) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== 'ADMIN') {
    redirect('/dashboard');
  }

  const { period } = await searchParams;
  const periodValue = period === 'all' ? 3650 : (parseInt(period || '30', 10) || 30); // Default 30 days

  // Fetch metrics based on selected period
  const metrics = await getAdminMetrics(periodValue);

  return (
    <AppLayout title="Dashboard de Métricas (Admin)">
      <DashboardView initialMetrics={metrics} currentPeriod={period || '30'} />
    </AppLayout>
  );
}
