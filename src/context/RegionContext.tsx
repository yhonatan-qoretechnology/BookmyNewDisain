"use client";
/* ============================================================
   RegionContext — de qué país es el negocio de la sesión
   ------------------------------------------------------------
   Bookmy se vende en España y en Colombia. El país cuelga de la
   EMPRESA: se elige al crear la cuenta y no cambia, así que aquí no
   hay selector de nada — el panel lee el país y punto. De él salen la
   moneda, la zona horaria y cómo se llaman las cosas en ese país.

   ⚙️ DE DÓNDE SALE EL PAÍS (por orden; nunca devuelve undefined):
     1. `session.pais`, pero refrescado con GET /paises por su isoCode:
        el catálogo del backend es la verdad, de modo que si allí sube
        el impuesto o el precio máximo no hay que volver a entrar.
     2. El país de la empresa de la sesión (GET /empresas/:id), la
        primera vez. Se guarda en la sesión para no repetir la
        pregunta en cada recarga.
     3. ESPANA cableado, mientras llegan los dos anteriores o si
        fallan: ninguna pantalla se queda sin moneda ni formatos.
============================================================ */
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { setZonaHoraria } from "@/lib/timezone";
import { ESPANA, paisUsable, type ClaveEtiqueta, type ConfigPais } from "@/config/paises";
import { useSession } from "@/context/SessionContext";
import { isApiEnabled } from "@/api/config";
import { EmpresasApi, PaisesApi } from "@/api/modules";
import type { ApiEmpresa } from "@/api/types";

interface RegionContextValue {
  /** País del negocio con el que se ha entrado. Nunca es undefined. */
  pais: ConfigPais;
  /** Importe en la moneda del país (25,00 € · $ 45.000). */
  fmtMoneda: (valor: number) => string;
  /** Fecha en el formato del país. Acepta Date, instante ISO o "YYYY-MM-DD". */
  fmtFecha: (d: Date | string) => string;
  /** Cómo se llama ahí lo que cambia de nombre entre países. */
  etiqueta: (clave: ClaveEtiqueta) => string;
}

/* ── Los tres ayudantes ──────────────────────────────────────
   Se construyen fuera del componente para poder dárselos también al
   valor por defecto del contexto: así `useRegion()` sigue formateando
   en euros aunque alguien monte una pantalla sin el provider. */

/** Intl revienta con un locale, una moneda o una zona horaria que no
    reconoce, y eso vendría del backend: mejor quedarse sin formateador
    que dejar la pantalla en blanco. */
function intlSeguro<T>(crear: () => T): T | null {
  try { return crear(); } catch { return null; }
}

const CALENDARIO = /^\d{4}-\d{2}-\d{2}$/;

function crearAyudantes(pais: ConfigPais): Omit<RegionContextValue, "pais"> {
  const moneda = intlSeguro(() =>
    new Intl.NumberFormat(pais.locale, {
      style: "currency",
      currency: pais.moneda,
      /* El mínimo va junto al máximo a propósito: Intl le pone a cada
         moneda sus decimales (2 para EUR) y, si el máximo es 0 como en
         Colombia, la combinación lanza RangeError. */
      minimumFractionDigits: pais.decimalesMoneda,
      maximumFractionDigits: pais.decimalesMoneda,
    })
  );

  const opcionesFecha: Intl.DateTimeFormatOptions = { day: "2-digit", month: "2-digit", year: "numeric" };
  const instante = intlSeguro(() =>
    new Intl.DateTimeFormat(pais.locale, { ...opcionesFecha, timeZone: pais.zonaHoraria })
  );
  /* Un "YYYY-MM-DD" es un día del calendario, no un instante: pasarlo
     por la zona horaria del negocio lo movería al día anterior en
     Bogotá (UTC-5), que es justo el fallo que ya tuvimos con las citas
     de primera hora. Por eso ese caso se formatea en UTC. */
  const dia = intlSeguro(() => new Intl.DateTimeFormat(pais.locale, { ...opcionesFecha, timeZone: "UTC" }));

  return {
    fmtMoneda: (valor: number) =>
      moneda ? moneda.format(valor) : `${valor.toFixed(pais.decimalesMoneda)} ${pais.moneda}`,

    fmtFecha: (d: Date | string) => {
      const esDiaSuelto = typeof d === "string" && CALENDARIO.test(d);
      const fecha = typeof d === "string" ? new Date(esDiaSuelto ? `${d}T00:00:00Z` : d) : d;
      if (Number.isNaN(fecha.getTime())) return "—";
      const formateador = esDiaSuelto ? dia : instante;
      return formateador ? formateador.format(fecha) : fecha.toISOString().slice(0, 10);
    },

    etiqueta: (clave: ClaveEtiqueta) => {
      switch (clave) {
        case "fiscal":    return pais.etiquetaFiscal;
        case "region":    return pais.etiquetaRegion;
        case "municipio": return pais.etiquetaMunicipio;
        case "impuesto":  return pais.etiquetaImpuesto;
      }
    },
  };
}

