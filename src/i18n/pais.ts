/* ============================================================
   i18n · País del negocio aplicado a los TEXTOS
   ------------------------------------------------------------
   ⚙️ PUNTO DE CONFIGURACIÓN #6 — IDIOMA ≠ PAÍS
   Son dos ejes distintos y se combinan:
     · idioma (es/en) → lo elige la persona en Configuración.
     · país (ES/CO)   → cuelga de la EMPRESA, se fija en el alta
                        y no cambia nunca.
   Un negocio colombiano con el panel en inglés sigue siendo
   colombiano: tiene que leer «celular» y pesos, no euros.

   Aquí vive SOLO el vocabulario. Moneda, zona horaria, festivos,
   formatos y las etiquetas que ya manda el backend en GET /paises
   (etiquetaFiscal, etiquetaRegion, etiquetaMunicipio,
   etiquetaImpuesto) son cosa de useRegion(): este fichero no las
   duplica, para que no haya dos verdades sobre el mismo dato.
============================================================ */

/** Países en los que se vende Bookmy (`isoCode` de GET /paises). */
export type PaisIso = "ES" | "CO";

/** España es la base: es el país que ya está en producción con
    clientes, así que también es el respaldo cuando una variante no
    trae el país activo. Mientras nadie diga lo contrario, todo se
    comporta exactamente como se comportaba antes de Colombia. */
export const PAIS_POR_DEFECTO: PaisIso = "ES";

/** Type guard sobre lo que llegue de fuera (sesión, API, storage). */
export function esPaisIso(value: unknown): value is PaisIso {
  return value === "ES" || value === "CO";
}

/* ── Variantes de texto por país ──────────────────────────────

   Una hoja del diccionario puede ser un texto normal o un texto
   con redacción por país. ES es obligatorio (es el idioma base) y
   el resto de países son opcionales: lo que no se escriba cae a ES.
   Así, al añadir un país nuevo a `PaisIso`, nada se rompe: se va
   traduciendo lo que chirríe, variante a variante.               */
export type Variante = { ES: string } & Partial<Record<PaisIso, string>>;

/** Lo que puede haber en una hoja del diccionario. */
export type Texto = string | Variante;

/** Envuelve una variante al declararla en el diccionario:

      movil: porPais({ ES: "Móvil", CO: "Celular" }),

    La envoltura no es decorativa. `Dictionary` se deriva de
    `typeof es`, y sin ella TypeScript fijaría el tipo de esa clave
    como «objeto con ES y CO», obligando al resto de idiomas a
    repetir el desdoble aunque en su lengua no exista (en inglés
    «Mobile» vale para los dos países). Devolviendo `Texto` la clave
    acepta las dos formas y cada idioma desdobla solo si le hace
    falta. */
export function porPais(variante: Variante): Texto {
  return variante;
}

/** Aplana una hoja del diccionario al texto del país activo.
    Devuelve `undefined` si no es una hoja de texto, para que quien
    llama pueda seguir con su propio respaldo. */
export function textoDelPais(valor: unknown, pais: PaisIso): string | undefined {
  if (typeof valor === "string") return valor;
  if (valor && typeof valor === "object") {
    const variante = valor as Partial<Record<PaisIso, unknown>>;
    const propio = variante[pais];
    if (typeof propio === "string") return propio;
    const base = variante[PAIS_POR_DEFECTO];
    if (typeof base === "string") return base;
  }
  return undefined;
}

/* ── País activo ──────────────────────────────────────────────

   No es un contexto de React a propósito: el RegionProvider se monta
   POR DEBAJO del I18nProvider (ver app/layout.tsx), así que los
   textos no pueden leer el país con useRegion(). Un almacén de módulo
   con suscripción se deja escribir desde cualquier sitio —incluso
   desde código que no es un componente— y se lee con `useI18n().pais`.

   Quien lo escribe:
     · el I18nProvider, con `session.pais.isoCode`, que es el mismo
       país que resuelve el RegionProvider y guarda en la sesión. Eso
       cubre el panel entero sin que nadie tenga que acordarse.
     · el alta de la web pública, en cuanto se elige el país: ahí
       todavía no hay sesión de la que leerlo.                     */

let paisActivo: PaisIso = PAIS_POR_DEFECTO;
const oyentes = new Set<() => void>();

export function getPaisActivo(): PaisIso {
  return paisActivo;
}

/** Fija el país de los textos. Tolera lo que le echen —undefined
    mientras no se sabe, "co" en minúsculas, un ISO que no se
    vende— y en ese caso se queda como estaba: mientras nadie diga
    un país válido, todo sigue en España y nada cambia. */
export function setPaisActivo(iso: unknown): void {
  /* En el servidor este módulo se comparte entre peticiones: lo que
     escribiera una empresa colombiana lo leería el SSR de la
     siguiente. El país solo se conoce en cliente, así que aquí se
     para y el primer render (servidor e hidratación) siempre es la
     base, sin descuadres de hidratación. */
  if (typeof window === "undefined") return;
  const normalizado = typeof iso === "string" ? iso.trim().toUpperCase() : iso;
  if (!esPaisIso(normalizado) || normalizado === paisActivo) return;
  paisActivo = normalizado;
  oyentes.forEach((avisar) => avisar());
}

export function suscribirPais(oyente: () => void): () => void {
  oyentes.add(oyente);
  return () => { oyentes.delete(oyente); };
}
