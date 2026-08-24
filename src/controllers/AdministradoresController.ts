/* ============================================================
   AdministradoresController — altas de COMPANY_ADMIN / BRANCH_ADMIN
   (AdminManagementModule del backend)
     GET    /admin/admins
     POST   /admin/companies/:empresaId/admins  → dueño de empresa
     POST   /admin/branches/:sedeId/admins      → admin de sede
     DELETE /admin/admins/:userId
   Uso exclusivo de /administradores (superadmin): se elige la
   empresa y, opcionalmente, una sede — si se elige sede, se crea un
   admin de ESA sede; si no, un dueño de TODA la empresa.
============================================================ */
import type { Administrador, CredencialesEmpleado, Negocio, Sede } from "@/models";
import { AdminApi } from "@/api/modules";
import type { ApiUser } from "@/api/types";

/** Contraseña temporal legible (sin caracteres ambiguos) — igual que Personal. */
function generarPassword(largo = 12): string {
  const abc = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  const bytes = new Uint32Array(largo);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (n) => abc[n % abc.length]).join("");
}

/**
 * Convierte un Users del API (con AdminProfile) al modelo del panel,
 * resolviendo nombre de empresa/sede con lo que ya cargó la página.
 */
function mapAdmin(u: ApiUser, negocios: Negocio[], sedesPorEmpresa: Map<string, Sede[]>): Administrador {
  const empresaId = u.AdminProfile?.empresaId != null ? String(u.AdminProfile.empresaId) : null;
  const sedeId = u.AdminProfile?.sedeId != null ? String(u.AdminProfile.sedeId) : null;
  const negocio = empresaId ? negocios.find((n) => n.id === empresaId) : undefined;
  const sede = empresaId && sedeId ? sedesPorEmpresa.get(empresaId)?.find((s) => s.id === sedeId) : undefined;
  const nombre = u.AdminProfile
    ? `${u.AdminProfile.firstName} ${u.AdminProfile.lastName}`.trim()
    : u.UserData?.name || u.email;
  return {
    id: u.id,
    nombre: nombre || u.email,
    email: u.email,
    telefono: u.AdminProfile?.phone || "—",
    rol: u.role === "COMPANY_ADMIN" ? "owner" : "admin",
    negocioId: empresaId,
    negocioName: negocio?.nombre || "—",
    sedeId,
    sedeName: sede?.nombre || "",
    activo: u.state !== "disabled" && u.state !== "blocked",
    foto: u.AdminProfile?.photoUrl || u.fotoPerfil || null,
  };
}

export const AdministradoresController = {
  /**
   * Todos los administradores (dueños de empresa + admins de sede).
   * @param negocios Empresas ya cargadas (para resolver nombre).
   * @param sedesPorEmpresa Sedes de cada empresa, id→Sede[] (idem).
   */
  async getAll(negocios: Negocio[], sedesPorEmpresa: Map<string, Sede[]>): Promise<Administrador[]> {
    const admins = await AdminApi.findAll().catch(() => [] as ApiUser[]);
    return (admins || [])
      .filter((u) => u.role === "COMPANY_ADMIN" || u.role === "BRANCH_ADMIN")
      .map((u) => mapAdmin(u, negocios, sedesPorEmpresa));
  },

  /**
   * Crea un administrador y devuelve sus credenciales (la contraseña
   * solo se puede ver esta vez). Sin `sedeId` → dueño de toda la
   * empresa (COMPANY_ADMIN); con `sedeId` → admin de esa sede
   * (BRANCH_ADMIN).
   * @throws ApiError si el backend rechaza el DTO (p. ej. correo repetido).
   */
  async crear(input: {
    empresaId: string;
    sedeId?: string;
    firstName: string;
    lastName: string;
    telefono: string;
    email: string;
  }): Promise<CredencialesEmpleado> {
    const password = generarPassword();
    const email = input.email.trim().toLowerCase();
    const nombre = `${input.firstName.trim()} ${input.lastName.trim()}`.trim();

    const form = new FormData();
    form.append("email", email);
    form.append("password", password);
    form.append("firstName", input.firstName.trim());
    form.append("lastName", input.lastName.trim());
    form.append("name", nombre);
    form.append("phone", input.telefono.trim());
    form.append("countryId", "1");
    form.append("idioma", "es");
    form.append("clientType", "business");
    form.append("state", "enabled");
    form.append("empresaId", input.empresaId);

    if (input.sedeId) {
      form.append("role", "BRANCH_ADMIN");
      form.append("sedeId", input.sedeId);
      await AdminApi.createBranchAdmin(Number(input.sedeId), form);
    } else {
      form.append("role", "COMPANY_ADMIN");
      await AdminApi.createCompanyAdmin(Number(input.empresaId), form);
    }
    return { email, password };
  },

  /** Elimina un administrador — DELETE /admin/admins/:userId. */
  async remove(userId: number): Promise<void> {
    await AdminApi.remove(userId);
  },
};
