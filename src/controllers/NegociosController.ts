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
    if (!session?.negocioId) return [];
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
};
