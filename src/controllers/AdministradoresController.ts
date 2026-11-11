/* ============================================================
   AdministradoresController — altas de COMPANY_ADMIN / BRANCH_ADMIN
   (AdminManagementModule del backend)
     GET    /admin/admins
     GET    /admin/admins/:userId
     PATCH  /admin/admins/:userId                → editar (multipart)
     POST   /admin/companies/:empresaId/admins  → dueño de empresa
     POST   /admin/branches/:sedeId/admins      → admin de sede
     DELETE /admin/admins/:userId
   Lo usan el superadmin (cualquier empresa; con o sin sede) y el dueño
   de una empresa (solo admins de SUS sedes: el backend ya acota el
   listado y rechaza lo que no sea suyo).
============================================================ */
import type { Administrador, CredencialesEmpleado, Negocio, Sede } from "@/models";
import { AdminApi } from "@/api/modules";
import type { ApiUser } from "@/api/types";
import { generarPassword } from "@/lib/password";

/** Lo mínimo de una empresa que hace falta para poner su nombre. */
type EmpresaNombre = Pick<Negocio, "id" | "nombre">;

/** Datos personales opcionales del alta y de la edición. */
export interface DatosAdminExtra {
  genero?: string;
  /** YYYY-MM-DD */
  nacimiento?: string;
  foto?: File | null;
}

/**
 * Convierte un Users del API (con AdminProfile) al modelo del panel,
 * resolviendo nombre de empresa/sede con lo que ya cargó la página.
 */
function mapAdmin(u: ApiUser, negocios: EmpresaNombre[], sedesPorEmpresa: Map<string, Sede[]>): Administrador {
  const empresaId = u.AdminProfile?.empresaId != null ? String(u.AdminProfile.empresaId) : null;
  const sedeId = u.AdminProfile?.sedeId != null ? String(u.AdminProfile.sedeId) : null;
  const negocio = empresaId ? negocios.find((n) => n.id === empresaId) : undefined;
  /* La sede se busca en todas las empresas: un admin de sede puede no
     tener empresaId en su perfil. */
  const sede = sedeId
    ? (empresaId ? sedesPorEmpresa.get(empresaId) : undefined)?.find((s) => s.id === sedeId)
      ?? Array.from(sedesPorEmpresa.values()).flat().find((s) => s.id === sedeId)
    : undefined;
  const nombre = u.AdminProfile
    ? `${u.AdminProfile.firstName} ${u.AdminProfile.lastName}`.trim()
    : u.UserData?.name || u.email;
  return {
    id: u.id,
    nombre: nombre || u.email,
    firstName: u.AdminProfile?.firstName || "",
    lastName: u.AdminProfile?.lastName || "",
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

/** Añade al form los datos opcionales que se hayan rellenado. */
function anadirExtra(form: FormData, extra: DatosAdminExtra) {
  if (extra.genero) form.append("gender", extra.genero);
  if (extra.nacimiento) form.append("birthdate", extra.nacimiento);
  if (extra.foto) form.append("photoFile", extra.foto);
}

export const AdministradoresController = {
  /**
   * Los administradores que la sesión puede ver: todos para el
   * superadmin, los de las sedes de su empresa para un dueño.
   * @param negocios Empresas ya cargadas (para resolver nombre).
   * @param sedesPorEmpresa Sedes de cada empresa, id→Sede[] (idem).
   */
  async getAll(negocios: EmpresaNombre[], sedesPorEmpresa: Map<string, Sede[]>): Promise<Administrador[]> {
    const admins = await AdminApi.findAll().catch(() => [] as ApiUser[]);
    return (admins || [])
      .filter((u) => u.role === "COMPANY_ADMIN" || u.role === "BRANCH_ADMIN")
      .map((u) => mapAdmin(u, negocios, sedesPorEmpresa));
  },

  /** Género y nacimiento de un admin, para rellenar la edición. */
  async detalle(userId: number): Promise<{ genero: string; nacimiento: string }> {
    const u = await AdminApi.findOne(userId).catch(() => null);
    return {
      genero: u?.UserData?.gender || "",
      nacimiento: u?.UserData?.birthdate ? String(u.UserData.birthdate).slice(0, 10) : "",
    };
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
  } & DatosAdminExtra): Promise<CredencialesEmpleado> {
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
    anadirExtra(form, input);

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

  /**
   * Edita nombre, apellido, teléfono, estado, género, nacimiento y foto
   * — PATCH /admin/admins/:userId (multipart).
   * @throws ApiError si el backend lo rechaza (p. ej. no es de su empresa).
   */
  async actualizar(userId: number, input: {
    firstName: string;
    lastName: string;
    telefono: string;
    activo: boolean;
  } & DatosAdminExtra): Promise<void> {
    const form = new FormData();
    form.append("firstName", input.firstName.trim());
    form.append("lastName", input.lastName.trim());
    form.append("phone", input.telefono.trim());
    form.append("state", input.activo ? "enabled" : "disabled");
    anadirExtra(form, input);
    await AdminApi.update(userId, form);
  },

  /** Elimina un administrador — DELETE /admin/admins/:userId. */
  async remove(userId: number): Promise<void> {
    await AdminApi.remove(userId);
  },
};
