"use client";
/* ============================================================
   CampanasClientes — campañas del negocio a un filtro guardado
   ------------------------------------------------------------
   Lista (Todas / WhatsApp / Correo / Programadas / Enviadas) y
   asistente de 4 pasos: Audiencia → Mensaje → Programación →
   Resumen. A un lado, la audiencia elegida y las plantillas.
   El envío lo hace el backend: al momento, en la fecha elegida o
   se guarda como borrador.
============================================================ */
import { useEffect, useMemo, useRef, useState } from "react";
import type { ApiCampanaCliente, ApiCanalCampana, ApiEstadoCampana, ApiFiltroCliente } from "@/api/types";
import { MarketingApi } from "@/api/modules";
import { useData } from "@/hooks/useData";
import { useSession } from "@/context/SessionContext";
import { useUi } from "@/context/UiContext";
import { useI18n } from "@/i18n";
import Panel, { PanelHead } from "@/components/ui/Panel";
import DataTable from "@/components/ui/DataTable";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import Icon, { type IconName } from "@/components/ui/Icon";
import MenuAcciones from "@/components/ui/MenuAcciones";
import { SkTable } from "@/components/ui/Skeleton";
import { Field } from "@/components/ui/Modal";
import { FiltroBuilder, resumenCriterios, useOpcionesEmpresa } from "./FiltrosClientes";
import styles from "./marketing.module.css";

const KIND: Record<ApiEstadoCampana, "pendiente" | "confirmada" | "activo" | "cancelado" | "inactivo"> = {
  BORRADOR: "inactivo",
  PROGRAMADA: "confirmada",
  ENVIANDO: "pendiente",
  ENVIADA: "activo",
  CANCELADA: "cancelado",
};

type Chip = "todas" | "WHATSAPP" | "EMAIL" | "PROGRAMADA" | "ENVIADA";

const VARIABLES = ["nombre", "negocio", "enlace_reserva"] as const;
const PLANTILLAS: { id: string; icono: IconName }[] = [
  { id: "promo", icono: "tag" },
  { id: "recordatorio", icono: "calendar" },
  { id: "fidelizacion", icono: "star" },
  { id: "novedades", icono: "send" },
  { id: "cumple", icono: "crown" },
];

function fmtFechaHora(iso: string | null, locale: string) {
  if (!iso) return "—";
  try {
    return new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "es-ES", { dateStyle: "medium", timeStyle: "short" }).format(new Date(iso));
  } catch {
    return iso;
  }
}

