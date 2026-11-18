"use client";
/* ============================================================
   FiltrosClientes — filtros de clientes que guarda el negocio
   ------------------------------------------------------------
   El negocio arma un filtro con los datos de sus clientes (edad,
   cumpleaños, ciudad, género, actividad…) y lo guarda con un
   nombre. Se ve al momento cuántos clientes lo cumplen y cuántos
   tienen correo o WhatsApp. Las campañas se envían a un filtro
   guardado (el backend lo vuelve a evaluar el día del envío).
============================================================ */
import { useEffect, useMemo, useState } from "react";
import type { ApiFiltroCliente, ApiService, ApiVistaPreviaFiltro, CriteriosFiltro } from "@/api/types";
import { MarketingApi } from "@/api/modules";
import { FiltroFacturasController, NuevaFacturaController, type OpcionFiltro } from "@/controllers/FacturacionControllers";
import { useData } from "@/hooks/useData";
import { useSession } from "@/context/SessionContext";
import { useUi } from "@/context/UiContext";
import { useI18n } from "@/i18n";
import Panel, { PanelHead } from "@/components/ui/Panel";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import Icon from "@/components/ui/Icon";
import Modal, { ModalTitle, ModalActions, Field } from "@/components/ui/Modal";
import { SkTable } from "@/components/ui/Skeleton";
import { FECHAS_ESPECIALES } from "@/components/clientes/FechasEspeciales";
import styles from "./marketing.module.css";

type T = (k: string, v?: Record<string, string | number>) => string;

const MESES_ES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
const MESES_EN = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

/** Texto corto de cada criterio, para las tarjetas y el resumen. */
export function resumenCriterios(c: CriteriosFiltro, t: T, locale: string, sedes: OpcionFiltro[] = []): string[] {
  const meses = locale === "en" ? MESES_EN : MESES_ES;
  const out: string[] = [];
  if (c.sedeId) out.push(sedes.find((s) => s.id === String(c.sedeId))?.nombre || t("marketing.critSede"));
  if (c.genero) out.push(t(`marketing.genero_${c.genero}`));
  if (c.edadMin != null && c.edadMax != null) out.push(t("marketing.critEdadEntre", { min: c.edadMin, max: c.edadMax }));
  else if (c.edadMin != null) out.push(t("marketing.critEdadMin", { min: c.edadMin }));
  else if (c.edadMax != null) out.push(t("marketing.critEdadMax", { max: c.edadMax }));
  if (c.cumpleHoy) out.push(t("marketing.critCumpleHoy"));
  else if (c.cumpleMes === 0) out.push(t("marketing.critCumpleEsteMes"));
  else if (c.cumpleMes) out.push(t("marketing.critCumpleMes", { mes: meses[c.cumpleMes - 1] }));
  if (c.ciudad) out.push(c.ciudad);
  if (c.idioma) out.push(t(`marketing.idioma_${c.idioma}`));
  if (c.reservasMin) out.push(t("marketing.critReservasMin", { n: c.reservasMin }));
  if (c.sinVisitaDias) out.push(t("marketing.critSinVisita", { n: c.sinVisitaDias }));
  if (c.visitaRecienteDias) out.push(t("marketing.critVisitaReciente", { n: c.visitaRecienteDias }));
  if (c.nuevosDias) out.push(t("marketing.critNuevos", { n: c.nuevosDias }));
  if (c.servicioId) out.push(t("marketing.critServicio"));
  if (c.conHijos === true) out.push(t("marketing.critConHijos"));
  if (c.conHijos === false) out.push(t("marketing.critSinHijos"));
  if (c.cumpleHijoMes === 0) out.push(t("marketing.critHijoEsteMes"));
  else if (c.cumpleHijoMes) out.push(t("marketing.critHijoMes", { mes: meses[c.cumpleHijoMes - 1] }));
  if (c.fechaEspecial) out.push(t("marketing.critFecha", { fecha: t(`fechasEspeciales.${c.fechaEspecial}`) }));
  return out.length ? out : [t("marketing.critTodos")];
}

