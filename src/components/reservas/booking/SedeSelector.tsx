"use client";
/* ============================================================
   SedeSelector — tarjetas de sede + mapa de ubicación
   ------------------------------------------------------------
   Reemplaza al antiguo <select>: cada sede se presenta como una
   tarjeta con imagen, nombre, dirección, provincia, teléfono,
   horario y botón "Seleccionar". Un panel lateral muestra el
   mapa dinámico de Google Maps (lazy: solo se carga en cliente).
============================================================ */
import { memo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import type { SedeOpcion } from "@/models";
import { resumenHorario } from "@/constants";
import { useI18n } from "@/i18n";
import Icon from "@/components/ui/Icon";
import Button from "@/components/ui/Button";
import styles from "./booking.module.css";

const IMG_BASE_URL = process.env.VITE_API_BASE_URL_IMG || "https://bookmy.es/";

/* Lazy Loading del mapa: el SDK de Maps solo existe en cliente */
const SedeMap = dynamic(() => import("./SedeMap"), {
  ssr: false,
  loading: () => <div className={styles.mapSkeleton} />,
});

interface SedeSelectorProps {
  sedes: SedeOpcion[];
  selectedId?: string | null;
  onSelect: (sedeId: string) => void;
}

const SedeCard = memo(function SedeCard({
  sede, selected, onSelect, selectLabel, selectedLabel, scheduleLabel,
}: {
  sede: SedeOpcion;
  selected: boolean;
  onSelect: (sedeId: string) => void;
  selectLabel: string;
  selectedLabel: string;
  scheduleLabel: string;
}) {
  const horario = resumenHorario(sede.horario);
  // Use imagen field first, fallback to first image from imagenes array
  const imageSource = sede.imagen || (sede.imagenes && sede.imagenes.length > 0 ? sede.imagenes[0] : null);
  const imageUrl = imageSource ? (imageSource.startsWith('http') ? imageSource : `${IMG_BASE_URL}${imageSource}`) : null;
  const [imgError, setImgError] = useState(false);
  
  // Debug: log image construction
  /*console.log('=== Sede Image Debug ===');
  console.log('Sede:', sede.nombre);
  console.log('IMG_BASE_URL:', IMG_BASE_URL);
  console.log('sede.imagen:', sede.imagen);
  console.log('sede.imagenes:', sede.imagenes);
  console.log('imageSource:', imageSource);
  console.log('imageUrl:', imageUrl);
  console.log('======================');*/
  
  return (
    <article className={`${styles.sedeCard} ${selected ? styles.selected : ""}`}>
      <div className={styles.sedeMedia}>
        {imageUrl && !imgError ? (
          <img 
            src={imageUrl} 
            alt={sede.nombre} 
            loading="lazy" 
            
            onError={() => {
              console.error('Error loading image:', imageUrl);
              console.error('Image source:', imageSource);
              setImgError(true);
            }} 
          />
        ) : (
          <span className={styles.sedePlaceholder} aria-hidden>
            <Icon name="mapPin" width={34} height={34} strokeWidth={1.6} />
          </span>
        )}
        {sede.provincia && (
          <span className={styles.provinciaChip}>
            <Icon name="mapPin" width={12} height={12} strokeWidth={2.2} />
            {sede.provincia}
          </span>
        )}
      </div>

      <div className={styles.sedeBody}>
        <h4 className={styles.sedeNombre}>{sede.nombre}</h4>
        {sede.direccion && (
          <p className={styles.sedeDato}>
            <Icon name="mapPin" width={14} height={14} />
            <span>{sede.direccion}</span>
          </p>
        )}
        {sede.telefono && (
          <p className={styles.sedeDato}>
            <Icon name="phone" width={14} height={14} />
            <span>{sede.telefono}</span>
          </p>
        )}
        {horario.length > 0 && (
          <p className={styles.sedeDato}>
            <Icon name="clock" width={14} height={14} />
            <span className={styles.sedeHorario} aria-label={scheduleLabel}>
              {horario.map((linea) => <span key={linea}>{linea}</span>)}
            </span>
          </p>
        )}
      </div>

      <div className={styles.sedeFoot}>
        {selected ? (
          <span className={styles.selectedTag}>
            <Icon name="check" width={15} height={15} strokeWidth={2.6} />
            {selectedLabel}
          </span>
        ) : (
          <Button size="sm" block onClick={() => onSelect(sede.id)}>
            {selectLabel}
          </Button>
        )}
      </div>
    </article>
  );
});

function SedeSelectorBase({ sedes, selectedId, onSelect }: SedeSelectorProps) {
  const { t } = useI18n();
  const carouselRef = useRef<HTMLDivElement>(null);

  const scrollCarousel = (direction: 'left' | 'right') => {
    if (carouselRef.current) {
      const scrollAmount = 240;
      carouselRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className={styles.sedeLayoutFullscreen}>
      <SedeMap sedes={sedes} selectedId={selectedId} onSelect={onSelect} />
      
      <button
        className={`${styles.sedeCarouselNav} ${styles.prev}`}
        onClick={() => scrollCarousel('left')}
        aria-label="Previous"
      >
        <Icon name="chevron-left" width={20} height={20} strokeWidth={2.5} />
      </button>
      
      <button
        className={`${styles.sedeCarouselNav} ${styles.next}`}
        onClick={() => scrollCarousel('right')}
        aria-label="Next"
      >
        <Icon name="chevron-right" width={20} height={20} strokeWidth={2.5} />
      </button>
      
      <div className={styles.sedeCarouselOverlay}>
        <div className={styles.carouselHeader}>
          <div className={styles.mapTitle}>{t("booking.mapTitle")}</div>
          <div className={styles.mapHint}>{t("booking.mapHint")}</div>
        </div>
        <div ref={carouselRef} className={styles.sedeCarousel}>
          {sedes.map((s) => (
            <SedeCard
              key={s.id}
              sede={s}
              selected={s.id === selectedId}
              onSelect={onSelect}
              selectLabel={t("booking.select")}
              selectedLabel={t("booking.selectedF")}
              scheduleLabel={t("booking.schedule")}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default memo(SedeSelectorBase);
