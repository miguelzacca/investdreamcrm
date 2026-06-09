import { NextResponse } from "next/server";
import { createLeadRoundRobin, LeadInput } from "@/lib/leads";

/**
 * POST /api/webhooks/leads
 *
 * Recebe leads enviados pelo Make (ex-Integromat) via HTTP module.
 *
 * Payload esperado (JSON string do Make):
 * {
 *   "full_name": "Nome do Lead",          // campo "Full name"
 *   "phone_number": "11999999999",        // campo "Phone number"
 *   "interest": "Imóvel X",              // opcional
 *   "source": "Meta Ads"                 // opcional
 * }
 *
 * Segurança: o Make deve enviar o header "x-webhook-secret" com o valor
 * definido em MAKE_WEBHOOK_SECRET no .env (se não estiver definido, libera para dev).
 */
export async function POST(request: Request) {
  try {
    // ── 1. Verificação de secret token ──────────────────────────────────────
    const secret = process.env.MAKE_WEBHOOK_SECRET;
    if (secret) {
      const headerSecret = request.headers.get("x-webhook-secret");
      if (headerSecret !== secret) {
        console.warn("[Make Webhook] Token inválido recebido:", headerSecret);
        return new NextResponse("Unauthorized", { status: 401 });
      }
    }

    // ── 2. Lê o body ────────────────────────────────────────────────────────
    const body = await request.json();

    // Suporte a snake_case e camelCase para flexibilidade no Make
    const fullName: string =
      body.full_name || body.fullName || body["Full name"] || "";
    const phoneNumber: string =
      body.phone_number || body.phoneNumber || body["Phone number"] || "";
    const interest: string =
      body.interest || body["Interest"] || "Meta Ads";
    const source: string =
      body.source || body["Source"] || "Meta Ads";

    if (!fullName || !phoneNumber) {
      console.error("[Make Webhook] Payload inválido — campos obrigatórios ausentes:", body);
      return new NextResponse(
        JSON.stringify({ error: "full_name e phone_number são obrigatórios" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // ── 3. Cria o lead via round-robin ──────────────────────────────────────
    const leadData: LeadInput = {
      name: fullName,
      whatsApp: phoneNumber,
      interest,
      temperature: "COLD",
      source,
    };

    const result = await createLeadRoundRobin(leadData);

    console.log(
      `[Make Webhook] Lead "${fullName}" criado e atribuído a: ${result.assignedTo}`
    );

    return NextResponse.json(
      {
        success: true,
        message: `Lead atribuído a ${result.assignedTo}`,
        leadId: result.lead.id,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("[Make Webhook] Erro interno:", error);
    return new NextResponse(
      JSON.stringify({ error: "Internal Server Error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
