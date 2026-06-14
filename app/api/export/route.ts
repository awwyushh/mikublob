import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { exportBlobData } from '@/lib/blob-service';

export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const payload = await exportBlobData(session.user.id);

  if (!payload) {
    return NextResponse.json({ error: 'Database not ready' }, { status: 503 });
  }

  return new NextResponse(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="mikublob-export-${new Date().toISOString().slice(0, 10)}.json"`
    }
  });
}
