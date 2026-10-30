"use client";
/* ============================================================
   Automatizaciones y campañas — solo SUPER_ADMIN
   ------------------------------------------------------------
   · Automatizaciones: "cuando pase X, (tras N minutos) envía un
     correo o una notificación al negocio o a los superadmins". El
     backend las dispara con los eventos de dominio y de actividad
     del panel, y las envía un cron cada minuto.
   · Campañas: un correo a un segmento de negocios en una fecha.
   · Historial: las últimas ejecuciones, con el error si falló.
============================================================ */
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ROUTES } from "@/constants";
import { AutomatizacionesApi } from "@/api/modules";
import type {
  ApiAccionAutomatizacion,
  ApiAutomatizacion,
  ApiCampanaEmail,
  ApiDestinoAutomatizacion,
  ApiEjecucionAutomatizacion,
  ApiEstadoCampana,
  ApiEstadoEjecucion,
  ApiSegmentoCampana,
} from "@/api/types";
import { ApiError } from "@/api/http";
import { useData } from "@/hooks/useData";
import { useSession } from "@/context/SessionContext";
import { useUi } from "@/context/UiContext";
import { useI18n } from "@/i18n";
import Panel, { PanelHead } from "@/components/ui/Panel";
import Tabs from "@/components/ui/Tabs";
import Toolbar, { ToolbarActions } from "@/components/ui/Toolbar";
import DataTable from "@/components/ui/DataTable";
import Badge, { Tag } from "@/components/ui/Badge";
import Button, { IconButton } from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import Icon from "@/components/ui/Icon";
import Modal, { ModalTitle, ModalText, ModalActions, Field } from "@/components/ui/Modal";
import styles from "./automatizaciones.module.css";

type Pestana = "reglas" | "campanas" | "historial";

const KIND_CAMPANA: Record<ApiEstadoCampana, "pendiente" | "confirmada" | "activo" | "cancelado" | "inactivo"> = {
  BORRADOR: "inactivo",
  PROGRAMADA: "confirmada",
  ENVIANDO: "pendiente",
  ENVIADA: "activo",
  CANCELADA: "cancelado",
};
const KIND_EJ: Record<ApiEstadoEjecucion, "pendiente" | "activo" | "cancelado" | "inactivo"> = {
  PENDIENTE: "pendiente",
  ENVIADA: "activo",
  FALLIDA: "cancelado",
  OMITIDA: "inactivo",
};

function fmtFechaHora(iso: string | null, locale: string) {
  if (!iso) return "—";
  try {
    return new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "es-ES", { dateStyle: "medium", timeStyle: "short" }).format(new Date(iso));
  } catch {
    return iso;
  }
}

