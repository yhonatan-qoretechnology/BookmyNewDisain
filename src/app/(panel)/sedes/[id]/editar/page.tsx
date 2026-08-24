"use client";
/* ============================================================
   Editar sede — vista propia (antes era un modal)
   ------------------------------------------------------------
   Datos de contacto + horario semanal + días cerrados puntuales
   (JSON en la fila de la sede — ver el comentario en
   SedesController.update sobre por qué no se usan las tablas
   horario_sede / dia_cerrado_sede) + imágenes, en dos pestañas.
============================================================ */
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import type { SedeDetalle } from "@/models";
import { SedesController } from "@/controllers/CrudControllers";
import { useData } from "@/hooks/useData";
import { useUi } from "@/context/UiContext";
import { useI18n } from "@/i18n";
import { fmtFechaLarga } from "@/constants";
import { normalizeKey } from "@/lib/timezone";
import Panel, { PanelHead } from "@/components/ui/Panel";
import Tabs from "@/components/ui/Tabs";
import Button from "@/components/ui/Button";
import { Field } from "@/components/ui/Modal";
import ImageGallery from "@/components/ui/ImageGallery";
import EmptyState from "@/components/ui/EmptyState";
import Icon from "@/components/ui/Icon";
import styles from "./editarSede.module.css";

/** Días en orden de despliegue (la clave es la misma que usa el
    backend en el JSON `sede.horario`, en español y con tilde). */
const DIAS = [
  "lunes", "martes", "miércoles", "jueves", "viernes", "sábado", "domingo",
] as const;

interface DiaForm { cerrado: boolean; apertura: string; cierre: string }
type HorarioForm = Record<string, DiaForm>;

const DEFAULT_APERTURA = "10:00";
const DEFAULT_CIERRE = "19:00";

function horarioToForm(horario: Record<string, string> | null): HorarioForm {
  const form: HorarioForm = {};
  for (const dia of DIAS) {
    const entrada = horario
      ? Object.entries(horario).find(([k]) => normalizeKey(k) === normalizeKey(dia))?.[1]
      : undefined;
    if (!entrada || entrada.trim().toLowerCase() === "cerrado") {
      form[dia] = { cerrado: true, apertura: DEFAULT_APERTURA, cierre: DEFAULT_CIERRE };
      continue;
    }
    const [apertura, cierre] = entrada.split("-");
    form[dia] = {
      cerrado: false,
      apertura: apertura?.trim() || DEFAULT_APERTURA,
      cierre: cierre?.trim() || DEFAULT_CIERRE,
    };
  }
  return form;
}

function formToHorario(form: HorarioForm): Record<string, string> {
  const horario: Record<string, string> = {};
  for (const dia of DIAS) {
    const d = form[dia];
    horario[dia] = d.cerrado ? "Cerrado" : `${d.apertura}-${d.cierre}`;
  }
  return horario;
}

