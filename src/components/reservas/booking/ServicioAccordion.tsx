"use client";
/* ============================================================
   ServicioAccordion — servicios agrupados por categoría
   ------------------------------------------------------------
   Primero se muestran las categorías; cada una es una sección
   desplegable (acordeón) con las tarjetas de sus servicios:
   nombre, descripción, duración, precio con moneda y botón
   "Seleccionar".

   Encima, un menú de categorías: «Todas» enseña todo; tocar una
   deja solo esa (abierta). Así no hay que bajar por toda la lista
   para llegar a la categoría que se busca.
============================================================ */
import { memo, useCallback, useState } from "react";
import type { CategoriaServicios, ServicioOpcion } from "@/models";
import { useRegion } from "@/context/RegionContext";
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
  const { fmtMoneda } = useRegion();
  return (
    <article className={`${styles.servCard} ${selected ? styles.selected : ""}`}>
      <h5 className={styles.servNombre}>{servicio.nombre}</h5>
      {servicio.descripcion && <p className={styles.servDesc}>{servicio.descripcion}</p>}
      <div className={styles.servMeta}>
        <span className={styles.servDur}>
          <Icon name="clock" width={13} height={13} />
          {labels.minutes(servicio.duracion)}
        </span>
        <span className={styles.servPrecio}>{fmtMoneda(servicio.precio)}</span>
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

  /* Abiertas por defecto: TODAS las categorías, para que se vean los
     servicios completos del profesional apenas cargan (antes solo se
     abría la primera categoría y el resto quedaba oculto en acordeones
     colapsados, dando la impresión de que faltaban servicios). */
  const [abiertas, setAbiertas] = useState<Set<string>>(
    () => new Set(categorias.map((c) => c.categoria))
  );

  /* Categoría elegida en el menú; null = todas */
  const [filtro, setFiltro] = useState<string | null>(null);
  const visibles = filtro ? categorias.filter((c) => c.categoria === filtro) : categorias;
  const total = categorias.reduce((n, c) => n + c.servicios.length, 0);

  const elegir = useCallback((categoria: string | null) => {
    setFiltro(categoria);
    /* La elegida se abre siempre, aunque se hubiera plegado antes */
    if (categoria) setAbiertas((prev) => new Set(prev).add(categoria));
  }, []);

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
    <>
    {categorias.length > 1 && (
      <div className={styles.catMenu} role="tablist" aria-label={t("booking.categoriasMenu")}>
        <button
          type="button"
          role="tab"
          aria-selected={filtro === null}
          className={`${styles.catMenuItem} ${filtro === null ? styles.catMenuActivo : ""}`}
          onClick={() => elegir(null)}
        >
          {t("booking.todasCategorias")}
          <span className={styles.catMenuCount}>{total}</span>
        </button>
        {categorias.map((cat) => (
          <button
            key={cat.categoria}
            type="button"
            role="tab"
            aria-selected={filtro === cat.categoria}
            className={`${styles.catMenuItem} ${filtro === cat.categoria ? styles.catMenuActivo : ""}`}
            onClick={() => elegir(cat.categoria)}
          >
            {cat.categoria}
            <span className={styles.catMenuCount}>{cat.servicios.length}</span>
          </button>
        ))}
      </div>
    )}
    <div className={styles.accordion}>
      {visibles.map((cat) => {
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
    </>
  );
}

export default memo(ServicioAccordionBase);
