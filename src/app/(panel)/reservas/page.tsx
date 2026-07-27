"use client";
/* ============================================================
   Reservas — listado de citas (AppointmentModule)
   La creación vive en el flujo /reservas/nueva (sede → cliente
   → profesional → servicio → fecha → hora → confirmación).
   "?nueva=1" redirige a ese flujo.
============================================================ */
import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ESTADOS_RESERVA, ROUTES, fmtFechaCorta } from "@/constants";
import { ReservasController } from "@/controllers/ReservasController";
import { useSession } from "@/context/SessionContext";
import { useI18n } from "@/i18n";
import { useData } from "@/hooks/useData";
import { useReservaPopup } from "@/components/reservas/ReservaPopupContext";
import Panel, { PanelHead, SelectPill } from "@/components/ui/Panel";
import Toolbar, { SearchBox, ToolbarActions } from "@/components/ui/Toolbar";
import DataTable, { PriceCell } from "@/components/ui/DataTable";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import { PersonRow } from "@/components/ui/People";

function ReservasContent() {
  const params = useSearchParams();
  const router = useRouter();
  const { session } = useSession();
  const { t, locale } = useI18n();
  const popup = useReservaPopup();

  const [search, setSearch] = useState("");
  const [estadoIdx, setEstadoIdx] = useState(0);
  const estado = ESTADOS_RESERVA[estadoIdx];

  /* Enlaces históricos "?nueva=1" → asistente de creación */
  useEffect(() => {
    if (params.get("nueva") === "1") router.replace(ROUTES.reservaNueva);
  }, [params, router]);

  /* Listado según el rol (aislamiento multi-tenant) */
  const { data: base } = useData(
    () => ReservasController.getForSession(session, locale),
    [session?.id, session?.negocioId, session?.sedeId, locale],
    []
  );

  /* Al volver del asistente, abre el detalle de la reserva creada */
  const creada = params.get("creada");
  useEffect(() => {
    if (creada && base.some((r) => r.id === creada)) popup.open(creada);
  }, [creada, base, popup]);

  const lista = useMemo(() => {
    const q = search.toLowerCase();
    return base.filter((r) => {
      const matchQ = (r.servicio + r.cliente + r.id).toLowerCase().includes(q);
      const matchE = estado === "todos" || r.estado === estado;
      return matchQ && matchE;
    });
  }, [base, search, estado]);

  return (
    <Panel>
      <PanelHead
        title={t("reservas.panelTitle")}
        sub={
          session?.role === "admin"
            ? t("reservas.subBranch", { sede: session.sedeName || "" })
            : t("reservas.subAll", { negocio: session?.negocioName || "—" })
        }
      />
      <Toolbar>
        <SearchBox value={search} onChange={setSearch} placeholder={t("reservas.searchPlaceholder")} />
        <ToolbarActions>
          <SelectPill onClick={() => setEstadoIdx((i) => (i + 1) % ESTADOS_RESERVA.length)}>
            {t("reservas.stateFilter", { estado: estado === "todos" ? t("common.all") : t(`estados.${estado}`) })}
          </SelectPill>
          {/* "Agregar Nueva Reserva" → asistente secuencial */}
          <Button onClick={() => router.push(ROUTES.reservaNueva)}>{t("reservas.new")}</Button>
        </ToolbarActions>
      </Toolbar>

      {lista.length === 0 ? (
        <EmptyState icon="calendar" title={t("reservas.emptyTitle")} message={t("reservas.emptyMsg")} />
      ) : (
        <DataTable headers={[t("common.id"), t("common.service"), t("common.client"), t("common.date"), t("common.time"), t("common.price"), t("common.state")]}>
          {lista.map((r) => (
            <tr key={r.id} onClick={() => popup.open(r)} style={{ cursor: "pointer" }}>
              <td><b>{r.id}</b></td>
              <td>{r.servicio}</td>
              <td><PersonRow name={r.cliente} /></td>
              <td>{fmtFechaCorta(r.fecha)}</td>
              <td>{r.hora}</td>
              <PriceCell value={r.precio} />
              <td><Badge kind={r.estado}>{t(`estados.${r.estado}`)}</Badge></td>
            </tr>
          ))}
        </DataTable>
      )}
    </Panel>
  );
}

export default function ReservasPage() {
  return (
    <Suspense fallback={null}>
      <ReservasContent />
    </Suspense>
  );
}
