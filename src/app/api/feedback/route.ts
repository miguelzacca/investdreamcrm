import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT ?? 587),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

function buildFeedbackHtml(stars: number, suggestion: string, userName: string): string {
  const starsFilled = '★'.repeat(stars);
  const starsEmpty = '☆'.repeat(5 - stars);
  const starsColor = stars >= 4 ? '#10b981' : stars >= 3 ? '#f59e0b' : '#ef4444';
  const label =
    stars === 5 ? 'Excelente! 🎉' :
    stars === 4 ? 'Muito bom! 👍' :
    stars === 3 ? 'Regular 😐' :
    stars === 2 ? 'Precisa melhorar 😕' :
    'Ruim 😞';

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <title>Feedback do Sistema</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:32px 0;">
    <tr>
      <td align="center">
        <table width="580" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:32px 40px;">
              <p style="margin:0;color:rgba(255,255,255,0.8);font-size:12px;text-transform:uppercase;letter-spacing:1px;">InvestDream CRM</p>
              <h1 style="margin:8px 0 0;color:#ffffff;font-size:24px;font-weight:700;">💡 Novo Feedback Recebido</h1>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:36px 40px;">
              <p style="margin:0 0 6px;color:#64748b;font-size:14px;">Usuário:</p>
              <p style="margin:0 0 28px;color:#1e293b;font-size:16px;font-weight:700;">${userName}</p>

              <!-- Stars -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;margin-bottom:20px;">
                <tr>
                  <td style="padding:20px 24px;border-bottom:1px solid #e2e8f0;">
                    <p style="margin:0;font-size:11px;color:#94a3b8;text-transform:uppercase;letter-spacing:0.8px;">Avaliação UX</p>
                    <p style="margin:8px 0 0;font-size:28px;letter-spacing:2px;color:${starsColor};">${starsFilled}${starsEmpty}</p>
                    <p style="margin:6px 0 0;font-size:14px;font-weight:700;color:${starsColor};">${label} (${stars}/5)</p>
                  </td>
                </tr>
                ${suggestion ? `
                <tr>
                  <td style="padding:20px 24px;">
                    <p style="margin:0;font-size:11px;color:#94a3b8;text-transform:uppercase;letter-spacing:0.8px;">Sugestão / Ideia</p>
                    <p style="margin:10px 0 0;font-size:15px;color:#1e293b;line-height:1.65;white-space:pre-wrap;">${suggestion.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>
                  </td>
                </tr>` : ''}
              </table>

              <p style="margin:0;color:#94a3b8;font-size:13px;">Recebido em: ${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}</p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:16px 40px;background:#f8fafc;border-top:1px solid #e2e8f0;">
              <p style="margin:0;font-size:12px;color:#94a3b8;text-align:center;">InvestDream CRM · Feedback automático do sistema</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { stars, suggestion, userName } = body as {
      stars: number;
      suggestion: string;
      userName?: string;
    };

    if (!stars || stars < 1 || stars > 5) {
      return NextResponse.json({ error: 'Avaliação inválida.' }, { status: 400 });
    }

    if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.warn('[feedback] SMTP não configurado.');
      return NextResponse.json({ ok: true, warn: 'SMTP not configured' });
    }

    await transporter.sendMail({
      from: `"InvestDream CRM" <${process.env.SMTP_USER}>`,
      to: 'investdream.crm@gmail.com',
      subject: `💡 Feedback do Sistema — ${stars}★ de ${userName ?? 'Usuário'}`,
      html: buildFeedbackHtml(stars, suggestion ?? '', userName ?? 'Anônimo'),
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[feedback] Erro:', err);
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 });
  }
}