/** Sedes y servicios de la empresa, para los desplegables del filtro. */
export function useOpcionesEmpresa(empresaId?: number) {
  const { session } = useSession();
  const { locale } = useI18n();
  const { data: sedes } = useData(
    async () =>
      /* El admin de sede no elige sede: la suya */
      session?.role === "admin"
        ? (session.sedeId ? [{ id: String(session.sedeId), nombre: session.sedeName || "" }] : [])
        : FiltroFacturasController.sedes(session, empresaId ? String(empresaId) : ""),
    [session?.id, empresaId],
    [] as OpcionFiltro[]
  );
  const { data: servicios } = useData(
    async () => {
      const listas = await Promise.all(sedes.map((s) => NuevaFacturaController.servicios(s.id, locale)));
      const vistos = new Map<number, ApiService>();
      for (const l of listas) for (const s of l) vistos.set(s.id, s);
      return [...vistos.values()].sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    },
    [sedes, locale],
    [] as ApiService[]
  );
  return { sedes, servicios };
}

/* ── Lista de filtros guardados ───────────────────────────── */
export default function FiltrosClientes({
  empresaId,
  onNuevaCampana,
}: {
  /** Solo el superadmin la pasa; el resto usa la de su sesión */
  empresaId?: number;
  onNuevaCampana?: (filtroId: number) => void;
}) {
  const { t, locale } = useI18n();
  const { toast, confirm } = useUi();
  const { data: filtros, loading, reload } = useData(
    () => MarketingApi.filtros(empresaId),
    [empresaId],
    [] as ApiFiltroCliente[]
  );
  const { sedes, servicios } = useOpcionesEmpresa(empresaId);
  const [editando, setEditando] = useState<ApiFiltroCliente | "nuevo" | null>(null);

  const borrar = (f: ApiFiltroCliente) =>
    confirm({
      title: t("marketing.borrarFiltroTitulo"),
      message: t("marketing.borrarFiltroMsg", { nombre: f.nombre }),
      confirmLabel: t("common.delete"),
      onConfirm: async () => {
        try {
          await MarketingApi.borrarFiltro(f.id, empresaId);
          toast(t("marketing.filtroBorrado"), "success");
          await reload();
        } catch (e) {
          toast(e instanceof Error ? e.message : t("common.error"), "error");
        }
      },
    });

  return (
    <Panel>
      <PanelHead
        title={t("marketing.filtrosTitulo")}
        sub={t("marketing.filtrosSub")}
        right={
          <Button size="sm" onClick={() => setEditando("nuevo")}>
            <Icon name="plus" /> {t("marketing.crearFiltro")}
          </Button>
        }
      />

      {loading && filtros.length === 0 ? (
        <SkTable cols={3} rows={3} person={-1} />
      ) : filtros.length === 0 ? (
        <EmptyState icon="users" title={t("marketing.filtrosVacio")} message={t("marketing.filtrosVacioMsg")} />
      ) : (
        <div className={styles.filtrosGrid}>
          {filtros.map((f) => (
            <article key={f.id} className={styles.filtroCard}>
              <div className={styles.filtroCab}>
                <span className={styles.filtroIcono}><Icon name="users" /></span>
                <span className={styles.filtroNombre} title={f.nombre}>{f.nombre}</span>
              </div>
              <div className={styles.criterios}>
                {resumenCriterios(f.criterios || {}, t, locale, sedes).map((c, i) => (
                  <span key={i} className={styles.criterio}>{c}</span>
                ))}
              </div>
              <div className={styles.cifras}>
                <div className={styles.cifra}><b>{f.total}</b><span>{t("marketing.contactos")}</span></div>
                <div className={styles.cifra}><b>{f.conTelefono}</b><span>WhatsApp</span></div>
                <div className={styles.cifra}><b>{f.conEmail}</b><span>{t("common.email")}</span></div>
              </div>
              <div className={styles.filtroAcciones}>
                {onNuevaCampana && (
                  <Button size="sm" onClick={() => onNuevaCampana(f.id)} disabled={f.total === 0}>
                    <Icon name="send" /> {t("marketing.usarEnCampana")}
                  </Button>
                )}
                <Button size="sm" variant="ghost" onClick={() => setEditando(f)}>
                  <Icon name="edit" /> {t("common.edit")}
                </Button>
                <Button size="sm" variant="dangerGhost" onClick={() => borrar(f)}>
                  <Icon name="trash" />
                </Button>
              </div>
            </article>
          ))}
        </div>
      )}

      <FiltroBuilder
        abierto={editando !== null}
        filtro={editando === "nuevo" ? null : editando}
        empresaId={empresaId}
        sedes={sedes}
        servicios={servicios}
        onClose={() => setEditando(null)}
        onGuardado={async () => { setEditando(null); await reload(); }}
      />
    </Panel>
  );
}

