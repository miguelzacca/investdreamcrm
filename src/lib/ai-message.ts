export async function generateLeadNotificationMessage(
  leadName: string,
  leadInterest: string | null | undefined,
  agentName: string,
  leadUrl: string
) {
  const NVIDIA_KEY = (process.env.NVIDIA_API_KEY || '').replace(/[\r\n"']/g, '').trim();
  
  const systemPrompt = `Você é um assistente do Invest Dream CRM.
Sua missão é gerar uma mensagem casual, rápida e humana (como um colega avisando o outro) para notificar o corretor ${agentName} que um novo lead chegou.
Use estratégias variadas (saudações diferentes, frases curtas) para NUNCA gerar mensagens idênticas, evitando detecção de bot pelo WhatsApp.

Diretrizes OBRIGATÓRIAS:
1. Links Intactos (CRÍTICO): NUNCA remova, altere ou esconda nenhum link (ex: https://...). Eles devem obrigatoriamente estar na mensagem final.
2. Seja breve e direto.
3. Tom Humano e Casual: A mensagem deve soar natural e amigável.
4. Regra de Ouro: Retorne APENAS a mensagem pronta para envio. NUNCA inclua aspas no início/fim, NUNCA inclua introduções ("Aqui está:") e NUNCA explique o que você fez.`;

  const userPrompt = `Gere o aviso de novo lead agora.
Lead: ${leadName}
Interesse: ${leadInterest || 'Não especificado'}
Link do lead OBRIGATÓRIO na mensagem: ${leadUrl}`;

  const fallbackMessage = () => {
    const greetings = ['Opa', 'E aí', 'Olá', 'Fala'];
    const greeting = greetings[Math.floor(Math.random() * greetings.length)];
    return `${greeting} ${agentName}! Chegou um novo lead para você: ${leadName}.\nInteresse: ${leadInterest || 'Não especificado'}.\nAcesse aqui: ${leadUrl}`;
  };

  if (!NVIDIA_KEY) {
    console.error('NVIDIA_API_KEY não configurada. Usando fallback humano.');
    return fallbackMessage();
  }

  try {
    const response = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${NVIDIA_KEY}`,
      },
      body: JSON.stringify({
        model: 'meta/llama-3.1-8b-instruct',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.85,
        top_p: 0.9,
        max_tokens: 512,
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('[ai-message] NVIDIA error:', errText);
      return fallbackMessage();
    }

    const data = await response.json();
    let msg = data?.choices?.[0]?.message?.content;

    if (!msg) return fallbackMessage();

    msg = msg.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
    msg = msg.replace(/^["']|["']$/g, '').trim();

    return msg;
  } catch (err: any) {
    console.error('[ai-message] error:', err.message);
    return fallbackMessage();
  }
}
