"use client";
/* ============================================================
   ProfesionalCarousel — carrusel de tarjetas de profesionales
   ------------------------------------------------------------
   Tarjetas con imagen de portada, nombre, biografía, teléfono,
   estado y botón "Seleccionar". Desplazamiento con scroll-snap
   y flechas de navegación.
============================================================ */
import { memo, useCallback, useRef } from "react";
import type { ProfesionalCard } from "@/models";
import { fotoUrl, initials } from "@/constants";
import { useI18n } from "@/i18n";
import Icon from "@/components/ui/Icon";
import Button from "@/components/ui/Button";
import styles from "./booking.module.css";

interface ProfesionalCarouselProps {
  profesionales: ProfesionalCard[];
  selectedId?: string;
  onSelect: (p: ProfesionalCard) => void;
}

const ProCard = memo(function ProCard({
  pro, selected, onSelect, labels,
}: {
  pro: ProfesionalCard;
  selected: boolean;
  onSelect: (p: ProfesionalCard) => void;
  labels: { select: string; selected: string; active: string; inactive: string };
}) {
  const cls = [
    styles.proCard,
    selected ? styles.selected : "",
    pro.disponible ? "" : styles.off,
  ].filter(Boolean).join(" ");

  return (
    <article className={cls}>
      <div className={styles.proMedia}>
        {/* La ruta llega relativa desde el backend: se resuelve con la base de imágenes */}
        {fotoUrl(pro.foto) ? (
          <img src={fotoUrl(pro.foto)!} alt={pro.nombre} loading="lazy" />
        ) : (
          <span className={styles.proInitials} aria-hidden>{initials(pro.nombre)}</span>
        )}
        <span className={`${styles.proEstado} ${pro.disponible ? "" : styles.inactivo}`}>
          {pro.disponible ? labels.active : labels.inactive}
        </span>
      </div>

      <div className={styles.proBody}>
        <h4 className={styles.proNombre}>{pro.nombre}</h4>
        {pro.biografia && <p className={styles.proBio}>{pro.biografia}</p>}
        {pro.telefono && (
          <span className={styles.proTelefono}>
            <Icon name="phone" width={13} height={13} />
            {pro.telefono}
          </span>
        )}
      </div>

      <div className={styles.proFoot}>
        {selected ? (
          <span className={styles.selectedTag}>
            <Icon name="check" width={15} height={15} strokeWidth={2.6} />
            {labels.selected}
          </span>
        ) : (
          <Button size="sm" block disabled={!pro.disponible} onClick={() => onSelect(pro)}>
            {labels.select}
          </Button>
        )}
      </div>
    </article>
  );
});

function ProfesionalCarouselBase({ profesionales, selectedId, onSelect }: ProfesionalCarouselProps) {
  const { t } = useI18n();

  const labels = {
    select: t("booking.select"),
    selected: t("booking.selectedM"),
    active: t("booking.active"),
    inactive: t("booking.inactive"),
  };

  return (
    <div className={styles.profesionalesGrid}>
      {profesionales.map((p) => (
        <ProCard
          key={p.id}
          pro={p}
          selected={p.id === selectedId}
          onSelect={onSelect}
          labels={labels}
        />
      ))}
    </div>
  );
}

export default memo(ProfesionalCarouselBase);
