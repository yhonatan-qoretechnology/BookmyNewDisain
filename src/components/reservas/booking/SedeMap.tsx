"use client";
/* ============================================================
   SedeMap — mapa dinámico de Google Maps con las sedes
   ------------------------------------------------------------
   Renderiza un marcador por sede usando su latitud/longitud
   reales (nada de imágenes estáticas). Al pulsar un marcador se
   selecciona la sede; al seleccionar una tarjeta el mapa centra
   y acerca esa sede. El SDK se carga vía useGoogleMaps (Hooks).
============================================================ */
import { memo, useEffect, useMemo, useRef } from "react";
import type { SedeOpcion } from "@/models";
import { useGoogleMaps } from "@/hooks/useGoogleMaps";
import { useI18n } from "@/i18n";
import Icon from "@/components/ui/Icon";
import styles from "./booking.module.css";

const ZOOM_SEDE = 15;
const ZOOM_INICIAL = 13;

interface PuntoSede {
  sede: SedeOpcion;
  pos: google.maps.LatLngLiteral;
}

interface SedeMapProps {
  sedes: SedeOpcion[];
  selectedId?: string | null;
  onSelect: (sedeId: string) => void;
}

function SedeMapBase({ sedes, selectedId, onSelect }: SedeMapProps) {
  const { t } = useI18n();
  const { ready, error } = useGoogleMaps();

  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const listenersRef = useRef<google.maps.MapsEventListener[]>([]);

  /* Callback estable para no recrear marcadores al re-renderizar */
  const onSelectRef = useRef(onSelect);
  useEffect(() => { onSelectRef.current = onSelect; }, [onSelect]);

  /* Solo sedes con coordenadas válidas */
  const puntos = useMemo<PuntoSede[]>(
    () => sedes.flatMap((s) =>
      s.latitud !== null && s.longitud !== null
        ? [{ sede: s, pos: { lat: s.latitud, lng: s.longitud } }]
        : []
    ),
    [sedes]
  );

  /* Crear mapa + marcadores */
  useEffect(() => {
    if (!ready || !containerRef.current || puntos.length === 0) return;

    if (!mapRef.current) {
      mapRef.current = new google.maps.Map(containerRef.current, {
        center: puntos[0].pos,
        zoom: ZOOM_INICIAL,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: true,
        clickableIcons: false,
        gestureHandling: "cooperative",
      });
    }
    const map = mapRef.current;

    /* Limpiar marcadores previos */
    listenersRef.current.forEach((l) => {
      try {
        l.remove();
      } catch (e) {
        console.warn('Error removing listener:', e);
      }
    });
    listenersRef.current = [];
    markersRef.current.forEach((m) => {
      try {
        m.setMap(null);
      } catch (e) {
        console.warn('Error removing marker:', e);
      }
    });
    markersRef.current = [];

    const bounds = new google.maps.LatLngBounds();
    for (const { sede, pos } of puntos) {
      const marker = new google.maps.Marker({ position: pos, map, title: sede.nombre });
      listenersRef.current.push(
        marker.addListener("click", () => onSelectRef.current(sede.id))
      );
      markersRef.current.push(marker);
      bounds.extend(pos);
    }

    if (puntos.length === 1) {
      map.setCenter(puntos[0].pos);
      map.setZoom(ZOOM_SEDE);
    } else {
      map.fitBounds(bounds, 48);
    }
  }, [ready, puntos]);

  /* Centrar la sede seleccionada */
  useEffect(() => {
    if (!ready || !mapRef.current || !selectedId) return;
    const punto = puntos.find((p) => p.sede.id === selectedId);
    if (!punto) return;
    mapRef.current.panTo(punto.pos);
    mapRef.current.setZoom(ZOOM_SEDE);
  }, [ready, selectedId, puntos]);

  /* Limpieza al desmontar */
  useEffect(() => () => {
    listenersRef.current.forEach((l) => {
      try {
        l.remove();
      } catch (e) {
        console.warn('Error removing listener on cleanup:', e);
      }
    });
    markersRef.current.forEach((m) => {
      try {
        m.setMap(null);
      } catch (e) {
        console.warn('Error removing marker on cleanup:', e);
      }
    });
    mapRef.current = null;
  }, []);

  if (error) return <div className={styles.mapSkeleton}>{t("booking.mapError")}</div>;
  if (puntos.length === 0) return <div className={styles.mapSkeleton}>{t("booking.mapNoCoords")}</div>;

  return (
    <>
      {!ready && <div className={styles.mapSkeleton}>{t("booking.loading")}</div>}
      <div
        ref={containerRef}
        className={styles.mapCanvasFullscreen}
        style={ready ? undefined : { display: "none" }}
        role="application"
        aria-label={t("booking.mapTitle")}
      />
      {ready && (
        <div className={styles.mapBrandOverlay}>
          <div className={styles.mapBrandLogo}>
            <Icon name="mapPin" width={48} height={48} strokeWidth={1.5} />
            <span>BookMy</span>
          </div>
        </div>
      )}
    </>
  );
}

export default memo(SedeMapBase);
