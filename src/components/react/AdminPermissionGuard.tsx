'use client';
import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: string;
  permissions: Record<string, boolean>;
}

const SessionContext = createContext<SessionUser | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<SessionUser | null>(null);

  useEffect(() => {
    fetch('/api/auth/session')
      .then(r => r.json().then(d => d.user && setSession(d.user)))
      .catch(() => {});
  }, []);

  return <SessionContext.Provider value={session}>{children}</SessionContext.Provider>;
}

export function useSession() {
  return useContext(SessionContext);
}

function hasPermission(session: SessionUser | null, permission: string): boolean {
  if (!session) return false;
  if (session.role === 'admin') return true;
  return !!session.permissions?.[permission];
}

interface Props {
  permission?: string;
  role?: string[];
  children: ReactNode;
  fallback?: ReactNode;
  disabled?: boolean;
}

/**
 * Gate component that conditionally renders children based on user permissions.
 * - If user has required permission: render children
 * - If user lacks permission: render fallback (default: null)
 * - If disabled=true: render children with disabled styling
 */
export default function AdminPermissionGuard({
  permission,
  role,
  children,
  fallback = null,
  disabled = false,
}: Props) {
  const session = useSession();

  if (!session) return <>{fallback}</>;

  if (role && role.length > 0 && !role.includes(session.role)) return <>{fallback}</>;

  if (permission && !hasPermission(session, permission)) return <>{fallback}</>;

  if (disabled) {
    return (
      <div className="opacity-50 pointer-events-none" title="You don't have permission">
        {children}
      </div>
    );
  }

  return <>{children}</>;
}