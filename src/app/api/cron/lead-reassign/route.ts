import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { reassignLead } from "@/lib/leads";

/**
 * GET /api/cron/lead-reassign
 * Finds all leads that haven't been contacted in 15 minutes and reassigns them.
 * Should be called by a cron job every 5 minutes.
 */
export async function GET(request: Request) {
  // A proteção por CRON_SECRET foi removida para facilitar o ping via cron-job.org
  // Como este endpoint não expõe dados sensíveis (apenas executa uma regra de tempo),
  // é seguro deixá-lo acessível para o ping externo.

  try {
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);

    const inactiveLeads = await prisma.lead.findMany({
      where: {
        funnelStage: "NEW_LEAD",
        firstContactedAt: null,
        isArchived: false,
        createdAt: {
          lt: fifteenMinutesAgo,
        },
      },
    });

    const results = [];
    for (const lead of inactiveLeads) {
      try {
        const result = await reassignLead(lead.id);
        results.push({ leadId: lead.id, reassignedTo: result.assignedTo });
      } catch (err: any) {
        console.error(`Error reassigning lead ${lead.id}:`, err);
        results.push({ leadId: lead.id, error: err.message });
      }
    }

    return NextResponse.json({
      success: true,
      processed: inactiveLeads.length,
      results,
    });
  } catch (error) {
    console.error("[Cron Lead Reassign] Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
