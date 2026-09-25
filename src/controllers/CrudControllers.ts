/* ============================================================
   Controladores de dominio — consumo exclusivo del API oficial.
   Cada bloque es el espejo de un módulo NestJS del backend.
============================================================ */
import type {
  CategoriaCatalogo, CredencialesEmpleado, Cliente, Empleado, Factura, Reserva,
  Resena, SedeDetalle, Servicio, Session,
} from "@/models";
import {
  AsignacionesApi, CategoriesApi, ClientsApi, ImagenesApi, PaymentsApi, ProfesionalesApi,
  ResenasApi, SedesApi, ServicesApi, ServicesWriteApi,
} from "@/api/modules";
import type {
  ApiClient, ApiProfesional, ApiResena, ApiSede, ApiService, ApiServicioAsignable, ClientUpdatePayload,
} from "@/api/types";
import { generarPassword } from "@/lib/password";
import { madridToday } from "@/lib/timezone";
import { ReservasController } from "./ReservasController";

/* ── Clientes (ClientManagementModule: GET /clients) ─────── */
/** Nº de visitas y última visita, calculadas desde las citas. */
interface EstadisticasCliente {
  visitas: number;
  ultima: string;
}

/**
 * Agrupa las citas por cliente.
 * Se cuenta como visita toda cita ya pasada que no esté cancelada ni
 * marcada como no presentada; la última visita es la más reciente de
 * ellas. El alcance lo fija la sesión (una sede, las de la empresa o
 * todas), así que un admin de sede solo ve lo suyo.
 */
function agruparVisitas(reservas: Reserva[]): Map<number, EstadisticasCliente> {
  const hoy = new Date().toISOString().slice(0, 10);
  const porCliente = new Map<number, EstadisticasCliente>();

  for (const r of reservas) {
    if (r.clienteId == null) continue;
    if (r.estado === "cancelado" || r.estado === "noShow") continue;
    if (r.fecha > hoy) continue; // aún no ha ocurrido

    const previo = porCliente.get(r.clienteId);
    if (!previo) {
      porCliente.set(r.clienteId, { visitas: 1, ultima: r.fecha });
    } else {
      previo.visitas += 1;
      if (r.fecha > previo.ultima) previo.ultima = r.fecha;
    }
  }

  return porCliente;
}

export const ClientesController = {
  /**
   * Clientes finales — GET /clients (ClientManagementModule).
   *
   * Sustituye a /auth/users: el backend ya filtra por role CLIENT,
   * pagina y aplica el guard de rol, y la respuesta pesa ~6 veces
   * menos. El endpoint filtra por `name` y `email` de forma
   * independiente (combinados serían AND), así que para conservar la
   * búsqueda «nombre O correo» se lanzan las dos y se fusionan.
   *
   * @param term Texto libre: se busca en nombre y en correo.
   * @param session Sesión activa; delimita las citas para las visitas.
   */
  async search(term: string, session?: Session | null): Promise<Cliente[]> {
    const q = term.trim();

    const paginas = q
      ? await Promise.all([
          ClientsApi.list({ name: q, limit: 100 }).catch(() => null),
          ClientsApi.list({ email: q, limit: 100 }).catch(() => null),
        ])
      : [await ClientsApi.list({ limit: 100 }).catch(() => null)];

    /* Fusión por id para no repetir a quien coincide por ambos campos */
    const unicos = new Map<number, ApiClient>();
    for (const p of paginas) {
      for (const c of p?.clients ?? []) unicos.set(c.id, c);
    }

    /* Visitas reales en lugar de los ceros que se mostraban antes */
    const reservas = session
      ? await ReservasController.getForSession(session).catch(() => [] as Reserva[])
      : [];
    const stats = agruparVisitas(reservas);

    return [...unicos.values()].map((c) => {
      const s = stats.get(c.id);
      return {
        id: c.id,
        nombre: c.userData?.name || c.email,
        correo: c.email,
        telefono: c.userData?.phone || "—",
        foto: c.fotoPerfil || null,
        estado: c.state,
        visitas: s?.visitas ?? 0,
        ultima: s?.ultima ?? "—",
      };
    });
  },

  /**
   * Ficha completa — GET /clients/:id. Trae además el `historial`
   * (citas, pagos, reseñas), que es lo que decide si al dar de baja
   * la cuenta se borrará o solo se anonimizará.
   */
  getDetalle: (id: number) => ClientsApi.findOne(id),

  /**
   * PATCH /clients/:id. Solo se envían los campos con valor para no
   * pisar con cadenas vacías lo que el cliente ya tenía guardado.
   */
  async update(id: number, datos: ClientUpdatePayload): Promise<ApiClient> {
    const limpio: ClientUpdatePayload = {};
    for (const [clave, valor] of Object.entries(datos)) {
      if (valor === undefined) continue;
      if (typeof valor === "string" && !valor.trim()) continue;
      (limpio as Record<string, unknown>)[clave] =
        typeof valor === "string" ? valor.trim() : valor;
    }
    return ClientsApi.update(id, limpio);
  },

  /** PATCH /clients/:id/password — el admin no necesita la anterior. */
  cambiarPassword: (id: number, password: string) =>
    ClientsApi.changePassword(id, password),

  /**
   * DELETE /clients/:id. Devuelve `mode` para poder contar al usuario
   * qué ocurrió: `deleted` (se borró) o `anonymized` (tenía historial
   * de facturación y solo se anonimizaron sus datos).
   */
  remove: (id: number) => ClientsApi.remove(id),
};

