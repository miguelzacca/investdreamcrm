import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import { sendPasswordResetEmail } from '@/lib/mailer';

/** Ensure the table exists — idempotent, safe to call on every request */
async function ensureTable() {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "PasswordResetToken" (
      "id"        TEXT        NOT NULL,
      "userId"    TEXT        NOT NULL,
      "token"     TEXT        NOT NULL,
      "expiresAt" TIMESTAMPTZ NOT NULL,
      "usedAt"    TIMESTAMPTZ,
      "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY ("id"),
      CONSTRAINT "PasswordResetToken_userId_fkey"
        FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
    );
  `);
  await prisma.$executeRawUnsafe(`
    CREATE UNIQUE INDEX IF NOT EXISTS "PasswordResetToken_token_key"
      ON "PasswordResetToken" ("token");
  `);
}

let tableReady = false;

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email inválido.' }, { status: 400 });
    }

    // Auto-create table on first call
    if (!tableReady) {
      await ensureTable();
      tableReady = true;
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Find user by email — always return success to avoid user enumeration
    const user = await prisma.user.findFirst({
      where: { email: normalizedEmail },
    });

    if (user) {
      // Invalidate any previous unused tokens
      await prisma.passwordResetToken.deleteMany({
        where: { userId: user.id, usedAt: null },
      });

      // Generate a secure random token
      const token = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      await prisma.passwordResetToken.create({
        data: { userId: user.id, token, expiresAt },
      });

      const baseUrl = process.env.NEXTAUTH_URL ?? 'http://localhost:3000';
      const resetUrl = `${baseUrl}/login/reset-password?token=${token}`;

      await sendPasswordResetEmail(normalizedEmail, resetUrl);
    }

    // Always return success (security: don't reveal whether email exists)
    return NextResponse.json({
      message: 'Se este e-mail estiver cadastrado, você receberá as instruções em breve.',
    });
  } catch (err) {
    console.error('[forgot-password]', err);
    return NextResponse.json({ error: 'Erro interno. Tente novamente.' }, { status: 500 });
  }
}