/* ── Lista ─────────────────────────────────────────────────── */
export default function CampanasClientes({
  empresaId,
  filtroInicial,
  onIrAFiltros,
}: {
  empresaId?: number;
  /** Abre el asistente con este filtro ya elegido (desde «Usar en campaña») */
  filtroInicial?: number | null;
  onIrAFiltros?: () => void;
}) {
  const { t, locale } = useI18n();
  const { toast } = useUi();
  const { data: campanas, loading, reload } = useData(
    () => MarketingApi.campanas(empresaId),
    [empresaId],
    [] as ApiCampanaCliente[]
  );
  const [chip, setChip] = useState<Chip>("todas");
  const [creando, setCreando] = useState<boolean>(!!filtroInicial);

  useEffect(() => { if (filtroInicial) setCreando(true); }, [filtroInicial]);

  /* Mientras haya alguna enviándose, se refresca sola */
  const enviando = campanas.some((c) => c.estado === "ENVIANDO");
  useEffect(() => {
    if (!enviando) return;
    const id = setInterval(() => void reload(), 5000);
    return () => clearInterval(id);
  }, [enviando, reload]);

  const visibles = useMemo(
    () =>
      campanas.filter((c) =>
        chip === "todas" ? true : chip === "WHATSAPP" || chip === "EMAIL" ? c.canal === chip : c.estado === chip
      ),
    [campanas, chip]
  );

  const accion = async (c: ApiCampanaCliente, tipo: "enviar" | "cancelar") => {
    try {
      if (tipo === "enviar") await MarketingApi.enviarCampana(c.id, empresaId);
      else await MarketingApi.cancelarCampana(c.id, empresaId);
      toast(t(tipo === "enviar" ? "marketing.enviandose" : "marketing.cancelada"), "success");
      await reload();
    } catch (e) {
      toast(e instanceof Error ? e.message : t("common.error"), "error");
    }
  };

  if (creando) {
    return (
      <AsistenteCampana
        empresaId={empresaId}
        filtroInicial={filtroInicial ?? null}
        onCancelar={() => setCreando(false)}
        onIrAFiltros={onIrAFiltros}
        onCreada={async () => { setCreando(false); await reload(); }}
      />
    );
  }

  const chips: { id: Chip; label: string; icono?: IconName }[] = [
    { id: "todas", label: t("marketing.chipTodas") },
    { id: "WHATSAPP", label: "WhatsApp", icono: "message" },
    { id: "EMAIL", label: t("common.email"), icono: "mail" },
    { id: "PROGRAMADA", label: t("marketing.chipProgramadas"), icono: "clock" },
    { id: "ENVIADA", label: t("marketing.chipEnviadas"), icono: "check" },
  ];

  return (
    <Panel>
      <PanelHead
        title={t("marketing.campanasTitulo")}
        sub={t("marketing.campanasSub")}
        right={<Button size="sm" onClick={() => setCreando(true)}><Icon name="plus" /> {t("marketing.nuevaCampana")}</Button>}
      />
      <div className={styles.chips} role="tablist">
        {chips.map((c) => (
          <button
            key={c.id}
            type="button"
            role="tab"
            aria-selected={chip === c.id}
            className={`${styles.chip} ${chip === c.id ? styles.chipOn : ""}`}
            onClick={() => setChip(c.id)}
          >
            {c.icono && <Icon name={c.icono} />} {c.label}
          </button>
        ))}
      </div>

      {loading && campanas.length === 0 ? (
        <SkTable cols={6} rows={5} person={-1} />
      ) : visibles.length === 0 ? (
        <EmptyState icon="send" title={t("marketing.campanasVacio")} message={t("marketing.campanasVacioMsg")} />
      ) : (
        <DataTable
          headers={[
            t("marketing.colNombre"),
            t("marketing.colSegmento"),
            t("marketing.colFecha"),
            t("common.state"),
            t("common.actions"),
          ]}
        >
          {visibles.map((c) => (
            <tr key={c.id}>
              <td>
                <div className={styles.nombreCampana}>
                  <span className={`${styles.canalIcono} ${c.canal === "WHATSAPP" ? styles.canalWa : styles.canalMail}`}>
                    <Icon name={c.canal === "WHATSAPP" ? "message" : "mail"} />
                  </span>
                  <span className={styles.nombreTexto}>
                    <b>{c.nombre}</b>
                    <span>{c.mensaje}</span>
                  </span>
                </div>
              </td>
              <td>
                {c.filtro?.nombre || t("marketing.filtroBorradoCorto")}
                <span className={styles.sub}>
                  {c.estado === "ENVIADA"
                    ? t("marketing.enviadosDe", { enviados: c.enviados, total: c.destinatarios })
                    : "—"}
                  {c.fallidos > 0 && ` · ${t("marketing.fallidosN", { n: c.fallidos })}`}
                </span>
              </td>
              <td>{fmtFechaHora(c.enviadaEn || c.programadaPara, locale)}</td>
              <td><Badge kind={KIND[c.estado]}>{t(`automatizaciones.estadosCampana.${c.estado}`)}</Badge></td>
              <td>
                {(c.estado === "BORRADOR" || c.estado === "PROGRAMADA") ? (
                  <MenuAcciones
                    etiqueta={t("marketing.accionesDe", { nombre: c.nombre })}
                    acciones={[
                      { etiqueta: t("marketing.enviarAhora"), icono: "send", onClick: () => void accion(c, "enviar") },
                      { etiqueta: t("marketing.cancelar"), icono: "x", peligro: true, onClick: () => void accion(c, "cancelar") },
                    ]}
                  />
                ) : "—"}
              </td>
            </tr>
          ))}
        </DataTable>
      )}
    </Panel>
  );
}