/* ── Servicios (ServiceModule + CategoryModule) ──────────── */

/** Categoría de respaldo cuando el servicio no tiene ninguna asignada */
export const SIN_CATEGORIA = "Sin categoría";

/**
 * Resuelve el nombre de la categoría de un servicio tolerando las
 * distintas formas en que el backend puede serializar la relación:
 * `category.name`, `category.translations[]` o solo `categoryId`.
 */
function nombreCategoria(
  sv: ApiService,
  porId: Map<number, string>,
  language: string
): string {
  const cat = sv.category;
  if (cat?.name) return cat.name;
  const trads = cat?.translations ?? [];
  const propia = trads.find((tr) => tr.language === language) ?? trads[0];
  if (propia?.name) return propia.name;
  const id = cat?.id ?? sv.categoryId;
  return (id != null ? porId.get(id) : undefined) || SIN_CATEGORIA;
}

export const ServiciosController = {
  /**
   * Lista servicios con traducción y precio — GET /services?language=.
   * @param term Búsqueda por nombre/descripción.
   * @param language Idioma activo del panel.
   */
  async search(term: string, language = "es"): Promise<Servicio[]> {
    const q = term.toLowerCase();
    /* GET /services ya resuelve el nombre de la categoría. Antes se
       pedían también todas las categorías para completarlo, lo que
       suponía una segunda petición en cada pulsación del buscador;
       nombreCategoria conserva ese camino como respaldo. */
    const list = await ServicesApi.findAll(language).catch(() => []);
    const porId = new Map<number, string>();
    return (list || [])
      .map((sv) => ({
        id: sv.id,
        nombre: sv.name,
        categoria: nombreCategoria(sv, porId, language),
        categoryId: sv.category?.id ?? sv.categoryId ?? null,
        descripcion: sv.description || "",
        duracion: sv.prices?.[0]?.duration ?? 30,
        precio: sv.prices?.[0]?.amount ?? 0,
        activo: true,
        imagenes: sv.imagenes ?? [],
      }))
      .filter((s) => (s.nombre + s.categoria + s.descripcion).toLowerCase().includes(q));
  },

  /** Agrupa el catálogo por categoría conservando el orden de aparición. */
  agruparPorCategoria(servicios: Servicio[]): CategoriaCatalogo[] {
    const grupos = new Map<string, Servicio[]>();
    for (const s of servicios) {
      const lista = grupos.get(s.categoria);
      if (lista) lista.push(s);
      else grupos.set(s.categoria, [s]);
    }
    return Array.from(grupos, ([categoria, lista]) => ({ categoria, servicios: lista }));
  },

  /**
   * Categorías para el alta — GET /categories?language=.
   * @returns Opciones { id, nombre } con la traducción resuelta.
   */
  async getCategorias(language = "es"): Promise<Array<{ id: number; nombre: string }>> {
    const list = await CategoriesApi.findAll(language).catch(() => []);
    return (list || []).map((c) => ({
      id: c.id,
      nombre: c.translations?.[0]?.name || `#${c.id}`,
    }));
  },

  /**
   * Crea un servicio — POST /services con el CreateServiceDto exacto
   * (categoryId + translations[] + prices[]). Si se pasan `imagenes`,
   * viaja como multipart (translations/prices serializados con
   * JSON.stringify, tal como espera el backend en ese modo).
   */
  async create(input: {
    nombre: string;
    descripcion?: string;
    categoryId: number;
    duracion: number;
    precio: number;
    language: string;
    imagenes?: File[];
  }): Promise<void> {
    const dto = {
      categoryId: input.categoryId,
      translations: [
        { language: input.language, name: input.nombre, description: input.descripcion },
      ],
      prices: [{ amount: input.precio, duration: input.duracion, currency: "EUR" }],
    };
    if (input.imagenes?.length) {
      await ServicesWriteApi.createConImagenes(dto, input.imagenes);
    } else {
      await ServicesWriteApi.create(dto);
    }
  },

  /**
   * Actualiza un servicio — PUT /services/:id. Solo manda los campos
   * presentes; si hay `imagenes`, se SUMAN a la galería existente (el
   * backend no la reemplaza).
   */
  async update(id: number, input: {
    nombre?: string;
    descripcion?: string;
    categoryId?: number;
    duracion?: number;
    precio?: number;
    language: string;
    imagenes?: File[];
  }): Promise<void> {
    const dto = {
      categoryId: input.categoryId,
      translations: input.nombre
        ? [{ language: input.language, name: input.nombre, description: input.descripcion }]
        : undefined,
      prices: input.precio != null || input.duracion != null
        ? [{ amount: input.precio ?? 0, duration: input.duracion ?? 30, currency: "EUR" }]
        : undefined,
    };
    if (input.imagenes?.length) {
      await ServicesWriteApi.updateConImagenes(id, dto, input.imagenes);
    } else {
      await ServicesWriteApi.update(id, dto);
    }
  },

  /** Añade una imagen — POST /services/:id/imagen. @returns galería actualizada. */
  async subirImagen(id: number, file: File): Promise<string[]> {
    const actualizado = await ImagenesApi.servicio(id, file);
    return actualizado?.imagenes ?? [];
  },

  /** Añade varias — POST /services/:id/imagenes (tope MAX_ARCHIVOS_SERVICIO). */
  async subirImagenes(id: number, files: File[]): Promise<string[]> {
    const actualizado = await ImagenesApi.servicioVarias(id, files);
    return actualizado?.imagenes ?? [];
  },

  /** Quita una imagen — DELETE /services/:id/imagenes { imagenes: [ruta] }. */
  async borrarImagen(id: number, ruta: string): Promise<string[]> {
    const actualizado = await ImagenesApi.borrarServicioImagenes(id, [ruta]);
    return actualizado?.imagenes ?? [];
  },

  /** Reemplaza la imagen de una posición — PUT /services/:id/imagenes/:index. */
  async reemplazarImagen(id: number, index: number, file: File): Promise<string[]> {
    const actualizado = await ImagenesApi.reemplazarServicioImagen(id, index, file);
    return actualizado?.imagenes ?? [];
  },

  /** Elimina un servicio y sus dependencias — DELETE /services/:id. */
  async remove(id: number): Promise<void> {
    await ServicesWriteApi.remove(id);
  },
};

