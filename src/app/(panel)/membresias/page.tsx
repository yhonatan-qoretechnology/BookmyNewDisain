"use client";
/* ============================================================
   Membresías — control de Bookmy CRM Pro (solo SUPER_ADMIN)
   ------------------------------------------------------------
   Quién paga mensual o anual, quién está por vencer o vencido,
   ingresos del mes y del año, ingreso recurrente (MRR), últimos
   pagos y precios de Pro / sedes extra. Se refresca solo.
============================================================ */
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ROUTES } from "@/constants";
import { MembresiaApi } from "@/api/modules";
import type { ApiMembresiasAdmin, ApiPreciosMembresia, ApiSituacionMembresia } from "@/api/types";
import { useData } from "@/hooks/useData";
import { useSession } from "@/context/SessionContext";
import { useUi } from "@/context/UiContext";
import { useI18n } from "@/i18n";
import Panel, { PanelHead } from "@/components/ui/Panel";
import StatCard, { StatGrid } from "@/components/ui/StatCard";
import DataTable from "@/components/ui/DataTable";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import Icon from "@/components/ui/Icon";
import { SkTable } from "@/components/ui/Skeleton";
import Toolbar, { SearchBox, FilterGroup, FilterSelect } from "@/components/ui/Toolbar";
import Modal, { ModalTitle, ModalText, ModalActions, Field } from "@/components/ui/Modal";

const KIND: Record<ApiSituacionMembresia, "activo" | "pendiente" | "cancelado" | "confirmada" | "inactivo" | "atendida"> = {
  AL_DIA: "activo",
  POR_VENCER: "pendiente",
  VENCIDA: "cancelado",
  MANUAL: "confirmada",
  PRUEBA: "atendida",
  REGALO: "atendida",
  FREE: "inactivo",
};

