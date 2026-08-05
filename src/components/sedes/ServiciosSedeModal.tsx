"use client";
/* ============================================================
   ServiciosSedeModal — qué servicios presta cada profesional
   ------------------------------------------------------------
   Escribe en service_sede_profesional, la tabla que valida el
   backend al crear una cita. Si un servicio no aparece aquí para
   ningún profesional, no se puede reservar en esa sede.

   La relación Sede<->Service (la que decide quién puede editar el
   servicio) la sincroniza el backend, así que desde aquí no se toca.

   Diseño: el catálogo puede superar los 200 servicios, así que la
   cabecera y el pie quedan fijos y solo scrollea la lista. Los
   servicios se agrupan por categoría para poder recorrerlos.
============================================================ */
import { useMemo, useState } from "react";
import {
  AsignacionesController,
  type ServicioAsignable,
} from "@/controllers/CrudControllers";
import { ProfesionalesApi } from "@/api/modules";
import { useData } from "@/hooks/useData";
import { useI18n } from "@/i18n";
import { useUi } from "@/context/UiContext";
import { fmtMoneda } from "@/constants";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import Icon from "@/components/ui/Icon";
import styles from "./ServiciosSedeModal.module.css";

export default function ServiciosSedeModal({
  sedeId,
  sedeNombre,
  onClose,
}: {
  sedeId: number | null;
  sedeNombre: string;
  onClose: () => void;
}) {
  const { t, locale } = useI18n();
  const { toast } = useUi();

  const [profesionalId, setProfesionalId] = useState<number | null>(null);
  const [busqueda, setBusqueda] = useState("");
  const [soloAsignados, setSoloAsignados] = useState(false);
  const [guardando, setGuardando] = useState<number | null>(null);
  /* Cambios locales sobre la respuesta del API: evita recargar
     doscientos servicios en cada clic */
  const [cambios, setCambios] = useState<Map<number, number | null>>(new Map());

  const abierto = sedeId != null;

  const { data: profesionales } = useData(
    () => (abierto ? ProfesionalesApi.findBySede(sedeId).catch(() => []) : Promise.resolve([])),
    [sedeId],
    []
  );

  const profActivo = profesionalId ?? profesionales[0]?.id ?? null;

  const { data: servicios, loading } = useData<ServicioAsignable[]>(
    () =>
      abierto && profActivo != null
        ? AsignacionesController.listar(sedeId, profActivo, locale)
        : Promise.resolve([]),
    [sedeId, profActivo, locale],
    []
  );

  /* Estado efectivo = respuesta del API + los cambios ya aplicados */
  const lista = useMemo(
    () =>
      servicios.map((s) =>
        cambios.has(s.id)
          ? { ...s, asignacionId: cambios.get(s.id)!, asignado: cambios.get(s.id) != null }
          : s
      ),
    [servicios, cambios]
  );

  const visibles = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return lista.filter(
      (s) =>
        (!soloAsignados || s.asignado) &&
        (!q || (s.nombre + s.categoria).toLowerCase().includes(q))
    );
  }, [lista, busqueda, soloAsignados]);

  /* Agrupado por categoría: recorrer 200 servicios en plano es inviable */
  const grupos = useMemo(() => {
    const m = new Map<string, ServicioAsignable[]>();
    for (const s of visibles) {
      const k = s.categoria || "—";
      const arr = m.get(k);
      if (arr) arr.push(s);
      else m.set(k, [s]);
    }
    return [...m.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [visibles]);

  const asignados = lista.filter((s) => s.asignado).length;

  if (!abierto) return null;

  const alternar = async (s: ServicioAsignable) => {
    if (profActivo == null) return;
    setGuardando(s.id);
    try {
      const nuevoId = await AsignacionesController.alternar(s, sedeId, profActivo);
      setCambios((prev) => new Map(prev).set(s.id, nuevoId));
    } catch (e) {
      toast(e instanceof Error ? e.message : t("serviciosSede.errGuardar"), "error");
    } finally {
      setGuardando(null);
    }
  };

  const cerrar = () => {
    setCambios(new Map());
    setBusqueda("");
    setSoloAsignados(false);
    setProfesionalId(null);
    onClose();
  };

  const sinProfesionales = profesionales.length === 0;

  return (
    <Modal open onClose={cerrar} maxWidth={760} contentScroll>
      {/* ── Cabecera fija ── */}
      <header className={styles.head}>
        <div className={styles.headTop}>
          <div className={styles.headText}>
            <h3>{t("serviciosSede.titulo", { sede: sedeNombre })}</h3>
            <p>{t("serviciosSede.sub")}</p>
          </div>
          <button
            type="button"
            className={styles.cerrar}
            onClick={cerrar}
            aria-label={t("common.close")}
          >
            ×
          </button>
        </div>

        {!sinProfesionales && (
          <>
            {/* Con muchos profesionales, un desplegable no rompe la altura */}
            <div className={styles.controles}>
              <label className={styles.campo}>
                <span>{t("serviciosSede.profesional")}</span>
                <select
                  value={profActivo ?? ""}
                  onChange={(e) => { setProfesionalId(Number(e.target.value)); setCambios(new Map()); }}
                >
                  {profesionales.map((p) => (
                    <option key={p.id} value={p.id}>{p.nombre}</option>
                  ))}
                </select>
              </label>

              <label className={styles.campo}>
                <span>{t("serviciosSede.buscar")}</span>
                <input
                  type="search"
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  placeholder={t("serviciosSede.buscarPlaceholder")}
                />
              </label>
            </div>

            <div className={styles.resumen}>
              <label className={styles.filtro}>
                <input
                  type="checkbox"
                  checked={soloAsignados}
                  onChange={(e) => setSoloAsignados(e.target.checked)}
                />
                {t("serviciosSede.soloAsignados")}
              </label>
              <span className={styles.contador}>
                <b>{asignados}</b> {t("serviciosSede.deTotal", { total: lista.length })}
              </span>
            </div>
          </>
        )}
      </header>

      {/* ── Zona con scroll propio ── */}
      <div className={styles.scrollArea}>
        {sinProfesionales ? (
          <div className={styles.aviso}>
            <Icon name="user" />
            <b>{t("serviciosSede.sinProfesionales")}</b>
            <span>{t("serviciosSede.sinProfesionalesMsg")}</span>
          </div>
        ) : loading ? (
          <p className={styles.vacio}>{t("common.loading")}</p>
        ) : grupos.length === 0 ? (
          <p className={styles.vacio}>{t("serviciosSede.sinResultados")}</p>
        ) : (
          grupos.map(([categoria, items]) => (
            <section key={categoria} className={styles.grupo}>
              <h4 className={styles.grupoTitulo}>
                {categoria}
                <span>{items.length}</span>
              </h4>
              {items.map((s) => (
                <label
                  key={s.id}
                  className={`${styles.fila} ${s.asignado ? styles.filaOn : ""}`}
                >
                  <input
                    type="checkbox"
                    checked={s.asignado}
                    disabled={guardando === s.id}
                    onChange={() => void alternar(s)}
                  />
                  <span className={styles.info}>
                    <b>{s.nombre}</b>
                    {s.duracion > 0 && (
                      <span className={styles.meta}>{s.duracion} min</span>
                    )}
                  </span>
                  <span className={styles.precio}>
                    {s.precio > 0 ? fmtMoneda(s.precio, s.moneda) : "—"}
                  </span>
                  <span className={styles.estado} aria-hidden>
                    {guardando === s.id ? <span className={styles.spinner} /> : null}
                  </span>
                </label>
              ))}
            </section>
          ))
        )}
      </div>

      {/* ── Pie fijo ── */}
      <footer className={styles.foot}>
        <p className={styles.nota}>{t("serviciosSede.nota")}</p>
        <Button onClick={cerrar}>{t("common.close")}</Button>
      </footer>
    </Modal>
  );
}