/* ── Facturación (PaymentModule) ─────────────────────────── */
export const FacturasController = {
  /**
   * Pagos como facturación — GET /payments.
   * PaymentStatus: PAID→pagado · PENDING/RESERVED→pendiente ·
   * FAILED/CANCELLED→cancelado.
   */
  async search(term: string): Promise<Factura[]> {
    const q = term.toLowerCase();
    const list = await PaymentsApi.findAll().catch(() => []);
    return (list || [])
      .map((p) => ({
        id: `PAY-${p.id}`,
        cliente: p.user?.UserData?.name || p.user?.email || `#${p.appointmentId}`,
        foto: p.user?.fotoPerfil || null,
        fecha: (p.createdAt || "").slice(0, 10) || "—",
        total: p.totalAmount,
        estado: (p.status === "PAID"
          ? "pagado"
          : p.status === "FAILED" || p.status === "CANCELLED"
            ? "cancelado"
            : "pendiente") as Factura["estado"],
      }))
      .filter((f) => (f.cliente + f.id).toLowerCase().includes(q));
  },
};

/* ── Reseñas (ResenaModule) ──────────────────────────────── */
const RESENA_ESTADO: Record<string, Resena["estado"]> = {
  PENDIENTE: "pendiente",
  APROBADA: "aprobada",
  RECHAZADA: "rechazada",
};

