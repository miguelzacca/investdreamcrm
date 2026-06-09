import { NextResponse } from "next/server";
import { createLeadRoundRobin, LeadInput } from "@/lib/leads";

export async function POST(request: Request) {
  try {
    // 1. Verificação de segurança (Webhook Secret)
    // Pode vir via Header de Authorization ou via Query Parameter
    const authHeader = request.headers.get("Authorization");
    const { searchParams } = new URL(request.url);
    const tokenFromQuery = searchParams.get("token");
    const secret = process.env.WEBHOOK_SECRET;

    if (secret) {
      const isHeaderValid = authHeader === `Bearer ${secret}` || authHeader === secret;
      const isQueryValid = tokenFromQuery === secret;

      if (!isHeaderValid && !isQueryValid) {
        return NextResponse.json(
          { error: "Unauthorized. Invalid WEBHOOK_SECRET." },
          { status: 401 }
        );
      }
    }

    // 2. Parse do payload
    const body = await request.json();

    if (!body.name || !body.whatsApp) {
      return NextResponse.json(
        { error: "Missing required fields: 'name' and 'whatsApp' are mandatory." },
        { status: 400 }
      );
    }

    // 3. Preparação dos dados para a criação do lead
    const leadData: LeadInput = {
      name: body.name,
      whatsApp: body.whatsApp,
      interest: body.interest || "Campanha Meta Ads",
      temperature: body.temperature || "COLD",
      source: body.source || "Meta Ads Webhook",
    };

    // 4. Inserção na Fila Automática
    const result = await createLeadRoundRobin(leadData);

    return NextResponse.json(
      {
        message: "Lead created and assigned successfully",
        assignedTo: result.assignedTo,
        leadId: result.lead.id,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("[Webhooks API Error]", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 }
    );
  }
}
