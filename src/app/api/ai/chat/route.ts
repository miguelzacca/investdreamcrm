import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { GoogleGenAI } from '@google/genai';

// Instantiate the SDK
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { messages } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Formato inválido' }, { status: 400 });
    }

    const agentId = session.user.id;
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Fetch minimal context
    const [activeLeads, hotLeads, dealsThisMonth, allDeals, recentLeads] = await Promise.all([
      prisma.lead.count({ where: { agentId, isArchived: false } }),
      prisma.lead.count({ where: { agentId, isArchived: false, temperature: 'HOT' } }),
      prisma.deal.findMany({ where: { agentId, closedAt: { gte: startOfMonth } } }),
      prisma.deal.findMany({ where: { agentId } }),
      prisma.lead.findMany({
        where: { agentId, isArchived: false },
        orderBy: { updatedAt: 'desc' },
        take: 15,
        select: { name: true, funnelStage: true, temperature: true, interest: true }
      }),
    ]);

    const commissionThisMonth = dealsThisMonth.reduce((sum, d) => sum + (d.firstMonthCommission ?? 0), 0);
    const totalCommission = allDeals.reduce((sum, d) => sum + (d.firstMonthCommission ?? 0), 0);

    const funnelCounts = recentLeads.reduce((acc, lead) => {
      acc[lead.funnelStage] = (acc[lead.funnelStage] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Compact system instruction
    const systemInstruction = `Você é o CRM AI, assistente inteligente do corretor de imóveis ${session.user.name || session.user.username} da Invest Dream.
Sua função: ajudar o corretor a escrever mensagens persuasivas (follow-ups) para leads, analisar o funil, sugerir abordagens e resumir métricas.
CONTEXTO ATUAL DO CORRETOR:
- Leads Ativos: ${activeLeads} | Quentes (HOT): ${hotLeads}
- Negócios fechados no mês: ${dealsThisMonth.length} | Comissões no mês: R$${commissionThisMonth.toFixed(2)} | Comissão total: R$${totalCommission.toFixed(2)}
FUNIL DOS TOP 15 LEADS: ${JSON.stringify(funnelCounts)}
TOP 15 LEADS (Para contexto de nomes e interesses):
${recentLeads.map(l => `- ${l.name} | ${l.funnelStage} | ${l.temperature} | Int: ${l.interest || 'N/A'}`).join('\n')}

REGRAS:
1. Responda SEMPRE em português brasileiro.
2. Quando pedir para gerar uma mensagem para um cliente, crie um texto altamente persuasivo, em tom profissional, mas empático, pronto para WhatsApp (evite emojis em excesso).
3. Seja direto e conciso, sem introduções prolixas.
4. Use o contexto fornecido para basear suas respostas, mas não exponha os dados crus ao usuário sem necessidade.
5. Quando analisar o funil, indique pontos de atenção ou onde focar.
`;

    // History trimming: get only the last 8 messages
    const trimmedMessages = messages.slice(-8).map((m: any) => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.content }]
    }));

    // Fallback logic
    let stream;
    try {
      stream = await ai.models.generateContentStream({
        model: 'gemini-2.5-flash-lite',
        contents: trimmedMessages,
        config: {
          systemInstruction,
          temperature: 0.7,
        }
      });
    } catch (e) {
      console.warn('Fallback para gemini-2.5-flash após erro:', e);
      stream = await ai.models.generateContentStream({
        model: 'gemini-2.5-flash',
        contents: trimmedMessages,
        config: {
          systemInstruction,
          temperature: 0.7,
        }
      });
    }

    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            if (chunk.text) {
              controller.enqueue(new TextEncoder().encode(chunk.text));
            }
          }
        } catch (err) {
          controller.error(err);
        } finally {
          controller.close();
        }
      }
    });

    return new Response(readableStream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error: any) {
    console.error('API Chat Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
