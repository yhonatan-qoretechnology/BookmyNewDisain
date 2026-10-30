"use client";
/* ============================================================
   Seguimiento y Control — auditoría de login (AuthModule del backend)
   ------------------------------------------------------------
   EXCLUSIVO DE SUPERADMIN: cada intento de login (correcto o no)
   queda registrado con IP, país/ciudad y dispositivo. Es de solo
   lectura — no permite bloquear ni actuar sobre un acceso.

   A diferencia del resto de listados del panel (que traen todo y
   paginan en el navegador, ver usePaginacion), este endpoint pagina
   en el backend: el estado `page` se manda tal cual en cada
   petición y los controles de <Pagination> se arman a mano con la
   paginación que devuelve el API, sin pasar por usePaginacion.
============================================================ */
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ROUTES } from "@/constants";
import { AuthApi } from "@/api/modules";
import type { ApiAccesoUsuario, ApiAccesosPage, ApiAccesosResumen } from "@/api/types";
import { useData } from "@/hooks/useData";
import { useSession } from "@/context/SessionContext";
import { useI18n } from "@/i18n";
import Panel, { PanelHead } from "@/components/ui/Panel";
import Toolbar, { SearchBox, FilterDate, FilterGroup, FilterSelect } from "@/components/ui/Toolbar";
import DataTable from "@/components/ui/DataTable";
import StatCard, { StatGrid } from "@/components/ui/StatCard";
import Badge, { Tag } from "@/components/ui/Badge";
import EmptyState from "@/components/ui/EmptyState";
import Icon from "@/components/ui/Icon";
import type { PaginationProps } from "@/components/ui/Pagination";
import Link from "next/link";
import styles from "./accesos.module.css";
import { dispositivo, fmtFechaHora, ubicacion } from "@/components/accesos/formato";

const LIMIT = 20;
const RESUMEN_DIAS = 30;

/** Estado inicial antes de la primera respuesta del API — una página vacía
    pero con la forma real de ApiAccesosPage, para no pelear con undefined. */
const PAGINA_VACIA: ApiAccesosPage = {
  items: [],
  pagination: { page: 1, limit: LIMIT, total: 0, totalPages: 1 },
};