function fmtFecha(iso: string | null, locale: string) {
  if (!iso) return "—";
  try {
    return new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "es-ES", { dateStyle: "medium" }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export default function MembresiasPage() {
  const router = useRouter();
  const { session } = useSession();
  const { t, locale } = useI18n();
  const { toast } = useUi();
  const esSuper = session?.role === "superadmin";
  const { data, loading, reload } = useData(
    () => (esSuper ? MembresiaApi.admin() : Promise.resolve(null)),
    [esSuper],
    null as ApiMembresiasAdmin | null
  );
  const [q, setQ] = useState("");
  const [fSit, setFSit] = useState<"" | ApiSituacionMembresia>("");
  const [fCiclo, setFCiclo] = useState<"" | "MENSUAL" | "ANUAL">("");
  const [editando, setEditando] = useState<ApiPreciosMembresia | null>(null);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (session && !esSuper) router.replace(ROUTES.dashboard);
  }, [session, esSuper, router]);

  /* «Tiempo real»: se refresca cada minuto mientras la pantalla está abierta */
  useEffect(() => {
    if (!esSuper) return;
    const id = setInterval(() => void reload(), 60_000);
    return () => clearInterval(id);
  }, [esSuper, reload]);

  const filas = useMemo(
    () =>
      (data?.empresas || []).filter(
        (e) =>
          (!q || e.empresa.toLowerCase().includes(q.toLowerCase())) &&
          (!fSit || e.situacion === fSit) &&
          (!fCiclo || e.ciclo === fCiclo)
      ),
    [data, q, fSit, fCiclo]
  );

  const fmt = (n: number) => {
    try {
      return new Intl.NumberFormat(locale === "en" ? "en-GB" : "es-ES", { style: "currency", currency: data?.precios.moneda || "EUR" }).format(n);
    } catch {
      return `${n.toFixed(2)} €`;
    }
  };

  const guardarPrecios = async () => {
    if (!editando) return;
    setGuardando(true);
    try {
      await MembresiaApi.precios(editando);
      toast(t("membresias.preciosGuardados"), "success");
      setEditando(null);
      await reload();
    } catch (e) {
      toast(e instanceof Error ? e.message : t("common.error"), "error");
    } finally {
      setGuardando(false);
    }
  };

  if (!esSuper) return null;
  if (loading && !data) return <Panel><SkTable cols={6} rows={6} person={-1} /></Panel>;
  if (!data) return null;
  const r = data.resumen;
  const num = (v: string) => Number(v.replace(",", "."));

  return (
    <>
      <StatGrid>
        <StatCard color="teal" icon={<Icon name="crown" />} label={t("membresias.activas")} count={r.activas}
          footer={t("membresias.mensualesAnuales", { m: r.mensuales, a: r.anuales })} />
        <StatCard color="amber" icon={<Icon name="clock" />} label={t("membresias.porVencer")} count={r.porVencer}
          footer={t("membresias.vencidas", { n: r.vencidas })} />
        <StatCard color="green" icon={<Icon name="dollar" />} label={t("membresias.ingresosMes")} count={r.ingresosMes} format={fmt}
          footer={t("membresias.ingresosAnio", { n: fmt(r.ingresosAnio) })} />
        <StatCard color="blue" icon={<Icon name="barChart" />} label={t("membresias.mrr")} count={r.mrr} format={fmt}
          footer={t("membresias.enPrueba", { n: r.enPrueba })} />
      </StatGrid>

      <Panel style={{ marginTop: 20 }}>
        <PanelHead
          title={t("membresias.titulo")}
          sub={t("membresias.sub", {
            mensual: fmt(data.precios.precioMensual),
            anual: fmt(data.precios.precioAnual),
            sedes: data.precios.sedesIncluidas,
            extra: fmt(data.precios.precioSedeExtra),
          })}
          right={
            <Button size="sm" variant="ghost" onClick={() => setEditando({ ...data.precios })}>
              <Icon name="settings" /> {t("membresias.precios")}
            </Button>
          }
        />
        <Toolbar>
          <FilterGroup>
            <SearchBox compact value={q} onChange={setQ} placeholder={t("membresias.buscar")} />
            <FilterSelect
              value={fSit}
              onChange={(v) => setFSit(v as typeof fSit)}
              icon="crown"
              label={t("membresias.situacion")}
              options={[
                { value: "", label: t("membresias.todas") },
                ...(["AL_DIA", "POR_VENCER", "VENCIDA", "MANUAL", "PRUEBA", "REGALO", "FREE"] as const).map((s) => ({
                  value: s, label: t(`membresias.sit_${s}`),
                })),
              ]}
            />
            <FilterSelect
              value={fCiclo}
              onChange={(v) => setFCiclo(v as typeof fCiclo)}
              icon="calendar"
              label={t("membresias.ciclo")}
              options={[
                { value: "", label: t("membresias.cualquierCiclo") },
                { value: "MENSUAL", label: t("membresia.mensual") },
                { value: "ANUAL", label: t("membresia.anual") },
              ]}
            />
          </FilterGroup>
        </Toolbar>

        {filas.length === 0 ? (
          <EmptyState icon="crown" title={t("membresias.vacio")} />
        ) : (
          <DataTable headers={[
            t("referidos.colEmpresa"), t("membresias.situacion"), t("membresias.ciclo"),
            t("membresias.pagadoHasta"), t("membresias.dias"), t("membresias.sedes"),
          ]}>
            {filas.map((e) => (
              <tr key={e.empresaId}>
                <td><b>{e.empresa}</b></td>
                <td><Badge kind={KIND[e.situacion]}>{t(`membresias.sit_${e.situacion}`)}</Badge></td>
                <td>{e.ciclo ? t(e.ciclo === "ANUAL" ? "membresia.anual" : "membresia.mensual") : "—"}</td>
                <td>{fmtFecha(e.proPagadoHasta, locale)}</td>
                <td>{e.diasRestantes == null ? "—" : e.diasRestantes < 0 ? t("membresias.haceDias", { n: -e.diasRestantes }) : e.diasRestantes}</td>
                <td>{e.limiteSedes != null ? `${e.sedes} / ${e.limiteSedes}` : e.sedes}{e.sedesExtra > 0 && ` (+${e.sedesExtra})`}</td>
              </tr>
            ))}
          </DataTable>
        )}
      </Panel>

      <Panel style={{ marginTop: 20 }}>
        <PanelHead title={t("membresias.pagos")} sub={t("membresias.pagosSub")} />
        {data.pagos.length === 0 ? (
          <EmptyState icon="wallet" title={t("membresias.sinPagos")} />
        ) : (
          <DataTable headers={[t("referidos.colEmpresa"), t("membresias.fecha"), t("membresias.ciclo"), t("membresias.importe"), t("membresias.cubre"), t("membresias.via")]}>
            {data.pagos.map((p) => (
              <tr key={p.id}>
                <td>{p.empresa.nombre}</td>
                <td>{fmtFecha(p.pagadoEn, locale)}</td>
                <td>{t(p.ciclo === "ANUAL" ? "membresia.anual" : "membresia.mensual")}{p.sedesExtra > 0 && ` · +${p.sedesExtra} ${t("membresias.sedes").toLowerCase()}`}</td>
                <td><b>{p.cubiertoPorReferidos ? "—" : fmt(p.monto)}</b></td>
                <td>{fmtFecha(p.periodoHasta, locale)}</td>
                <td>{p.cubiertoPorReferidos ? t("membresia.porReferidos") : p.online ? "Stripe" : t("membresias.manual")}</td>
              </tr>
            ))}
          </DataTable>
        )}
      </Panel>

      <Modal open={!!editando} onClose={() => { if (!guardando) setEditando(null); }}>
        <ModalTitle>{t("membresias.precios")}</ModalTitle>
        <ModalText>{t("membresias.preciosTexto")}</ModalText>
        {editando && (
          <>
            <Field label={t("membresias.precioMensual")} htmlFor="mp-mes">
              <input id="mp-mes" type="number" min={0.01} step="0.01" value={editando.precioMensual}
                onChange={(e) => setEditando({ ...editando, precioMensual: num(e.target.value) })} />
            </Field>
            <Field label={t("membresias.precioAnual")} htmlFor="mp-anio">
              <input id="mp-anio" type="number" min={0.01} step="0.01" value={editando.precioAnual}
                onChange={(e) => setEditando({ ...editando, precioAnual: num(e.target.value) })} />
            </Field>
            <Field label={t("membresias.sedesIncluidas")} htmlFor="mp-sedes">
              <input id="mp-sedes" type="number" min={1} value={editando.sedesIncluidas}
                onChange={(e) => setEditando({ ...editando, sedesIncluidas: Math.round(num(e.target.value)) })} />
            </Field>
            <Field label={t("membresias.precioSedeExtra")} htmlFor="mp-extra">
              <input id="mp-extra" type="number" min={0} step="0.01" value={editando.precioSedeExtra}
                onChange={(e) => setEditando({ ...editando, precioSedeExtra: num(e.target.value) })} />
            </Field>
            <Field label={t("membresias.diasAviso")} htmlFor="mp-aviso">
              <input id="mp-aviso" type="number" min={1} max={60} value={editando.diasAviso}
                onChange={(e) => setEditando({ ...editando, diasAviso: Math.round(num(e.target.value)) })} />
            </Field>
          </>
        )}
        <ModalActions>
          <Button variant="ghost" onClick={() => setEditando(null)} disabled={guardando}>{t("common.cancel")}</Button>
          <Button onClick={() => void guardarPrecios()} disabled={guardando}>{guardando ? t("marketing.guardando") : t("common.save")}</Button>
        </ModalActions>
      </Modal>
    </>
  );
}
