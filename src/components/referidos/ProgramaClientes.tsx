"use client";
/* ============================================================
   ProgramaClientes — referidos de los clientes del negocio
   ------------------------------------------------------------
   · Activar el programa y elegir premios: lo que gana quien
     invita (cuando el amigo completa su primera cita) y el regalo
     del amigo (en su primera cita). % o importe fijo, vigencia y
     tope por cliente.
   · Registrar que un cliente nuevo llegó con el código de otro:
     recibe al momento su cupón de bienvenida.
   · Comprobar un cupón y ver referidos, cupones y los clientes
     que más recomiendan.
   El código de cada cliente se comparte desde Clientes (⋯).
============================================================ */
import { useEffect, useState } from "react";
import { ReferidosClientesApi } from "@/api/modules";
import type {
  ApiEstadoCupon,
  ApiEstadoReferidoCliente,
  ApiProgramaReferidosCliente,
  ApiReferidosClientes,
  ApiTipoDescuento,
  ApiValidacionCupon,
} from "@/api/types";
import type { ClienteOpcion } from "@/models";
import { NuevaFacturaController } from "@/controllers/FacturacionControllers";
import { useData } from "@/hooks/useData";
import { useRegion } from "@/context/RegionContext";
import { useUi } from "@/context/UiContext";
import { useI18n } from "@/i18n";
import Panel, { PanelHead } from "@/components/ui/Panel";
import Tabs from "@/components/ui/Tabs";
import DataTable from "@/components/ui/DataTable";
import StatCard, { StatGrid } from "@/components/ui/StatCard";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import Icon from "@/components/ui/Icon";
import { PersonRow } from "@/components/ui/People";
import { SkTable } from "@/components/ui/Skeleton";
import { Field } from "@/components/ui/Modal";
import styles from "@/app/(panel)/referidos/referidos.module.css";

const KIND_REF: Record<ApiEstadoReferidoCliente, "pendiente" | "activo" | "cancelado"> = {
  PENDIENTE: "pendiente",
  COMPLETADO: "activo",
  ANULADO: "cancelado",
};
const KIND_CUPON: Record<ApiEstadoCupon, "activo" | "atendida" | "inactivo" | "cancelado"> = {
  DISPONIBLE: "activo",
  USADO: "atendida",
  VENCIDO: "inactivo",
  ANULADO: "cancelado",
};

function fmtFecha(iso: string | null, locale: string) {
  if (!iso) return "—";
  try {
    return new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "es-ES", { dateStyle: "medium" }).format(new Date(iso));
  } catch {
    return iso;
  }
}

/** «15 %» o «10,00 €» según el tipo de descuento. */
export function useTextoPremio() {
  const { fmtMoneda } = useRegion();
  return (tipo: ApiTipoDescuento, valor: number) => (tipo === "PORCENTAJE" ? `${valor} %` : fmtMoneda(valor));
}

