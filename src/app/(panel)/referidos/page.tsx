"use client";
/* ============================================================
   Referidos 2.0
   ------------------------------------------------------------
   Dueño del negocio, dos programas:
   · «Invita negocios»: su enlace y código, lo que ha ganado
     (meses de Pro gratis), niveles, embudo, invitar por correo o
     WhatsApp y a quién invitó. Gana cuando el invitado paga su
     primer mes de Pro.
   · «Programa para tus clientes»: lo activa y elige premios; ve
     referidos y cupones, registra a un invitado y canjea cupones
     (componente ProgramaClientes).
   Superadmin: embudo global, ranking con nivel, regalar meses y
   anular referidos sospechosos.
============================================================ */
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ROUTES, fotoUrl, initials } from "@/constants";
import { ReferidosApi } from "@/api/modules";
import type { ApiEstadoReferido, ApiNivelReferido, ApiReferidosAdmin, ApiReferidosMio } from "@/api/types";
import { useData } from "@/hooks/useData";
import { useSession } from "@/context/SessionContext";
import { useUi } from "@/context/UiContext";
import { useI18n } from "@/i18n";
import Panel, { PanelHead } from "@/components/ui/Panel";
import Tabs from "@/components/ui/Tabs";
import DataTable from "@/components/ui/DataTable";
import StatCard, { StatGrid } from "@/components/ui/StatCard";
import Badge, { Tag } from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import Icon, { WhatsAppIcon } from "@/components/ui/Icon";
import { SkTable } from "@/components/ui/Skeleton";
import Modal, { ModalTitle, ModalText, ModalActions, Field } from "@/components/ui/Modal";
import ProgramaClientes from "@/components/referidos/ProgramaClientes";
import styles from "./referidos.module.css";

const KIND: Record<ApiEstadoReferido, "pendiente" | "activo" | "cancelado"> = {
  PENDIENTE: "pendiente",
  RECOMPENSADO: "activo",
  ANULADO: "cancelado",
};
const ICONO_NIVEL: Record<ApiNivelReferido, "star" | "crown" | "shield"> = {
  BRONCE: "shield",
  PLATA: "star",
  ORO: "crown",
  DIAMANTE: "crown",
};

