/* ============================================================
   Tipado mínimo del SDK de Google Maps JavaScript
   ------------------------------------------------------------
   Solo se declaran las clases y opciones que consume el panel
   (mapa de sedes del flujo de reservas). Evita depender del
   paquete @types/google.maps manteniendo tipado estricto.
============================================================ */
export {};

declare global {
  namespace google.maps {
    interface LatLngLiteral {
      lat: number;
      lng: number;
    }

    interface MapsEventListener {
      remove(): void;
    }

    interface MapOptions {
      center?: LatLngLiteral;
      zoom?: number;
      mapTypeControl?: boolean;
      streetViewControl?: boolean;
      fullscreenControl?: boolean;
      clickableIcons?: boolean;
      gestureHandling?: "cooperative" | "greedy" | "none" | "auto";
    }

    class LatLngBounds {
      constructor();
      extend(point: LatLngLiteral): LatLngBounds;
    }

    class Map {
      constructor(el: HTMLElement, opts?: MapOptions);
      setCenter(center: LatLngLiteral): void;
      setZoom(zoom: number): void;
      panTo(center: LatLngLiteral): void;
      fitBounds(bounds: LatLngBounds, padding?: number): void;
    }

    interface MarkerLabel {
      text: string;
      color?: string;
      fontSize?: string;
      fontWeight?: string;
    }

    interface MarkerOptions {
      position: LatLngLiteral;
      map?: Map | null;
      title?: string;
      label?: MarkerLabel | string;
    }

    class Marker {
      constructor(opts?: MarkerOptions);
      setMap(map: Map | null): void;
      addListener(eventName: string, handler: () => void): MapsEventListener;
    }
  }

  interface Window {
    google?: { maps: typeof google.maps };
    /** Callback global usado por el cargador del SDK de Maps */
    __bookmyMapsReady?: () => void;
  }
}
