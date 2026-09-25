"use client";
/* ============================================================
   Plan del negocio en el panel.
   El plan viaja en la sesión (lo trae el login) y desde aquí se
   puede refrescar cuando cambia: al activar la prueba o cuando el
   superadmin cobra.
============================================================ */
import { useCallback } from "react";
import { EmpresasApi } from "@/api/modules";
import { useSession } from "@/context/SessionContext";

export function usePlan() {
  const { session, updateSession } = useSession();
  const estado = session?.plan ?? null;

  /** El superadmin no pertenece a ningún negocio: lo ve todo. */
  const esPro = session?.role === "superadmin" || estado?.planEfectivo === "PRO";

  const refrescar = useCallback(async () => {
    const empresaId = Number(session?.negocioId);
    if (!empresaId) return null;
    const plan = await EmpresasApi.plan(empresaId).catch(() => null);
    if (plan) updateSession({ plan });
    return plan;
  }, [session?.negocioId, updateSession]);

  const activarPrueba = useCallback(async () => {
    const empresaId = Number(session?.negocioId);
    if (!empresaId) throw new Error("Sin negocio");
    const plan = await EmpresasApi.activarPrueba(empresaId);
    updateSession({ plan });
    return plan;
  }, [session?.negocioId, updateSession]);

  return { estado, esPro, refrescar, activarPrueba };
}
