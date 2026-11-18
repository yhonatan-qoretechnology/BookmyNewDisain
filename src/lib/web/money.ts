/* ============================================================
   Países, monedas y formato de importes de la WEB PÚBLICA
   ------------------------------------------------------------
   OJO, no confundir con src/config/paises.ts: son dos cosas
   distintas y las dos hacen falta.

     · src/config/paises.ts  → los países donde Bookmy OPERA. La
       lista la manda el backend (GET /paises) y de ella sale el
       país de cada negocio, con su moneda, su impuesto y su
       documento fiscal. Es la que manda al crear una cuenta.

     · este archivo           → los países en los que un visitante
       puede VER los números de la web. Es material de venta: la
       calculadora, el asistente y los ejemplos de precio. Que
       alguien vea la cuenta en pesos colombianos no quiere decir
       que ya pueda darse de alta desde Colombia.

   Por eso aquí hay veintitantos países y en el alta solo los del
   catálogo: un visitante de Lima entiende "90 soles" y no "35 €",
   aunque todavía no le vendamos.

   Los importes de ejemplo (rangos y chips) son orientativos: cada
   negocio ajusta el suyo.
============================================================ */

export interface PaisMoneda {
  /** Código corto propio de la web ("es", "mx"…). No es ISO en los dos últimos. */
  code: string;
  name: string;
  /** ISO 4217 para Intl ("EUR", "COP"). */
  cur: string;
  /** Locale de Intl para el formato ("es-ES", "es-CO"). */
  loc: string;
  /** Prefijo telefónico con el "+". Vacío en los dos genéricos. */
  dial: string;
  /** Calculadora: [mínimo, máximo, paso, valor inicial]. */
  range: [number, number, number, number];
  /** Tres precios de ejemplo: [bajo, medio, alto]. */
  chips: [number, number, number];
  /** Otras formas de escribirlo, para reconocerlo en texto libre. */
  alias: string[];
  /** Cómo se llama la moneda de boca ("pesos colombianos"). */
  curName: string;
}

/* code, nombre, moneda, locale, prefijo, calculadora, chips, alias */
type Fila = [string, string, string, string, string, [number, number, number, number], [number, number, number], string[]];

const RAW: Fila[] = [
  ["es", "España", "EUR", "es-ES", "+34", [10, 200, 5, 35], [20, 35, 60], ["espana", "spain", "madrid", "barcelona", "malaga", "sevilla", "valencia", "marbella", "benalmadena", "fuengirola", "torremolinos", "bilbao"]],
  ["mx", "México", "MXN", "es-MX", "+52", [100, 4000, 50, 500], [300, 500, 900], ["mexico", "cdmx", "guadalajara", "monterrey", "puebla", "cancun"]],
  ["co", "Colombia", "COP", "es-CO", "+57", [10000, 600000, 5000, 70000], [40000, 70000, 150000], ["colombia", "bogota", "medellin", "cali", "barranquilla", "cartagena"]],
  ["ar", "Argentina", "ARS", "es-AR", "+54", [2000, 300000, 1000, 30000], [15000, 30000, 60000], ["argentina", "buenos aires", "rosario", "mendoza"]],
  ["cl", "Chile", "CLP", "es-CL", "+56", [5000, 200000, 1000, 25000], [15000, 25000, 45000], ["chile", "santiago de chile", "valparaiso", "vina del mar"]],
  ["pe", "Perú", "PEN", "es-PE", "+51", [20, 600, 5, 90], [50, 90, 180], ["peru", "lima", "arequipa", "cusco"]],
  ["ec", "Ecuador", "USD", "es-EC", "+593", [5, 250, 5, 25], [15, 25, 50], ["ecuador", "quito", "guayaquil", "cuenca"]],
  ["us", "Estados Unidos", "USD", "es-US", "+1", [10, 400, 5, 70], [40, 70, 120], ["estados unidos", "eeuu", "ee uu", "usa", "miami", "nueva york", "new york", "texas", "florida"]],
  ["ve", "Venezuela", "USD", "es-VE", "+58", [5, 200, 5, 20], [10, 20, 40], ["venezuela", "caracas", "maracaibo", "valencia venezuela"]],
  ["do", "República Dominicana", "DOP", "es-DO", "+1", [300, 15000, 100, 2000], [1000, 2000, 4000], ["republica dominicana", "dominicana", "santo domingo", "punta cana"]],
  ["gt", "Guatemala", "GTQ", "es-GT", "+502", [50, 1500, 10, 200], [100, 200, 400], ["guatemala"]],
  ["cr", "Costa Rica", "CRC", "es-CR", "+506", [5000, 150000, 1000, 20000], [10000, 20000, 40000], ["costa rica"]],
  ["pa", "Panamá", "USD", "es-PA", "+507", [5, 300, 5, 35], [20, 35, 60], ["panama"]],
  ["uy", "Uruguay", "UYU", "es-UY", "+598", [300, 10000, 100, 1500], [800, 1500, 3000], ["uruguay", "montevideo", "punta del este"]],
  ["py", "Paraguay", "PYG", "es-PY", "+595", [30000, 1500000, 10000, 200000], [100000, 200000, 400000], ["paraguay", "asuncion"]],
  ["bo", "Bolivia", "BOB", "es-BO", "+591", [30, 1000, 10, 150], [70, 150, 300], ["bolivia", "la paz", "cochabamba"]],
  ["hn", "Honduras", "HNL", "es-HN", "+504", [100, 4000, 50, 600], [300, 600, 1200], ["honduras", "tegucigalpa", "san pedro sula"]],
  ["sv", "El Salvador", "USD", "es-SV", "+503", [5, 250, 5, 25], [15, 25, 50], ["el salvador", "san salvador"]],
  ["ni", "Nicaragua", "NIO", "es-NI", "+505", [100, 5000, 50, 800], [400, 800, 1600], ["nicaragua", "managua"]],
  ["pr", "Puerto Rico", "USD", "es-PR", "+1", [10, 300, 5, 50], [30, 50, 90], ["puerto rico", "san juan"]],
  ["pt", "Portugal", "EUR", "pt-PT", "+351", [10, 200, 5, 30], [20, 30, 50], ["portugal", "lisboa", "oporto", "porto"]],
  ["eu", "Otro país (euros)", "EUR", "es-ES", "", [10, 200, 5, 35], [20, 35, 60], ["euro", "euros", "eur"]],
  ["usd", "Otro país (dólares)", "USD", "es-US", "", [5, 300, 5, 40], [20, 40, 70], ["dolar", "dolares", "usd"]],
];