/** ISO → valor de <input type="datetime-local"> en hora local. */
function aLocal(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

export default function AutomatizacionesPage() {
  const router = useRouter();
  const { session } = useSession();
  const { t } = useI18n();
  const [pestana, setPestana] = useState<Pestana>("reglas");

  useEffect(() => {
    if (session && session.role !== "superadmin") router.replace(ROUTES.dashboard);
  }, [session, router]);

  if (session && session.role !== "superadmin") return null;

  return (
    <>
      <Tabs
        tabs={[
          { id: "reglas", label: t("automatizaciones.tabReglas") },
          { id: "campanas", label: t("automatizaciones.tabCampanas") },
          { id: "historial", label: t("automatizaciones.tabHistorial") },
        ]}
        active={pestana}
        onChange={(id) => setPestana(id as Pestana)}
      />
      <div className={styles.contenido}>
        {pestana === "reglas" && <Reglas />}
        {pestana === "campanas" && <Campanas />}
        {pestana === "historial" && <Historial />}
      </div>
    </>
  );
}

/* ── Reglas ───────────────────────────────────────────────── */
interface FormRegla {
  nombre: string;
  evento: string;
  retrasoMinutos: string;
  accion: ApiAccionAutomatizacion;
  destino: ApiDestinoAutomatizacion;
  asunto: string;
  mensaje: string;
}
const REGLA_VACIA: FormRegla = {
  nombre: "", evento: "", retrasoMinutos: "0", accion: "EMAIL", destino: "EMPRESA", asunto: "", mensaje: "",
};

function Reglas() {
  const { t } = useI18n();
  const { toast, confirm } = useUi();
  const { data: reglas, loading, reload } = useData(() => AutomatizacionesApi.listar(), [], [] as ApiAutomatizacion[]);
  const { data: catalogo } = useData(() => AutomatizacionesApi.eventos(), [], { eventos: [], variables: [] as string[] });
  const [editando, setEditando] = useState<ApiAutomatizacion | "nueva" | null>(null);
  const [form, setForm] = useState<FormRegla>(REGLA_VACIA);
  const [guardando, setGuardando] = useState(false);

  const etiquetaEvento = useMemo(() => new Map(catalogo.eventos.map((e) => [e.evento, e.etiqueta])), [catalogo]);
  const grupos = useMemo(() => {
    const g = new Map<string, typeof catalogo.eventos>();
    for (const e of catalogo.eventos) g.set(e.grupo, [...(g.get(e.grupo) ?? []), e]);
    return [...g.entries()];
  }, [catalogo]);

  const abrir = (r: ApiAutomatizacion | "nueva") => {
    setForm(
      r === "nueva"
        ? REGLA_VACIA
        : { nombre: r.nombre, evento: r.evento, retrasoMinutos: String(r.retrasoMinutos), accion: r.accion, destino: r.destino, asunto: r.asunto, mensaje: r.mensaje },
    );
    setEditando(r);
  };

  const set = <K extends keyof FormRegla>(k: K, v: FormRegla[K]) => setForm((f) => ({ ...f, [k]: v }));

  const guardar = async () => {
    if (!form.nombre.trim() || !form.evento || !form.asunto.trim() || !form.mensaje.trim()) {
      toast(t("common.error"), "error");
      return;
    }
    setGuardando(true);
    const dto = {
      nombre: form.nombre.trim(),
      evento: form.evento,
      retrasoMinutos: Math.max(0, Math.round(Number(form.retrasoMinutos) || 0)),
      accion: form.accion,
      destino: form.destino,
      asunto: form.asunto.trim(),
      mensaje: form.mensaje.trim(),
    };
    try {
      if (editando === "nueva") await AutomatizacionesApi.crear(dto);
      else if (editando) await AutomatizacionesApi.actualizar(editando.id, dto);
      toast(t("automatizaciones.guardada"), "success");
      setEditando(null);
      await reload();
    } catch (e) {
      toast(e instanceof ApiError ? e.message : t("common.error"), "error");
    } finally {
      setGuardando(false);
    }
  };

  const alternar = async (r: ApiAutomatizacion) => {
    try {
      await AutomatizacionesApi.actualizar(r.id, { activa: !r.activa });
      await reload();
    } catch (e) {
      toast(e instanceof ApiError ? e.message : t("common.error"), "error");
    }
  };

  const eliminar = (r: ApiAutomatizacion) =>
    confirm({
      title: t("automatizaciones.eliminarTitulo"),
      message: t("automatizaciones.eliminarMsg", { nombre: r.nombre }),
      confirmLabel: t("common.delete"),
      onConfirm: async () => {
        try {
          await AutomatizacionesApi.eliminar(r.id);
          toast(t("automatizaciones.eliminada"), "success");
          await reload();
        } catch (e) {
          toast(e instanceof ApiError ? e.message : t("common.error"), "error");
        }
      },
    });

  const espera = (min: number) =>
    min === 0
      ? t("automatizaciones.inmediato")
      : min % 1440 === 0
        ? t("automatizaciones.dias", { n: String(min / 1440) })
        : min % 60 === 0
          ? t("automatizaciones.horas", { n: String(min / 60) })
          : t("automatizaciones.minutos", { n: String(min) });

  return (
    <Panel>
      <PanelHead title={t("automatizaciones.tabReglas")} sub={t("automatizaciones.reglasSub")} />
      <Toolbar>
        <span />
        <ToolbarActions>
          <Button onClick={() => abrir("nueva")}>{t("automatizaciones.nueva")}</Button>
        </ToolbarActions>
      </Toolbar>

      {!loading && reglas.length === 0 ? (
        <EmptyState icon="bot" title={t("automatizaciones.vacio")} message={t("automatizaciones.vacioMsg")} />
      ) : (
        <DataTable
          headers={[
            t("automatizaciones.colNombre"),
            t("automatizaciones.colEvento"),
            t("automatizaciones.colAccion"),
            t("automatizaciones.colRetraso"),
            t("automatizaciones.colEjecuciones"),
            t("automatizaciones.colActiva"),
            "",
          ]}
        >
          {reglas.map((r) => {
            const destino = t(`automatizaciones.destino${r.destino}`);
            return (
              <tr key={r.id}>
                <td><b>{r.nombre}</b></td>
                <td>{etiquetaEvento.get(r.evento) ?? <Tag>{r.evento}</Tag>}</td>
                <td>{r.accion === "EMAIL" ? t("automatizaciones.accionEmail", { destino }) : t("automatizaciones.accionNotif", { destino })}</td>
                <td>{espera(r.retrasoMinutos)}</td>
                <td>{r._count?.ejecuciones ?? 0}</td>
                <td>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={r.activa}
                    aria-label={r.activa ? t("automatizaciones.desactivar") : t("automatizaciones.activar")}
                    className={`${styles.switch} ${r.activa ? styles.switchOn : ""}`}
                    onClick={() => void alternar(r)}
                  >
                    <span />
                  </button>
                </td>
                <td>
                  <div className={styles.acciones}>
                    <IconButton title={t("common.edit")} aria-label={`${t("common.edit")} · ${r.nombre}`} onClick={() => abrir(r)}>
                      <Icon name="edit" />
                    </IconButton>
                    <IconButton danger title={t("common.delete")} aria-label={`${t("common.delete")} · ${r.nombre}`} onClick={() => eliminar(r)}>
                      <Icon name="trash" />
                    </IconButton>
                  </div>
                </td>
              </tr>
            );
          })}
        </DataTable>
      )}

      <Modal open={editando !== null} onClose={() => { if (!guardando) setEditando(null); }} maxWidth={620} contentScroll>
        <ModalTitle>{editando === "nueva" ? t("automatizaciones.modalNueva") : t("automatizaciones.modalEditar")}</ModalTitle>
        <div className={styles.modalCuerpo}>
          <Field label={t("automatizaciones.campoNombre")} htmlFor="au-nombre">
            <input id="au-nombre" value={form.nombre} onChange={(e) => set("nombre", e.target.value)} maxLength={120} />
          </Field>
          <Field label={t("automatizaciones.campoEvento")} htmlFor="au-evento">
            <select id="au-evento" value={form.evento} onChange={(e) => set("evento", e.target.value)}>
              <option value="">{t("automatizaciones.campoEventoPh")}</option>
              {grupos.map(([grupo, eventos]) => (
                <optgroup key={grupo} label={grupo}>
                  {eventos.map((e) => <option key={e.evento} value={e.evento}>{e.etiqueta}</option>)}
                </optgroup>
              ))}
            </select>
          </Field>
          <div className={styles.fila3}>
            <Field label={t("automatizaciones.campoRetraso")} htmlFor="au-retraso" hint={t("automatizaciones.campoRetrasoHint")}>
              <input id="au-retraso" type="number" min={0} max={43200} value={form.retrasoMinutos} onChange={(e) => set("retrasoMinutos", e.target.value)} />
            </Field>
            <Field label={t("automatizaciones.campoAccion")} htmlFor="au-accion">
              <select id="au-accion" value={form.accion} onChange={(e) => set("accion", e.target.value as ApiAccionAutomatizacion)}>
                <option value="EMAIL">{t("automatizaciones.accionEMAIL")}</option>
                <option value="NOTIFICACION">{t("automatizaciones.accionNOTIFICACION")}</option>
              </select>
            </Field>
            <Field label={t("automatizaciones.campoDestino")} htmlFor="au-destino">
              <select id="au-destino" value={form.destino} onChange={(e) => set("destino", e.target.value as ApiDestinoAutomatizacion)}>
                <option value="EMPRESA">{t("automatizaciones.destinoEMPRESA")}</option>
                <option value="SUPERADMINS">{t("automatizaciones.destinoSUPERADMINS")}</option>
              </select>
            </Field>
          </div>
          <Field label={t("automatizaciones.campoAsunto")} htmlFor="au-asunto">
            <input id="au-asunto" value={form.asunto} onChange={(e) => set("asunto", e.target.value)} maxLength={200} />
          </Field>
          <Field
            label={t("automatizaciones.campoMensaje")}
            htmlFor="au-mensaje"
            hint={t("automatizaciones.variables", { lista: catalogo.variables.map((v) => `{{${v}}}`).join(" ") })}
          >
            <textarea id="au-mensaje" rows={7} value={form.mensaje} onChange={(e) => set("mensaje", e.target.value)} maxLength={5000} />
          </Field>
        </div>
        <ModalActions>
          <Button variant="ghost" onClick={() => setEditando(null)} disabled={guardando}>{t("common.cancel")}</Button>
          <Button onClick={() => void guardar()} disabled={guardando}>{guardando ? t("common.saving") : t("common.save")}</Button>
        </ModalActions>
      </Modal>
    </Panel>
  );
}

/* ── Campañas ─────────────────────────────────────────────── */
interface FormCampana {
  nombre: string;
  asunto: string;
  mensaje: string;
  segmento: ApiSegmentoCampana;
  programadaPara: string;
}
const CAMPANA_VACIA: FormCampana = { nombre: "", asunto: "", mensaje: "", segmento: "TODAS", programadaPara: "" };
const SEGMENTOS: ApiSegmentoCampana[] = ["TODAS", "PRO", "FREE", "PRUEBA"];

function Campanas() {
  const { t, locale } = useI18n();
  const { toast, confirm } = useUi();
  const { data: campanas, loading, reload } = useData(() => AutomatizacionesApi.campanas(), [], [] as ApiCampanaEmail[]);
  const [editando, setEditando] = useState<ApiCampanaEmail | "nueva" | null>(null);
  const [form, setForm] = useState<FormCampana>(CAMPANA_VACIA);
  const [guardando, setGuardando] = useState(false);
  const [alcance, setAlcance] = useState<number | null>(null);

  /* Cuántos negocios recibirían la campaña con el segmento elegido */
  useEffect(() => {
    if (editando === null) return;
    let vigente = true;
    setAlcance(null);
    AutomatizacionesApi.destinatarios(form.segmento)
      .then((r) => { if (vigente) setAlcance(r.destinatarios); })
      .catch(() => undefined);
    return () => { vigente = false; };
  }, [form.segmento, editando]);

  const abrir = (c: ApiCampanaEmail | "nueva") => {
    setForm(
      c === "nueva"
        ? CAMPANA_VACIA
        : { nombre: c.nombre, asunto: c.asunto, mensaje: c.mensaje, segmento: c.segmento, programadaPara: aLocal(c.programadaPara) },
    );
    setEditando(c);
  };
  const set = <K extends keyof FormCampana>(k: K, v: FormCampana[K]) => setForm((f) => ({ ...f, [k]: v }));

  const guardar = async () => {
    if (!form.nombre.trim() || !form.asunto.trim() || !form.mensaje.trim()) {
      toast(t("common.error"), "error");
      return;
    }
    setGuardando(true);
    const dto = {
      nombre: form.nombre.trim(),
      asunto: form.asunto.trim(),
      mensaje: form.mensaje.trim(),
      segmento: form.segmento,
      programadaPara: form.programadaPara ? new Date(form.programadaPara).toISOString() : null,
    };
    try {
      if (editando === "nueva") await AutomatizacionesApi.crearCampana({ ...dto, programadaPara: dto.programadaPara ?? undefined });
      else if (editando) await AutomatizacionesApi.actualizarCampana(editando.id, dto);
      toast(t("automatizaciones.campanaGuardada"), "success");
      setEditando(null);
      await reload();
    } catch (e) {
      toast(e instanceof ApiError ? e.message : t("common.error"), "error");
    } finally {
      setGuardando(false);
    }
  };

  const cancelar = (c: ApiCampanaEmail) =>
    confirm({
      title: t("automatizaciones.cancelarTitulo"),
      message: t("automatizaciones.cancelarMsg", { nombre: c.nombre }),
      confirmLabel: t("automatizaciones.cancelar"),
      onConfirm: async () => {
        try {
          await AutomatizacionesApi.cancelarCampana(c.id);
          toast(t("automatizaciones.campanaCancelada"), "success");
          await reload();
        } catch (e) {
          toast(e instanceof ApiError ? e.message : t("common.error"), "error");
        }
      },
    });

  const editable = (c: ApiCampanaEmail) => c.estado === "BORRADOR" || c.estado === "PROGRAMADA";

  return (
    <Panel>
      <PanelHead title={t("automatizaciones.tabCampanas")} sub={t("automatizaciones.campanasSub")} />
      <Toolbar>
        <span />
        <ToolbarActions>
          <Button onClick={() => abrir("nueva")}>{t("automatizaciones.nuevaCampana")}</Button>
        </ToolbarActions>
      </Toolbar>

      {!loading && campanas.length === 0 ? (
        <EmptyState icon="mail" title={t("automatizaciones.sinCampanas")} />
      ) : (
        <DataTable
          headers={[
            t("automatizaciones.colNombre"),
            t("automatizaciones.colSegmento"),
            t("automatizaciones.colProgramada"),
            t("automatizaciones.colEstadoCampana"),
            t("automatizaciones.colResultado"),
            "",
          ]}
        >
          {campanas.map((c) => (
            <tr key={c.id}>
              <td><b>{c.nombre}</b><span className={styles.sub}>{c.asunto}</span></td>
              <td>{t(`automatizaciones.segmentos.${c.segmento}`)}</td>
              <td>{c.enviadaEn ? fmtFechaHora(c.enviadaEn, locale) : c.programadaPara ? fmtFechaHora(c.programadaPara, locale) : t("automatizaciones.sinFecha")}</td>
              <td><Badge kind={KIND_CAMPANA[c.estado]}>{t(`automatizaciones.estadosCampana.${c.estado}`)}</Badge></td>
              <td>
                {c.estado === "ENVIADA"
                  ? t("automatizaciones.resultado", { enviados: String(c.enviados), total: String(c.destinatarios) })
                  : "—"}
              </td>
              <td>
                {editable(c) && (
                  <div className={styles.acciones}>
                    <IconButton title={t("common.edit")} aria-label={`${t("common.edit")} · ${c.nombre}`} onClick={() => abrir(c)}>
                      <Icon name="edit" />
                    </IconButton>
                    <IconButton danger title={t("automatizaciones.cancelar")} aria-label={`${t("automatizaciones.cancelar")} · ${c.nombre}`} onClick={() => cancelar(c)}>
                      <Icon name="x" />
                    </IconButton>
                  </div>
                )}
              </td>
            </tr>
          ))}
        </DataTable>
      )}

      <Modal open={editando !== null} onClose={() => { if (!guardando) setEditando(null); }} maxWidth={620} contentScroll>
        <ModalTitle>{editando === "nueva" ? t("automatizaciones.modalCampana") : t("automatizaciones.modalCampanaEditar")}</ModalTitle>
        <div className={styles.modalCuerpo}>
          <Field label={t("automatizaciones.campoNombre")} htmlFor="ca-nombre">
            <input id="ca-nombre" value={form.nombre} onChange={(e) => set("nombre", e.target.value)} maxLength={120} />
          </Field>
          <div className={styles.fila2}>
            <Field label={t("automatizaciones.campoSegmento")} htmlFor="ca-segmento">
              <select id="ca-segmento" value={form.segmento} onChange={(e) => set("segmento", e.target.value as ApiSegmentoCampana)}>
                {SEGMENTOS.map((s) => <option key={s} value={s}>{t(`automatizaciones.segmentos.${s}`)}</option>)}
              </select>
            </Field>
            <Field label={t("automatizaciones.campoFecha")} htmlFor="ca-fecha" hint={t("automatizaciones.campoFechaHint")}>
              <input id="ca-fecha" type="datetime-local" value={form.programadaPara} onChange={(e) => set("programadaPara", e.target.value)} />
            </Field>
          </div>
          {alcance !== null && (
            <ModalText>{t("automatizaciones.alcance", { n: String(alcance) })}</ModalText>
          )}
          <Field label={t("automatizaciones.campoAsunto")} htmlFor="ca-asunto">
            <input id="ca-asunto" value={form.asunto} onChange={(e) => set("asunto", e.target.value)} maxLength={200} />
          </Field>
          <Field label={t("automatizaciones.campoMensaje")} htmlFor="ca-mensaje" hint={t("automatizaciones.variables", { lista: "{{empresa}} {{fecha}}" })}>
            <textarea id="ca-mensaje" rows={9} value={form.mensaje} onChange={(e) => set("mensaje", e.target.value)} maxLength={10000} />
          </Field>
        </div>
        <ModalActions>
          <Button variant="ghost" onClick={() => setEditando(null)} disabled={guardando}>{t("common.cancel")}</Button>
          <Button onClick={() => void guardar()} disabled={guardando}>{guardando ? t("common.saving") : t("common.save")}</Button>
        </ModalActions>
      </Modal>
    </Panel>
  );
}

/* ── Historial ────────────────────────────────────────────── */
function Historial() {
  const { t, locale } = useI18n();
  const { data: ejecuciones, loading } = useData(() => AutomatizacionesApi.ejecuciones(), [], [] as ApiEjecucionAutomatizacion[]);

  return (
    <Panel>
      <PanelHead title={t("automatizaciones.tabHistorial")} sub={t("automatizaciones.historialSub")} />
      {!loading && ejecuciones.length === 0 ? (
        <EmptyState icon="clock" title={t("automatizaciones.sinHistorial")} />
      ) : (
        <DataTable
          headers={[
            t("automatizaciones.colNombre"),
            t("automatizaciones.colCuando"),
            t("automatizaciones.colEstadoEj"),
            t("automatizaciones.colError"),
          ]}
        >
          {ejecuciones.map((e) => (
            <tr key={e.id}>
              <td><b>{e.automatizacion.nombre}</b></td>
              <td>{fmtFechaHora(e.programadaPara, locale)}</td>
              <td><Badge kind={KIND_EJ[e.estado]}>{t(`automatizaciones.estadosEj.${e.estado}`)}</Badge></td>
              <td className={styles.error}>{e.error || "—"}</td>
            </tr>
          ))}
        </DataTable>
      )}
    </Panel>
  );
}
