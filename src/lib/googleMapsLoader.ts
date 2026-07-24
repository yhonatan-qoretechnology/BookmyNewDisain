/* ============================================================
   googleMapsLoader — servicio de carga del SDK de Google Maps
   ------------------------------------------------------------
   SRP: este módulo solo sabe inyectar el script del SDK una
   única vez (singleton) y notificar cuándo está listo. La UI
   lo consume a través del hook useGoogleMaps (DIP).
============================================================ */

/** API key del mapa de sedes (configurable por entorno) */
export const GOOGLE_MAPS_API_KEY: string =
  process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ??
  "AIzaSyBOl2lQivaauMAu-gpUI_-fCekiBaWyAxY";

const CALLBACK_NAME = "__bookmyMapsReady" as const;
const SCRIPT_ID = "bookmy-google-maps-sdk";

let loaderPromise: Promise<void> | null = null;

/**
 * Carga el SDK de Google Maps una sola vez.
 * @returns Promesa resuelta cuando `window.google.maps` está disponible.
 */
export function loadGoogleMaps(): Promise<void> {
  /* SSR: el mapa solo existe en cliente */
  if (typeof window === "undefined") return Promise.resolve();
  if (window.google?.maps) return Promise.resolve();
  if (loaderPromise) return loaderPromise;

  loaderPromise = new Promise<void>((resolve, reject) => {
    window[CALLBACK_NAME] = () => resolve();

    const script = document.createElement("script");
    script.id = SCRIPT_ID;
    script.async = true;
    script.src =
      "https://maps.googleapis.com/maps/api/js" +
      `?key=${encodeURIComponent(GOOGLE_MAPS_API_KEY)}` +
      `&loading=async&callback=${CALLBACK_NAME}`;
    script.onerror = () => {
      loaderPromise = null;
      document.getElementById(SCRIPT_ID)?.remove();
      reject(new Error("GOOGLE_MAPS_LOAD_ERROR"));
    };
    document.head.appendChild(script);
  });

  return loaderPromise;
}
