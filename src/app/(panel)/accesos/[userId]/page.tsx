"use client";
/* ============================================================
   Seguimiento y Control · ficha de un usuario
   ------------------------------------------------------------
   EXCLUSIVO DE SUPERADMIN. Todo lo que la auditoría de login sabe
   de UNA persona: desde dónde entra (IP, ciudad, región, país),
   con qué dispositivos y su historial completo de intentos.

   Los agregados (ubicaciones, dispositivos) se calculan en el
   navegador sobre sus accesos más recientes: GET /auth/accesos
   pagina a 100 como máximo y no tiene un resumen por usuario, así
   que se leen hasta MAX_PAGINAS páginas y, si hay más, se avisa de
   que el resumen cubre solo esa parte. El historial de abajo sí
   pagina en el backend y llega hasta el primer acceso.

   Ubicación = la que geoip-lite deduce de la IP: aproximada (a
   nivel de ciudad) y sin coordenadas, porque el backend no las
   guarda.
============================================================ */
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ROUTES, initials } from "@/constants";
import { AuthApi, ClientsApi } from "@/api/modules";
import type { ApiAccesoUsuario, ApiAccesosPage } from "@/api/types";
import { useData } from "@/hooks/useData";
import { useSession } from "@/context/SessionContext";
import { useI18n } from "@/i18n";
import Panel, { PanelHead } from "@/components/ui/Panel";
import DataTable from "@/components/ui/DataTable";
import StatCard, { StatGrid } from "@/components/ui/StatCard";
import Badge, { Tag } from "@/components/ui/Badge";
import EmptyState from "@/components/ui/EmptyState";
import Icon from "@/components/ui/Icon";
import type { PaginationProps } from "@/components/ui/Pagination";
import { bandera, dispositivo, fmtFechaHora, nombrePais } from "@/components/accesos/formato";
import styles from "../accesos.module.css";

const LIMIT_HISTORIAL = 20;
const POR_PAGINA_RESUMEN = 100;
const MAX_PAGINAS = 5;

const PAGINA_VACIA: ApiAccesosPage = {
  items: [],
  pagination: { page: 1, limit: LIMIT_HISTORIAL, total: 0, totalPages: 1 },
};

interface Agrupado {
  clave: string;
  veces: number;
  fallidos: number;
  ultimo: string;
  ips: Set<string>;
  muestra: ApiAccesoUsuario;
}

/** Agrupa los accesos por una clave (ubicación o dispositivo). Los
    accesos llegan del más reciente al más antiguo, así que el primero
    de cada grupo es su última vez. */
function agrupar(rows: ApiAccesoUsuario[], clave: (r: ApiAccesoUsuario) => string): Agrupado[] {
  const mapa = new Map<string, Agrupado>();
  for (const r of rows) {
    const k = clave(r);
    const g = mapa.get(k);
    if (!g) {
      mapa.set(k, { clave: k, veces: 1, fallidos: r.exito ? 0 : 1, ultimo: r.createdAt, ips: new Set([r.ipAddress]), muestra: r });
    } else {
      g.veces += 1;
      if (!r.exito) g.fallidos += 1;
      g.ips.add(r.ipAddress);
    }
  }
  return [...mapa.values()].sort((a, b) => b.veces - a.veces);
}

/** Lee las páginas más recientes de un usuario para el resumen. */
async function accesosRecientes(userId: number) {
  const primera = await AuthApi.accesos.list({ userId, page: 1, limit: POR_PAGINA_RESUMEN });
  const paginas = Math.min(primera.pagination.totalPages, MAX_PAGINAS);
  const resto = await Promise.all(
    Array.from({ length: paginas - 1 }, (_, i) =>
      AuthApi.accesos.list({ userId, page: i + 2, limit: POR_PAGINA_RESUMEN }).catch(() => PAGINA_VACIA)
    )
  );
  return {
    items: [primera, ...resto].flatMap((p) => p.items),
    total: primera.pagination.total,
  };
}

