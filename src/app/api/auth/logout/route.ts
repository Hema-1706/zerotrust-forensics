import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { appendAuditEvent } from '@/lib/audit';

export async function POST() {
  const session = await getSession();
  if (session) {
    appendAuditEvent(
      { id: session.id, name: session.name, role: session.role },
      'USER_LOGOUT',
      'USER',
      session.id,
      { email: session.email }
    );
  }

  const response = NextResponse.json({ success: true });
  response.cookies.delete('zt_session');
  return response;
}
