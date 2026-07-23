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
import { initials } from "@/constants";
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
        {pro.foto ? (
          <img src={pro.foto} alt={pro.nombre} loading="lazy" />
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
  const ref = useRef<HTMLDivElement>(null);

  const scroll = useCallback((dir: 1 | -1) => {
    ref.current?.scrollBy({ left: dir * (ref.current.clientWidth * 0.8), behavior: "smooth" });
  }, []);

  const labels = {
    select: t("booking.select"),
    selected: t("booking.selectedM"),
    active: t("booking.active"),
    inactive: t("booking.inactive"),
  };

  return (
    <div className={styles.carouselWrap}>
      <button
        type="button"
        className={`${styles.carouselNav} ${styles.prev}`}
        onClick={() => scroll(-1)}
        aria-label={t("booking.back")}
      >
        <Icon name="chevron-left" width={16} height={16} strokeWidth={2.4} />
      </button>

      <div className={styles.carousel} ref={ref}>
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

      <button
        type="button"
        className={`${styles.carouselNav} ${styles.next}`}
        onClick={() => scroll(1)}
        aria-label={t("booking.next")}
      >
        <Icon name="chevron-right" width={16} height={16} strokeWidth={2.4} />
      </button>
    </div>
  );
}

export default memo(ProfesionalCarouselBase);