export default function SeguimientoUsuarioPage() {
  const router = useRouter();
  const params = useParams<{ userId: string }>();
  const userId = Number(params.userId);
  const { session } = useSession();
  const { t, locale } = useI18n();

  useEffect(() => {
    if (session && session.role !== "superadmin") router.replace(ROUTES.dashboard);
  }, [session, router]);

  const valido = Number.isInteger(userId) && userId > 0;

  const { data: reciente, loading } = useData(
    () => (valido ? accesosRecientes(userId) : Promise.resolve({ items: [], total: 0 })),
    [userId],
    { items: [] as ApiAccesoUsuario[], total: 0 }
  );

  const [page, setPage] = useState(1);
  const { data: historial } = useData(
    () => (valido ? AuthApi.accesos.list({ userId, page, limit: LIMIT_HISTORIAL }) : Promise.resolve(PAGINA_VACIA)),
    [userId, page],
    PAGINA_VACIA
  );

  /* La auditoría trae correo y rol; si es un cliente final, su ficha
     añade nombre y teléfono. Para otros roles /clients responde 404 y
     se queda con lo de la auditoría. */
  const rol = reciente.items[0]?.user?.role;
  const { data: cliente } = useData(
    () => (valido && rol === "CLIENT" ? ClientsApi.findOne(userId).catch(() => null) : Promise.resolve(null)),
    [userId, rol],
    null
  );

  const items = reciente.items;
  const email = items[0]?.user?.email ?? items[0]?.email ?? "";
  const nombre = cliente?.userData?.name || email || t("accesos.usuarioSinNombre");
  const ultimo = items[0];
  const ultimoExitoso = items.find((r) => r.exito);
  const fallidos = items.filter((r) => !r.exito).length;
  const truncado = reciente.total > items.length;

  const ubicaciones = useMemo(
    () => agrupar(items, (r) => [r.pais ?? "", r.region ?? "", r.ciudad ?? ""].join("|")),
    [items]
  );
  const dispositivos = useMemo(() => agrupar(items, (r) => dispositivo(r)), [items]);

  /* Señal simple de riesgo: varios fallos en las últimas 24 h */
  const fallos24h = useMemo(() => {
    const limite = Date.now() - 24 * 3600 * 1000;
    return items.filter((r) => !r.exito && new Date(r.createdAt).getTime() >= limite).length;
  }, [items]);

  const paginacion: PaginationProps = useMemo(() => {
    const p = historial.pagination;
    return {
      pagina: p.page,
      totalPaginas: p.totalPages,
      total: p.total,
      desde: p.total === 0 ? 0 : (p.page - 1) * p.limit + 1,
      hasta: Math.min(p.page * p.limit, p.total),
      irA: (n: number) => setPage(Math.min(Math.max(n, 1), p.totalPages)),
    };
  }, [historial]);

  if (session && session.role !== "superadmin") return null;

  const textoUbicacion = (r: ApiAccesoUsuario) =>
    [r.ciudad, r.region, nombrePais(r.pais, locale)].filter(Boolean).join(", ") || t("accesos.ubicacionDesconocida");

  return (
    <>
      <Link href={ROUTES.accesos} className={styles.volver}>← {t("accesos.volver")}</Link>

      {/* Identidad + última actividad */}
      <Panel className={styles.ficha}>
        <div className={styles.identidad}>
          <span className={styles.avatar}>{initials(nombre)}</span>
          <div className={styles.identidadTexto}>
            <h2>{nombre}</h2>
            <span className={styles.meta}>
              {email && <span>{email}</span>}
              {cliente?.userData?.phone && <span>{cliente.userData.phone}</span>}
              {rol && <Tag>{rol}</Tag>}
              <span>#{userId}</span>
            </span>
          </div>
          {fallos24h >= 3 && (
            <span className={styles.alerta} role="status">
              <Icon name="shield" /> {t("accesos.alertaFallos", { n: fallos24h })}
            </span>
          )}
        </div>

        {ultimo && (
          <dl className={styles.ultimo}>
            <div><dt>{t("accesos.ultimoIntento")}</dt><dd>{fmtFechaHora(ultimo.createdAt, locale)}</dd></div>
            <div><dt>{t("accesos.ultimoExitoso")}</dt><dd>{ultimoExitoso ? fmtFechaHora(ultimoExitoso.createdAt, locale) : "—"}</dd></div>
            <div><dt>{t("accesos.colIp")}</dt><dd className={styles.mono}>{ultimo.ipAddress}</dd></div>
            <div>
              <dt>{t("accesos.colUbicacion")}</dt>
              <dd>{bandera(ultimo.pais) && <span aria-hidden>{bandera(ultimo.pais)} </span>}{textoUbicacion(ultimo)}</dd>
            </div>
            <div><dt>{t("accesos.colDispositivo")}</dt><dd>{dispositivo(ultimo)}</dd></div>
          </dl>
        )}
      </Panel>

      <StatGrid>
        <StatCard color="blue" icon={<Icon name="list" />} label={t("accesos.statTotal")} count={reciente.total} footer={t("accesos.desdeSiempre")} />
        <StatCard color="red" icon={<Icon name="x" />} label={t("accesos.statFallidos")} count={fallidos} footer={truncado ? t("accesos.ultimosN", { n: items.length }) : t("accesos.desdeSiempre")} />
        <StatCard color="purple" icon={<Icon name="mapPin" />} label={t("accesos.statUbicaciones")} count={ubicaciones.length} footer={truncado ? t("accesos.ultimosN", { n: items.length }) : t("accesos.desdeSiempre")} />
        <StatCard color="teal" icon={<Icon name="layout" />} label={t("accesos.statDispositivos")} count={dispositivos.length} footer={truncado ? t("accesos.ultimosN", { n: items.length }) : t("accesos.desdeSiempre")} />
      </StatGrid>

      {!loading && items.length === 0 ? (
        <Panel>
          <EmptyState icon="shield" title={t("accesos.usuarioSinAccesos")} message={t("accesos.usuarioSinAccesosMsg")} />
        </Panel>
      ) : (
        <>
          <div className={styles.dosCol}>
            <Panel>
              <PanelHead title={t("accesos.ubicacionesTitle")} sub={t("accesos.ubicacionesSub")} />
              <ul className={styles.lista}>
                {ubicaciones.map((g) => (
                  <li key={g.clave}>
                    <span className={styles.listaIcono} aria-hidden>{bandera(g.muestra.pais) || "🌐"}</span>
                    <div className={styles.listaTexto}>
                      <b>{textoUbicacion(g.muestra)}</b>
                      <span className={styles.mono}>{[...g.ips].slice(0, 3).join(" · ")}{g.ips.size > 3 ? ` +${g.ips.size - 3}` : ""}</span>
                      <span>{t("accesos.ultimaVez", { fecha: fmtFechaHora(g.ultimo, locale) })}</span>
                    </div>
                    <div className={styles.listaCifras}>
                      <b>{g.veces}</b>
                      {g.fallidos > 0 && <span className={styles.fallos}>{t("accesos.nFallidos", { n: g.fallidos })}</span>}
                    </div>
                  </li>
                ))}
              </ul>
            </Panel>

            <Panel>
              <PanelHead title={t("accesos.dispositivosTitle")} sub={t("accesos.dispositivosSub")} />
              <ul className={styles.lista}>
                {dispositivos.map((g) => (
                  <li key={g.clave}>
                    <span className={styles.listaIcono} aria-hidden>
                      {g.muestra.dispositivo === "mobile" ? "📱" : g.muestra.dispositivo === "tablet" ? "📲" : "💻"}
                    </span>
                    <div className={styles.listaTexto}>
                      <b>{g.clave}</b>
                      <span>{t("accesos.ultimaVez", { fecha: fmtFechaHora(g.ultimo, locale) })}</span>
                    </div>
                    <div className={styles.listaCifras}>
                      <b>{g.veces}</b>
                      {g.fallidos > 0 && <span className={styles.fallos}>{t("accesos.nFallidos", { n: g.fallidos })}</span>}
                    </div>
                  </li>
                ))}
              </ul>
            </Panel>
          </div>

          <Panel>
            <PanelHead title={t("accesos.historialTitle")} sub={t("accesos.panelSub", { n: historial.pagination.total })} />
            <DataTable
              paginacion={paginacion}
              resetKey={`${userId}|${page}`}
              headers={[
                t("accesos.colFecha"),
                t("accesos.colEstado"),
                t("accesos.colMotivo"),
                t("accesos.colIp"),
                t("accesos.colUbicacion"),
                t("accesos.colDispositivo"),
              ]}
            >
              {historial.items.map((row) => (
                <tr key={row.id}>
                  <td>{fmtFechaHora(row.createdAt, locale)}</td>
                  <td>
                    <Badge kind={row.exito ? "activo" : "cancelado"}>
                      {row.exito ? t("accesos.exito") : t("accesos.fallido")}
                    </Badge>
                  </td>
                  <td>{row.motivoFallo ? t(`accesos.motivo.${row.motivoFallo}`) : "—"}</td>
                  <td className={styles.mono}>{row.ipAddress}</td>
                  <td>{bandera(row.pais) && <span aria-hidden>{bandera(row.pais)} </span>}{textoUbicacion(row)}</td>
                  <td>{dispositivo(row)}</td>
                </tr>
              ))}
            </DataTable>
          </Panel>
        </>
      )}
    </>
  );
}