/* ── Asistente de 4 pasos ─────────────────────────────────── */
function AsistenteCampana({
  empresaId,
  filtroInicial,
  onCancelar,
  onCreada,
  onIrAFiltros,
}: {
  empresaId?: number;
  filtroInicial: number | null;
  onCancelar: () => void;
  onCreada: () => Promise<void> | void;
  onIrAFiltros?: () => void;
}) {
  const { t, locale } = useI18n();
  const { toast } = useUi();
  const { session } = useSession();
  const { data: filtros, reload: recargarFiltros } = useData(
    () => MarketingApi.filtros(empresaId),
    [empresaId],
    [] as ApiFiltroCliente[]
  );
  const { data: opciones } = useData(() => MarketingApi.opciones(empresaId), [empresaId], null);
  const { sedes, servicios } = useOpcionesEmpresa(empresaId);
  const waDisponible = !!opciones?.canales.whatsapp;

  const [paso, setPaso] = useState(1);
  const [filtroId, setFiltroId] = useState<number | null>(filtroInicial);
  const [canal, setCanal] = useState<ApiCanalCampana>("EMAIL");
  const [plantilla, setPlantilla] = useState("");
  const [asunto, setAsunto] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [cuando, setCuando] = useState<"ahora" | "programar">("ahora");
  const [fecha, setFecha] = useState("");
  const [nombre, setNombre] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [creandoFiltro, setCreandoFiltro] = useState(false);
  const textoRef = useRef<HTMLTextAreaElement>(null);

  const filtro = filtros.find((f) => f.id === filtroId) || null;
  const negocio = session?.negocioName || "Bookmy";

  /* Con un solo filtro guardado, se elige solo */
  useEffect(() => {
    if (filtroId == null && filtros.length === 1) setFiltroId(filtros[0].id);
  }, [filtros, filtroId]);

  const usarPlantilla = (id: string) => {
    setPlantilla(id);
    setMensaje(t(`marketing.plantilla_${id}_texto`));
    setAsunto(t(`marketing.plantilla_${id}_asunto`));
    if (!nombre.trim()) setNombre(t(`marketing.plantilla_${id}`));
  };

  const insertarVariable = (v: string) => {
    const el = textoRef.current;
    const marca = `{{${v}}}`;
    if (!el) { setMensaje((m) => m + marca); return; }
    const ini = el.selectionStart ?? mensaje.length;
    const fin = el.selectionEnd ?? mensaje.length;
    const nuevo = mensaje.slice(0, ini) + marca + mensaje.slice(fin);
    setMensaje(nuevo.slice(0, 1000));
    requestAnimationFrame(() => { el.focus(); el.setSelectionRange(ini + marca.length, ini + marca.length); });
  };

  const vistaPrevia = (texto: string) =>
    texto
      .replace(/\{\{\s*nombre\s*\}\}/g, "Ana")
      .replace(/\{\{\s*negocio\s*\}\}/g, negocio)
      .replace(/\{\{\s*enlace_reserva\s*\}\}/g, "https://bookmy.es");

  const destinatarios = filtro ? (canal === "EMAIL" ? filtro.conEmail : filtro.conTelefono) : 0;

  /* ¿Se puede pasar al siguiente paso? */
  const faltaEnPaso = (p: number): string | null => {
    if (p === 1 && !filtro) return t("marketing.faltaFiltro");
    if (p === 2) {
      if (canal === "WHATSAPP" && !waDisponible) return t("marketing.waNoDisponible");
      if (canal === "EMAIL" && !asunto.trim()) return t("marketing.faltaAsunto");
      if (mensaje.trim().length < 5) return t("marketing.faltaMensaje");
    }
    if (p === 3 && cuando === "programar") {
      if (!fecha) return t("marketing.faltaFecha");
      if (new Date(fecha).getTime() < Date.now() + 60_000) return t("marketing.fechaPasada");
    }
    return null;
  };

  const siguiente = () => {
    const falta = faltaEnPaso(paso);
    if (falta) { toast(falta, "error"); return; }
    setPaso((p) => Math.min(4, p + 1));
  };

  const guardar = async (borrador: boolean) => {
    for (const p of [1, 2, 3]) {
      const falta = faltaEnPaso(p);
      if (falta && !(borrador && p === 2 && canal === "WHATSAPP")) { toast(falta, "error"); setPaso(p); return; }
    }
    if (!nombre.trim() || nombre.trim().length < 2) { toast(t("marketing.faltaNombreCampana"), "error"); return; }
    if (!borrador && destinatarios === 0) { toast(t("marketing.sinDestinatarios"), "error"); return; }
    setEnviando(true);
    try {
      await MarketingApi.crearCampana({
        ...(empresaId && { empresaId }),
        filtroId: filtro!.id,
        nombre: nombre.trim(),
        canal,
        ...(canal === "EMAIL" && { asunto: asunto.trim() }),
        mensaje: mensaje.trim(),
        ...(cuando === "programar" && fecha && { programadaPara: new Date(fecha).toISOString() }),
        ...(borrador && { borrador: true }),
      });
      toast(
        t(borrador ? "marketing.borradorGuardado" : cuando === "programar" ? "marketing.programadaOk" : "marketing.enviandose"),
        "success"
      );
      await onCreada();
    } catch (e) {
      toast(e instanceof Error ? e.message : t("common.error"), "error");
    } finally {
      setEnviando(false);
    }
  };

  const PASOS = [t("marketing.pasoAudiencia"), t("marketing.pasoMensaje"), t("marketing.pasoProgramacion"), t("marketing.pasoResumen")];

  return (
    <div className={styles.layout}>
      <Panel>
        <PanelHead title={t("marketing.nuevaCampana")} sub={t("marketing.nuevaCampanaSub")} />

        <ol className={styles.pasos} aria-label={t("marketing.pasos")}>
          {PASOS.map((p, i) => {
            const n = i + 1;
            const cls = n < paso ? styles.pasoHecho : n === paso ? styles.pasoActual : "";
            return (
              <li key={p} className={`${styles.paso} ${cls}`} aria-current={n === paso ? "step" : undefined}>
                <span className={styles.pasoNum}>{n < paso ? <Icon name="check" /> : n}</span>
                {p}
              </li>
            );
          })}
        </ol>

        {/* 1 · Audiencia */}
        {paso === 1 && (
          <div>
            <h3 className={styles.bloqueTitulo}>{t("marketing.eligeFiltro")}</h3>
            <p className={styles.bloqueSub}>{t("marketing.eligeFiltroSub")}</p>
            {filtros.length === 0 ? (
              <EmptyState icon="users" title={t("marketing.filtrosVacio")} message={t("marketing.creaUnFiltro")} />
            ) : (
              <div className={styles.opciones} style={{ maxWidth: "none" }}>
                {filtros.map((f) => (
                  <label key={f.id} className={`${styles.opcion} ${filtroId === f.id ? styles.opcionOn : ""}`}>
                    <input type="radio" name="filtro" checked={filtroId === f.id} onChange={() => setFiltroId(f.id)} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <b>{f.nombre}</b>
                      <span>{resumenCriterios(f.criterios || {}, t, locale, sedes).join(" · ")}</span>
                    </div>
                    <span style={{ fontWeight: 800, color: "var(--teal-700)" }}>
                      {t("marketing.nContactos", { n: f.total })}
                    </span>
                  </label>
                ))}
              </div>
            )}
            <div style={{ marginTop: 12 }}>
              <Button size="sm" variant="ghost" onClick={() => setCreandoFiltro(true)}>
                <Icon name="plus" /> {t("marketing.crearFiltro")}
              </Button>
            </div>
          </div>
        )}

        {/* 2 · Mensaje */}
        {paso === 2 && (
          <div>
            <h3 className={styles.bloqueTitulo}>{t("marketing.canalTitulo")}</h3>
            <p className={styles.bloqueSub}>{t("marketing.canalSub")}</p>
            <div className={styles.canales}>
              <button
                type="button"
                className={`${styles.canal} ${canal === "WHATSAPP" ? styles.canalOn : ""}`}
                onClick={() => setCanal("WHATSAPP")}
                disabled={!waDisponible}
                aria-pressed={canal === "WHATSAPP"}
              >
                <span className={`${styles.canalIcono} ${styles.canalWa}`}><Icon name="message" /></span>
                <span className={styles.canalTexto}>
                  <b>WhatsApp</b>
                  <span>{waDisponible ? t("marketing.waSub") : t("marketing.waNoDisponible")}</span>
                </span>
                <span className={styles.radio} />
              </button>
              <button
                type="button"
                className={`${styles.canal} ${canal === "EMAIL" ? styles.canalOn : ""}`}
                onClick={() => setCanal("EMAIL")}
                aria-pressed={canal === "EMAIL"}
              >
                <span className={`${styles.canalIcono} ${styles.canalMail}`}><Icon name="mail" /></span>
                <span className={styles.canalTexto}>
                  <b>{t("common.email")}</b>
                  <span>{t("marketing.mailSub")}</span>
                </span>
                <span className={styles.radio} />
              </button>
            </div>

            <div className={styles.mensajeGrid}>
              <div>
                <Field label={t("marketing.plantilla")} htmlFor="mc-plantilla">
                  <select id="mc-plantilla" className={styles.select} value={plantilla} onChange={(e) => e.target.value && usarPlantilla(e.target.value)}>
                    <option value="">{t("marketing.plantillaElige")}</option>
                    {PLANTILLAS.map((p) => <option key={p.id} value={p.id}>{t(`marketing.plantilla_${p.id}`)}</option>)}
                  </select>
                </Field>
                {canal === "EMAIL" && (
                  <Field label={t("marketing.asunto")} htmlFor="mc-asunto">
                    <input id="mc-asunto" className={styles.input} value={asunto} maxLength={200} onChange={(e) => setAsunto(e.target.value)} />
                  </Field>
                )}
                <Field label={canal === "WHATSAPP" ? t("marketing.mensajeWa") : t("marketing.mensajeMail")} htmlFor="mc-mensaje">
                  <textarea
                    id="mc-mensaje"
                    ref={textoRef}
                    className={styles.textarea}
                    value={mensaje}
                    maxLength={1000}
                    placeholder={t("marketing.mensajePh")}
                    onChange={(e) => setMensaje(e.target.value)}
                  />
                </Field>
                <div className={styles.variables}>
                  {t("marketing.variables")}:
                  {VARIABLES.map((v) => (
                    <button key={v} type="button" className={styles.variable} onClick={() => insertarVariable(v)}>{`{{${v}}}`}</button>
                  ))}
                  <span className={styles.contador}>{mensaje.length} / 1000</span>
                </div>
              </div>

              <div>
                <span className={styles.seccionTitulo}>{t("marketing.vistaPrevia")}</span>
                {canal === "WHATSAPP" ? (
                  <div className={styles.wa}>
                    <div className={styles.waCab}>
                      <span className={styles.waAvatar}>{negocio.charAt(0).toUpperCase()}</span>
                      {negocio}
                    </div>
                    <div className={styles.waCuerpo}>
                      <div className={styles.waBurbuja}>
                        {vistaPrevia(mensaje) || t("marketing.mensajePh")}
                        <span className={styles.waHora}>10:24 ✓✓</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className={styles.mail}>
                    <div className={styles.mailCab}>
                      {negocio}
                      <b>{vistaPrevia(asunto) || t("marketing.asunto")}</b>
                    </div>
                    <div className={styles.mailCuerpo}>{vistaPrevia(mensaje) || t("marketing.mensajePh")}</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 3 · Programación */}
        {paso === 3 && (
          <div>
            <h3 className={styles.bloqueTitulo}>{t("marketing.cuandoTitulo")}</h3>
            <p className={styles.bloqueSub}>{t("marketing.cuandoSub")}</p>
            <div className={styles.opciones}>
              <label className={`${styles.opcion} ${cuando === "ahora" ? styles.opcionOn : ""}`}>
                <input type="radio" name="cuando" checked={cuando === "ahora"} onChange={() => setCuando("ahora")} />
                <div><b>{t("marketing.enviarAhora")}</b><span>{t("marketing.enviarAhoraSub")}</span></div>
              </label>
              <label className={`${styles.opcion} ${cuando === "programar" ? styles.opcionOn : ""}`}>
                <input type="radio" name="cuando" checked={cuando === "programar"} onChange={() => setCuando("programar")} />
                <div><b>{t("marketing.programar")}</b><span>{t("marketing.programarSub")}</span></div>
              </label>
              {cuando === "programar" && (
                <Field label={t("marketing.fechaHora")} htmlFor="mc-fecha">
                  <input id="mc-fecha" className={styles.input} type="datetime-local" value={fecha} onChange={(e) => setFecha(e.target.value)} />
                </Field>
              )}
            </div>
          </div>
        )}

        {/* 4 · Resumen */}
        {paso === 4 && (
          <div>
            <Field label={t("marketing.nombreCampana")} htmlFor="mc-nombre">
              <input id="mc-nombre" className={styles.input} value={nombre} maxLength={120}
                placeholder={t("marketing.nombreCampanaPh")} onChange={(e) => setNombre(e.target.value)} />
            </Field>
            <dl className={styles.resumen}>
              <dt>{t("marketing.pasoAudiencia")}</dt>
              <dd>{filtro?.nombre} · {t("marketing.nContactos", { n: destinatarios })}</dd>
              <dt>{t("marketing.canal")}</dt>
              <dd>{canal === "WHATSAPP" ? "WhatsApp" : t("common.email")}</dd>
              {canal === "EMAIL" && (<><dt>{t("marketing.asunto")}</dt><dd>{asunto}</dd></>)}
              <dt>{t("marketing.pasoProgramacion")}</dt>
              <dd>{cuando === "ahora" ? t("marketing.enviarAhora") : fmtFechaHora(fecha ? new Date(fecha).toISOString() : null, locale)}</dd>
            </dl>
            {destinatarios === 0 && <p className={styles.aviso}>{t("marketing.sinDestinatarios")}</p>}
          </div>
        )}

        <div className={styles.pie}>
          <Button variant="ghost" onClick={() => (paso === 1 ? onCancelar() : setPaso(paso - 1))} disabled={enviando}>
            ← {paso === 1 ? t("common.cancel") : t("marketing.volver")}
          </Button>
          <span className={styles.espacio} />
          {paso >= 2 && (
            <Button variant="ghost" onClick={() => void guardar(true)} disabled={enviando}>
              <Icon name="fileText" /> {t("marketing.guardarBorrador")}
            </Button>
          )}
          {paso < 4 ? (
            <Button onClick={siguiente}>
              {t("marketing.continuar", { paso: PASOS[paso] })} →
            </Button>
          ) : (
            <Button onClick={() => void guardar(false)} disabled={enviando || destinatarios === 0}>
              <Icon name="send" /> {enviando ? t("marketing.enviando") : cuando === "programar" ? t("marketing.programarCampana") : t("marketing.enviarCampana")}
            </Button>
          )}
        </div>
      </Panel>

      {/* Laterales: audiencia y plantillas */}
      <div className={styles.lateral}>
        <section className={styles.lado}>
          <h3 className={styles.ladoTitulo}><Icon name="users" /> {t("marketing.audienciaTitulo")}</h3>
          <p className={styles.ladoTexto}>{t("marketing.audienciaSub")}</p>
          <select className={styles.select} value={filtroId ?? ""} onChange={(e) => setFiltroId(e.target.value ? Number(e.target.value) : null)}>
            <option value="">{t("marketing.eligeFiltro")}</option>
            {filtros.map((f) => <option key={f.id} value={f.id}>{f.nombre}</option>)}
          </select>
          {filtro && (
            <>
              <div className={styles.filtroNota}>{resumenCriterios(filtro.criterios || {}, t, locale, sedes).join(" · ")}</div>
              <div className={styles.audiencia}>
                <div><b>{filtro.total}</b><span><Icon name="users" /> {t("marketing.contactos")}</span></div>
                <div><b>{filtro.conTelefono}</b><span><Icon name="message" /> WhatsApp</span></div>
                <div><b>{filtro.conEmail}</b><span><Icon name="mail" /> {t("common.email")}</span></div>
              </div>
            </>
          )}
          {onIrAFiltros && (
            <Button size="sm" variant="ghost" onClick={onIrAFiltros} style={{ marginTop: 10 }}>
              {t("marketing.verFiltros")} →
            </Button>
          )}
        </section>

        <section className={styles.lado}>
          <h3 className={styles.ladoTitulo}><Icon name="fileText" /> {t("marketing.plantillasTitulo")}</h3>
          <div className={styles.plantillas}>
            {PLANTILLAS.map((p) => (
              <div key={p.id} className={`${styles.plantilla} ${plantilla === p.id ? styles.plantillaOn : ""}`}>
                <Icon name={p.icono} />
                <span>{t(`marketing.plantilla_${p.id}`)}</span>
                <Button size="sm" variant="ghost" onClick={() => { usarPlantilla(p.id); if (paso < 2 && filtro) setPaso(2); }}>
                  {t("marketing.usar")}
                </Button>
              </div>
            ))}
          </div>
        </section>
      </div>

      <FiltroBuilder
        abierto={creandoFiltro}
        filtro={null}
        empresaId={empresaId}
        sedes={sedes}
        servicios={servicios}
        onClose={() => setCreandoFiltro(false)}
        onGuardado={async (f) => { setCreandoFiltro(false); await recargarFiltros(); setFiltroId(f.id); }}
      />
    </div>
  );
}
