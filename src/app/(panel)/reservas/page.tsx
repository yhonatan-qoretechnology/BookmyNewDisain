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
import { usePaginacion } from "@/hooks/usePaginacion";
import { useUi } from "@/context/UiContext";
import { useReservaPopup } from "@/components/reservas/ReservaPopupContext";
import Panel, { PanelHead, SelectPill } from "@/components/ui/Panel";
import Toolbar, { SearchBox, ToolbarActions } from "@/components/ui/Toolbar";
import DataTable, { PriceCell } from "@/components/ui/DataTable";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import { PersonRow } from "@/components/ui/People";
import ExtensionTag from "@/components/reservas/ExtensionTag";
import type { Reserva } from "@/models";
import EditarReservaModal from "@/components/reservas/EditarReservaModal";
import ExtenderCitaModal from "@/components/reservas/ExtenderCitaModal";
import styles from "./reservas.module.css";

function ReservasContent() {
  const params = useSearchParams();
  const router = useRouter();
  const { session } = useSession();
  const { t, locale } = useI18n();
  const popup = useReservaPopup();

  const { toast } = useUi();

  const [search, setSearch] = useState("");
  const [estadoIdx, setEstadoIdx] = useState(0);
  /* Filtros del listado: día, servicio, especialista y hora de inicio */
  const [fFecha, setFFecha] = useState("");
  const [fServicio, setFServicio] = useState("");
  const [fEmpleado, setFEmpleado] = useState("");
  const [fHora, setFHora] = useState("");
  /* id de la reserva cuyo estado se está guardando (bloquea su selector) */
  const [guardando, setGuardando] = useState<string | null>(null);
  /* Reserva abierta en el modal de edición (horario / detalles). */
  const [editando, setEditando] = useState<Reserva | null>(null);
  const [extendiendo, setExtendiendo] = useState<Reserva | null>(null);
  const estado = ESTADOS_RESERVA[estadoIdx];

  /* Enlaces históricos "?nueva=1" → asistente de creación */
  useEffect(() => {
    if (params.get("nueva") === "1") router.replace(ROUTES.reservaNueva);
  }, [params, router]);

  /* Listado según el rol (aislamiento multi-tenant) */
  const { data: base, reload } = useData(
    () => ReservasController.getForSession(session, locale),
    [session?.id, session?.negocioId, session?.sedeId, locale],
    []
  );

  /* Al volver del asistente, abre el detalle de la reserva creada */
  const creada = params.get("creada");
  useEffect(() => {
    if (creada && base.some((r) => r.id === creada)) popup.open(creada, reload);
  }, [creada, base, popup, reload]);

  /* Opciones de los filtros: salen de las propias reservas, así solo se
     ofrece lo que de verdad hay en el listado. */
  const opciones = useMemo(() => {
    const ordenar = (xs: Iterable<string>) => Array.from(new Set(xs)).filter(Boolean).sort((a, b) => a.localeCompare(b));
    return {
      servicios: ordenar(base.map((r) => r.servicio)),
      empleados: ordenar(base.map((r) => r.empleadoName || "")),
      horas: ordenar(base.map((r) => r.hora.slice(0, 2))),
    };
  }, [base]);

  const hayFiltros = !!(search || estadoIdx || fFecha || fServicio || fEmpleado || fHora);
  const limpiarFiltros = () => {
    setSearch(""); setEstadoIdx(0);
    setFFecha(""); setFServicio(""); setFEmpleado(""); setFHora("");
  };

  const lista = useMemo(() => {
    const q = search.toLowerCase();
    return base.filter((r) => {
      const matchQ = [r.servicio, r.cliente, r.id, r.email, r.empleadoName || ""].join(" ").toLowerCase().includes(q);
      const matchE = estado === "todos" || r.estado === estado;
      return matchQ && matchE
        && (!fFecha || r.fecha === fFecha)
        && (!fServicio || r.servicio === fServicio)
        && (!fEmpleado || r.empleadoName === fEmpleado)
        && (!fHora || r.hora.startsWith(fHora));
    });
  }, [base, search, estado, fFecha, fServicio, fEmpleado, fHora]);

  const claveFiltros = `${search}|${estado}|${fFecha}|${fServicio}|${fEmpleado}|${fHora}`;

  /* El listado ya no se corta en 50 por sede, así que una sede activa puede
     traer cientos de citas: se pagina igual que Facturación. */
  const pagina = usePaginacion(lista, {
    porPagina: 15,
    resetKey: claveFiltros,
  });

  const cambiarEstado = async (reserva: Reserva, nuevo: Reserva["estado"]) => {
    if (nuevo === reserva.estado) return;
    setGuardando(reserva.id);
    try {
      await ReservasController.cambiarEstado(reserva, nuevo);
      await reload();
      toast(t("reservas.estadoCambiado", { estado: t(`estados.${nuevo}`) }), "success");
    } catch (e) {
      toast(e instanceof Error ? e.message : t("reservas.estadoError"), "error");
    } finally {
      setGuardando(null);
    }
  };

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

      <div className={styles.filtros} role="group" aria-label={t("reservas.filtros")}>
        <label className={styles.filtro}>
          <span>{t("common.date")}</span>
          <input type="date" value={fFecha} onChange={(e) => setFFecha(e.target.value)} />
        </label>
        <label className={styles.filtro}>
          <span>{t("common.service")}</span>
          <select value={fServicio} onChange={(e) => setFServicio(e.target.value)}>
            <option value="">{t("common.all")}</option>
            {opciones.servicios.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </label>
        <label className={styles.filtro}>
          <span>{t("reservas.especialista")}</span>
          <select value={fEmpleado} onChange={(e) => setFEmpleado(e.target.value)}>
            <option value="">{t("common.all")}</option>
            {opciones.empleados.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </label>
        <label className={styles.filtro}>
          <span>{t("common.time")}</span>
          <select value={fHora} onChange={(e) => setFHora(e.target.value)}>
            <option value="">{t("common.all")}</option>
            {opciones.horas.map((h) => <option key={h} value={h}>{h}:00 – {h}:59</option>)}
          </select>
        </label>
        <Button size="sm" variant="ghost" onClick={limpiarFiltros} disabled={!hayFiltros}>
          {t("reservas.limpiarFiltros")}
        </Button>
      </div>

      {lista.length === 0 ? (
        <EmptyState icon="calendar" title={t("reservas.emptyTitle")} message={t("reservas.emptyMsg")} />
      ) : (
        <DataTable
          paginacion={pagina}
          resetKey={`${claveFiltros}|${pagina.pagina}`}
          headers={[t("common.id"), t("common.service"), t("common.client"), t("reservas.especialista"), t("common.date"), t("common.time"), t("common.price"), t("common.state"), t("common.actions")]}
        >
          {pagina.visibles.map((r) => (
            <tr key={r.id} onClick={() => popup.open(r, reload)} style={{ cursor: "pointer" }}>
              <td><b>{r.id}</b></td>
              <td>{r.servicio}<ExtensionTag reserva={r} /></td>
              <td><PersonRow name={r.cliente} photo={r.clienteFoto} /></td>
              <td>{r.empleadoName || "—"}</td>
              <td>{fmtFechaCorta(r.fecha)}</td>
              <td>{r.hora}</td>
              <PriceCell value={r.precio} />
              <td><Badge kind={r.estado}>{t(`estados.${r.estado}`)}</Badge></td>
              {/* stopPropagation: la fila entera abre el detalle, y sin esto
                  desplegar el selector abriría también el popup. */}
              <td onClick={(e) => e.stopPropagation()}>
                <div className={styles.accionesCell}>
                <select
                  className={styles.estadoSelect}
                  value={r.estado}
                  disabled={guardando === r.id}
                  aria-label={t("reservas.cambiarEstado")}
                  title={t("reservas.cambiarEstado")}
                  onChange={(e) => void cambiarEstado(r, e.target.value as Reserva["estado"])}
                >
                  {ESTADOS_RESERVA.filter((e) => e !== "todos").map((e) => (
                    <option key={e} value={e}>{t(`estados.${e}`)}</option>
                  ))}
                </select>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setEditando(r)}
                  disabled={guardando === r.id}
                >
                  {t("reservas.editar")}
                </Button>
                </div>
              </td>
            </tr>
          ))}
        </DataTable>
      )}

      <EditarReservaModal
        reserva={editando}
        onClose={() => setEditando(null)}
        onActualizada={(r) => { setEditando(r); void reload(); }}
        onExtender={(r) => { setEditando(null); setExtendiendo(r); }}
      />
      <ExtenderCitaModal
        reserva={extendiendo}
        onClose={() => setExtendiendo(null)}
        onCambios={() => void reload()}
      />
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