const mapResena = (r: ApiResena): Resena => {
  const estado = RESENA_ESTADO[r.estado] ?? (r.aprobado ? "aprobada" : "pendiente");
  return {
    id: r.id,
    cliente: r.usuario?.UserData?.name || r.usuario?.email || `#${r.usuarioId}`,
    email: r.usuario?.email || "",
    foto: r.usuario?.fotoPerfil || null,
    estrellas: Math.round(r.calificacion),
    texto: r.comentario || "",
    fecha: (r.createdAt || "").slice(0, 10),
    estado,
    aprobada: estado === "aprobada",
  };
};

export const ResenasController = {
  /** Lista reseñas — GET /resenas (incluye usuario.UserData). */
  async search(term: string): Promise<Resena[]> {
    const q = term.toLowerCase();
    const list = await ResenasApi.findAll().catch(() => []);
    return (list || []).map(mapResena).filter((r) => (r.cliente + r.texto).toLowerCase().includes(q));
  },

  /**
   * Reseñas de una sede concreta — GET /resenas/sede/:sedeId. Se usa
   * desde el drill-down "Sedes" de /empresas, donde se quiere ver
   * (y moderar) solo lo que dejaron los clientes de ESA sede.
   */
  async searchPorSede(sedeId: number): Promise<Resena[]> {
    const list = await ResenasApi.bySede(sedeId).catch(() => []);
    return (list || []).map(mapResena);
  },

  /**
   * Publica o rechaza una reseña — PATCH /resenas/:id/aprobar.
   * El backend deja `estado` en APROBADA o RECHAZADA según el valor.
   * @param aprobado true la publica, false la rechaza.
   */
  async aprobar(id: number, aprobado = true): Promise<void> {
    await ResenasApi.aprobar(id, aprobado);
  },

  /**
   * Borra una reseña — DELETE /resenas/:id.
   * Es definitivo: el backend no guarda un estado de borrada, quita
   * la fila. Para retirarla de la web sin perderla, usar aprobar(id,
   * false), que la deja en RECHAZADA.
   */
  async remove(id: number): Promise<void> {
    await ResenasApi.remove(id);
  },
};

/* ── Personal (ProfesionalModule + AuthModule) ───────────── */


