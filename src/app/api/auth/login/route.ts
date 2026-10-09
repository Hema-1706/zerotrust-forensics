import { NextResponse } from 'next/server';
import { db, initDatabase } from '@/lib/db';
import { verifyPassword } from '@/lib/crypto';
import { appendAuditEvent } from '@/lib/audit';

export async function POST(request: Request) {
  try {
    await initDatabase();
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 });
    }

    const userRes = await db.execute({
      sql: 'SELECT * FROM users WHERE email = ?',
      args: [email],
    });

    const user = userRes.rows[0] as any;
    if (!user) {
      return NextResponse.json({ error: 'Invalid credentials.' }, { status: 401 });
    }

    const isValid = verifyPassword(password, String(user.password_hash), String(user.password_salt));
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid credentials.' }, { status: 401 });
    }

    // Prepare session payload
    const sessionData = {
      id: String(user.id),
      email: String(user.email),
      name: String(user.name),
      role: String(user.role),
      ed25519_public_key: String(user.ed25519_public_key),
    };

    const sessionCookieValue = Buffer.from(JSON.stringify(sessionData)).toString('base64');

    // Audit log
    await appendAuditEvent(
      { id: sessionData.id, name: sessionData.name, role: sessionData.role },
      'USER_LOGIN',
      'USER',
      sessionData.id,
      { email: sessionData.email, role: sessionData.role, ip: '127.0.0.1' }
    );

    const response = NextResponse.json({
      success: true,
      user: sessionData,
    });

    response.cookies.set('zt_session', sessionCookieValue, {
      httpOnly: true,
      secure: false, // Local dev
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
