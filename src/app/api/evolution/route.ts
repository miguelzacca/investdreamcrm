import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { createInstance, connectInstance, getInstanceStatus, logoutInstance, deleteInstance } from '@/lib/evolution';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const action = searchParams.get('action');

  try {
    if (action === 'status') {
      const status = await getInstanceStatus();
      return NextResponse.json(status);
    }
    
    if (action === 'connect') {
      let status = await getInstanceStatus();
      // Se não existe, deu erro ou está fechada, vamos recriar do zero para evitar bugs do Evolution
      if (!status || status.error || status?.instance?.state === 'close') {
        console.log('[evolution/connect] Recriando instância...');
        await deleteInstance();
        // Um pequeno delay para garantir que o Evolution deletou
        await new Promise(r => setTimeout(r, 1000));
        const created = await createInstance();
        if (created?.status === 401) {
          return NextResponse.json({ error: 'Evolution API Key Inválida ou Ausente.' }, { status: 401 });
        }
      }
      const connect = await connectInstance();
      if (connect?.status === 401) {
         return NextResponse.json({ error: 'Evolution API Key Inválida ou Ausente.' }, { status: 401 });
      }
      return NextResponse.json(connect);
    }

    if (action === 'logout') {
      // Tentar logout limpo, mas SEMPRE deletar a instância para garantir que o próximo QR code seja limpo
      await logoutInstance();
      console.log('[evolution/logout] Deletando instância para garantir desconexão total.');
      await deleteInstance();
      return NextResponse.json({ success: true, fallbackDelete: true });
    }

    // Hard reset: delete + recreate instance from scratch
    if (action === 'reset') {
      await deleteInstance();
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('Evolution API Proxy Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