function fmtFecha(iso: string | null, locale: string) {
  if (!iso) return "—";
  try {
    return new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "es-ES", { dateStyle: "medium" }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export default function ReferidosPage() {
  const router = useRouter();
  const { session } = useSession();
  const rol = session?.role;

  useEffect(() => {
    if (rol && rol !== "owner" && rol !== "superadmin") router.replace(ROUTES.dashboard);
  }, [rol, router]);

  if (rol === "superadmin") return <ReferidosAdmin />;
  if (rol === "owner") return <ReferidosDueno />;
  return null;
}

/* ── Dueño: dos programas ─────────────────────────────────── */
function ReferidosDueno() {
  const { t } = useI18n();
  const [tab, setTab] = useState<"negocios" | "clientes">("negocios");
  return (
    <>
      <Tabs
        tabs={[
          { id: "negocios", label: t("referidos.tabNegocios") },
          { id: "clientes", label: t("referidos.tabClientes") },
        ]}
        active={tab}
        onChange={(id) => setTab(id as "negocios" | "clientes")}
      />
      <div className={styles.contenido}>
        {tab === "negocios" ? <InvitaNegocios /> : <ProgramaClientes />}
      </div>
    </>
  );
}

function InvitaNegocios() {
  const { t, locale } = useI18n();
  const { toast } = useUi();
  const { data, loading, error, reload } = useData(() => ReferidosApi.mio(), [], null as ApiReferidosMio | null);
  const [copiado, setCopiado] = useState<"codigo" | "enlace" | null>(null);
  const [emails, setEmails] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [enviando, setEnviando] = useState(false);

  const copiar = async (texto: string, que: "codigo" | "enlace") => {
    try {
      await navigator.clipboard.writeText(texto);
      setCopiado(que);
      setTimeout(() => setCopiado(null), 1800);
    } catch {
      toast(t("referidos.copiarError"), "error");
    }
  };

  if (loading && !data) return <Panel><SkTable cols={4} rows={4} person={-1} /></Panel>;
  if (!data) return <Panel><EmptyState icon="tag" title={t("referidos.errorCarga")} message={error || undefined} /></Panel>;

  const textoCompartir = t("referidos.textoCompartir", { codigo: data.codigo, meses: data.recompensa.mesesBienvenida, enlace: data.enlace });
  const waHref = `https://wa.me/?text=${encodeURIComponent(textoCompartir)}`;
  const mailHref = `mailto:?subject=${encodeURIComponent(t("referidos.asuntoCompartir", { empresa: data.empresa }))}&body=${encodeURIComponent(textoCompartir)}`;

  const compartirNativo = async () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      try { await navigator.share({ title: "Bookmy", text: textoCompartir, url: data.enlace }); } catch { /* cancelado */ }
    } else {
      void copiar(data.enlace, "enlace");
    }
  };

  const invitar = async () => {
    const lista = emails.split(/[\s,;]+/).map((e) => e.trim()).filter(Boolean);
    if (lista.length === 0) { toast(t("referidos.faltanCorreos"), "error"); return; }
    if (lista.length > 10) { toast(t("referidos.maxCorreos"), "error"); return; }
    setEnviando(true);
    try {
      const r = await ReferidosApi.invitar(lista, mensaje);
      toast(t("referidos.invitacionesEnviadas", { n: r.enviados }), "success");
      if (r.fallidos.length) toast(t("referidos.invitacionesFallidas", { lista: r.fallidos.join(", ") }), "error");
      setEmails("");
      await reload();
    } catch (e) {
      toast(e instanceof Error ? e.message : t("common.error"), "error");
    } finally {
      setEnviando(false);
    }
  };

  const { embudo, nivel, meses } = data;
  const maxNivel = data.niveles[data.niveles.length - 1]?.min || 1;
  const pct = nivel.siguiente
    ? Math.round(((nivel.siguiente.min - nivel.faltan) / nivel.siguiente.min) * 100)
    : 100;
  const conv = (a: number, b: number) => (b ? `${Math.round((a / b) * 100)} %` : "—");

  return (
    <>
      {/* Héroe */}
      <section className={styles.hero}>
        <div style={{ position: "relative", zIndex: 1 }}>
          <span className={styles.heroEtiqueta}><Icon name="star" /> {t("referidos.heroEtiqueta")}</span>
          <h2 className={styles.heroTitulo}>
            {t("referidos.heroTitulo", { meses: data.recompensa.meses })}
          </h2>
          <p className={styles.heroTexto}>
            {t("referidos.heroTexto", { meses: data.recompensa.meses, bienvenida: data.recompensa.mesesBienvenida })}
          </p>
          <div className={styles.heroGanado}>
            <div><b>{meses.ganados}</b><span>{t("referidos.mesesGanados")}</span></div>
            <div><b>{embudo.recompensados}</b><span>{t("referidos.negociosQuePagaron")}</span></div>
            <div><b>{nivel.actual ? t(`referidos.nivel_${nivel.actual.id}`) : "—"}</b><span>{t("referidos.tuNivel")}</span></div>
          </div>
        </div>

        <div className={styles.compartir}>
          <span className={styles.compartirLabel}>{t("referidos.tuCodigo")}</span>
          <div className={styles.codigoGrande}>
            <b>{data.codigo}</b>
            <Button size="sm" variant="ghost" onClick={() => void copiar(data.codigo, "codigo")}>
              <Icon name={copiado === "codigo" ? "check" : "paperclip"} /> {copiado === "codigo" ? t("referidos.copiado") : t("referidos.copiar")}
            </Button>
          </div>
          <span className={styles.compartirLabel}>{t("referidos.tuEnlace")}</span>
          <div className={styles.enlace}>
            <input readOnly value={data.enlace} onFocus={(e) => e.currentTarget.select()} aria-label={t("referidos.tuEnlace")} />
            <Button size="sm" onClick={() => void copiar(data.enlace, "enlace")}>
              {copiado === "enlace" ? t("referidos.copiado") : t("referidos.copiar")}
            </Button>
          </div>
          <div className={styles.botonesCompartir}>
            <a className={`${styles.btnRed} ${styles.btnWa}`} href={waHref} target="_blank" rel="noopener noreferrer">
              <WhatsAppIcon /> WhatsApp
            </a>
            <a className={styles.btnRed} href={mailHref}><Icon name="mail" /> {t("common.email")}</a>
            <button type="button" className={styles.btnRed} onClick={() => void compartirNativo()}>
              <Icon name="send" /> {t("referidos.compartir")}
            </button>
          </div>
        </div>
      </section>

      {/* Estado de los meses ganados */}
      {(meses.proGratisHasta || meses.credito > 0) && (
        <div className={styles.aviso}>
          {meses.proGratisHasta && t("referidos.proGratisHasta", { fecha: fmtFecha(meses.proGratisHasta, locale) })}
          {meses.proGratisHasta && meses.credito > 0 && " · "}
          {meses.credito > 0 && t("referidos.creditoMeses", { n: meses.credito })}
        </div>
      )}

      {/* Niveles */}
      <Panel>
        <PanelHead title={t("referidos.nivelesTitulo")} sub={t("referidos.nivelesSub")} />
        <div className={styles.niveles}>
          {data.niveles.map((n) => {
            const logrado = embudo.recompensados >= n.min;
            const actual = nivel.actual?.id === n.id;
            return (
              <div
                key={n.id}
                className={`${styles.nivel} ${logrado ? styles.nivelLogrado : styles.nivelBloqueado} ${actual ? styles.nivelActual : ""}`}
              >
                {logrado && <span className={styles.nivelCheck}><Icon name="check" /></span>}
                <span className={`${styles.nivelIcono} ${styles[n.id]}`}><Icon name={ICONO_NIVEL[n.id]} /></span>
                <b>{t(`referidos.nivel_${n.id}`)}</b>
                <span>{t("referidos.nivelRequisito", { n: n.min })}</span>
                <span>{n.bono > 0 ? t("referidos.nivelBono", { n: n.bono }) : t("referidos.nivelInsignia")}</span>
              </div>
            );
          })}
        </div>
        <div className={styles.progreso}>
          <div className={styles.progresoTexto}>
            <span>
              {nivel.siguiente
                ? t("referidos.faltanPara", { n: nivel.faltan, nivel: t(`referidos.nivel_${nivel.siguiente.id}`) })
                : t("referidos.nivelMaximo")}
            </span>
            <b>{embudo.recompensados} / {nivel.siguiente?.min ?? maxNivel}</b>
          </div>
          <div className={styles.barra} role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
            <span style={{ width: `${pct}%` }} />
          </div>
        </div>
      </Panel>

      {/* Embudo */}
      <Panel>
        <PanelHead title={t("referidos.embudoTitulo")} sub={t("referidos.embudoSub")} />
        <div className={styles.embudo}>
          <div className={styles.embudoPaso}><b>{embudo.visitas}</b><span>{t("referidos.visitas")}</span></div>
          <div className={styles.embudoPaso}>
            <b>{embudo.registrados}</b><span>{t("referidos.registrados")}</span>
            <small>{conv(embudo.registrados, embudo.visitas)}</small>
          </div>
          <div className={styles.embudoPaso}><b>{embudo.pendientes}</b><span>{t("referidos.pendientesPago")}</span></div>
          <div className={styles.embudoPaso}>
            <b>{embudo.recompensados}</b><span>{t("referidos.pagaronPro")}</span>
            <small>{conv(embudo.recompensados, embudo.registrados)}</small>
          </div>
        </div>
      </Panel>

      <div className={styles.dosCol}>
        {/* Invitados */}
        <Panel>
          <PanelHead title={t("referidos.invitados")} sub={t("referidos.invitadosSub")} />
          {data.referidos.length === 0 ? (
            <EmptyState icon="users" title={t("referidos.sinInvitados")} message={t("referidos.sinInvitadosMsg")} />
          ) : (
            <DataTable headers={[t("referidos.colEmpresa"), t("referidos.colFecha"), t("referidos.colEstado"), t("referidos.colMeses")]}>
              {data.referidos.map((r) => (
                <tr key={r.id}>
                  <td>
                    <div className={styles.fila}>
                      <span className={styles.avatar}>
                        {r.logo
                          /* eslint-disable-next-line @next/next/no-img-element */
                          ? <img src={fotoUrl(r.logo) || ""} alt="" />
                          : initials(r.empresa).slice(0, 2)}
                      </span>
                      <b>{r.empresa}</b>
                    </div>
                  </td>
                  <td>{fmtFecha(r.createdAt, locale)}</td>
                  <td><Badge kind={KIND[r.estado]}>{t(`referidos.estados.${r.estado}`)}</Badge></td>
                  <td>{r.meses > 0 ? `+${r.meses}` : "—"}</td>
                </tr>
              ))}
            </DataTable>
          )}
        </Panel>

        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          {/* Invitar por correo */}
          <Panel>
            <PanelHead title={t("referidos.invitarTitulo")} sub={t("referidos.invitarSub", { n: data.invitacionesRestantesHoy })} />
            <div className={styles.invitarForm}>
              <Field label={t("referidos.correos")} htmlFor="ref-emails">
                <textarea id="ref-emails" className={styles.textarea} value={emails} placeholder="salon@ejemplo.com, barberia@ejemplo.com"
                  onChange={(e) => setEmails(e.target.value)} />
              </Field>
              <Field label={t("referidos.mensajeOpcional")} htmlFor="ref-mensaje">
                <textarea id="ref-mensaje" className={styles.textarea} value={mensaje} maxLength={500}
                  placeholder={t("referidos.mensajePh")} onChange={(e) => setMensaje(e.target.value)} />
              </Field>
              <Button onClick={() => void invitar()} disabled={enviando || data.invitacionesRestantesHoy === 0}>
                <Icon name="send" /> {enviando ? t("referidos.enviando") : t("referidos.enviarInvitaciones")}
              </Button>
            </div>
          </Panel>

          {/* Historial de meses */}
          <Panel>
            <PanelHead title={t("referidos.historialTitulo")} />
            {data.recompensas.length === 0 ? (
              <p className={styles.ayuda}>{t("referidos.sinRecompensas")}</p>
            ) : (
              <div className={styles.historial}>
                {data.recompensas.map((r) => (
                  <div key={r.id} className={styles.hItem}>
                    <span className={styles.hMeses}>+{r.meses}</span>
                    <span className={styles.hTexto}>
                      {r.motivo}
                      <span>{fmtFecha(r.createdAt, locale)} · {t(r.aplicadaComo === "CREDITO" ? "referidos.comoCredito" : "referidos.comoProGratis")}</span>
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Panel>
        </div>
      </div>

      {/* Cómo funciona */}
      <Panel>
        <PanelHead title={t("referidos.comoFunciona")} />
        <div className={styles.pasos}>
          {[1, 2, 3].map((n) => (
            <div key={n} className={styles.pasoCard}>
              <span className={styles.pasoNum}>{n}</span>
              <div>
                <b>{t(`referidos.paso${n}Titulo`)}</b>
                <span>{t(`referidos.paso${n}`, { meses: data.recompensa.meses, bienvenida: data.recompensa.mesesBienvenida })}</span>
              </div>
            </div>
          ))}
        </div>
      </Panel>
    </>
  );
}

/* ── Superadmin ───────────────────────────────────────────── */
function ReferidosAdmin() {
  const { t, locale } = useI18n();
  const { toast, confirm } = useUi();
  const { data, loading, reload } = useData(() => ReferidosApi.admin(), [], null as ApiReferidosAdmin | null);
  const [regaloDe, setRegaloDe] = useState<{ empresaId: number; empresa: string } | null>(null);
  const [meses, setMeses] = useState("1");
  const [motivo, setMotivo] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [filtro, setFiltro] = useState<"" | ApiEstadoReferido>("");

  const referidos = useMemo(
    () => (data?.referidos || []).filter((r) => !filtro || r.estado === filtro),
    [data, filtro]
  );

  const regalar = async () => {
    if (!regaloDe) return;
    const n = Number(meses);
    if (!Number.isInteger(n) || n < 1 || n > 24) { toast(t("referidos.mesesInvalidos"), "error"); return; }
    setGuardando(true);
    try {
      await ReferidosApi.otorgarMeses(regaloDe.empresaId, n, motivo.trim() || t("referidos.regaloPorDefecto"));
      toast(t("referidos.regaloHecho"), "success");
      setRegaloDe(null); setMeses("1"); setMotivo("");
      await reload();
    } catch (e) {
      toast(e instanceof Error ? e.message : t("common.error"), "error");
    } finally {
      setGuardando(false);
    }
  };

  const anular = (r: ApiReferidosAdmin["referidos"][number]) =>
    confirm({
      title: t("referidos.anularTitulo"),
      message: t("referidos.anularMsg", { invita: r.referidor.nombre, invitado: r.referida.nombre }),
      confirmLabel: t("referidos.anular"),
      onConfirm: async () => {
        try {
          await ReferidosApi.anular(r.id);
          toast(t("referidos.anulado"), "success");
          await reload();
        } catch (e) {
          toast(e instanceof Error ? e.message : t("common.error"), "error");
        }
      },
    });

  if (loading && !data) return <Panel><SkTable cols={6} rows={6} person={-1} /></Panel>;
  if (!data) return null;
  const r = data.resumen;

  return (
    <>
      <StatGrid>
        <StatCard color="teal" icon={<Icon name="tag" />} label={t("referidos.statVisitas")} count={r.visitas}
          footer={t("referidos.statCodigos", { n: r.codigos })} />
        <StatCard color="blue" icon={<Icon name="users" />} label={t("referidos.statReferidos")} count={r.referidos}
          footer={t("referidos.statPendientes", { n: r.pendientes })} />
        <StatCard color="green" icon={<Icon name="circle-check" />} label={t("referidos.statRecompensados")} count={r.recompensados}
          footer={t("referidos.statConversion", { n: r.conversion })} />
        <StatCard color="amber" icon={<Icon name="star" />} label={t("referidos.statMeses")} count={r.mesesEntregados}
          footer={t("referidos.statConfig", { a: data.config.mesesReferidor, b: data.config.mesesBienvenida })} />
      </StatGrid>

      <Panel>
        <PanelHead title={t("referidos.ranking")} sub={t("referidos.rankingSub")} />
        {data.ranking.length === 0 ? (
          <EmptyState icon="tag" title={t("referidos.vacio")} />
        ) : (
          <DataTable headers={[
            "#", t("referidos.colEmpresa"), t("referidos.colCodigo"), t("referidos.visitas"), t("referidos.colReferidos"),
            t("referidos.pagaronPro"), t("referidos.tuNivel"), t("referidos.mesesGanados"), t("common.actions"),
          ]}>
            {data.ranking.map((x, i) => (
              <tr key={x.empresaId}>
                <td><b>{i + 1}</b></td>
                <td><b>{x.empresa}</b>{x.proGratisHasta && <span className={styles.sub}>{t("referidos.proGratisHastaCorto", { fecha: fmtFecha(x.proGratisHasta, locale) })}</span>}</td>
                <td><Tag>{x.codigo}</Tag></td>
                <td>{x.visitas}</td>
                <td>{x.referidos}</td>
                <td><b>{x.recompensados}</b></td>
                <td>{x.nivel ? t(`referidos.nivel_${x.nivel}`) : "—"}</td>
                <td>{x.mesesGanados}{x.credito > 0 && <span className={styles.sub}>{t("referidos.creditoCorto", { n: x.credito })}</span>}</td>
                <td>
                  <Button size="sm" variant="ghost" onClick={() => setRegaloDe({ empresaId: x.empresaId, empresa: x.empresa })}>
                    <Icon name="star" /> {t("referidos.regalarMeses")}
                  </Button>
                </td>
              </tr>
            ))}
          </DataTable>
        )}
      </Panel>

      <Panel>
        <PanelHead
          title={t("referidos.ultimos")}
          right={
            <select className={styles.select} style={{ width: "auto" }} value={filtro} onChange={(e) => setFiltro(e.target.value as "" | ApiEstadoReferido)}>
              <option value="">{t("referidos.todos")}</option>
              <option value="PENDIENTE">{t("referidos.estados.PENDIENTE")}</option>
              <option value="RECOMPENSADO">{t("referidos.estados.RECOMPENSADO")}</option>
              <option value="ANULADO">{t("referidos.estados.ANULADO")}</option>
            </select>
          }
        />
        {referidos.length === 0 ? (
          <EmptyState icon="users" title={t("referidos.vacio")} />
        ) : (
          <DataTable headers={[t("referidos.colInvita"), t("referidos.colInvitado"), t("referidos.colFecha"), t("referidos.colEstado"), t("referidos.colMeses"), t("common.actions")]}>
            {referidos.map((x) => (
              <tr key={x.id}>
                <td>{x.referidor.nombre}<span className={styles.sub}>{x.codigo}</span></td>
                <td>{x.referida.nombre}</td>
                <td>{fmtFecha(x.createdAt, locale)}</td>
                <td><Badge kind={KIND[x.estado]}>{t(`referidos.estados.${x.estado}`)}</Badge></td>
                <td>{x.estado === "RECOMPENSADO" ? `+${x.mesesReferidor} / +${x.mesesReferida}` : "—"}</td>
                <td>
                  {x.estado === "PENDIENTE"
                    ? <Button size="sm" variant="dangerGhost" onClick={() => anular(x)}>{t("referidos.anular")}</Button>
                    : "—"}
                </td>
              </tr>
            ))}
          </DataTable>
        )}
      </Panel>

      <Modal open={!!regaloDe} onClose={() => { if (!guardando) setRegaloDe(null); }}>
        <ModalTitle>{t("referidos.regaloTitulo", { empresa: regaloDe?.empresa || "" })}</ModalTitle>
        <ModalText>{t("referidos.regaloTexto")}</ModalText>
        <Field label={t("referidos.colMeses")} htmlFor="rg-meses">
          <input id="rg-meses" className={styles.input} type="number" min={1} max={24} value={meses} onChange={(e) => setMeses(e.target.value)} />
        </Field>
        <Field label={t("referidos.motivo")} htmlFor="rg-motivo">
          <input id="rg-motivo" className={styles.input} value={motivo} maxLength={200} placeholder={t("referidos.regaloPorDefecto")} onChange={(e) => setMotivo(e.target.value)} />
        </Field>
        <ModalActions>
          <Button variant="ghost" onClick={() => setRegaloDe(null)} disabled={guardando}>{t("common.cancel")}</Button>
          <Button onClick={() => void regalar()} disabled={guardando}>{guardando ? t("referidos.enviando") : t("referidos.regalarMeses")}</Button>
        </ModalActions>
      </Modal>
    </>
  );
}
