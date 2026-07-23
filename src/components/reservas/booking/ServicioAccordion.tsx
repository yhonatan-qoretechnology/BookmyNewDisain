"use client";
/* ============================================================
   ServicioAccordion — servicios agrupados por categoría
   ------------------------------------------------------------
   Primero se muestran las categorías; cada una es una sección
   desplegable (acordeón) con las tarjetas de sus servicios:
   nombre, descripción, duración, precio con moneda y botón
   "Seleccionar". La primera categoría (y la del servicio ya
   elegido) abren por defecto.
============================================================ */
import { memo, useCallback, useState } from "react";
import type { CategoriaServicios, ServicioOpcion } from "@/models";
import { fmtMoneda } from "@/constants";
import { useI18n } from "@/i18n";
import Icon from "@/components/ui/Icon";
import Button from "@/components/ui/Button";
import styles from "./booking.module.css";

interface ServicioAccordionProps {
  categorias: CategoriaServicios[];
  selectedId?: string;
  onSelect: (s: ServicioOpcion) => void;
}

const ServicioCard = memo(function ServicioCard({
  servicio, selected, onSelect, labels,
}: {
  servicio: ServicioOpcion;
  selected: boolean;
  onSelect: (s: ServicioOpcion) => void;
  labels: { select: string; selected: string; minutes: (n: number) => string };
}) {
  return (
    <article className={`${styles.servCard} ${selected ? styles.selected : ""}`}>
      <h5 className={styles.servNombre}>{servicio.nombre}</h5>
      {servicio.descripcion && <p className={styles.servDesc}>{servicio.descripcion}</p>}
      <div className={styles.servMeta}>
        <span className={styles.servDur}>
          <Icon name="clock" width={13} height={13} />
          {labels.minutes(servicio.duracion)}
        </span>
        <span className={styles.servPrecio}>{fmtMoneda(servicio.precio, servicio.moneda)}</span>
      </div>
      <div className={styles.servFoot}>
        {selected ? (
          <span className={styles.selectedTag}>
            <Icon name="check" width={15} height={15} strokeWidth={2.6} />
            {labels.selected}
          </span>
        ) : (
          <Button size="sm" block onClick={() => onSelect(servicio)}>
            {labels.select}
          </Button>
        )}
      </div>
    </article>
  );
});

function ServicioAccordionBase({ categorias, selectedId, onSelect }: ServicioAccordionProps) {
  const { t } = useI18n();

  /* Abiertas por defecto: la primera categoría y la del servicio elegido */
  const [abiertas, setAbiertas] = useState<Set<string>>(() => {
    const iniciales = new Set<string>();
    if (categorias[0]) iniciales.add(categorias[0].categoria);
    const delSeleccionado = categorias.find((c) =>
      c.servicios.some((s) => s.id === selectedId)
    );
    if (delSeleccionado) iniciales.add(delSeleccionado.categoria);
    return iniciales;
  });

  const toggle = useCallback((categoria: string) => {
    setAbiertas((prev) => {
      const next = new Set(prev);
      if (next.has(categoria)) next.delete(categoria);
      else next.add(categoria);
      return next;
    });
  }, []);

  const labels = {
    select: t("booking.select"),
    selected: t("booking.selectedM"),
    minutes: (n: number) => t("booking.minutes", { n }),
  };

  return (
    <div className={styles.accordion}>
      {categorias.map((cat) => {
        const open = abiertas.has(cat.categoria);
        const panelId = `cat-${cat.categoria.replace(/\s+/g, "-").toLowerCase()}`;
        return (
          <section
            key={cat.categoria}
            className={`${styles.catItem} ${open ? styles.open : ""}`}
          >
            <button
              type="button"
              className={styles.catHead}
              onClick={() => toggle(cat.categoria)}
              aria-expanded={open}
              aria-controls={panelId}
            >
              <span className={styles.catNombre}>{cat.categoria}</span>
              <span className={styles.catCount}>
                {t("booking.servicesCount", { n: cat.servicios.length })}
              </span>
              <span className={styles.catChevron} aria-hidden>
                <Icon name="chevron" width={17} height={17} strokeWidth={2.2} />
              </span>
            </button>

            {open && (
              <div id={panelId} className={styles.catBody}>
                <div className={styles.servGrid}>
                  {cat.servicios.map((s) => (
                    <ServicioCard
                      key={s.id}
                      servicio={s}
                      selected={s.id === selectedId}
                      onSelect={onSelect}
                      labels={labels}
                    />
                  ))}
                </div>
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}

export default memo(ServicioAccordionBase);