export const PersonalController = {
  /**
   * Lista profesionales — GET /profesionales, con el nombre de la
   * sede resuelto a partir de las sedes visibles para la sesión.
   *
   * ⚠️ GET /profesionales no filtra por tenant: sin `sedes` esta lista
   * trae los profesionales de TODAS las empresas. Cuando la vista ya
   * conoce las sedes visibles (owner/admin con negocio activo) se
   * filtra aquí mismo, para que Personal respete el aislamiento
   * multi-tenant igual que el resto del panel. Con `sedes` vacío
   * (superadmin sin empresa elegida) se deja tal cual: no hay un
   * alcance claro contra el que filtrar.
   * @param term Búsqueda por nombre o rol.
   * @param sedes Sedes { id, nombre } ya cargadas por la vista.
   */
  async search(
    term: string,
    sedes: Array<{ id: string; nombre: string }> = [],
    session?: Session | null
  ): Promise<Empleado[]> {
    const q = term.toLowerCase();
    const [list, reservas] = await Promise.all([
      ProfesionalesApi.findAll().catch(() => []),
      session
        ? ReservasController.getForSession(session).catch(() => [] as Reserva[])
        : Promise.resolve([] as Reserva[]),
    ]);
    const nombreSede = new Map(sedes.map((s) => [s.id, s.nombre]));
    const sedeIds = new Set(sedes.map((s) => s.id));
    /* La columna "reservas este mes" mostraba siempre 0: el dato nunca se
       calculaba. Se cuenta sobre las citas visibles de la sesión, sin las
       canceladas ni las extensiones (que no son reservas nuevas). */
    const mesActual = madridToday().slice(0, 7);
    const reservasDelMes = new Map<string, number>();
    for (const r of reservas) {
      if (r.extensionDeId != null) continue;
      if (r.estado === "cancelado") continue;
      if (!r.fecha.startsWith(mesActual)) continue;
      const k = String(r.empleadoId);
      reservasDelMes.set(k, (reservasDelMes.get(k) || 0) + 1);
    }
    return (list || [])
      .filter((p) => sedeIds.size === 0 || sedeIds.has(String(p.sedeId)))
      .map((p) => ({
        id: p.id,
        nombre: p.nombre,
        rol: p.biografia || "Profesional",
        /* Misma fuente que el carrusel de profesionales del agendado */
        foto: p.imagen || null,
        sede: nombreSede.get(String(p.sedeId)) || "—",
        sedeId: String(p.sedeId),
        telefono: p.phone || "",
        reservas: reservasDelMes.get(String(p.id)) || 0,
        activo: p.state !== "disabled",
        tieneAcceso: p.acceso?.tieneAcceso ?? false,
        accesoEmail: p.acceso?.email ?? null,
      }))
      .filter((p) => (p.nombre + p.rol).toLowerCase().includes(q));
  },

  /**
   * Profesionales de UNA sede — GET /profesionales/by-sede/:sedeId.
   * Se usa desde el drill-down "Sedes" de /empresas: ya viene acotado
   * por sede, así que no hace falta el filtro por tenant de `search`.
   */
  async searchPorSede(sedeId: number, sedeNombre: string): Promise<Empleado[]> {
    const list = await ProfesionalesApi.findBySede(sedeId).catch(() => []);
    return (list || []).map((p) => ({
      id: p.id,
      nombre: p.nombre,
      rol: p.biografia || "Profesional",
      foto: p.imagen || null,
      sede: sedeNombre,
      sedeId: String(p.sedeId),
      telefono: p.phone || "",
      reservas: 0,
      activo: p.state !== "disabled",
      tieneAcceso: p.acceso?.tieneAcceso ?? false,
      accesoEmail: p.acceso?.email ?? null,
    }));
  },

  /** Sugiere una contraseña temporal legible, para prellenar los
      formularios de alta / dar acceso / cambiar acceso. */
  sugerirPassword(): string {
    return generarPassword();
  },

  /**
   * Crea un profesional — POST /profesionales. `password` es
   * obligatorio (login de profesionales, rol EMPLOYEE): el backend
   * genera solo el correo de acceso (patrón nombre@empresa.com) y lo
   * devuelve en `acceso.email`, para mostrárselo al admin.
   *
   * La foto va en una segunda petición (PATCH /profesionales/:id/imagen)
   * en lugar de como multipart del POST. El backend admite las dos formas,
   * pero así el alta usa exactamente el mismo camino de siempre: si la
   * imagen falla, el profesional queda creado y solo se pierde la foto,
   * que se puede volver a subir desde la edición.
   *
   * @returns `fotoFallida` en true si se creó pero la imagen no subió.
   */
  async crear(input: {
    nombre: string; rol: string; telefono: string; sedeId: string; password: string;
    foto?: File | null;
    /** Correo REAL del empleado. Si se indica, el backend le manda el enlace
        para que fije su propia contraseña; el de login es sintético. */
    emailPersonal?: string;
  }): Promise<{ email: string; fotoFallida: boolean }> {
    const creado = await ProfesionalesApi.create({
      nombre: input.nombre.trim(),
      phone: input.telefono.trim(),
      sedeId: Number(input.sedeId),
      biografia: input.rol.trim() || undefined,
      password: input.password,
      emailPersonal: input.emailPersonal?.trim() || undefined,
    });

    let fotoFallida = false;
    if (input.foto) {
      try {
        await ImagenesApi.profesional(creado.id, input.foto);
      } catch {
        fotoFallida = true;
      }
    }

    return { email: creado.acceso.email, fotoFallida };
  },

  /** Edita un profesional — PATCH /profesionales/:id. */
  async update(
    id: number,
    input: { nombre: string; rol: string; telefono: string; sedeId: string }
  ): Promise<void> {
    await ProfesionalesApi.update(id, {
      nombre: input.nombre.trim(),
      phone: input.telefono.trim(),
      biografia: input.rol.trim(),
      sedeId: Number(input.sedeId),
    });
  },

  /**
   * Da acceso al panel a un profesional viejo que aún no tenía login —
   * PATCH /profesionales/:id/vincular-acceso { email, password }.
   * @throws ApiError si el correo ya existe o el DTO no coincide.
   */
  async darAcceso(id: number, email: string, password: string): Promise<CredencialesEmpleado> {
    const correo = email.trim().toLowerCase();
    await ProfesionalesApi.vincularAcceso(id, { email: correo, password });
    return { email: correo, password };
  },

  /**
   * Cambia correo y/o contraseña de un profesional que ya tiene login —
   * PATCH /profesionales/:id/acceso { email?, password? }. Solo se
   * manda lo que cambió; la contraseña se devuelve para mostrarla UNA
   * sola vez (el backend no la vuelve a exponer).
   */
  async cambiarAcceso(
    id: number,
    cambios: { email?: string; password?: string }
  ): Promise<{ email: string; password?: string }> {
    const payload: { email?: string; password?: string } = {};
    if (cambios.email) payload.email = cambios.email.trim().toLowerCase();
    if (cambios.password) payload.password = cambios.password;
    const res = await ProfesionalesApi.cambiarAcceso(id, payload);
    return { email: res.email || payload.email || "", password: cambios.password };
  },

  /**
   * Inhabilita o vuelve a habilitar — PATCH /profesionales/:id { state }.
   * Es la "baja" de los administradores que no son superadmin: el
   * profesional se conserva con su historial de citas.
   */
  async cambiarEstado(id: number, activo: boolean): Promise<void> {
    await ProfesionalesApi.update(id, { state: activo ? "enabled" : "disabled" });
  },

  /** Elimina un profesional — DELETE /profesionales/:id (solo superadmin). */
  async remove(id: number): Promise<void> {
    await ProfesionalesApi.remove(id);
  },
};

