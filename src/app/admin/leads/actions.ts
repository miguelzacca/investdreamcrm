"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    throw new Error("Acesso negado. Apenas administradores.");
  }
  return session;
}

export async function getAdminLeads(opts?: {
  agentId?: string;
  archived?: boolean;
}) {
  await requireAdmin();

  return prisma.lead.findMany({
    where: {
      ...(opts?.agentId ? { agentId: opts.agentId } : {}),
      isArchived: opts?.archived ?? false,
    },
    include: {
      agent: { select: { id: true, name: true, username: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getAllAgents() {
  await requireAdmin();
  return prisma.user.findMany({
    select: { id: true, name: true, username: true, role: true },
    orderBy: { name: "asc" },
  });
}