/* ── Constructor de filtro con vista previa en vivo ───────── */
type Form = {
  nombre: string;
  sedeId: string;
  genero: string;
  edadMin: string;
  edadMax: string;
  cumpleMes: string;
  cumpleHoy: boolean;
  ciudad: string;
  idioma: string;
  reservasMin: string;
  sinVisitaDias: string;
  visitaRecienteDias: string;
  nuevosDias: string;
  servicioId: string;
  conHijos: "" | "si" | "no";
  fechaEspecial: string;
  cumpleHijoMes: string;
};
const VACIO: Form = {
  nombre: "", sedeId: "", genero: "", edadMin: "", edadMax: "", cumpleMes: "", cumpleHoy: false, ciudad: "",
  idioma: "", reservasMin: "", sinVisitaDias: "", visitaRecienteDias: "", nuevosDias: "", servicioId: "",
  conHijos: "", fechaEspecial: "", cumpleHijoMes: "",
};

const num = (v: string) => (v.trim() === "" || !Number.isFinite(Number(v)) ? undefined : Number(v));

function aCriterios(f: Form): CriteriosFiltro {
  const c: CriteriosFiltro = {
    sedeId: num(f.sedeId),
    genero: f.genero || undefined,
    edadMin: num(f.edadMin),
    edadMax: num(f.edadMax),
    cumpleMes: f.cumpleMes === "" ? undefined : Number(f.cumpleMes),
    cumpleHoy: f.cumpleHoy || undefined,
    ciudad: f.ciudad.trim() || undefined,
    idioma: f.idioma || undefined,
    reservasMin: num(f.reservasMin),
    sinVisitaDias: num(f.sinVisitaDias),
    visitaRecienteDias: num(f.visitaRecienteDias),
    nuevosDias: num(f.nuevosDias),
    servicioId: num(f.servicioId),
    conHijos: f.conHijos === "si" ? true : f.conHijos === "no" ? false : undefined,
    fechaEspecial: f.fechaEspecial || undefined,
    cumpleHijoMes: f.cumpleHijoMes === "" ? undefined : Number(f.cumpleHijoMes),
  };
  return Object.fromEntries(Object.entries(c).filter(([, v]) => v !== undefined)) as CriteriosFiltro;
}

function desdeFiltro(f: ApiFiltroCliente | null): Form {
  if (!f) return VACIO;
  const c = f.criterios || {};
  const s = (v?: number) => (v == null ? "" : String(v));
  return {
    nombre: f.nombre, sedeId: s(c.sedeId), genero: c.genero || "", edadMin: s(c.edadMin), edadMax: s(c.edadMax),
    cumpleMes: s(c.cumpleMes), cumpleHoy: !!c.cumpleHoy, ciudad: c.ciudad || "", idioma: c.idioma || "",
    reservasMin: s(c.reservasMin), sinVisitaDias: s(c.sinVisitaDias), visitaRecienteDias: s(c.visitaRecienteDias),
    nuevosDias: s(c.nuevosDias), servicioId: s(c.servicioId),
    conHijos: c.conHijos === true ? "si" : c.conHijos === false ? "no" : "",
    fechaEspecial: c.fechaEspecial || "",
    cumpleHijoMes: s(c.cumpleHijoMes),
  };
}

