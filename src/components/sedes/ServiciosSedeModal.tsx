"use client";
/* ============================================================
   ServiciosSedeModal — qué servicios presta cada profesional
   ------------------------------------------------------------
   Escribe en service_sede_profesional, la tabla que valida el
   backend al crear una cita. Si un servicio no aparece aquí para
   ningún profesional, no se puede reservar en esa sede.

   La relación Sede<->Service (la que decide quién puede editar el
   servicio) la sincroniza el backend, así que desde aquí no se toca.
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
import Modal, { ModalTitle, ModalText, ModalActions } from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import Icon from "@/components/ui/Icon";
import Badge from "@/components/ui/Badge";
import EmptyState from "@/components/ui/EmptyState";
import { SearchBox } from "@/components/ui/Toolbar";
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
  /* Cambios locales sobre la respuesta del API, para no recargar
     la lista entera en cada clic */
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

  return (
    <Modal open onClose={cerrar} maxWidth={720}>
      <ModalTitle>{t("serviciosSede.titulo", { sede: sedeNombre })}</ModalTitle>
      <ModalText>{t("serviciosSede.sub")}</ModalText>

      {profesionales.length === 0 ? (
        <EmptyState
          icon="user"
          title={t("serviciosSede.sinProfesionales")}
          message={t("serviciosSede.sinProfesionalesMsg")}
        />
      ) : (
        <>
          {/* Profesional cuyo catálogo se está editando */}
          <div className={styles.profesionales} role="tablist">
            {profesionales.map((p) => (
              <button
                key={p.id}
                type="button"
                role="tab"
                aria-selected={p.id === profActivo}
                className={p.id === profActivo ? styles.profActivo : styles.prof}
                onClick={() => { setProfesionalId(p.id); setCambios(new Map()); }}
              >
                {p.nombre}
              </button>
            ))}
          </div>

          <div className={styles.barra}>
            <SearchBox
              value={busqueda}
              onChange={setBusqueda}
              placeholder={t("serviciosSede.buscar")}
              compact
            />
            <label className={styles.filtro}>
              <input
                type="checkbox"
                checked={soloAsignados}
                onChange={(e) => setSoloAsignados(e.target.checked)}
              />
              {t("serviciosSede.soloAsignados")}
            </label>
            <Badge kind="activo">
              {t("serviciosSede.contador", { n: asignados, total: lista.length })}
            </Badge>
          </div>

          <div className={styles.lista}>
            {loading ? (
              <p className={styles.vacio}>{t("common.loading")}</p>
            ) : visibles.length === 0 ? (
              <p className={styles.vacio}>{t("serviciosSede.sinResultados")}</p>
            ) : (
              visibles.map((s) => (
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
                    <span className={styles.meta}>
                      {s.categoria}
                      {s.duracion > 0 && ` · ${s.duracion} min`}
                    </span>
                  </span>
                  <span className={styles.precio}>
                    {s.precio > 0 ? fmtMoneda(s.precio, s.moneda) : "—"}
                  </span>
                  {guardando === s.id && <span className={styles.spinner} aria-hidden />}
                </label>
              ))
            )}
          </div>

          <p className={styles.nota}>
            <Icon name="circle-x" /> {t("serviciosSede.nota")}
          </p>
        </>
      )}

      <ModalActions>
        <Button onClick={cerrar}>{t("common.close")}</Button>
      </ModalActions>
    </Modal>
  );
}