export default function ProgramaClientes({ empresaId }: { empresaId?: number }) {
  const { t, locale } = useI18n();
  const { toast, confirm } = useUi();
  const textoPremio = useTextoPremio();
  const { data, loading, reload } = useData(
    () => ReferidosClientesApi.resumen(empresaId),
    [empresaId],
    null as ApiReferidosClientes | null
  );
  const [form, setForm] = useState<ApiProgramaReferidosCliente | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [vista, setVista] = useState<"referidos" | "cupones" | "top">("referidos");

  useEffect(() => { if (data) setForm(data.programa); }, [data]);

  const guardar = async (cambios?: Partial<ApiProgramaReferidosCliente>) => {
    if (!form) return;
    const p = { ...form, ...cambios };
    setGuardando(true);
    try {
      await ReferidosClientesApi.guardarPrograma(p, empresaId);
      toast(t(cambios?.activo === false ? "refClientes.desactivado" : "refClientes.guardado"), "success");
      await reload();
    } catch (e) {
      toast(e instanceof Error ? e.message : t("common.error"), "error");
    } finally {
      setGuardando(false);
    }
  };

  const anular = (id: number, nombre: string) =>
    confirm({
      title: t("refClientes.anularTitulo"),
      message: t("refClientes.anularMsg", { nombre }),
      confirmLabel: t("referidos.anular"),
      onConfirm: async () => {
        try {
          await ReferidosClientesApi.anular(id, empresaId);
          toast(t("referidos.anulado"), "success");
          await reload();
        } catch (e) {
          toast(e instanceof Error ? e.message : t("common.error"), "error");
        }
      },
    });

  const revisar = async () => {
    try {
      const r = await ReferidosClientesApi.revisar(empresaId);
      toast(t("refClientes.revisados", { n: r.revisados, c: r.completados }), "success");
      await reload();
    } catch (e) {
      toast(e instanceof Error ? e.message : t("common.error"), "error");
    }
  };

  if (loading && !data) return <Panel><SkTable cols={4} rows={4} person={-1} /></Panel>;
  if (!data || !form) return null;
  const s = data.stats;
  const set = <K extends keyof ApiProgramaReferidosCliente>(k: K, v: ApiProgramaReferidosCliente[K]) =>
    setForm((f) => (f ? { ...f, [k]: v } : f));

  return (
    <>
      {/* Activar */}
      <div className={`${styles.estadoPrograma} ${data.programa.activo ? styles.estadoProgramaOn : ""}`}>
        <div>
          <b>{data.programa.activo ? t("refClientes.activoTitulo") : t("refClientes.inactivoTitulo")}</b>
          <p className={styles.ayuda} style={{ margin: "4px 0 0" }}>
            {data.programa.activo
              ? t("refClientes.activoTexto", {
                  premio: textoPremio(data.programa.tipoReferidor, data.programa.valorReferidor),
                  regalo: textoPremio(data.programa.tipoInvitado, data.programa.valorInvitado),
                })
              : t("refClientes.inactivoTexto")}
          </p>
        </div>
        <Button
          variant={data.programa.activo ? "ghost" : "primary"}
          onClick={() => void guardar({ activo: !data.programa.activo })}
          disabled={guardando}
        >
          {data.programa.activo ? t("refClientes.desactivar") : t("refClientes.activar")}
        </Button>
      </div>

      <StatGrid>
        <StatCard color="teal" icon={<Icon name="users" />} label={t("refClientes.statReferidos")} count={s.referidos}
          footer={t("refClientes.statPendientes", { n: s.pendientes })} />
        <StatCard color="green" icon={<Icon name="check" />} label={t("refClientes.statCompletados")} count={s.completados}
          footer={t("refClientes.statCompletadosSub")} />
        <StatCard color="amber" icon={<Icon name="tag" />} label={t("refClientes.statCupones")} count={s.cuponesEmitidos}
          footer={t("refClientes.statCuponesSub", { d: s.cuponesDisponibles, u: s.cuponesUsados })} />
        <StatCard color="blue" icon={<Icon name="dollar" />} label={t("refClientes.statDescuento")} value={textoPremio("MONTO", s.descuentoTotal)}
          footer={t("refClientes.statDescuentoSub")} />
      </StatGrid>

      <div className={styles.dosCol}>
        {/* Premios */}
        <Panel>
          <PanelHead title={t("refClientes.premiosTitulo")} sub={t("refClientes.premiosSub")} />
          <div className={styles.premios}>
            <div className={styles.premio}>
              <div className={styles.premioTitulo}><Icon name="star" /> {t("refClientes.premioReferidor")}</div>
              <div className={styles.premioFila}>
                <input className={styles.input} type="number" min={0.01} step="0.01" value={form.valorReferidor}
                  aria-label={t("refClientes.valor")} onChange={(e) => set("valorReferidor", Number(e.target.value))} />
                <select className={styles.select} value={form.tipoReferidor} aria-label={t("refClientes.tipo")}
                  onChange={(e) => set("tipoReferidor", e.target.value as ApiTipoDescuento)}>
                  <option value="PORCENTAJE">%</option>
                  <option value="MONTO">{t("refClientes.importe")}</option>
                </select>
              </div>
              <p className={styles.ayuda}>{t("refClientes.premioReferidorAyuda")}</p>
            </div>
            <div className={styles.premio}>
              <div className={styles.premioTitulo}><Icon name="send" /> {t("refClientes.regaloInvitado")}</div>
              <div className={styles.premioFila}>
                <input className={styles.input} type="number" min={0.01} step="0.01" value={form.valorInvitado}
                  aria-label={t("refClientes.valor")} onChange={(e) => set("valorInvitado", Number(e.target.value))} />
                <select className={styles.select} value={form.tipoInvitado} aria-label={t("refClientes.tipo")}
                  onChange={(e) => set("tipoInvitado", e.target.value as ApiTipoDescuento)}>
                  <option value="PORCENTAJE">%</option>
                  <option value="MONTO">{t("refClientes.importe")}</option>
                </select>
              </div>
              <p className={styles.ayuda}>{t("refClientes.regaloInvitadoAyuda")}</p>
            </div>
          </div>
          <div className={styles.fila3} style={{ marginTop: 14 }}>
            <Field label={t("refClientes.vigencia")} htmlFor="pc-vig" hint={t("refClientes.vigenciaAyuda")}>
              <input id="pc-vig" className={styles.input} type="number" min={0} max={730} value={form.vigenciaDias}
                onChange={(e) => set("vigenciaDias", Number(e.target.value))} />
            </Field>
            <Field label={t("refClientes.maxPorCliente")} htmlFor="pc-max" hint={t("refClientes.maxAyuda")}>
              <input id="pc-max" className={styles.input} type="number" min={0} max={1000} value={form.maxPorCliente}
                onChange={(e) => set("maxPorCliente", Number(e.target.value))} />
            </Field>
          </div>
          <Field label={t("refClientes.mensaje")} htmlFor="pc-msg" hint={t("refClientes.mensajeAyuda")}>
            <textarea id="pc-msg" className={styles.textarea} maxLength={500} value={form.mensaje || ""}
              placeholder={t("refClientes.mensajePh")} onChange={(e) => set("mensaje", e.target.value)} />
          </Field>
          <Button onClick={() => void guardar()} disabled={guardando}>
            {guardando ? t("marketing.guardando") : t("refClientes.guardar")}
          </Button>
        </Panel>

        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <RegistrarReferido empresaId={empresaId} activo={data.programa.activo} onHecho={() => void reload()} />
          <ComprobarCupon empresaId={empresaId} />
        </div>
      </div>

      {/* Listados */}
      <Panel>
        <PanelHead
          title={t("refClientes.actividad")}
          right={s.pendientes > 0 ? (
            <Button size="sm" variant="ghost" onClick={() => void revisar()}>
              <Icon name="clock" /> {t("refClientes.revisarAhora")}
            </Button>
          ) : undefined}
        />
        <div className={styles.tabsInternas}>
          <Tabs
            tabs={[
              { id: "referidos", label: t("refClientes.tabReferidos") },
              { id: "cupones", label: t("refClientes.tabCupones") },
              { id: "top", label: t("refClientes.tabTop") },
            ]}
            active={vista}
            onChange={(id) => setVista(id as typeof vista)}
          />
        </div>

        {vista === "referidos" && (data.referidos.length === 0 ? (
          <EmptyState icon="users" title={t("refClientes.sinReferidos")} message={t("refClientes.sinReferidosMsg")} />
        ) : (
          <DataTable headers={[t("refClientes.colInvita"), t("refClientes.colInvitado"), t("referidos.colFecha"), t("referidos.colEstado"), t("common.actions")]}>
            {data.referidos.map((r) => (
              <tr key={r.id}>
                <td><PersonRow name={r.referidor.nombre} photo={r.referidor.foto} /><span className={styles.sub}>{r.codigo}</span></td>
                <td><PersonRow name={r.invitado.nombre} photo={r.invitado.foto} /></td>
                <td>{fmtFecha(r.createdAt, locale)}</td>
                <td>
                  <Badge kind={KIND_REF[r.estado]}>{t(`refClientes.estados.${r.estado}`)}</Badge>
                  {r.completadoEn && <span className={styles.sub}>{fmtFecha(r.completadoEn, locale)}</span>}
                </td>
                <td>
                  {r.estado === "PENDIENTE"
                    ? <Button size="sm" variant="dangerGhost" onClick={() => anular(r.id, r.invitado.nombre)}>{t("referidos.anular")}</Button>
                    : "—"}
                </td>
              </tr>
            ))}
          </DataTable>
        ))}

        {vista === "cupones" && (data.cupones.length === 0 ? (
          <EmptyState icon="tag" title={t("refClientes.sinCupones")} />
        ) : (
          <DataTable headers={[t("refClientes.colCupon"), t("common.client"), t("refClientes.colDescuento"), t("refClientes.colMotivo"), t("referidos.colEstado"), t("refClientes.colVence")]}>
            {data.cupones.map((c) => (
              <tr key={c.id}>
                <td><span className={styles.cuponCodigo}>{c.codigo}</span></td>
                <td>{c.cliente?.nombre}</td>
                <td>
                  <b>{textoPremio(c.tipo, c.valor)}</b>
                  {c.descuento != null && <span className={styles.sub}>{t("refClientes.ahorro", { n: textoPremio("MONTO", c.descuento) })}</span>}
                </td>
                <td>{t(c.motivo === "PREMIO" ? "refClientes.motivoPremio" : "refClientes.motivoBienvenida")}</td>
                <td><Badge kind={KIND_CUPON[c.estado]}>{t(`refClientes.estadosCupon.${c.estado}`)}</Badge></td>
                <td>{c.usadoEn ? fmtFecha(c.usadoEn, locale) : fmtFecha(c.venceEn, locale)}</td>
              </tr>
            ))}
          </DataTable>
        ))}

        {vista === "top" && (data.top.length === 0 ? (
          <EmptyState icon="star" title={t("refClientes.sinTop")} />
        ) : (
          <DataTable headers={["#", t("common.client"), t("refClientes.colInvitados"), t("refClientes.statCompletados")]}>
            {data.top.map((x, i) => (
              <tr key={x.userId}>
                <td><b>{i + 1}</b></td>
                <td>{x.nombre}</td>
                <td>{x.invitados}</td>
                <td><b>{x.completados}</b></td>
              </tr>
            ))}
          </DataTable>
        ))}
      </Panel>

      <Panel>
        <PanelHead title={t("referidos.comoFunciona")} />
        <div className={styles.pasos}>
          {[1, 2, 3].map((n) => (
            <div key={n} className={styles.pasoCard}>
              <span className={styles.pasoNum}>{n}</span>
              <div>
                <b>{t(`refClientes.paso${n}Titulo`)}</b>
                <span>{t(`refClientes.paso${n}`)}</span>
              </div>
            </div>
          ))}
        </div>
      </Panel>
    </>
  );
}

