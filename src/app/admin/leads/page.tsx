import React from "react";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { AppLayout } from "@/components/layout/AppLayout";
import { getAdminLeads, getAllAgents } from "./actions";
import AdminLeadsClient from "./AdminLeadsClient";

export default async function AdminLeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ agentId?: string; archived?: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") redirect("/dashboard");

  const params = await searchParams;
  const agentId = params.agentId ?? "";
  const archived = params.archived === "1";

  const [leads, agents] = await Promise.all([
    getAdminLeads({ agentId: agentId || undefined, archived }),
    getAllAgents(),
  ]);

  return (
    <AppLayout title="Todos os Leads — Visão Admin">
      <AdminLeadsClient
        initialLeads={leads}
        agents={agents}
        initialArchived={archived}
        initialAgentId={agentId}
      />
    </AppLayout>
  );
}