const CUR_NAME: Record<string, string> = {
  EUR: "euros", USD: "dólares", MXN: "pesos mexicanos", COP: "pesos colombianos", ARS: "pesos argentinos",
  CLP: "pesos chilenos", PEN: "soles", DOP: "pesos dominicanos", GTQ: "quetzales", CRC: "colones",
  UYU: "pesos uruguayos", PYG: "guaraníes", BOB: "bolivianos", HNL: "lempiras", NIO: "córdobas",
};

/** Los países en el orden en que se enseñan. */
export const PAISES: PaisMoneda[] = RAW.map(([code, name, cur, loc, dial, range, chips, alias]) => ({
  code, name, cur, loc, dial, range, chips, alias, curName: CUR_NAME[cur] || cur,
}));

const PO_CODIGO = Object.fromEntries(PAISES.map((c) => [c.code, c])) as Record<string, PaisMoneda>;

/** Un país por su código. Si no existe, España, que es el mercado de casa. */
export const pais = (code: string | null | undefined): PaisMoneda => PO_CODIGO[code ?? ""] || PO_CODIGO.es;

/* Deja el texto en minúsculas, sin tildes y rodeado de espacios, para
   poder buscar palabras enteras sin que "panama" encaje dentro de otra. */
const llano = (s: string) =>
  ` ${String(s).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9$€\s]/g, " ").replace(/\s+/g, " ").trim()} `;

/**
 * Reconoce el país (o la moneda) en un texto libre: «estoy en Bogotá»,
 * «trabajo con pesos mexicanos»… Gana el alias más largo que encaje,
 * para que "valencia venezuela" no se quede en "valencia".
 */
export function reconocerPais(texto: string): string | null {
  const t = llano(texto);
  let mejor: string | null = null;
  let largo = 0;
  PAISES.forEach((c) => {
    [llano(c.name).trim(), ...c.alias].forEach((a) => {
      if (a && t.includes(` ${a} `) && a.length > largo) { mejor = c.code; largo = a.length; }
    });
  });
  if (mejor) return mejor;
  if (/ pesos? mexicanos? | mxn /.test(t)) return "mx";
  if (/ pesos? colombianos? | cop /.test(t)) return "co";
  if (/ pesos? argentinos? | ars /.test(t)) return "ar";
  if (/ pesos? chilenos? | clp /.test(t)) return "cl";
  if (/ soles? /.test(t)) return "pe";
  if (/ € /.test(t)) return "eu";
  if (/ \$ /.test(t)) return "usd";
  return null;
}

/* Zonas horarias que identifican un país sin lugar a dudas. */
const TZ: Record<string, string> = {
  "Europe/Madrid": "es", "Atlantic/Canary": "es", "Africa/Ceuta": "es",
  "America/Mexico_City": "mx", "America/Cancun": "mx", "America/Monterrey": "mx", "America/Tijuana": "mx",
  "America/Merida": "mx", "America/Chihuahua": "mx", "America/Hermosillo": "mx",
  "America/Bogota": "co", "America/Santiago": "cl", "America/Lima": "pe", "America/Guayaquil": "ec",
  "America/Caracas": "ve", "America/Santo_Domingo": "do", "America/Guatemala": "gt",
  "America/Costa_Rica": "cr", "America/Panama": "pa", "America/Montevideo": "uy", "America/Asuncion": "py",
  "America/La_Paz": "bo", "America/Tegucigalpa": "hn", "America/El_Salvador": "sv", "America/Managua": "ni",
  "America/Puerto_Rico": "pr", "Europe/Lisbon": "pt",
};

