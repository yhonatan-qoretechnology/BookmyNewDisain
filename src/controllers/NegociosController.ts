/* ============================================================
   NegociosController — empresas (EmpresaModule del backend)
   GET/POST /empresas · GET /sedes/empresa/:id
============================================================ */
import type { Negocio, Sede, Session } from "@/models";
import { EmpresasApi, SedesApi } from "@/api/modules";
import type { ApiEmpresa } from "@/api/types";

/**
 * Convierte una Empresa del API al modelo del panel.
 * @param e Empresa cruda (tabla empresas).
 */
const mapEmpresa = (e: ApiEmpresa): Negocio => ({
  id: String(e.id),
  nombre: e.nombre,
  rubro: e.descripcion || "—",
  activo: true,
  logo: e.logo ?? null,
  plan: e.plan ?? "FREE",
  trialEndsAt: e.trialEndsAt ?? null,
  /* Una prueba viva vale como Pro aunque el plan contratado sea FREE. */
  enPrueba: !!e.trialEndsAt && new Date(e.trialEndsAt).getTime() > Date.now(),
  /* Sin fila de KYC es que nunca envió documentación: le toca subirla. */
  kycEstado: e.kyc?.estado ?? "PENDIENTE",
  bloqueada: !!e.bloqueada,
  bloqueadaMotivo: e.bloqueadaMotivo ?? null,
  /* El backend lo manda como `country`, igual que el campo de Prisma. */
  paisIso: e.country?.isoCode ?? e.pais?.isoCode ?? null,
  paisNombre: e.country?.nombre ?? e.pais?.nombre ?? null,
});

export const NegociosController = {
  /** Empresas registradas en la plataforma — GET /empresas. */
  async getAll(): Promise<Negocio[]> {
    return (await EmpresasApi.findAll()).map(mapEmpresa);
  },

  /** Sedes de una empresa — GET /sedes/empresa/:empresaId. */
  async getSedes(negocioId: string): Promise<Sede[]> {
    const list = await SedesApi.findByEmpresa(Number(negocioId));
    return list.map((s) => ({
      id: String(s.id),
      negocioId: String(s.empresaId),
      nombre: s.nombre,
      ciudad: s.provincia || "",
      activa: true,
    }));
  },

  /** Sedes visibles para la sesión (aislamiento por tenant). */
  async getSedesForSession(session: Session | null): Promise<Sede[]> {
    /* El superadmin sin empresa elegida lleva negocioId "0": no hay sedes que pedir. */
    if (!session?.negocioId || !Number(session.negocioId)) return [];
    return this.getSedes(session.negocioId);
  },

  /** Nº de sedes de una empresa (listado de superadmin). */
  async countSedes(negocioId: string): Promise<number> {
    return (await this.getSedes(negocioId)).length;
  },

  /**
   * Registra una empresa — POST /empresas (CreateEmpresaDto).
   * @param input nombre y descripción (rubro).
   */
  async add(input: { nombre: string; rubro: string }): Promise<Negocio> {
    const created = await EmpresasApi.create({
      nombre: input.nombre,
      descripcion: input.rubro,
    });
    return mapEmpresa(created);
  },

  /**
   * Corta el acceso de una empresa — PATCH /empresas/:id/bloquear.
   * Sus admins y profesionales no podrán entrar al panel (el login
   * devuelve EMPRESA_BLOQUEADA) y sus sedes dejan de admitir reservas.
   * @throws ApiError 403 si quien llama no es superadmin.
   */
  async bloquear(negocioId: string, motivo?: string): Promise<void> {
    await EmpresasApi.bloquear(Number(negocioId), motivo);
  },

  /** Devuelve el acceso — PATCH /empresas/:id/desbloquear. */
  async desbloquear(negocioId: string): Promise<void> {
    await EmpresasApi.desbloquear(Number(negocioId));
  },
};
