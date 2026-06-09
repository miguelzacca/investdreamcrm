import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await req.json();
    const { email } = body;

    // Validate email format if provided
    if (email) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return NextResponse.json({ error: "Email inválido." }, { status: 400 });
      }

      const existingEmail = await prisma.user.findUnique({ where: { email } });
      if (existingEmail && existingEmail.id !== id) {
        return NextResponse.json({ error: "Este email já está em uso por outro usuário." }, { status: 400 });
      }
    }

    const user = await prisma.user.update({
      where: { id },
      data: { email: email || null },
      select: { id: true, name: true, username: true, email: true },
    });

    return NextResponse.json(user);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Erro ao atualizar usuário." }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { id } = await params;

  if (id === session.user.id) {
    return NextResponse.json({ error: "Você não pode apagar seu próprio usuário." }, { status: 400 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        _count: {
          select: { leads: true, deals: true }
        }
      }
    });

    if (!user) {
      return NextResponse.json({ error: "Usuário não encontrado." }, { status: 404 });
    }

    if (user._count.leads > 0 || user._count.deals > 0) {
      // Reatribui todos os leads e negócios para o admin logado antes de deletar
      await prisma.$transaction([
        prisma.lead.updateMany({
          where: { agentId: id },
          data: { agentId: session.user.id }
        }),
        prisma.deal.updateMany({
          where: { agentId: id },
          data: { agentId: session.user.id }
        }),
        prisma.user.delete({ where: { id } })
      ]);
    } else {
      await prisma.user.delete({ where: { id } });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Erro ao apagar usuário." }, { status: 500 });
  }
}
