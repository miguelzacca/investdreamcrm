import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const agentId = searchParams.get("agentId") || undefined;
  const archived = searchParams.get("archived") === "1";

  const leads = await prisma.lead.findMany({
    where: {
      ...(agentId ? { agentId } : {}),
      isArchived: archived,
    },
    include: {
      agent: { select: { id: true, name: true, username: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(leads);
}
