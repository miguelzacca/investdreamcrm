import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { reassignLead } from "@/lib/leads";

/**
 * GET /api/cron/lead-reassign
 * Finds all leads that haven't been contacted in 15 minutes and reassigns them.
 * Should be called by a cron job every 5 minutes.
 */
export async function GET(request: Request) {
  // Opcional: Proteger a rota usando um cron secret
  const authHeader = request.headers.get("authorization");
  if (
    process.env.CRON_SECRET &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);

    const inactiveLeads = await prisma.lead.findMany({
      where: {
        funnelStage: "NEW_LEAD",
        firstContactedAt: null,
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