const RegionContext = createContext<RegionContextValue>({
  pais: ESPANA,
  ...crearAyudantes(ESPANA),
});

/**
 * Lo que la empresa cuenta de su país. Según lo que incluya la consulta
 * del backend llega el país anidado, solo su id, o nada en empresas
 * dadas de alta antes de vender en Colombia.
 */
interface RefPais {
  isoCode: string | null;
  id: number | null;
  /** El país entero, cuando la respuesta lo trae y sirve para formatear. */
  completo: ConfigPais | null;
}

function refDeEmpresa(empresa: ApiEmpresa): RefPais | null {
  const p = empresa.pais ?? null;
  const id = p?.id ?? empresa.paisId ?? null;
  if (!p && id == null) return null;
  const completo = paisUsable(p);
  return { isoCode: p?.isoCode ?? null, id, completo };
}

export function RegionProvider({ children }: { children: React.ReactNode }) {
  const { session, updateSession } = useSession();
  const [catalogo, setCatalogo] = useState<ConfigPais[]>([]);
  const [deEmpresa, setDeEmpresa] = useState<RefPais | null>(null);

  const paisSesion = session?.pais ?? null;
  const haySesion = !!session;
  const empresaId = Number(session?.negocioId);
  /* Un empleado no tiene empresa en su perfil (negocioId queda ""), y
     el superadmin no es de ningún negocio: para ellos no hay a quién
     preguntar y manda el respaldo. */
  const puedePreguntar = Number.isInteger(empresaId) && empresaId > 0;

  /* El catálogo solo se pide dentro del panel: en la web pública no hay
     negocio del que hablar y sería una petición por visita. El alta se
     lo pide por su cuenta, que ahí todavía no hay sesión. */
  useEffect(() => {
    if (!haySesion || !isApiEnabled() || catalogo.length > 0) return;
    let vivo = true;
    PaisesApi.listar()
      .then((lista) => { if (vivo && Array.isArray(lista) && lista.length > 0) setCatalogo(lista); })
      .catch(() => { /* se sigue con lo que ya haya: en el peor caso, España */ });
    return () => { vivo = false; };
  }, [haySesion, catalogo.length]);

  /* El login ya guarda el país en la sesión, así que lo normal es que
     esto no llegue a salir. Queda para los dos casos en que falta: una
     sesión abierta antes de este cambio (vive en sessionStorage) y una
     empresa cuya consulta devolvió el país recortado. */
  useEffect(() => {
    if (paisSesion || deEmpresa || !puedePreguntar || !isApiEnabled()) return;
    let vivo = true;
    EmpresasApi.findOne(empresaId)
      .then((empresa) => { if (vivo) setDeEmpresa(refDeEmpresa(empresa)); })
      .catch(() => { /* 403 del admin de sede, red caída…: queda España */ });
    return () => { vivo = false; };
  }, [paisSesion, deEmpresa, puedePreguntar, empresaId]);

  const pais = useMemo<ConfigPais>(() => {
    const iso = paisSesion?.isoCode || deEmpresa?.isoCode || null;
    /* El id 0 es el del respaldo cableado, no el de ningún país real. */
    const id = paisSesion?.id || deEmpresa?.id || null;
    const delCatalogo = catalogo.find(
      (p) => (iso != null && p.isoCode === iso) || (id != null && id > 0 && p.id === id)
    );
    return delCatalogo ?? paisSesion ?? deEmpresa?.completo ?? ESPANA;
  }, [catalogo, paisSesion, deEmpresa]);

  /* Resuelto una vez, se guarda en la sesión: el país no cambia, así que
     las demás pantallas y las recargas ya no preguntan nada. No se
     guarda el respaldo, que significa "aún no se sabe" y dejaría a un
     negocio colombiano clavado en euros. */
  useEffect(() => {
    if (!haySesion || paisSesion || pais === ESPANA) return;
    updateSession({ pais });
  }, [haySesion, paisSesion, pais, updateSession]);

  /* La agenda no pasa por este contexto: sus ayudantes de hora viven en
     lib/timezone porque los usan funciones puras, fuera de React. Se les
     avisa aquí de cuál es la zona del negocio. Sin esto, un negocio
     colombiano vería su agenda en hora de Madrid, seis horas por delante. */
  useEffect(() => {
    setZonaHoraria(pais.zonaHoraria);
  }, [pais.zonaHoraria]);

  const valor = useMemo<RegionContextValue>(
    () => ({ pais, ...crearAyudantes(pais) }),
    [pais]
  );

  return <RegionContext.Provider value={valor}>{children}</RegionContext.Provider>;
}

export const useRegion = () => useContext(RegionContext);
