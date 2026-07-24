"use client";
/* ============================================================
   useGoogleMaps — disponibilidad del SDK de Google Maps
   ------------------------------------------------------------
   Capa Hooks: la UI pregunta "¿está listo el mapa?" sin conocer
   cómo se inyecta el script (eso vive en lib/googleMapsLoader).
============================================================ */
import { useEffect, useState } from "react";
import { loadGoogleMaps } from "@/lib/googleMapsLoader";

export interface GoogleMapsState {
  ready: boolean;
  error: boolean;
}

export function useGoogleMaps(): GoogleMapsState {
  const [state, setState] = useState<GoogleMapsState>({ ready: false, error: false });

  useEffect(() => {
    let active = true;
    loadGoogleMaps()
      .then(() => { if (active) setState({ ready: true, error: false }); })
      .catch(() => { if (active) setState({ ready: false, error: true }); });
    return () => { active = false; };
  }, []);

  return state;
}
