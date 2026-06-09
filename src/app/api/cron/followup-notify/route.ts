import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendNewLeadEmail } from "@/lib/mailer";

/**
 * GET /api/cron/followup-notify
 *
 * Finds all follow-up leads whose date has passed and whose agent has an email,
 * then sends a notification email to the agent.
 *
 * Configure this route to run hourly in vercel.json:
 * {
 *   "crons": [{ "path": "/api/cron/followup-notify", "schedule": "0 * * * *" }]
 * }
 *
 * Protect with CRON_SECRET in production (set the env var and pass it as
 * Authorization: Bearer <CRON_SECRET> header from the cron scheduler).
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const now = new Date();

  const dueFollowUps = await prisma.lead.findMany({
    where: {
      isFollowUp: true,
      isArchived: false,
      followUpDate: { lte: now },
      funnelStage: "NEW_LEAD",
      agent: { email: { not: null } },
    },
    include: {
      agent: { select: { id: true, name: true, email: true } },
    },
  });

  if (dueFollowUps.length === 0) {
    return NextResponse.json({ message: "Nenhum follow-up pendente.", sent: 0 });
  }

  let sent = 0;

  for (const lead of dueFollowUps) {
    if (!lead.agent.email) continue;

    await sendNewLeadEmail({
      agentEmail: lead.agent.email,
      agentName: lead.agent.name,
      leadName: lead.name,
      leadWhatsApp: lead.whatsApp,
      leadInterest: lead.interest,
      leadSource: lead.source,
      isFollowUp: true,
    });

    sent++;
  }

  return NextResponse.json({ message: `${sent} email(s) de follow-up enviado(s).`, sent });
}
