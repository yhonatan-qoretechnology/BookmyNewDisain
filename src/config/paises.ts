/* ============================================================
   Config · Países donde se vende Bookmy (España y Colombia)
   ------------------------------------------------------------
   El país cuelga de la EMPRESA: se elige una vez al crear la cuenta y
   no cambia. De él salen la moneda, la zona horaria, el documento
   fiscal, los formatos y cómo se llama cada cosa allí (NIF/CIF frente
   a NIT, Provincia frente a Departamento), de modo que un negocio
   colombiano no ve un euro en su vida y al revés.

   ⚙️ LA FUENTE REAL ES EL BACKEND: GET /paises (público, sin sesión).
   Aquí solo viven el tipo y el respaldo de España, para que el panel
   NUNCA se quede sin configuración mientras esa petición vuelve o si
   falla. Añadir un país es cosa del backend; este fichero no cambia.
============================================================ */

/** Un país tal y como lo devuelve GET /paises. */
export interface ConfigPais {
  /** Id en la tabla de países del backend (lo que guarda empresa.paisId). */
  id: number;
  /** ISO 3166-1 alfa-2 ("ES", "CO"). Es la clave con la que se cruzan
      el país de la sesión y el catálogo del backend. */
  isoCode: string;
  nombre: string;
  /** ISO 4217 para Intl ("EUR", "COP"). */
  moneda: string;
  /** Decimales con los que se escribe el dinero: 2 en España y 0 en
      Colombia, donde los céntimos no existen en la práctica. */
  decimalesMoneda: number;
  /** Locale de Intl para números y fechas ("es-ES", "es-CO"). */
  locale: string;
  /** Rango admitido al ponerle precio a un servicio. En pesos los
      importes son de otro orden de magnitud que en euros, así que un
      tope único dejaría fuera a medio país. */
  precioMinimo: number;
  precioMaximo: number;
  /** Zona horaria del negocio, en nombres IANA ("Europe/Madrid"). */
  zonaHoraria: string;
  /** Nombre del documento fiscal: "NIF/CIF" en España, "NIT" en Colombia. */
  etiquetaFiscal: string;
  /** División administrativa grande: "Provincia" o "Departamento". */
  etiquetaRegion: string;
  /** División pequeña: "Municipio" o "Ciudad". */
  etiquetaMunicipio: string;
  /** Nombre del impuesto que se ve en las facturas. */
  etiquetaImpuesto: string;
  /** false → el país no se divide en regiones y no hay que pedirla. */
  tieneRegiones: boolean;
  /** Porcentaje de impuesto por defecto: 21 en España, 19 en Colombia. */
  impuestoPorDefecto: number;
  /** Prefijo telefónico, con el "+" incluido ("+34", "+57"). */
  dialingCode: string;
  /** Imagen de la bandera que sirve el backend; puede llegar vacía. */
  flagUrl: string;
}

/**
 * Da por bueno un país solo si trae lo imprescindible para trabajar con
 * él. Según lo que incluya la consulta, el backend puede devolver la
 * empresa con el país recortado, y guardar eso en la sesión dejaría al
 * panel escribiendo «25 undefined» en vez de «25,00 €». Todo lo que
 * venga de fuera (login, empresa, storage) pasa por aquí.
 */
export function paisUsable(p: Partial<ConfigPais> | null | undefined): ConfigPais | null {
  return p && p.isoCode && p.locale && p.moneda ? (p as ConfigPais) : null;
}

/** Lo que cambia de nombre según el país — las claves de `etiqueta()`. */
export type ClaveEtiqueta = "fiscal" | "region" | "municipio" | "impuesto";

/**
 * Respaldo de España, cableado.
 *
 * España es el país con el que Bookmy lleva funcionando, así que es la
 * respuesta segura mientras el catálogo carga, si la petición falla o
 * si la sesión es antigua y no lleva país. Gracias a esto `useRegion()`
 * nunca devuelve undefined y ninguna pantalla se queda sin moneda.
 *
 * Los valores son los mismos que sirve el backend; si alguno cambia
 * allí, el catálogo manda y esto solo se usa de puente.
 */
export const ESPANA: ConfigPais = {
  /* 0 a propósito: no es el id real de la tabla de países, que solo lo
     sabe el backend. Así nadie manda por error el id del respaldo al
     crear nada — en cuanto llega GET /paises se sustituye por el real. */
  id: 0,
  isoCode: "ES",
  nombre: "España",
  moneda: "EUR",
  decimalesMoneda: 2,
  locale: "es-ES",
  precioMinimo: 0,
  precioMaximo: 1000,
  zonaHoraria: "Europe/Madrid",
  etiquetaFiscal: "NIF/CIF",
  etiquetaRegion: "Provincia",
  etiquetaMunicipio: "Municipio",
  etiquetaImpuesto: "IVA",
  tieneRegiones: true,
  impuestoPorDefecto: 21,
  dialingCode: "+34",
  /* La bandera la sirve el backend; el respaldo va sin imagen, así que
     quien la pinte tiene que aguantar una cadena vacía. */
  flagUrl: "",
};