/* ── Registrar un invitado ────────────────────────────────── */
function RegistrarReferido({ empresaId, activo, onHecho }: { empresaId?: number; activo: boolean; onHecho: () => void }) {
  const { t } = useI18n();
  const { toast } = useUi();
  const textoPremio = useTextoPremio();
  const [codigo, setCodigo] = useState("");
  const [validacion, setValidacion] = useState<{ quien: string | null; regalo: string } | null>(null);
  const [busqueda, setBusqueda] = useState("");
  const [opciones, setOpciones] = useState<ClienteOpcion[]>([]);
  const [invitado, setInvitado] = useState<ClienteOpcion | null>(null);
  const [guardando, setGuardando] = useState(false);

  /* El código se comprueba al escribirlo */
  useEffect(() => {
    const c = codigo.trim().toUpperCase();
    if (c.length < 5) { setValidacion(null); return; }
    let vigente = true;
    const id = setTimeout(() => {
      ReferidosClientesApi.validarCodigo(c)
        .then((r) => { if (vigente) setValidacion(r.valido ? { quien: r.quienInvita, regalo: textoPremio(r.regalo.tipo, r.regalo.valor) } : null); })
        .catch(() => { if (vigente) setValidacion(null); });
    }, 400);
    return () => { vigente = false; clearTimeout(id); };
  }, [codigo]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const q = busqueda.trim();
    if (q.length < 2 || invitado) { setOpciones([]); return; }
    let vigente = true;
    const id = setTimeout(() => {
      void NuevaFacturaController.buscarClientes(q, empresaId ? String(empresaId) : undefined)
        .then((l) => { if (vigente) setOpciones(l.slice(0, 6)); });
    }, 300);
    return () => { vigente = false; clearTimeout(id); };
  }, [busqueda, invitado, empresaId]);

  const registrar = async () => {
    if (!invitado || !codigo.trim()) return;
    setGuardando(true);
    try {
      const r = await ReferidosClientesApi.registrar(codigo.trim().toUpperCase(), Number(invitado.id), empresaId);
      toast(t("refClientes.registrado", { cupon: r.cupon.codigo }), "success");
      setCodigo(""); setInvitado(null); setBusqueda(""); setValidacion(null);
      onHecho();
    } catch (e) {
      toast(e instanceof Error ? e.message : t("common.error"), "error");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Panel>
      <PanelHead title={t("refClientes.registrarTitulo")} sub={t("refClientes.registrarSub")} />
      {!activo ? (
        <p className={styles.ayuda}>{t("refClientes.activaPrimero")}</p>
      ) : (
        <div className={styles.invitarForm}>
          <Field label={t("refClientes.codigoAmigo")} htmlFor="rr-codigo">
            <input id="rr-codigo" className={styles.input} value={codigo} maxLength={20} placeholder="ANA-7K3"
              onChange={(e) => setCodigo(e.target.value.toUpperCase())} />
          </Field>
          {validacion && (
            <div className={styles.resultadoCupon}>
              <span>{t("refClientes.codigoValido", { quien: validacion.quien || t("refClientes.unCliente"), regalo: validacion.regalo })}</span>
            </div>
          )}
          <Field label={t("refClientes.clienteNuevo")} htmlFor="rr-cliente">
            {invitado ? (
              <div className={styles.resultadoCupon} style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                <span><b>{invitado.nombre}</b> · {invitado.email}</span>
                <Button size="sm" variant="ghost" onClick={() => setInvitado(null)}>{t("common.edit")}</Button>
              </div>
            ) : (
              <>
                <input id="rr-cliente" className={styles.input} value={busqueda} placeholder={t("facturacion.nuevaClientePlaceholder")}
                  onChange={(e) => setBusqueda(e.target.value)} />
                {opciones.length > 0 && (
                  <div className={styles.historial} style={{ marginTop: 6 }}>
                    {opciones.map((o) => (
                      <button key={o.id} type="button" className={styles.hItem} style={{ cursor: "pointer", textAlign: "left", font: "inherit" }}
                        onClick={() => { setInvitado(o); setOpciones([]); }}>
                        <span className={styles.hTexto}>{o.nombre}<span>{o.email}</span></span>
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </Field>
          <Button onClick={() => void registrar()} disabled={guardando || !invitado || codigo.trim().length < 5}>
            <Icon name="check" /> {guardando ? t("marketing.guardando") : t("refClientes.registrar")}
          </Button>
        </div>
      )}
    </Panel>
  );
}

/* ── Comprobar un cupón ───────────────────────────────────── */
function ComprobarCupon({ empresaId }: { empresaId?: number }) {
  const { t, locale } = useI18n();
  const { toast } = useUi();
  const textoPremio = useTextoPremio();
  const [codigo, setCodigo] = useState("");
  const [res, setRes] = useState<ApiValidacionCupon | null>(null);
  const [buscando, setBuscando] = useState(false);

  const comprobar = async () => {
    if (!codigo.trim()) return;
    setBuscando(true);
    setRes(null);
    try {
      setRes(await ReferidosClientesApi.validarCupon(codigo.trim().toUpperCase(), undefined, empresaId));
    } catch (e) {
      toast(e instanceof Error ? e.message : t("common.error"), "error");
    } finally {
      setBuscando(false);
    }
  };

  return (
    <Panel>
      <PanelHead title={t("refClientes.comprobarTitulo")} sub={t("refClientes.comprobarSub")} />
      <div className={styles.enlace}>
        <input className={styles.input} value={codigo} placeholder="HOLA-7KX2P" maxLength={20}
          onChange={(e) => setCodigo(e.target.value.toUpperCase())}
          onKeyDown={(e) => { if (e.key === "Enter") void comprobar(); }} aria-label={t("refClientes.colCupon")} />
        <Button size="sm" onClick={() => void comprobar()} disabled={buscando}>{t("refClientes.comprobar")}</Button>
      </div>
      {res && (
        <div className={styles.resultadoCupon} style={{ marginTop: 10 }}>
          <b>{t("refClientes.cuponValido", { valor: textoPremio(res.tipo, res.valor) })}</b>
          <span>{res.cliente.nombre}{res.venceEn ? ` · ${t("refClientes.venceEl", { fecha: fmtFecha(res.venceEn, locale) })}` : ""}</span>
          <span className={styles.ayuda}>{t("refClientes.comoCanjear")}</span>
        </div>
      )}
    </Panel>
  );
}
