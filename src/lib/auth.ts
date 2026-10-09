import { cookies } from 'next/headers';
import { db, initDatabase } from './db';

export type UserRole = 'Admin' | 'Investigator' | 'Lab Analyst' | 'Auditor';

export interface UserSession {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  ed25519_public_key: string;
}

const SESSION_COOKIE_NAME = 'zt_session';

/**
 * Get current logged in user session from cookies
 */
export async function getSession(): Promise<UserSession | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);
  if (!sessionCookie || !sessionCookie.value) {
    return null;
  }

  try {
    const sessionData = JSON.parse(Buffer.from(sessionCookie.value, 'base64').toString('utf-8'));
    await initDatabase();
    // Verify user exists in database
    const userRes = await db.execute({
      sql: 'SELECT id, email, name, role, ed25519_public_key FROM users WHERE id = ?',
      args: [sessionData.id],
    });
    const user = userRes.rows[0] as unknown as UserSession | undefined;
    return user || null;
  } catch (error) {
    return null;
  }
}

/**
 * Check if user role matches allowed roles
 */
export function hasPermission(userRole: UserRole, allowedRoles: UserRole[]): boolean {
  return allowedRoles.includes(userRole);
}

/**
 * Require authentication and specific role permissions for API endpoints
 */
export async function requireAuth(allowedRoles?: UserRole[]): Promise<{ user: UserSession } | { error: string; status: number }> {
  const session = await getSession();
  if (!session) {
    return { error: 'Authentication required. Please sign in.', status: 401 };
  }

  if (allowedRoles && !hasPermission(session.role, allowedRoles)) {
    return {
      error: `Access Denied. Role '${session.role}' is not authorized to perform this operation.`,
      status: 403,
    };
  }

  return { user: session };
}