export default function AccesosPage() {
  const router = useRouter();
  const { session } = useSession();
  const { t, locale } = useI18n();

  /* GUARD DE ROL: esta vista solo existe para superadmin */
  useEffect(() => {
    if (session && session.role !== "superadmin") router.replace(ROUTES.dashboard);
  }, [session, router]);

  const [search, setSearch] = useState("");
  const [pais, setPais] = useState("");
  const [soloFallidos, setSoloFallidos] = useState(false);
  const [fDesde, setFDesde] = useState("");
  const [fHasta, setFHasta] = useState("");
  const [page, setPage] = useState(1);

  /* Al cambiar cualquier filtro, la página 7 del resultado anterior
     casi nunca tiene sentido en el nuevo: se vuelve a la primera. */
  useEffect(() => { setPage(1); }, [search, pais, soloFallidos, fDesde, fHasta]);

  const { data: pagina, loading, error } = useData(
    () => AuthApi.accesos.list({
      page,
      limit: LIMIT,
      email: search.trim() || undefined,
      /* El código llega tal cual lo escriben (geoip-lite devuelve el país
         en ISO-3166 de dos letras, p. ej. "ES", "AR"): no hay un catálogo
         de países vistos para ofrecer como select, así que es texto libre
         y se normaliza a mayúsculas acá, no en el backend. */
      pais: pais.trim() ? pais.trim().toUpperCase() : undefined,
      soloFallidos: soloFallidos || undefined,
      desde: fDesde || undefined,
      hasta: fHasta || undefined,
    }),
    [page, search, pais, soloFallidos, fDesde, fHasta],
    PAGINA_VACIA
  );

  const { data: resumen } = useData(
    () => AuthApi.accesos.resumen(RESUMEN_DIAS),
    [],
    { dias: RESUMEN_DIAS, total: 0, fallidos: 0, exitosos: 0, paisesDistintos: 0 } as ApiAccesosResumen
  );

  /* <Pagination> espera {pagina, totalPaginas, total, desde, hasta, irA}
     (ver usePaginacion), pero acá no hay un array completo que recortar:
     se arma el mismo contrato a mano con lo que ya pagino el backend. */
  const paginacion: PaginationProps = useMemo(() => {
    const p = pagina.pagination;
    return {
      pagina: p.page,
      totalPaginas: p.totalPages,
      total: p.total,
      desde: p.total === 0 ? 0 : (p.page - 1) * p.limit + 1,
      hasta: Math.min(p.page * p.limit, p.total),
      irA: (n: number) => setPage(Math.min(Math.max(n, 1), p.totalPages)),
    };
  }, [pagina]);

  if (session && session.role !== "superadmin") return null;

  return (
    <>
      <StatGrid>
        <StatCard
          color="blue" icon={<Icon name="list" />}
          label={t("accesos.statTotal")} count={resumen.total}
          footer={t("accesos.delPeriodo", { dias: RESUMEN_DIAS })}
        />
        <StatCard
          color="green" icon={<Icon name="circle-check" />}
          label={t("accesos.statExitosos")} count={resumen.exitosos}
          footer={t("accesos.delPeriodo", { dias: RESUMEN_DIAS })}
        />
        <StatCard
          color="red" icon={<Icon name="x" />}
          label={t("accesos.statFallidos")} count={resumen.fallidos}
          footer={t("accesos.delPeriodo", { dias: RESUMEN_DIAS })}
        />
        <StatCard
          color="purple" icon={<Icon name="mapPin" />}
          label={t("accesos.statPaises")} count={resumen.paisesDistintos}
          footer={t("accesos.delPeriodo", { dias: RESUMEN_DIAS })}
        />
      </StatGrid>

      <Panel>
        <PanelHead
          title={t("accesos.panelTitle")}
          sub={t("accesos.panelSub", { n: pagina.pagination.total })}
        />

        <Toolbar>
          <FilterGroup>
            <SearchBox
              compact
              value={search}
              onChange={setSearch}
              placeholder={t("accesos.searchPlaceholder")}
            />
            {/* Texto libre en vez de un select: no hay un catálogo de países
                vistos para ofrecer como opciones (ver comentario en useData
                más arriba). */}
            <SearchBox
              compact
              value={pais}
              onChange={setPais}
              placeholder={t("accesos.filterPaisPlaceholder")}
            />
            {/* El backend solo filtra por "soloFallidos" (booleano): no hay
                un "soloExitosos" propio, así que el select es binario. */}
            <FilterSelect
              icon="shield"
              label={t("accesos.filterEstado")}
              value={soloFallidos ? "fallidos" : ""}
              onChange={(v) => setSoloFallidos(v === "fallidos")}
              options={[
                { value: "", label: t("accesos.todos") },
                { value: "fallidos", label: t("accesos.soloFallidos") },
              ]}
            />
            <FilterDate value={fDesde} onChange={setFDesde} label={t("common.date")} />
            <FilterDate value={fHasta} onChange={setFHasta} label={t("common.date")} />
          </FilterGroup>
        </Toolbar>

        {pagina.items.length === 0 ? (
          <EmptyState
            icon="shield"
            title={loading ? t("accesos.panelTitle") : t("accesos.emptyTitle")}
            message={loading ? undefined : (error || t("accesos.emptyMsg"))}
          />
        ) : (
          <DataTable
            paginacion={paginacion}
            resetKey={`${search}|${pais}|${soloFallidos}|${fDesde}|${fHasta}|${page}`}
            headers={[
              t("accesos.colFecha"),
              t("accesos.colEmail"),
              t("accesos.colRol"),
              t("accesos.colEstado"),
              t("accesos.colMotivo"),
              t("accesos.colIp"),
              t("accesos.colUbicacion"),
              t("accesos.colDispositivo"),
            ]}
          >
            {pagina.items.map((row) => (
              <tr key={row.id}>
                <td>{fmtFechaHora(row.createdAt, locale)}</td>
                {/* Con cuenta, el correo abre su ficha de seguimiento; los
                    intentos contra correos inexistentes no tienen ficha. */}
                <td>
                  {row.userId ? (
                    <Link href={`${ROUTES.accesos}/${row.userId}`} className={styles.enlaceUsuario}>
                      {row.email}
                    </Link>
                  ) : row.email}
                </td>
                {/* Tag en vez de RoleBadge: los clientes finales también
                    inician sesión por acá y CLIENT no es uno de los roles
                    que RoleBadge sabe pintar. */}
                <td>{row.user ? <Tag>{row.user.role}</Tag> : "—"}</td>
                <td>
                  <Badge kind={row.exito ? "activo" : "cancelado"}>
                    {row.exito ? t("accesos.exito") : t("accesos.fallido")}
                  </Badge>
                </td>
                <td>{row.motivoFallo ? t(`accesos.motivo.${row.motivoFallo}`) : "—"}</td>
                <td>{row.ipAddress}</td>
                <td>{ubicacion(row, locale)}</td>
                <td>{dispositivo(row)}</td>
              </tr>
            ))}
          </DataTable>
        )}
      </Panel>
    </>
  );
}
