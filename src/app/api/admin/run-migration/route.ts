import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// One-time migration route — protected by CRON_SECRET
// DELETE this file after the table is created
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  const secret = process.env.CRON_SECRET;

  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
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

    return NextResponse.json({ ok: true, message: 'Tabela PasswordResetToken criada com sucesso.' });
  } catch (err) {
    console.error('[migrate]', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
