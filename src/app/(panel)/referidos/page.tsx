"use client";
/* ============================================================
   Referidos — "Invita y gana"
   ------------------------------------------------------------
   Dos vistas en la misma ruta, según el rol:
   · Dueño del negocio: su código y enlace para invitar, sus
     puntos, a quién invitó y el historial de puntos.
   · Superadmin: resumen del programa, ranking de los negocios que
     más invitan, últimos referidos, canje/ajuste de puntos y
     anulación de referidos sospechosos.

   Los puntos se ganan cuando el negocio invitado paga su PRIMER
   mes de Pro (no al registrarse): así no se premian cuentas falsas.
============================================================ */
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ROUTES } from "@/constants";
import { ReferidosApi } from "@/api/modules";
import type { ApiEstadoReferido, ApiReferidosAdmin, ApiReferidosMio } from "@/api/types";
import { ApiError } from "@/api/http";
import { useData } from "@/hooks/useData";
import { useSession } from "@/context/SessionContext";
import { useUi } from "@/context/UiContext";
import { useI18n } from "@/i18n";
import Panel, { PanelHead } from "@/components/ui/Panel";
import DataTable from "@/components/ui/DataTable";
import StatCard, { StatGrid } from "@/components/ui/StatCard";
import Badge, { Tag } from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import Icon from "@/components/ui/Icon";
import Modal, { ModalTitle, ModalText, ModalActions, Field } from "@/components/ui/Modal";
import styles from "./referidos.module.css";

