import { NextResponse } from 'next/server';
import { db, initDatabase } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { hashPassword, generateEd25519Keypair } from '@/lib/crypto';
import { appendAuditEvent } from '@/lib/audit';

export async function GET() {
  const authResult = await requireAuth();
  if ('error' in authResult) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  await initDatabase();

  const res = await db.execute(`
    SELECT id, email, name, role, ed25519_public_key, created_at, updated_at
    FROM users
    ORDER BY created_at ASC
  `);

  return NextResponse.json({ users: res.rows });
}

export async function POST(request: Request) {
  const authResult = await requireAuth(['Admin']);
  if ('error' in authResult) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  try {
    await initDatabase();
    const { name, email, password, role } = await request.json();

    if (!name || !email || !password || !role) {
      return NextResponse.json({ error: 'Name, Email, Password, and Role are required.' }, { status: 400 });
    }

    if (!['Admin', 'Investigator', 'Lab Analyst', 'Auditor'].includes(role)) {
      return NextResponse.json({ error: 'Invalid user role.' }, { status: 400 });
    }

    const existingRes = await db.execute({ sql: 'SELECT id FROM users WHERE email = ?', args: [email] });
    if (existingRes.rows.length > 0) {
      return NextResponse.json({ error: 'User with this email already exists.' }, { status: 400 });
    }

    const { hash, salt } = hashPassword(password);
    const keypair = generateEd25519Keypair();

    const countRes = await db.execute('SELECT COUNT(*) as count FROM users');
    const count = Number(countRes.rows[0]?.count || 0);
    const userId = `USR-${role.substring(0, 3).toUpperCase()}-${String(count + 1).padStart(3, '0')}`;
    const now = new Date().toISOString();

    const newUser = {
      id: userId,
      email,
      name,
      password_hash: hash,
      password_salt: salt,
      role,
      ed25519_public_key: keypair.publicKey,
      ed25519_private_key: keypair.privateKey,
      created_at: now,
      updated_at: now,
    };

    await db.execute({
      sql: `INSERT INTO users (id, email, name, password_hash, password_salt, role, ed25519_public_key, ed25519_private_key, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [newUser.id, newUser.email, newUser.name, newUser.password_hash, newUser.password_salt, newUser.role, newUser.ed25519_public_key, newUser.ed25519_private_key, newUser.created_at, newUser.updated_at],
    });

    await appendAuditEvent(
      { id: authResult.user.id, name: authResult.user.name, role: authResult.user.role },
      'USER_REGISTRATION',
      'USER',
      userId,
      { email, role, ed25519_public_key_generated: true }
    );

    return NextResponse.json({
      success: true,
      user: {
        id: userId,
        email,
        name,
        role,
        ed25519_public_key: keypair.publicKey,
        created_at: now,
      }
    }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'User creation failed' }, { status: 500 });
  }
}