/**
 * País probable del visitante: primero la zona horaria, después el
 * idioma del navegador. Solo vale para elegir qué enseñar primero;
 * el visitante siempre puede cambiarlo.
 *
 * SOLO EN CLIENTE. En el servidor no hay navegador, así que devuelve
 * España y el componente lo corrige al montarse: si se adivinara
 * durante el render, el HTML del servidor y el del cliente no
 * coincidirían y React se quejaría.
 */
export function paisProbable(): string {
  if (typeof window === "undefined") return "es";
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
    if (TZ[tz]) return TZ[tz];
    if (tz.startsWith("America/Argentina")) return "ar";
    if (/^America\/(New_York|Chicago|Denver|Los_Angeles|Phoenix|Detroit|Anchorage|Indiana)/.test(tz)) return "us";
  } catch { /* sin Intl */ }
  const lang = (navigator.language || "").toLowerCase();
  const region = lang.split("-")[1];
  if (region && PO_CODIGO[region]) return region;
  if (lang.startsWith("pt")) return "pt";
  return "es";
}

const CACHE: Record<string, Intl.NumberFormat> = {};

/** Un importe con la moneda y el formato de su país. Sin decimales. */
export function formatearDinero(valor: number, code: string): string {
  const c = pais(code);
  const clave = c.loc + c.cur;
  if (!CACHE[clave]) {
    try {
      CACHE[clave] = new Intl.NumberFormat(c.loc, { style: "currency", currency: c.cur, maximumFractionDigits: 0 });
    } catch {
      CACHE[clave] = new Intl.NumberFormat("es-ES", { style: "currency", currency: c.cur, maximumFractionDigits: 0 });
    }
  }
  return CACHE[clave].format(Math.round(valor));
}

/**
 * Lee un importe escrito a mano: «70.000», «1,5 mil», «35 €», «2k».
 * Admite el punto y la coma como separador de miles, porque según el
 * país se escribe de las dos maneras.
 */
export function leerImporte(texto: string): number | null {
  const s = String(texto).toLowerCase().replace(/ /g, " ");
  const m = s.match(/(\d[\d.,\s]*)\s*(k\b|mil\b|millon(?:es)?\b)?/);
  if (!m) return null;
  let num = m[1].trim().replace(/\s+/g, "");
  if (/^\d{1,3}([.,]\d{3})+$/.test(num)) num = num.replace(/[.,]/g, "");
  else if (/^\d+[.,]\d{1,2}$/.test(num)) num = num.replace(",", ".");
  else num = num.replace(/[.,]/g, "");
  let v = parseFloat(num);
  if (!Number.isFinite(v) || v <= 0) return null;
  if (m[2] === "k" || m[2] === "mil") v *= 1000;
  else if (m[2] && m[2].startsWith("millon")) v *= 1e6;
  return v;
}

/* ============================================================
   Los nombres, en el idioma del visitante
   ------------------------------------------------------------
   La tabla de arriba trae los nombres en español porque es el
   idioma de casa. Pero la web es bilingüe, y un desplegable que
   diga "España · pesos colombianos" en la versión inglesa canta.

   No se traducen a mano: los sabe el propio navegador. `Intl`
   tiene el nombre de cada país y de cada moneda en todos los
   idiomas, así que pedírselos sale gratis y nunca se queda
   desactualizado ni a medias.

   Los dos códigos genéricos ("eu" y "usd") no son países ISO y no
   los conoce Intl: esos sí llevan su texto en el diccionario, que
   es donde se traducen las frases de la web.
============================================================ */

/** Los dos códigos de la tabla que no son países de verdad. */
export const CODIGOS_GENERICOS = ["eu", "usd"] as const;
export const esGenerico = (code: string) => (CODIGOS_GENERICOS as readonly string[]).includes(code);

const CACHE_PAIS: Record<string, Intl.DisplayNames> = {};
const CACHE_MONEDA: Record<string, Intl.DisplayNames> = {};

/**
 * El nombre del país en el idioma pedido. Para "eu" y "usd" no hay
 * nada que preguntar: devuelve null y quien llame pone su texto.
 */
export function nombrePais(code: string, locale: string): string | null {
  const c = pais(code);
  if (esGenerico(c.code)) return null;
  try {
    if (!CACHE_PAIS[locale]) CACHE_PAIS[locale] = new Intl.DisplayNames([locale], { type: "region" });
    return CACHE_PAIS[locale].of(c.code.toUpperCase()) ?? c.name;
  } catch {
    /* Navegador sin Intl.DisplayNames: el español de la tabla. */
    return c.name;
  }
}

/** El nombre de la moneda en el idioma pedido ("pesos colombianos" / "Colombian pesos"). */
export function nombreMoneda(cur: string, locale: string): string {
  try {
    if (!CACHE_MONEDA[locale]) CACHE_MONEDA[locale] = new Intl.DisplayNames([locale], { type: "currency" });
    const n = CACHE_MONEDA[locale].of(cur);
    if (n) return n;
  } catch {
    /* sin Intl.DisplayNames */
  }
  return CUR_NAME[cur] || cur;
}
