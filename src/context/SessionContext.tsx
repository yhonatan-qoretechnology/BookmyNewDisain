"use client";
/* ============================================================
   SessionContext — sesión del usuario (sessionStorage)
============================================================ */
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { Session } from "@/models";
import { AuthController } from "@/controllers/AuthController";

interface SessionContextValue {
  session: Session | null;
  /** true mientras se lee sessionStorage en el cliente */
  loading: boolean;
  login: (session: Session) => void;
  logout: () => void;
  updateSession: (patch: Partial<Session>) => void;
}

const SessionContext = createContext<SessionContextValue>({
  session: null,
  loading: true,
  login: () => {},
  logout: () => {},
  updateSession: () => {},
});

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setSession(AuthController.getSession());
    setLoading(false);
  }, []);

  const login = useCallback((s: Session) => {
    AuthController.setSession(s);
    setSession(s);
  }, []);

  const logout = useCallback(() => {
    AuthController.clearSession();
    setSession(null);
  }, []);

  const updateSession = useCallback((patch: Partial<Session>) => {
    setSession((prev) => {
      if (!prev) return prev;
      const next = { ...prev, ...patch };
      AuthController.setSession(next);
      return next;
    });
  }, []);

  return (
    <SessionContext.Provider value={{ session, loading, login, logout, updateSession }}>
      {children}
    </SessionContext.Provider>
  );
}

export const useSession = () => useContext(SessionContext);
