/* ============================================================
   Places — un único mapeo de los address_components de Google
   ------------------------------------------------------------
   Lo usan el alta de sedes del panel y el alta de negocio de la
   web. Estaba escrito dos veces y las dos copias divergieron: la
   del panel restringía la búsqueda a España (una dirección de
   Bogotá no devolvía ni una sugerencia, así que la sede se
   guardaba sin coordenadas) y la de la web no guardaba el ISO del
   país. Un negocio colombiano y uno español se dan de alta por el
   mismo camino, así que el mapeo vive aquí y cada pantalla solo
   dice en qué país buscar.
============================================================ */

export interface DireccionPlaces {
  direccion: string;
  /** Nombre del país tal y como lo escribe Google: cambia con el
      idioma del navegador ("España", "Spain", "Espagne"). */
  pais: string;
  /** ISO-2 (short_name). Es lo único comparable, y de él cuelgan la
      moneda, la zona horaria y el documento fiscal del negocio. */
  paisIso: string;
  provincia: string;
  /** administrative_area_level_1 abreviada: con ella el backend
      resuelve los festivos de la zona. */
  region: string;
  municipio: string;
  localidad: string;
  latitud?: number;
  longitud?: number;
}

/** Primer componente cuyo `types` contenga alguno de los buscados. */
function buscar(
  comps: google.maps.places.AddressComponent[] | undefined,
  tipos: string[]
): google.maps.places.AddressComponent | undefined {
  return comps?.find((c) => tipos.some((t) => c.types.includes(t)));
}

const largo = (comps: google.maps.places.AddressComponent[] | undefined, ...tipos: string[]) =>
  buscar(comps, tipos)?.long_name ?? "";

const corto = (comps: google.maps.places.AddressComponent[] | undefined, ...tipos: string[]) =>
  buscar(comps, tipos)?.short_name ?? "";

/**
 * Traduce la respuesta de Places a los campos de una sede.
 * @param respaldo Dirección a usar si Google no devuelve
 *   `formatted_address` (lo que el usuario llevara escrito).
 */
export function mapearDireccion(
  place: google.maps.places.PlaceResult,
  respaldo = ""
): DireccionPlaces {
  const comps = place.address_components;
  return {
    direccion: place.formatted_address ?? respaldo,
    pais: largo(comps, "country"),
    /* Google devuelve el ISO en mayúsculas, pero no cuesta nada asegurarlo:
       el backend compara contra "ES"/"CO" y una "es" no coincidiría. */
    paisIso: corto(comps, "country").toUpperCase(),
    /* En España la provincia es el nivel 2; en Colombia no existe ese nivel
       y el departamento es el 1, de ahí el encadenado. */
    provincia: largo(comps, "administrative_area_level_2", "administrative_area_level_1"),
    region: corto(comps, "administrative_area_level_1"),
    municipio: largo(comps, "locality", "postal_town"),
    /* La "localidad" del PDF (Arroyo de la Miel) es una pedanía: Google la
       devuelve como sublocality o como neighborhood según la zona. */
    localidad: largo(comps, "sublocality", "sublocality_level_1", "neighborhood"),
    latitud: place.geometry?.location?.lat(),
    longitud: place.geometry?.location?.lng(),
  };
}

/**
 * Engancha el autocompletado de Google a un input de dirección.
 * @param paisIso ISO-2 del país en el que buscar. Sin él no se
 *   restringe la búsqueda: sugerencias más ruidosas, pero nunca
 *   cero resultados.
 * @returns Función de limpieza para el `useEffect` que lo monta.
 */
export function autocompletarDireccion(
  input: HTMLInputElement,
  paisIso: string | undefined,
  onDireccion: (direccion: DireccionPlaces) => void
): () => void {
  const auto = new google.maps.places.Autocomplete(input, {
    types: ["address"],
    fields: ["address_components", "formatted_address", "geometry"],
    ...(paisIso ? { componentRestrictions: { country: paisIso.toLowerCase() } } : {}),
  });

  const listener = auto.addListener("place_changed", () => {
    onDireccion(mapearDireccion(auto.getPlace(), input.value));
  });

  return () => listener.remove();
}
