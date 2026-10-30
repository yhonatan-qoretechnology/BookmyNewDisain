"use client";
/* ============================================================
   AccesosMapa — desde dónde entra un usuario, en Google Maps
   ------------------------------------------------------------
   Un marcador por ubicación distinta (lat/long que geoip-lite da
   para la IP: el centro de la ciudad, no la dirección exacta). El
   tamaño del marcador crece con las veces que entró desde ahí y
   es rojo si desde ese punto hubo intentos fallidos.

   Los accesos anteriores a la migración no traen coordenadas: si
   ninguno las tiene, el mapa no se pinta y se explica por qué.
============================================================ */
import { useEffect, useMemo, useRef } from "react";
import type { ApiAccesoUsuario } from "@/api/types";
import { useGoogleMaps } from "@/hooks/useGoogleMaps";
import { useI18n } from "@/i18n";
import styles from "@/app/(panel)/accesos/accesos.module.css";

interface Punto {
  pos: google.maps.LatLngLiteral;
  titulo: string;
  veces: number;
  fallidos: number;
}

export default function AccesosMapa({ accesos }: { accesos: ApiAccesoUsuario[] }) {
  const { t } = useI18n();
  const { ready, error } = useGoogleMaps();
  const contenedor = useRef<HTMLDivElement>(null);
  const mapa = useRef<google.maps.Map | null>(null);
  const marcadores = useRef<google.maps.Marker[]>([]);

  const puntos = useMemo<Punto[]>(() => {
    const porCoordenada = new Map<string, Punto>();
    for (const a of accesos) {
      if (a.latitud == null || a.longitud == null) continue;
      const clave = `${a.latitud.toFixed(3)},${a.longitud.toFixed(3)}`;
      const p = porCoordenada.get(clave);
      if (p) {
        p.veces += 1;
        if (!a.exito) p.fallidos += 1;
      } else {
        porCoordenada.set(clave, {
          pos: { lat: a.latitud, lng: a.longitud },
          titulo: [a.ciudad, a.pais].filter(Boolean).join(", ") || a.ipAddress,
          veces: 1,
          fallidos: a.exito ? 0 : 1,
        });
      }
    }
    return [...porCoordenada.values()];
  }, [accesos]);

  useEffect(() => {
    if (!ready || !contenedor.current || puntos.length === 0) return;
    if (!mapa.current) {
      mapa.current = new google.maps.Map(contenedor.current, {
        center: puntos[0].pos,
        zoom: 4,
        streetViewControl: false,
        mapTypeControl: false,
        fullscreenControl: false,
      });
    }
    marcadores.current.forEach((m) => m.setMap(null));

    const limites = new google.maps.LatLngBounds();
    marcadores.current = puntos.map((p) => {
      limites.extend(p.pos);
      return new google.maps.Marker({
        position: p.pos,
        map: mapa.current!,
        title: `${p.titulo} · ${p.veces}`,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: Math.min(6 + Math.sqrt(p.veces) * 3, 22),
          fillColor: p.fallidos > 0 ? "#ef4444" : "#12b981",
          fillOpacity: 0.85,
          strokeColor: "#ffffff",
          strokeWeight: 2,
        },
      });
    });

    if (puntos.length === 1) {
      mapa.current.setCenter(puntos[0].pos);
      mapa.current.setZoom(9);
    } else {
      mapa.current.fitBounds(limites, 48);
    }
  }, [ready, puntos]);

  useEffect(() => () => { marcadores.current.forEach((m) => m.setMap(null)); }, []);

  if (puntos.length === 0) {
    return <p className={styles.mapaAviso}>{t("accesos.mapaSinCoordenadas")}</p>;
  }
  if (error) {
    return <p className={styles.mapaAviso}>{t("accesos.mapaError")}</p>;
  }
  return (
    <>
      <div ref={contenedor} className={styles.mapa} role="img" aria-label={t("accesos.mapaAria", { n: puntos.length })} />
      <p className={styles.mapaLeyenda}>
        <span><i className={styles.puntoOk} /> {t("accesos.mapaLeyendaOk")}</span>
        <span><i className={styles.puntoFallo} /> {t("accesos.mapaLeyendaFallo")}</span>
        <span>{t("accesos.mapaAproximado")}</span>
      </p>
    </>
  );
}
