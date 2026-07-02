import { prisma } from '@/lib/prisma'
import { sendNewLeadEmail } from '@/lib/mailer'
import { Temperature } from '@prisma/client'
import { sendWebPushNotification } from '@/lib/webpush'
import {
  ADMIN_INSTANCE_NAME,
  sendText,
  getInstanceStatus,
} from '@/lib/evolution'
import { generateLeadNotificationMessage } from '@/lib/ai-message'

export type LeadInput = {
  name: string
  whatsApp: string
  interest?: string
  temperature: Temperature
  source?: string
}

/**
 * Picks the next agent in the sequential round-robin queue.
 * Priority:
 *  1. Only agents with inAutoQueue = true are considered.
 *  2. Agents that have NEVER received a lead go first, ordered by queueOrder ASC.
 *  3. Among agents who have received leads, the one whose lastLeadReceivedAt
 *     is the oldest goes next (strict sequential rotation).
 *  4. Ties broken by queueOrder ASC.
 */
export async function pickNextQueueAgent() {
  const agents = await prisma.user.findMany({
    where: { role: 'AGENT', inAutoQueue: true },
    select: {
      id: true,
      name: true,
      email: true,
      whatsApp: true,
      queueOrder: true,
      lastLeadReceivedAt: true,
    },
  })

  if (agents.length === 0) return null

  // Sort: null lastLeadReceivedAt (never received) → first, ordered by queueOrder
  // Then by lastLeadReceivedAt ASC (oldest first), ties broken by queueOrder ASC
  const sorted = [...agents].sort((a, b) => {
    const aNull = a.lastLeadReceivedAt === null
    const bNull = b.lastLeadReceivedAt === null

    if (aNull && bNull) return a.queueOrder - b.queueOrder
    if (aNull) return -1
    if (bNull) return 1

    const timeDiff =
      a.lastLeadReceivedAt!.getTime() - b.lastLeadReceivedAt!.getTime()
    if (timeDiff !== 0) return timeDiff
    return a.queueOrder - b.queueOrder
  })

  return sorted[0]
}

/**
 * Creates a lead via sequential round-robin queue.
 * Passes to the next agent in order regardless of how many active leads they have.
 */
export async function createLeadRoundRobin(data: LeadInput) {
  const target = await pickNextQueueAgent()

  if (!target) {
    throw new Error('Nenhum corretor disponível na fila automática.')
  }

  const now = new Date()

  const lead = await prisma.lead.create({
    data: {
      ...data,
      agentId: target.id,
      funnelStage: 'NEW_LEAD',
    },
  })

  // Advance the queue pointer
  await prisma.user.update({
    where: { id: target.id },
    data: { lastLeadReceivedAt: now },
  })

  // Notifica o corretor (Email)
  if (target.email) {
    sendNewLeadEmail({
      agentEmail: target.email,
      agentName: target.name,
      leadName: lead.name,
      leadWhatsApp: lead.whatsApp,
      leadInterest: lead.interest,
      leadSource: lead.source,
      isFollowUp: false,
    }).catch((err) =>
      console.error('[createLeadRoundRobin] email send error:', err),
    )
  }

  // Notifica o corretor (Push)
  try {
    const pushSubscriptions = await prisma.pushSubscription.findMany({
      where: { userId: target.id },
    })

    if (pushSubscriptions.length > 0) {
      const payload = JSON.stringify({
        title: 'Novo Lead!',
        body: `${lead.name} demonstrou interesse. Clique para ver.`,
        url: `/leads`, // Corrigido para a rota atual do kanban
      })

      for (const sub of pushSubscriptions) {
        await sendWebPushNotification(
          {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh,
              auth: sub.auth,
            },
          },
          payload,
        )
      }
    }
  } catch (err) {
    console.error('[createLeadRoundRobin] push notification error:', err)
  }

  // Notifica o corretor (WhatsApp via Evolution API)
  if (target.whatsApp) {
    try {
      const status = await getInstanceStatus(ADMIN_INSTANCE_NAME)
      // Evolution API v2 returns { instance: { state: 'open' } } at /connectionState
      const instanceState = status?.instance?.state ?? status?.state
      if (instanceState === 'open') {
        const leadUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/leads/${lead.id}`
        const aiMessage = await generateLeadNotificationMessage(
          lead.name,
          lead.interest,
          target.name,
          leadUrl,
        )
        await sendText(ADMIN_INSTANCE_NAME, target.whatsApp, aiMessage)
      } else {
        console.warn(
          '[createLeadRoundRobin] WA instance not open, state:',
          instanceState,
        )
      }
    } catch (err) {
      console.error('[createLeadRoundRobin] whatsapp notification error:', err)
    }
  }

  return { assignedTo: target.name, lead }
}

/**
 * Reassigns a lead to the next agent in the queue.
 * Used when the previous agent didn't contact the lead in time.
 */
export async function reassignLead(leadId: string) {
  const lead = await prisma.lead.findUnique({ where: { id: leadId } })
  if (!lead) throw new Error('Lead não encontrado')

  const target = await pickNextQueueAgent()
  if (!target) throw new Error('Nenhum corretor disponível na fila automática.')

  const now = new Date()

  // Update lead with new agent and reset createdAt so the 15-minute cron starts over
  const updatedLead = await prisma.lead.update({
    where: { id: leadId },
    data: {
      agentId: target.id,
      createdAt: now,
    },
  })

  // Advance the queue pointer
  await prisma.user.update({
    where: { id: target.id },
    data: { lastLeadReceivedAt: now },
  })

  // Notifica o corretor (Email)
  if (target.email) {
    sendNewLeadEmail({
      agentEmail: target.email,
      agentName: target.name,
      leadName: updatedLead.name,
      leadWhatsApp: updatedLead.whatsApp,
      leadInterest: updatedLead.interest,
      leadSource: updatedLead.source,
      isFollowUp: false,
    }).catch((err) => console.error('[reassignLead] email send error:', err))
  }

  // Notifica o corretor (Push)
  try {
    const pushSubscriptions = await prisma.pushSubscription.findMany({
      where: { userId: target.id },
    })

    if (pushSubscriptions.length > 0) {
      const payload = JSON.stringify({
        title: 'Lead Redistribuído para Você!',
        body: `${updatedLead.name} demonstrou interesse. Clique para ver.`,
        url: `/leads`,
      })

      for (const sub of pushSubscriptions) {
        await sendWebPushNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          payload,
        )
      }
    }
  } catch (err) {
    console.error('[reassignLead] push notification error:', err)
  }

  // Notifica o corretor (WhatsApp via Evolution API)
  if (target.whatsApp) {
    try {
      const status = await getInstanceStatus(ADMIN_INSTANCE_NAME)
      const instanceState = status?.instance?.state ?? status?.state
      if (instanceState === 'open') {
        const leadUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard`
        const aiMessage = await generateLeadNotificationMessage(
          updatedLead.name,
          updatedLead.interest,
          target.name,
          leadUrl,
        )
        await sendText(
          ADMIN_INSTANCE_NAME,
          target.whatsApp,
          `*REDISTRIBUIÇÃO*\n\n${aiMessage}`,
        )
      } else {
        console.warn(
          '[reassignLead] WA instance not open, state:',
          instanceState,
        )
      }
    } catch (err) {
      console.error('[reassignLead] whatsapp notification error:', err)
    }
  }

  return { assignedTo: target.name, lead: updatedLead }
}