/* ── Sedes (SedeModule, multi-tenant) ────────────────────── */
function mapSedeDetalle(s: ApiSede, equipo: number): SedeDetalle {
  return {
    id: s.id,
    negocioId: String(s.empresaId),
    nombre: s.nombre,
    direccion: s.direccion,
    equipo,
    activa: true,
    imagenes: s.imagenes ?? [],
    telefono: s.telefono || "",
    provincia: s.provincia || "",
    latitud: s.latitud ?? null,
    longitud: s.longitud ?? null,
    horario: s.horario ?? null,
    diasCerrado: s.diasCerrado ?? [],
  };
}

export const SedesController = {
  /**
   * Sedes de la empresa — GET /sedes/empresa/:empresaId.
   * @param term Búsqueda por nombre/dirección.
   * @param negocioId Empresa (tenant) de la sesión.
   */
  async search(term: string, negocioId: string): Promise<SedeDetalle[]> {
    const q = term.toLowerCase();
    /* El listado de sedes no siempre incluye la relación `profesionales`,
       así que el equipo se cuenta con una única consulta a
       GET /profesionales agrupada por sedeId. */
    const [list, profesionales] = await Promise.all([
      negocioId
        ? SedesApi.findByEmpresa(Number(negocioId)).catch(() => [])
        : SedesApi.findAll().catch(() => []),
      ProfesionalesApi.findAll().catch(() => [] as ApiProfesional[]),
    ]);
    const equipoPorSede = new Map<number, number>();
    for (const p of profesionales || []) {
      equipoPorSede.set(p.sedeId, (equipoPorSede.get(p.sedeId) || 0) + 1);
    }
    return (list || [])
      .map((s) => mapSedeDetalle(s, equipoPorSede.get(s.id) ?? s.profesionales?.length ?? 0))
      .filter((s) => (s.nombre + s.direccion).toLowerCase().includes(q));
  },

  /**
   * Sedes de una empresa concreta (sin depender de la sesión) — usado
   * por el drill-down "Sedes" de /empresas, donde el superadmin mira
   * una empresa que no es necesariamente la que tiene "activa".
   */
  async getByEmpresa(negocioId: string): Promise<SedeDetalle[]> {
    return this.search("", negocioId);
  },

  /**
   * Una sede por id — GET /sedes/:id. Fuente única de la vista de
   * edición (/sedes/:id/editar): trae también `horario` y
   * `diasCerrado`, que el listado no necesita pintar.
   */
  async getById(id: number): Promise<SedeDetalle | null> {
    const s = await SedesApi.findOne(id).catch(() => null);
    if (!s) return null;
    return mapSedeDetalle(s, s.profesionales?.length ?? 0);
  },

  /**
   * Crea una sede — POST /sedes.
   * Los campos geográficos son opcionales: si Places no los resolvió, la sede
   * se crea igual y se pueden completar después desde la edición.
   */
  async add(input: {
    nombre: string; direccion: string; negocioId: string;
    pais?: string; provincia?: string; municipio?: string; localidad?: string;
    latitud?: number; longitud?: number;
  }): Promise<void> {
    await SedesApi.create({
      nombre: input.nombre,
      direccion: input.direccion,
      empresaId: Number(input.negocioId),
      pais: input.pais?.trim() || undefined,
      provincia: input.provincia?.trim() || undefined,
      municipio: input.municipio?.trim() || undefined,
      localidad: input.localidad?.trim() || undefined,
      latitud: input.latitud,
      longitud: input.longitud,
    });
  },

  /** Elimina una sede — DELETE /sedes/:id (borra también sus imágenes). */
  async remove(id: number): Promise<void> {
    await SedesApi.remove(id);
  },

  /**
   * Edita una sede — PATCH /sedes/:id. Incluye horario y días cerrado:
   * el backend los guarda como JSON en la fila de la sede (columnas
   * `horario`/`diasCerrado`), que es lo que de hecho usa hoy el cálculo
   * de disponibilidad (las tablas horario_sede/dia_cerrado_sede están
   * vacías en producción — ver src/lib/disponibilidad.ts). Si algún día
   * se llenan esas tablas, tienen precedencia sobre este JSON y este
   * formulario dejaría de reflejar la disponibilidad real.
   */
  async update(id: number, input: {
    nombre: string; direccion: string; telefono: string; provincia: string;
    latitud?: number | null; longitud?: number | null;
    horario?: Record<string, string>; diasCerrado?: string[];
  }): Promise<void> {
    await SedesApi.update(id, {
      nombre: input.nombre.trim(),
      direccion: input.direccion.trim(),
      telefono: input.telefono.trim() || undefined,
      provincia: input.provincia.trim() || undefined,
      latitud: input.latitud ?? undefined,
      longitud: input.longitud ?? undefined,
      horario: input.horario,
      diasCerrado: input.diasCerrado,
    });
  },

  /**
   * Añade una imagen a la sede — POST /sedes/:id/imagen (campo "imagen").
   * El backend la agrega al array `imagenes` y devuelve la sede entera.
   * @returns el listado de imágenes ya actualizado.
   */
  async subirImagen(sedeId: number, file: File): Promise<string[]> {
    const actualizada = await ImagenesApi.sede(sedeId, file);
    return actualizada?.imagenes ?? [];
  },

  /** Quita una imagen — DELETE /sedes/:id/imagenes { imagenes: [ruta] }. */
  async borrarImagen(sedeId: number, ruta: string): Promise<string[]> {
    const actualizada = await ImagenesApi.borrarSedeImagenes(sedeId, [ruta]);
    return actualizada?.imagenes ?? [];
  },
};

