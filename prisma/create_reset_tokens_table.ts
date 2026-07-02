/**
 * Script de seed/migration manual para criar a tabela PasswordResetToken.
 * Execute: npx tsx prisma/create_reset_tokens_table.ts
 */
import { prisma } from '../src/lib/prisma';

async function main() {
  // Test connection
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "PasswordResetToken" (
      "id"        TEXT        NOT NULL,
      "userId"    TEXT        NOT NULL,
      "token"     TEXT        NOT NULL UNIQUE,
      "expiresAt" TIMESTAMPTZ NOT NULL,
      "usedAt"    TIMESTAMPTZ,
      "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY ("id"),
      CONSTRAINT "PasswordResetToken_userId_fkey"
        FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
    );
  `);

  console.log('✅ Tabela PasswordResetToken criada (ou já existia).');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
