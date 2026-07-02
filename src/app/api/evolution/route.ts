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
      if (!status || status.error) {
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
      // Try a clean logout first. If the socket is dead (Connection Closed),
      // the API returns 500 — in that case fall back to a full instance delete.
      const logout = await logoutInstance();
      const failed = logout?.status === 500 || logout?.response?.message?.some?.((m: string) => m.includes('Connection Closed'));
      if (failed) {
        console.warn('[evolution/logout] Logout failed (Connection Closed). Falling back to delete instance.');
        await deleteInstance();
      }
      return NextResponse.json({ success: true, fallbackDelete: failed });
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

