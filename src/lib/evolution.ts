export const EVOLUTION_API_URL =
  process.env.EVOLUTION_API_URL || 'https://imobhunter.up.railway.app'
export const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY || '' // Deve ser configurado no .env

export const ADMIN_INSTANCE_NAME = 'crm-admin-v2'

// Timeout for all Evolution API calls. Railway free tier can sleep and take
// a long time to respond. Without a timeout, hanging requests block Node.js
// connections and exhaust the Prisma/Postgres pool, causing DB errors in
// unrelated routes.
const EVOLUTION_TIMEOUT_MS = 8000

export async function getInstanceStatus(
  instanceName: string = ADMIN_INSTANCE_NAME,
) {
  try {
    const res = await fetch(
      `${EVOLUTION_API_URL}/instance/connectionState/${instanceName}`,
      {
        headers: {
          apikey: EVOLUTION_API_KEY,
        },
        cache: 'no-store',
        signal: AbortSignal.timeout(EVOLUTION_TIMEOUT_MS),
      },
    )
    if (!res.ok) return null
    return await res.json()
  } catch (err) {
    console.error('Error fetching instance status:', err)
    return null
  }
}

export async function createInstance(
  instanceName: string = ADMIN_INSTANCE_NAME,
) {
  try {
    const res = await fetch(`${EVOLUTION_API_URL}/instance/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: EVOLUTION_API_KEY,
      },
      body: JSON.stringify({
        instanceName,
        token: instanceName,
        qrcode: true,
        integration: 'WHATSAPP-BAILEYS',
      }),
      signal: AbortSignal.timeout(EVOLUTION_TIMEOUT_MS),
    })
    return await res.json()
  } catch (err) {
    console.error('Error creating instance:', err)
    return null
  }
}

export async function connectInstance(
  instanceName: string = ADMIN_INSTANCE_NAME,
) {
  try {
    const res = await fetch(
      `${EVOLUTION_API_URL}/instance/connect/${instanceName}`,
      {
        headers: {
          apikey: EVOLUTION_API_KEY,
        },
        cache: 'no-store',
        signal: AbortSignal.timeout(EVOLUTION_TIMEOUT_MS),
      },
    )
    return await res.json()
  } catch (err) {
    console.error('Error connecting instance:', err)
    return null
  }
}

export async function logoutInstance(
  instanceName: string = ADMIN_INSTANCE_NAME,
) {
  try {
    const res = await fetch(
      `${EVOLUTION_API_URL}/instance/logout/${instanceName}`,
      {
        method: 'DELETE',
        headers: {
          apikey: EVOLUTION_API_KEY,
        },
        signal: AbortSignal.timeout(EVOLUTION_TIMEOUT_MS),
      },
    )
    return await res.json()
  } catch (err) {
    console.error('Error logging out instance:', err)
    return null
  }
}

// Hard-reset: deletes the instance entirely so it can be recreated from scratch.
// Use when logout fails with "Connection Closed" (dead socket).
export async function deleteInstance(
  instanceName: string = ADMIN_INSTANCE_NAME,
) {
  try {
    const res = await fetch(
      `${EVOLUTION_API_URL}/instance/delete/${instanceName}`,
      {
        method: 'DELETE',
        headers: {
          apikey: EVOLUTION_API_KEY,
        },
        signal: AbortSignal.timeout(EVOLUTION_TIMEOUT_MS),
      },
    )
    return await res.json()
  } catch (err) {
    console.error('Error deleting instance:', err)
    return null
  }
}

export async function sendText(
  instanceName: string,
  number: string,
  text: string,
) {
  try {
    // Limpa o número, adiciona DDI 55 se necessário e formata como JID
    // O sufixo @s.whatsapp.net evita o lookup interno da Evolution API que pode falhar
    let cleanNumber = String(number).replace(/\D/g, '')
    if (cleanNumber.length === 10 || cleanNumber.length === 11) {
      cleanNumber = '55' + cleanNumber
    }
    const jid = cleanNumber.includes('@')
      ? cleanNumber
      : `${cleanNumber}@s.whatsapp.net`

    const res = await fetch(
      `${EVOLUTION_API_URL}/message/sendText/${instanceName}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: EVOLUTION_API_KEY,
        },
        body: JSON.stringify({
          number: jid,
          text: text,
        }),
        signal: AbortSignal.timeout(EVOLUTION_TIMEOUT_MS),
      },
    )

    const data = await res.json()

    if (!res.ok) {
      console.error(
        '[sendText] Evolution API error:',
        JSON.stringify(data, null, 2),
      )
    } else {
      console.log(
        '[sendText] Mensagem enviada para',
        jid,
        '| id:',
        data?.key?.id ?? data?.id,
      )
    }

    return data
  } catch (err: any) {
    console.error('[sendText] Error sending text:', err.message)
    return null
  }
}
