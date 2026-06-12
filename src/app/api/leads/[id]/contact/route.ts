import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const { id: leadId } = await params;
    
    // Buscar o lead atual para verificar o estado
    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
    });

    if (!lead) {
      return NextResponse.json({ error: 'Lead não encontrado' }, { status: 404 });
    }

    // Apenas quem é dono do lead ou admin pode atualizar
    if (lead.agentId !== session.user.id && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const now = new Date();

    const updateData: any = {
      lastContactedAt: now,
      contactCount: {
        increment: 1,
      },
    };

    if (!lead.firstContactedAt) {
      updateData.firstContactedAt = now;
    }

    // Se estiver como NEW_LEAD, mudar para CONTACTED automaticamente
    if (lead.funnelStage === 'NEW_LEAD') {
      updateData.funnelStage = 'CONTACTED';
    }

    const updatedLead = await prisma.lead.update({
      where: { id: leadId },
      data: updateData,
    });

    return NextResponse.json({ success: true, lead: updatedLead });
  } catch (error) {
    console.error('Erro ao registrar contato:', error);
    return NextResponse.json(
      { error: 'Erro interno ao registrar contato' },
      { status: 500 }
    );
  }
}
