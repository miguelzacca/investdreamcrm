import { NextResponse } from "next/server";
import { createLeadRoundRobin, LeadInput } from "@/lib/leads";

// 1. GET: Validação do Meta Webhook
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  const verifyToken = process.env.META_VERIFY_TOKEN;

  // Se o token estiver configurado, verificamos. Se não estiver, permitimos qualquer um para debug inicial.
  if (mode === "subscribe" && (!verifyToken || token === verifyToken)) {
    console.log("[Meta Webhook] WEBHOOK_VERIFIED");
    return new NextResponse(challenge, { status: 200 });
  } else {
    console.error("[Meta Webhook] Verification Failed. Expected token:", verifyToken, "Received:", token);
    return new NextResponse("Forbidden", { status: 403 });
  }
}

// 2. POST: Recebimento do Lead
export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Verifica se é evento de página do Meta
    if (body.object !== "page") {
      return new NextResponse("Not Found", { status: 404 });
    }

    // Itera sobre as "entries" (pode vir em lote)
    for (const entry of body.entry || []) {
      const changes = entry.changes || [];

      for (const change of changes) {
        if (change.field !== "leadgen") continue;

        const leadgenId = change.value?.leadgen_id;
        const formId = change.value?.form_id;

        if (!leadgenId) continue;

        // Puxa os dados reais da Graph API
        const accessToken = process.env.META_ACCESS_TOKEN;
        if (!accessToken) {
          console.error("[Meta Webhook] AVISO: META_ACCESS_TOKEN não encontrado no .env");
          continue; 
        }

        const graphUrl = `https://graph.facebook.com/v19.0/${leadgenId}?access_token=${accessToken}`;
        const response = await fetch(graphUrl, { method: "GET" });
        const data = await response.json();

        if (data.error) {
          console.error("[Meta Webhook] Erro na Graph API:", data.error);
          continue;
        }

        // Pega os campos do array field_data
        let fullName = "Lead do Meta Ads";
        let phoneNumber = "00000000000";

        if (data.field_data) {
          for (const field of data.field_data) {
            // O Meta permite customizar o nome da pergunta, tentamos adivinhar os padrões
            const fieldName = field.name.toLowerCase();
            if ((fieldName.includes("name") || fieldName.includes("nome")) && field.values?.[0]) {
              fullName = field.values[0];
            }
            if ((fieldName.includes("phone") || fieldName.includes("telefone") || fieldName.includes("whatsapp")) && field.values?.[0]) {
              phoneNumber = field.values[0];
            }
          }
        }

        const leadData: LeadInput = {
          name: fullName,
          whatsApp: phoneNumber,
          interest: `Formulário Meta Ads (ID: ${formId})`,
          temperature: "COLD",
          source: "Meta Ads",
        };

        // Insere na fila
        await createLeadRoundRobin(leadData).catch((err) => {
          console.error("[Meta Webhook] Erro ao atribuir lead à fila:", err);
        });
      }
    }

    // O Meta sempre espera um 200 OK
    return new NextResponse("EVENT_RECEIVED", { status: 200 });
  } catch (error: any) {
    console.error("[Webhooks API Error]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