export function FiltroBuilder({
  abierto,
  filtro,
  empresaId,
  sedes,
  servicios,
  onClose,
  onGuardado,
}: {
  abierto: boolean;
  filtro: ApiFiltroCliente | null;
  empresaId?: number;
  sedes: OpcionFiltro[];
  servicios: ApiService[];
  onClose: () => void;
  onGuardado: (f: ApiFiltroCliente) => Promise<void> | void;
}) {
  const { t, locale } = useI18n();
  const { toast } = useUi();
  const { session } = useSession();
  const [form, setForm] = useState<Form>(VACIO);
  const [preview, setPreview] = useState<ApiVistaPreviaFiltro | null>(null);
  const [calculando, setCalculando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const { data: opciones } = useData(
    () => (abierto ? MarketingApi.opciones(empresaId) : Promise.resolve(null)),
    [abierto, empresaId],
    null
  );

  useEffect(() => { if (abierto) { setForm(desdeFiltro(filtro)); setPreview(null); } }, [abierto, filtro]);

  const criterios = useMemo(() => aCriterios(form), [form]);
  const claveCriterios = JSON.stringify(criterios);

  /* Vista previa en vivo, con un respiro para no consultar en cada tecla */
  useEffect(() => {
    if (!abierto) return;
    let vigente = true;
    setCalculando(true);
    const id = setTimeout(() => {
      MarketingApi.vistaPrevia(criterios, empresaId)
        .then((r) => { if (vigente) setPreview(r); })
        .catch(() => { if (vigente) setPreview(null); })
        .finally(() => { if (vigente) setCalculando(false); });
    }, 450);
    return () => { vigente = false; clearTimeout(id); };
  }, [abierto, claveCriterios, empresaId]); // eslint-disable-line react-hooks/exhaustive-deps

  const set = <K extends keyof Form>(k: K, v: Form[K]) => setForm((f) => ({ ...f, [k]: v }));
  const meses = locale === "en" ? MESES_EN : MESES_ES;

  const guardar = async () => {
    if (form.nombre.trim().length < 2) { toast(t("marketing.faltaNombreFiltro"), "error"); return; }
    if (criterios.edadMin != null && criterios.edadMax != null && criterios.edadMin > criterios.edadMax) {
      toast(t("marketing.edadInvalida"), "error"); return;
    }
    setGuardando(true);
    try {
      const guardado = filtro
        ? await MarketingApi.editarFiltro(filtro.id, form.nombre.trim(), criterios, empresaId)
        : await MarketingApi.crearFiltro(form.nombre.trim(), criterios, empresaId);
      toast(t("marketing.filtroGuardado"), "success");
      await onGuardado(guardado);
    } catch (e) {
      toast(e instanceof Error ? e.message : t("common.error"), "error");
    } finally {
      setGuardando(false);
    }
  };

  const esAdminSede = session?.role === "admin";

  return (
    <Modal open={abierto} onClose={() => { if (!guardando) onClose(); }} maxWidth={860}>
      <ModalTitle>{filtro ? t("marketing.editarFiltro") : t("marketing.crearFiltro")}</ModalTitle>
      <div className={styles.builder}>
        <div>
          <Field label={t("marketing.nombreFiltro")} htmlFor="fb-nombre">
            <input id="fb-nombre" className={styles.input} value={form.nombre} maxLength={120}
              placeholder={t("marketing.nombreFiltroPh")} onChange={(e) => set("nombre", e.target.value)} />
          </Field>

          <div className={styles.seccion}>
            <span className={styles.seccionTitulo}><Icon name="user" /> {t("marketing.secPersonales")}</span>
            <div className={styles.fila2}>
              <Field label={t("marketing.genero")} htmlFor="fb-genero">
                <select id="fb-genero" className={styles.select} value={form.genero} onChange={(e) => set("genero", e.target.value)}>
                  <option value="">{t("marketing.cualquiera")}</option>
                  <option value="female">{t("marketing.genero_female")}</option>
                  <option value="male">{t("marketing.genero_male")}</option>
                  <option value="other">{t("marketing.genero_other")}</option>
                </select>
              </Field>
              <Field label={t("marketing.idioma")} htmlFor="fb-idioma">
                <select id="fb-idioma" className={styles.select} value={form.idioma} onChange={(e) => set("idioma", e.target.value)}>
                  <option value="">{t("marketing.cualquiera")}</option>
                  <option value="es">{t("marketing.idioma_es")}</option>
                  <option value="en">{t("marketing.idioma_en")}</option>
                </select>
              </Field>
              <Field label={t("marketing.edadMin")} htmlFor="fb-edadmin">
                <input id="fb-edadmin" className={styles.input} type="number" min={0} max={120} value={form.edadMin} onChange={(e) => set("edadMin", e.target.value)} />
              </Field>
              <Field label={t("marketing.edadMax")} htmlFor="fb-edadmax">
                <input id="fb-edadmax" className={styles.input} type="number" min={0} max={120} value={form.edadMax} onChange={(e) => set("edadMax", e.target.value)} />
              </Field>
            </div>
          </div>

          <div className={styles.seccion}>
            <span className={styles.seccionTitulo}><Icon name="users" /> {t("marketing.secFamilia")}</span>
            <div className={styles.fila2}>
              <Field label={t("marketing.hijos")} htmlFor="fb-hijos">
                <select id="fb-hijos" className={styles.select} value={form.conHijos} onChange={(e) => set("conHijos", e.target.value as Form["conHijos"])}>
                  <option value="">{t("marketing.cualquiera")}</option>
                  <option value="si">{t("marketing.conHijos")}</option>
                  <option value="no">{t("marketing.sinHijos")}</option>
                </select>
              </Field>
              <Field label={t("marketing.cumpleHijo")} htmlFor="fb-cumplehijo">
                <select id="fb-cumplehijo" className={styles.select} value={form.cumpleHijoMes} onChange={(e) => set("cumpleHijoMes", e.target.value)}>
                  <option value="">{t("marketing.cualquiera")}</option>
                  <option value="0">{t("marketing.esteMes")}</option>
                  {meses.map((m, i) => <option key={m} value={i + 1}>{m.charAt(0).toUpperCase() + m.slice(1)}</option>)}
                </select>
              </Field>
              <Field label={t("marketing.fechaEspecial")} htmlFor="fb-fecha">
                <select id="fb-fecha" className={styles.select} value={form.fechaEspecial} onChange={(e) => set("fechaEspecial", e.target.value)}>
                  <option value="">{t("marketing.cualquiera")}</option>
                  {FECHAS_ESPECIALES.map((f) => <option key={f} value={f}>{t(`fechasEspeciales.${f}`)}</option>)}
                </select>
              </Field>
            </div>
          </div>

          <div className={styles.seccion}>
            <span className={styles.seccionTitulo}><Icon name="star" /> {t("marketing.secCumple")}</span>
            <Field label={t("marketing.cumpleMes")} htmlFor="fb-mes">
              <select id="fb-mes" className={styles.select} value={form.cumpleMes} disabled={form.cumpleHoy}
                onChange={(e) => set("cumpleMes", e.target.value)}>
                <option value="">{t("marketing.cualquiera")}</option>
                <option value="0">{t("marketing.esteMes")}</option>
                {meses.map((m, i) => <option key={m} value={i + 1}>{m.charAt(0).toUpperCase() + m.slice(1)}</option>)}
              </select>
            </Field>
            <label className={styles.check}>
              <input type="checkbox" checked={form.cumpleHoy} onChange={(e) => set("cumpleHoy", e.target.checked)} />
              {t("marketing.cumpleHoy")}
            </label>
          </div>

          <div className={styles.seccion}>
            <span className={styles.seccionTitulo}><Icon name="mapPin" /> {t("marketing.secUbicacion")}</span>
            <div className={styles.fila2}>
              <Field label={t("marketing.ciudad")} htmlFor="fb-ciudad">
                <input id="fb-ciudad" className={styles.input} list="fb-ciudades" value={form.ciudad}
                  placeholder={t("marketing.ciudadPh")} onChange={(e) => set("ciudad", e.target.value)} />
                <datalist id="fb-ciudades">
                  {(opciones?.ciudades || []).map((c) => <option key={c} value={c} />)}
                </datalist>
              </Field>
              {!esAdminSede && (
                <Field label={t("common.branch")} htmlFor="fb-sede">
                  <select id="fb-sede" className={styles.select} value={form.sedeId} onChange={(e) => set("sedeId", e.target.value)}>
                    <option value="">{t("marketing.todasSedes")}</option>
                    {sedes.map((s) => <option key={s.id} value={s.id}>{s.nombre}</option>)}
                  </select>
                </Field>
              )}
            </div>
          </div>

          <div className={styles.seccion}>
            <span className={styles.seccionTitulo}><Icon name="calendar" /> {t("marketing.secActividad")}</span>
            <div className={styles.fila2}>
              <Field label={t("marketing.reservasMin")} htmlFor="fb-reservas">
                <input id="fb-reservas" className={styles.input} type="number" min={0} value={form.reservasMin} onChange={(e) => set("reservasMin", e.target.value)} />
              </Field>
              <Field label={t("marketing.servicio")} htmlFor="fb-servicio">
                <select id="fb-servicio" className={styles.select} value={form.servicioId} onChange={(e) => set("servicioId", e.target.value)}>
                  <option value="">{t("marketing.cualquiera")}</option>
                  {servicios.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </Field>
              <Field label={t("marketing.sinVisita")} htmlFor="fb-sinvisita" hint={t("marketing.sinVisitaHint")}>
                <input id="fb-sinvisita" className={styles.input} type="number" min={1} value={form.sinVisitaDias} onChange={(e) => set("sinVisitaDias", e.target.value)} />
              </Field>
              <Field label={t("marketing.visitaReciente")} htmlFor="fb-reciente" hint={t("marketing.visitaRecienteHint")}>
                <input id="fb-reciente" className={styles.input} type="number" min={1} value={form.visitaRecienteDias} onChange={(e) => set("visitaRecienteDias", e.target.value)} />
              </Field>
              <Field label={t("marketing.nuevos")} htmlFor="fb-nuevos" hint={t("marketing.nuevosHint")}>
                <input id="fb-nuevos" className={styles.input} type="number" min={1} value={form.nuevosDias} onChange={(e) => set("nuevosDias", e.target.value)} />
              </Field>
            </div>
          </div>
        </div>

        {/* Vista previa en vivo */}
        <aside className={`${styles.preview} ${calculando ? styles.cargando : ""}`} aria-live="polite">
          <div className={styles.previewTotal}>
            <b>{preview?.total ?? "—"}</b>
            <span>{t("marketing.cumplenFiltro")}{opciones ? ` · ${t("marketing.deTotal", { n: opciones.totalClientes })}` : ""}</span>
          </div>
          <div className={styles.previewCanales}>
            <span><Icon name="message" /> {preview?.conTelefono ?? 0} WhatsApp</span>
            <span><Icon name="mail" /> {preview?.conEmail ?? 0} {t("common.email")}</span>
          </div>
          <div className={styles.muestra}>
            {(preview?.muestra || []).slice(0, 8).map((c) => (
              <div key={c.userId} className={styles.muestraFila}>
                <b>{c.nombre}</b>
                <span>{[c.ciudad, c.email].filter(Boolean).join(" · ") || "—"}</span>
              </div>
            ))}
            {preview && preview.total === 0 && <p className={styles.aviso}>{t("marketing.nadieCumple")}</p>}
          </div>
        </aside>
      </div>

      <ModalActions>
        <Button variant="ghost" onClick={() => setForm({ ...VACIO, nombre: form.nombre })} disabled={guardando}>
          {t("marketing.limpiar")}
        </Button>
        <Button variant="ghost" onClick={onClose} disabled={guardando}>{t("common.cancel")}</Button>
        <Button onClick={() => void guardar()} disabled={guardando}>
          {guardando ? t("marketing.guardando") : t("marketing.guardarFiltro")}
        </Button>
      </ModalActions>
    </Modal>
  );
}