const KIND: Record<ApiEstadoReferido, "pendiente" | "activo" | "cancelado"> = {
  PENDIENTE: "pendiente",
  RECOMPENSADO: "activo",
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

export default function ReferidosPage() {
  const router = useRouter();
  const { session } = useSession();
  const rol = session?.role;

  /* Solo el dueño (owner) y el superadmin; el resto vuelve al inicio. */
  useEffect(() => {
    if (rol && rol !== "owner" && rol !== "superadmin") router.replace(ROUTES.dashboard);
  }, [rol, router]);

  if (rol === "superadmin") return <ReferidosAdmin />;
  if (rol === "owner") return <ReferidosNegocio />;
  return null;
}

/* ── Vista del dueño ──────────────────────────────────────── */
function ReferidosNegocio() {
  const { t, locale } = useI18n();
  const { toast } = useUi();
  const { data, loading, error } = useData(() => ReferidosApi.mio(), [], null as ApiReferidosMio | null);
  const [copiado, setCopiado] = useState<"codigo" | "enlace" | null>(null);

  /* El enlace apunta a la web pública (crear cuenta), que vive en el
     mismo dominio que el panel. */
  const enlace = useMemo(() => {
    if (!data || typeof window === "undefined") return "";
    return `${window.location.origin}/crear-cuenta?ref=${encodeURIComponent(data.codigo)}`;
  }, [data]);

  const copiar = async (texto: string, que: "codigo" | "enlace") => {
    try {
      await navigator.clipboard.writeText(texto);
      setCopiado(que);
      setTimeout(() => setCopiado(null), 1800);
    } catch {
      toast(texto, "default");
    }
  };

  if (!data) {
    return (
      <Panel>
        <EmptyState icon="tag" title={loading ? t("common.loading") : t("referidos.miTitulo")} message={loading ? undefined : error || undefined} />
      </Panel>
    );
  }

  return (
    <>
      <div className={styles.hero}>
        <Panel className={styles.heroPanel}>
          <PanelHead title={t("referidos.miTitulo")} sub={t("referidos.miSub")} />
          <div className={styles.codigoFila}>
            <div className={styles.codigoCaja}>
              <span className={styles.codigoLabel}>{t("referidos.tuCodigo")}</span>
              <span className={styles.codigo}>{data.codigo}</span>
            </div>
            <Button variant="ghost" onClick={() => void copiar(data.codigo, "codigo")}>
              {copiado === "codigo" ? t("referidos.copiado") : t("referidos.copiar")}
            </Button>
          </div>
          <label className={styles.enlaceLabel} htmlFor="ref-enlace">{t("referidos.tuEnlace")}</label>
          <div className={styles.enlaceFila}>
            <input id="ref-enlace" readOnly value={enlace} onFocus={(e) => e.currentTarget.select()} />
            <Button onClick={() => void copiar(enlace, "enlace")}>
              {copiado === "enlace" ? t("referidos.copiado") : t("referidos.copiar")}
            </Button>
          </div>
        </Panel>

        <Panel className={styles.saldoPanel}>
          <span className={styles.saldoLabel}>{t("referidos.saldo")}</span>
          <span className={styles.saldo}>{data.saldo.toLocaleString(locale === "en" ? "en-GB" : "es-ES")}</span>
          <h3 className={styles.comoTitulo}>{t("referidos.comoFunciona")}</h3>
          <ol className={styles.pasos}>
            <li>{t("referidos.paso1")}</li>
            <li>{t("referidos.paso2")}</li>
            <li>{t("referidos.paso3", { puntos: String(data.puntosPorReferido), bienvenida: String(data.puntosBienvenida) })}</li>
          </ol>
          <p className={styles.canje}>{t("referidos.canje")}</p>
        </Panel>
      </div>

      <div className={styles.dosCol}>
        <Panel>
          <PanelHead title={t("referidos.invitados")} sub={String(data.referidos.length)} />
          {data.referidos.length === 0 ? (
            <EmptyState icon="users" title={t("referidos.sinInvitados")} />
          ) : (
            <DataTable headers={[t("referidos.colEmpresa"), t("referidos.colEstado"), t("referidos.colPuntos"), t("referidos.colFecha")]}>
              {data.referidos.map((r) => (
                <tr key={r.id}>
                  <td><b>{r.empresa}</b></td>
                  <td><Badge kind={KIND[r.estado]}>{t(`referidos.estados.${r.estado}`)}</Badge></td>
                  <td>{r.puntos ? `+${r.puntos}` : "—"}</td>
                  <td>{fmtFecha(r.createdAt, locale)}</td>
                </tr>
              ))}
            </DataTable>
          )}
        </Panel>

        <Panel>
          <PanelHead title={t("referidos.movimientos")} />
          {data.movimientos.length === 0 ? (
            <EmptyState icon="tag" title={t("referidos.sinMovimientos")} />
          ) : (
            <ul className={styles.movimientos}>
              {data.movimientos.map((m) => (
                <li key={m.id}>
                  <span className={styles.movTexto}>
                    <b>{m.motivo}</b>
                    <span>{fmtFecha(m.createdAt, locale)}</span>
                  </span>
                  <span className={m.puntos > 0 ? styles.mas : styles.menos}>
                    {m.puntos > 0 ? `+${m.puntos}` : m.puntos}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </>
  );
}

/* ── Vista del superadmin ─────────────────────────────────── */
function ReferidosAdmin() {
  const { t, locale } = useI18n();
  const { toast, confirm } = useUi();
  const { data, loading, reload } = useData(() => ReferidosApi.admin(), [], null as ApiReferidosAdmin | null);

  const [ajusteDe, setAjusteDe] = useState<{ empresaId: number; empresa: string; saldo: number } | null>(null);
  const [puntos, setPuntos] = useState("");
  const [motivo, setMotivo] = useState("");
  const [guardando, setGuardando] = useState(false);

  const guardarAjuste = async () => {
    if (!ajusteDe) return;
    const n = Number(puntos);
    if (!Number.isInteger(n) || n === 0 || !motivo.trim()) {
      toast(t("common.error"), "error");
      return;
    }
    setGuardando(true);
    try {
      await ReferidosApi.movimiento(ajusteDe.empresaId, n, motivo.trim());
      toast(t("referidos.ajusteHecho"), "success");
      setAjusteDe(null);
      await reload();
    } catch (e) {
      toast(e instanceof ApiError ? e.message : t("common.error"), "error");
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
          toast(e instanceof ApiError ? e.message : t("common.error"), "error");
        }
      },
    });

  const resumen = data?.resumen ?? { codigos: 0, referidos: 0, recompensados: 0, puntosEmitidos: 0, puntosCanjeados: 0 };

  return (
    <>
      <StatGrid>
        <StatCard color="blue" icon={<Icon name="tag" />} label={t("referidos.statCodigos")} count={resumen.codigos} />
        <StatCard color="purple" icon={<Icon name="users" />} label={t("referidos.statReferidos")} count={resumen.referidos} />
        <StatCard color="teal" icon={<Icon name="star" />} label={t("referidos.statRecompensados")} count={resumen.recompensados} />
        <StatCard
          color="amber"
          icon={<Icon name="wallet" />}
          label={t("referidos.statPuntos")}
          count={resumen.puntosEmitidos}
          footer={t("referidos.statCanjeados", { n: String(resumen.puntosCanjeados) })}
        />
      </StatGrid>

      <Panel>
        <PanelHead title={t("referidos.ranking")} />
        {!loading && (data?.ranking.length ?? 0) === 0 ? (
          <EmptyState icon="tag" title={t("referidos.vacio")} />
        ) : (
          <DataTable
            headers={[
              t("referidos.colEmpresa"),
              t("referidos.colCodigo"),
              t("referidos.colReferidos"),
              t("referidos.colRecompensados"),
              t("referidos.colSaldo"),
              "",
            ]}
          >
            {(data?.ranking ?? []).map((r) => (
              <tr key={r.empresaId}>
                <td><b>{r.empresa}</b></td>
                <td><Tag>{r.codigo}</Tag></td>
                <td>{r.referidos}</td>
                <td>{r.recompensados}</td>
                <td><b>{r.saldo}</b></td>
                <td>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => { setPuntos(""); setMotivo(""); setAjusteDe({ empresaId: r.empresaId, empresa: r.empresa, saldo: r.saldo }); }}
                  >
                    {t("referidos.ajustar")}
                  </Button>
                </td>
              </tr>
            ))}
          </DataTable>
        )}
      </Panel>

      <Panel className={styles.seccion}>
        <PanelHead title={t("referidos.ultimos")} sub={String(data?.referidos.length ?? 0)} />
        {!loading && (data?.referidos.length ?? 0) === 0 ? (
          <EmptyState icon="users" title={t("referidos.vacio")} />
        ) : (
          <DataTable
            headers={[
              t("referidos.colInvita"),
              t("referidos.colInvitado"),
              t("referidos.colCodigo"),
              t("referidos.colEstado"),
              t("referidos.colPuntos"),
              t("referidos.colFecha"),
              "",
            ]}
          >
            {(data?.referidos ?? []).map((r) => (
              <tr key={r.id}>
                <td><b>{r.referidor.nombre}</b></td>
                <td>{r.referida.nombre}</td>
                <td><Tag>{r.codigo}</Tag></td>
                <td><Badge kind={KIND[r.estado]}>{t(`referidos.estados.${r.estado}`)}</Badge></td>
                <td>{r.estado === "RECOMPENSADO" ? `+${r.puntosReferidor} / +${r.puntosReferida}` : "—"}</td>
                <td>{fmtFecha(r.createdAt, locale)}</td>
                <td>
                  {r.estado === "PENDIENTE" && (
                    <Button size="sm" variant="dangerGhost" onClick={() => anular(r)}>{t("referidos.anular")}</Button>
                  )}
                </td>
              </tr>
            ))}
          </DataTable>
        )}
      </Panel>

      <Modal open={!!ajusteDe} onClose={() => { if (!guardando) setAjusteDe(null); }} maxWidth={480}>
        <ModalTitle>{t("referidos.ajusteTitulo", { empresa: ajusteDe?.empresa ?? "" })}</ModalTitle>
        <ModalText>{t("referidos.ajusteTexto", { saldo: String(ajusteDe?.saldo ?? 0) })}</ModalText>
        <Field label={t("referidos.ajustePuntos")} htmlFor="ref-puntos">
          <input id="ref-puntos" type="number" step="1" value={puntos} onChange={(e) => setPuntos(e.target.value)} placeholder="-100" />
        </Field>
        <Field label={t("referidos.ajusteMotivo")} htmlFor="ref-motivo">
          <input id="ref-motivo" value={motivo} onChange={(e) => setMotivo(e.target.value)} maxLength={200} placeholder={t("referidos.ajusteMotivoPh")} />
        </Field>
        <ModalActions>
          <Button variant="ghost" onClick={() => setAjusteDe(null)} disabled={guardando}>{t("common.cancel")}</Button>
          <Button onClick={() => void guardarAjuste()} disabled={guardando}>
            {guardando ? t("common.saving") : t("referidos.ajusteGuardar")}
          </Button>
        </ModalActions>
      </Modal>
    </>
  );
}