/* ── Servicios por sede y profesional ─────────────────────── */

export interface ServicioAsignable {
  id: number;
  nombre: string;
  categoria: string;
  precio: number;
  moneda: string;
  duracion: number;
  asignado: boolean;
  asignacionId: number | null;
}

/**
 * Gestiona qué servicios presta cada profesional en cada sede.
 *
 * Escribe en service_sede_profesional, que es la tabla que valida el
 * backend al crear una cita. La relación Sede<->Service (la que usa el
 * control de permisos) la sincroniza el propio backend, asi que desde
 * aqui no hay que tocarla.
 */
export const AsignacionesController = {
  /** Catálogo completo de la sede con el estado de asignación. */
  async listar(
    sedeId: number,
    profesionalId: number,
    language = "es",
  ): Promise<ServicioAsignable[]> {
    const list = await AsignacionesApi.porProfesional(sedeId, profesionalId, language)
      .catch(() => [] as ApiServicioAsignable[]);
    return (list || []).map((s) => ({
      id: s.id,
      nombre: s.nombre,
      categoria: s.categoria || "—",
      precio: s.precios?.[0]?.amount ?? 0,
      moneda: s.precios?.[0]?.currency ?? "EUR",
      duracion: s.precios?.[0]?.duration ?? 0,
      asignado: s.asignado,
      asignacionId: s.asignacionId,
    }));
  },

  /**
   * Activa o desactiva un servicio para ese profesional.
   * @returns el nuevo `asignacionId`, o null si se desasignó.
   */
  async alternar(
    servicio: ServicioAsignable,
    sedeId: number,
    profesionalId: number,
  ): Promise<number | null> {
    if (servicio.asignado && servicio.asignacionId != null) {
      await AsignacionesApi.quitar(servicio.asignacionId);
      return null;
    }
    const creada = await AsignacionesApi.asignar({
      sedeId,
      serviceId: servicio.id,
      profesionalId,
    });
    return creada?.id ?? null;
  },
};
