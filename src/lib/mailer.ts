import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT ?? 587),
  secure: process.env.SMTP_SECURE === "true", // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});



function buildEmailHtml(options: {
  agentName: string;
  leadName: string;
  leadWhatsApp: string;
  leadInterest?: string | null;
  leadSource?: string | null;
  isFollowUp: boolean;
}): string {
  const { agentName, leadName, leadInterest, leadSource, isFollowUp } = options;
  const subject = isFollowUp ? "⏰ Retorno de Follow-up" : "🆕 Novo Lead";
  const headerColor = isFollowUp ? "#f59e0b" : "#6366f1";
  const badgeText = isFollowUp ? "Follow-up" : "Novo Lead";
  const bodyText = isFollowUp
    ? `O lead <strong>${leadName}</strong> chegou ao dia do follow-up agendado e está aguardando seu contato.`
    : `Você recebeu um novo lead: <strong>${leadName}</strong>. Entre em contato o mais rápido possível para maximizar suas chances!`;

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${subject}</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:32px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
          <!-- Header -->
          <tr>
            <td style="background:${headerColor};padding:32px 40px;">
              <p style="margin:0;color:rgba(255,255,255,0.8);font-size:13px;text-transform:uppercase;letter-spacing:1px;">InvestDream CRM</p>
              <h1 style="margin:8px 0 0;color:#ffffff;font-size:26px;font-weight:700;">${subject}</h1>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:36px 40px;">
              <p style="margin:0 0 8px;color:#64748b;font-size:14px;">Olá, <strong style="color:#1e293b;">${agentName}</strong> 👋</p>
              <p style="margin:0 0 28px;color:#475569;font-size:15px;line-height:1.6;">${bodyText}</p>

              <!-- Lead Card -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;">
                <tr>
                  <td style="padding:20px 24px;border-bottom:1px solid #e2e8f0;">
                    <p style="margin:0;font-size:11px;color:#94a3b8;text-transform:uppercase;letter-spacing:0.8px;">Lead</p>
                    <p style="margin:4px 0 0;font-size:18px;font-weight:700;color:#1e293b;">${leadName}</p>
                    <span style="display:inline-block;margin-top:6px;padding:2px 10px;background:${headerColor};color:#fff;border-radius:999px;font-size:11px;font-weight:600;">${badgeText}</span>
                  </td>
                </tr>

                ${leadInterest ? `
                <tr>
                  <td style="padding:14px 24px;border-bottom:1px solid #e2e8f0;">
                    <p style="margin:0;font-size:12px;color:#94a3b8;">Interesse</p>
                    <p style="margin:2px 0 0;font-size:15px;color:#1e293b;font-weight:500;">${leadInterest}</p>
                  </td>
                </tr>` : ""}
                ${leadSource ? `
                <tr>
                  <td style="padding:14px 24px;">
                    <p style="margin:0;font-size:12px;color:#94a3b8;">Origem</p>
                    <p style="margin:2px 0 0;font-size:15px;color:#1e293b;font-weight:500;">${leadSource}</p>
                  </td>
                </tr>` : ""}
              </table>

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:28px;">
                <tr>
                  <td align="center">
                    <a href="${process.env.NEXTAUTH_URL ?? "http://localhost:3000"}/leads"
                       style="display:inline-block;padding:14px 32px;background:${headerColor};color:#fff;text-decoration:none;border-radius:10px;font-weight:600;font-size:15px;">
                      Abrir CRM →
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:20px 40px;background:#f8fafc;border-top:1px solid #e2e8f0;">
              <p style="margin:0;font-size:12px;color:#94a3b8;text-align:center;">Este email foi enviado automaticamente pelo InvestDream CRM. Não responda a este email.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export async function sendNewLeadEmail(options: {
  agentEmail: string;
  agentName: string;
  leadName: string;
  leadWhatsApp: string;
  leadInterest?: string | null;
  leadSource?: string | null;
  isFollowUp?: boolean;
}) {
  const { agentEmail, isFollowUp = false } = options;

  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn("[mailer] SMTP não configurado – email não enviado.");
    return;
  }

  const subject = isFollowUp
    ? `⏰ Follow-up: ${options.leadName} aguarda seu contato`
    : `🆕 Novo Lead: ${options.leadName}`;

  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM ?? process.env.SMTP_USER,
      to: agentEmail,
      subject,
      html: buildEmailHtml({ ...options, isFollowUp }),
    });
    console.log(`[mailer] Email enviado para ${agentEmail} – "${subject}"`);
  } catch (err) {
    console.error("[mailer] Falha ao enviar email:", err);
  }
}