export default function EditarSedePage() {
  const params = useParams<{ id: string }>();
  const sedeId = Number(params.id);
  const router = useRouter();
  const { toast } = useUi();
  const { t } = useI18n();

  const { data: sede, loading, reload } = useData<SedeDetalle | null>(
    () => (Number.isFinite(sedeId) ? SedesController.getById(sedeId) : Promise.resolve(null)),
    [sedeId], null
  );

  const [tab, setTab] = useState<"datos" | "imagenes">("datos");
  const [nombre, setNombre] = useState("");
  const [provincia, setProvincia] = useState("");
  const [direccion, setDireccion] = useState("");
  const [telefono, setTelefono] = useState("");
  const [latitud, setLatitud] = useState("");
  const [longitud, setLongitud] = useState("");
  const [horarioForm, setHorarioForm] = useState<HorarioForm>(() => horarioToForm(null));
  const [diasCerrado, setDiasCerrado] = useState<string[]>([]);
  const [nuevaFecha, setNuevaFecha] = useState("");
  const [guardando, setGuardando] = useState(false);

  /* Hidrata el formulario en cuanto llega la sede */
  useEffect(() => {
    if (!sede) return;
    setNombre(sede.nombre);
    setProvincia(sede.provincia);
    setDireccion(sede.direccion);
    setTelefono(sede.telefono);
    setLatitud(sede.latitud != null ? String(sede.latitud) : "");
    setLongitud(sede.longitud != null ? String(sede.longitud) : "");
    setHorarioForm(horarioToForm(sede.horario));
    setDiasCerrado(sede.diasCerrado);
  }, [sede]);

  const cambiarDia = (dia: string, patch: Partial<DiaForm>) => {
    setHorarioForm((prev) => ({ ...prev, [dia]: { ...prev[dia], ...patch } }));
  };

  const agregarDiaCerrado = () => {
    if (!nuevaFecha) return;
    setDiasCerrado((prev) => (prev.includes(nuevaFecha) ? prev : [...prev, nuevaFecha].sort()));
    setNuevaFecha("");
  };
  const quitarDiaCerrado = (fecha: string) => {
    setDiasCerrado((prev) => prev.filter((f) => f !== fecha));
  };

  const volver = () => router.back();

  const guardar = async () => {
    if (!nombre.trim() || !direccion.trim()) {
      toast(t("common.requiredName"), "error");
      return;
    }
    setGuardando(true);
    try {
      await SedesController.update(sedeId, {
        nombre, direccion, telefono, provincia,
        latitud: latitud.trim() ? Number(latitud) : null,
        longitud: longitud.trim() ? Number(longitud) : null,
        horario: formToHorario(horarioForm),
        diasCerrado,
      });
      toast(t("empresaSedes.updated"), "success");
      router.back();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Error", "error");
    } finally {
      setGuardando(false);
    }
  };

  const subirImagen = async (file: File) => {
    const imagenes = await SedesController.subirImagen(sedeId, file);
    await reload();
    return imagenes;
  };
  const borrarImagen = async (ruta: string) => {
    const imagenes = await SedesController.borrarImagen(sedeId, ruta);
    await reload();
    return imagenes;
  };

  const tabs = useMemo(() => [
    { id: "datos", label: t("empresaSedes.tabDatos") },
    { id: "imagenes", label: t("empresaSedes.tabImagenes") },
  ], [t]);

  if (!loading && !sede) {
    return (
      <Panel>
        <EmptyState icon="building" title={t("empresaSedes.notFoundTitle")} message={t("empresaSedes.notFoundMsg")} />
        <Button variant="ghost" onClick={volver}>← {t("common.cancel")}</Button>
      </Panel>
    );
  }

  return (
    <Panel>
      <PanelHead
        title={t("empresaSedes.editTitle")}
        sub={sede?.nombre}
        right={<Button variant="ghost" onClick={volver}>{t("common.close")}</Button>}
      />

      <Tabs tabs={tabs} active={tab} onChange={(id) => setTab(id as typeof tab)} />

      {loading && !sede ? (
        <p className={styles.loading}>{t("booking.loading")}</p>
      ) : tab === "datos" ? (
        <div className={styles.datosGrid}>
          <Field label={`${t("common.name")} *`} htmlFor="sd-nombre">
            <input id="sd-nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} />
          </Field>
          <Field label={`${t("empresaSedes.province")} *`} htmlFor="sd-prov">
            <input id="sd-prov" value={provincia} onChange={(e) => setProvincia(e.target.value)} />
          </Field>
          <Field label={`${t("sedes.address")} *`} htmlFor="sd-dir">
            <input id="sd-dir" value={direccion} onChange={(e) => setDireccion(e.target.value)} />
          </Field>
          <Field label={`${t("common.phone")} *`} htmlFor="sd-tel">
            <input id="sd-tel" value={telefono} onChange={(e) => setTelefono(e.target.value)} placeholder="+34 600 000 000" />
          </Field>
          <Field label={t("empresaSedes.latitude")} htmlFor="sd-lat">
            <input id="sd-lat" type="number" step="any" value={latitud} onChange={(e) => setLatitud(e.target.value)} />
          </Field>
          <Field label={t("empresaSedes.longitude")} htmlFor="sd-lng">
            <input id="sd-lng" type="number" step="any" value={longitud} onChange={(e) => setLongitud(e.target.value)} />
          </Field>

          <div className={styles.fullRow}>
            <label className={styles.sectionLabel}>{t("empresaSedes.schedule")} *</label>
            <div className={styles.horarioList}>
              {DIAS.map((dia) => {
                const d = horarioForm[dia] ?? { cerrado: true, apertura: DEFAULT_APERTURA, cierre: DEFAULT_CIERRE };
                return (
                  <div key={dia} className={styles.horarioRow}>
                    <label className={styles.horarioDia}>
                      <input
                        type="checkbox"
                        checked={!d.cerrado}
                        onChange={(e) => cambiarDia(dia, { cerrado: !e.target.checked })}
                      />
                      <span>{dia.charAt(0).toUpperCase() + dia.slice(1)}</span>
                    </label>
                    {d.cerrado ? (
                      <span className={styles.horarioCerrado}>{t("empresaSedes.closed")}</span>
                    ) : (
                      <div className={styles.horarioTimes}>
                        <input
                          type="time"
                          value={d.apertura}
                          onChange={(e) => cambiarDia(dia, { apertura: e.target.value })}
                        />
                        <span>—</span>
                        <input
                          type="time"
                          value={d.cierre}
                          onChange={(e) => cambiarDia(dia, { cierre: e.target.value })}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className={styles.fullRow}>
            <label className={styles.sectionLabel}>{t("empresaSedes.closedDays")}</label>
            <div className={styles.diaCerradoAdd}>
              <input type="date" value={nuevaFecha} onChange={(e) => setNuevaFecha(e.target.value)} />
              <Button size="sm" variant="ghost" type="button" onClick={agregarDiaCerrado} disabled={!nuevaFecha}>
                + {t("common.add")}
              </Button>
            </div>
            {diasCerrado.length > 0 && (
              <div className={styles.diaCerradoList}>
                {diasCerrado.map((f) => (
                  <span key={f} className={styles.diaCerradoTag}>
                    {fmtFechaLarga(f)}
                    <button type="button" onClick={() => quitarDiaCerrado(f)} aria-label={t("common.delete")}>
                      <Icon name="close" width={12} height={12} strokeWidth={2.4} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className={styles.actionsRow}>
            <Button variant="ghost" onClick={volver} disabled={guardando}>{t("common.cancel")}</Button>
            <Button onClick={() => void guardar()} disabled={guardando}>
              {guardando ? t("booking.loading") : t("empresaSedes.saveData")}
            </Button>
          </div>
        </div>
      ) : (
        sede && (
          <ImageGallery
            label={t("imagen.imagenSede")}
            imagenes={sede.imagenes}
            onAdd={subirImagen}
            onRemove={borrarImagen}
          />
        )
      )}
    </Panel>
  );
}
