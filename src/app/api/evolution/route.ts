import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { createInstance, connectInstance, getInstanceStatus, logoutInstance } from '@/lib/evolution';

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
      const logout = await logoutInstance();
      return NextResponse.json(logout);
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('Evolution API Proxy Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
