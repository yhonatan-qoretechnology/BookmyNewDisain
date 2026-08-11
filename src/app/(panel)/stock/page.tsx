"use client";
/* ============================================================
   Stock · Insumos — control de inventario (View)
   ------------------------------------------------------------
   Dos vistas según el rol:

   · superadmin / owner → visión global del negocio
       Catálogo de insumos · Stock por sede · Solicitudes
   · admin (usuario de sede) → solo su sede
       Stock de su sede · Sus solicitudes de reposición

   El flujo de reposición es: la sede solicita → la administración
   aprueba → las unidades aprobadas entran al stock de esa sede.
============================================================ */
import { useCallback, useMemo, useState } from "react";
import type { Insumo, SolicitudInventario, StockItem } from "@/models";
import { StockController, nivelDe } from "@/controllers/StockController";
import { useData } from "@/hooks/useData";
import { useSession } from "@/context/SessionContext";
import { useUi } from "@/context/UiContext";
import { useI18n } from "@/i18n";
import Panel from "@/components/ui/Panel";
import Toolbar, { SearchBox, ToolbarActions } from "@/components/ui/Toolbar";
import Tabs from "@/components/ui/Tabs";
import DataTable, { PriceCell } from "@/components/ui/DataTable";
import Badge, { Tag } from "@/components/ui/Badge";
import Button, { IconButton } from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import Icon from "@/components/ui/Icon";
import Modal, { ModalTitle, ModalText, ModalActions, Field } from "@/components/ui/Modal";
import styles from "./stock.module.css";

/** Estado de solicitud → badge del design system */
const BADGE_SOLICITUD = {
  pendiente: "pendiente",
  aprobada: "atendida",
  rechazada: "cancelado",
} as const;

/* ── Barra de nivel de existencias ───────────────────────── */
function NivelBar({ stock, max }: { stock: number; max: number }) {
  const nivel = nivelDe(stock, max);
  const pct = max > 0 ? Math.min((stock / max) * 100, 100) : 0;
  return (
    <div className={styles.barTrack}>
      <div
        className={`${styles.barFill} ${nivel !== "ok" ? styles[nivel] : ""}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

/* ── Celda "8 / 30 ud" con aviso de nivel crítico ────────── */
function StockCell({ item, criticoLabel }: { item: StockItem; criticoLabel: string }) {
  return (
    <div className={styles.stockCell}>
      <span className={styles.stockCount}>
        {item.stock} / {item.max} {item.insumo.unidad}
      </span>
      {nivelDe(item.stock, item.max) === "critico" && (
        <Badge kind="cancelado">{criticoLabel}</Badge>
      )}
    </div>
  );
}

/* ── Tarjeta de solicitud ────────────────────────────────── */
function SolicitudCard({
  solicitud,
  nombreInsumo,
  mostrarSede,
  onAprobar,
  onRechazar,
}: {
  solicitud: SolicitudInventario;
  nombreInsumo: (id: string) => string;
  mostrarSede: boolean;
  onAprobar?: (id: string) => void;
  onRechazar?: (id: string) => void;
}) {
  const { t } = useI18n();
  const pendiente = solicitud.estado === "pendiente";
  return (
    <article className={styles.solCard}>
      <div className={styles.solHead}>
        <div>
          <h4>
            {mostrarSede ? solicitud.sedeNombre : solicitud.id}
            <Badge kind={BADGE_SOLICITUD[solicitud.estado]}>
              {t(`stock.estado.${solicitud.estado}`)}
            </Badge>
          </h4>
          <small>
            {mostrarSede
              ? t("stock.requestedBy", { nombre: solicitud.solicitanteNombre, fecha: solicitud.fecha })
              : t("stock.sentOn", { fecha: solicitud.fecha })}
          </small>
        </div>
        {mostrarSede && <b className={styles.solId}>{solicitud.id}</b>}
      </div>

      {solicitud.notas && <div className={styles.solNotes}>{solicitud.notas}</div>}

      <div className={styles.solItems}>
        {solicitud.items.map((it) => (
          <div key={it.insumoId} className={styles.solItemRow}>
            <Icon name="box" width={16} height={16} />
            <span className={styles.solItemName}>{nombreInsumo(it.insumoId)}</span>
            <span className={styles.solQty}>×{it.cantidad}</span>
          </div>
        ))}
      </div>

      {pendiente && onAprobar && onRechazar && (
        <div className={styles.solActions}>
          <Button size="sm" onClick={() => onAprobar(solicitud.id)}>
            {t("stock.approve")}
          </Button>
          <Button size="sm" variant="danger" onClick={() => onRechazar(solicitud.id)}>
            {t("stock.reject")}
          </Button>
        </div>
      )}
    </article>
  );
}

export default function StockPage() {
  const { session } = useSession();
  const { t } = useI18n();
  const { toast, confirm } = useUi();

  /* superadmin y dueño ven todas las sedes; el usuario de sede, la suya */
  const esGlobal = session?.role === "superadmin" || session?.role === "owner";

  const [tab, setTab] = useState(esGlobal ? "catalogo" : "mi-stock");
  const [buscarCatalogo, setBuscarCatalogo] = useState("");
  const [buscarStock, setBuscarStock] = useState("");

  const { data: sedes } = useData(() => StockController.getSedes(session), [session?.negocioId], []);
  const { data: catalogo, reload: reloadCatalogo } = useData(
    () => StockController.getCatalogo(buscarCatalogo),
    [buscarCatalogo],
    []
  );
  const { data: solicitudes, reload: reloadSolicitudes } = useData(
    () => (esGlobal
      ? StockController.getSolicitudes()
      : StockController.getSolicitudesPorSede(session?.sedeId || "")),
    [esGlobal, session?.sedeId],
    []
  );

  /* Existencias: todas las sedes (global) o solo la propia */
  const sedesVisibles = useMemo(
    () => (esGlobal ? sedes : sedes.filter((s) => s.id === session?.sedeId)),
    [esGlobal, sedes, session?.sedeId]
  );
  const [stockVersion, setStockVersion] = useState(0);
  const { data: stockPorSede } = useData(
    async () => {
      const filas = await Promise.all(
        sedesVisibles.map(async (s) => ({
          sede: s,
          items: await StockController.getStockSede(s.id, esGlobal ? "" : buscarStock),
        }))
      );
      return filas;
    },
    [sedesVisibles, buscarStock, esGlobal, stockVersion],
    []
  );

  const pendientes = solicitudes.filter((s) => s.estado === "pendiente").length;
  const nombreInsumo = useCallback(
    (id: string) => catalogo.find((i) => i.id === id)?.nombre || "—",
    [catalogo]
  );
  const refrescarStock = () => setStockVersion((v) => v + 1);

  /* ── Alta de insumo (catálogo global) ───────────────────── */
  const [nuevoOpen, setNuevoOpen] = useState(false);
  const [nombre, setNombre] = useState("");
  const [categoria, setCategoria] = useState("");
  const [unidad, setUnidad] = useState("");
  const [precio, setPrecio] = useState("");

  const crearInsumo = async () => {
    if (!nombre.trim() || !categoria.trim() || !unidad.trim()) {
      toast(t("stock.fillRequired"), "error");
      return;
    }
    await StockController.addInsumo({
      nombre: nombre.trim(),
      categoria: categoria.trim(),
      unidad: unidad.trim(),
      precioRef: Number(precio) || 0,
    });
    setNuevoOpen(false);
    setNombre(""); setCategoria(""); setUnidad(""); setPrecio("");
    await reloadCatalogo();
    refrescarStock();
    toast(t("stock.insumoCreated"), "success");
  };

  const eliminarInsumo = (insumo: Insumo) => {
    confirm({
      title: t("stock.deleteTitle"),
      message: t("stock.deleteMsg", { nombre: insumo.nombre }),
      confirmLabel: t("common.delete"),
      onConfirm: () => {
        void StockController.removeInsumo(insumo.id).then(() => {
          void reloadCatalogo();
          refrescarStock();
          toast(t("stock.insumoDeleted"), "success");
        });
      },
    });
  };

  /* ── Reposición directa (vista global) ──────────────────── */
  const reponer = async (sedeId: string, insumoId: string) => {
    await StockController.ajustarStock(sedeId, insumoId, 5);
    refrescarStock();
    toast(t("stock.stockUpdated"), "success");
  };

  /* ── Solicitud de inventario (usuario de sede) ──────────── */
  const [solicitarOpen, setSolicitarOpen] = useState(false);
  const [cantidades, setCantidades] = useState<Record<string, number>>({});
  const [notas, setNotas] = useState("");

  const abrirSolicitud = () => {
    setCantidades({});
    setNotas("");
    setSolicitarOpen(true);
  };

  const cambiarCantidad = (insumoId: string, delta: number) =>
    setCantidades((prev) => ({
      ...prev,
      [insumoId]: Math.max(0, (prev[insumoId] || 0) + delta),
    }));

  const enviarSolicitud = async () => {
    const items = Object.entries(cantidades).map(([insumoId, cantidad]) => ({ insumoId, cantidad }));
    try {
      await StockController.crearSolicitud(session, items, notas);
      setSolicitarOpen(false);
      await reloadSolicitudes();
      setTab("mis-sol");
      toast(t("stock.requestSent"), "success");
    } catch {
      toast(t("stock.requestEmpty"), "error");
    }
  };

  /* ── Moderación de solicitudes (vista global) ───────────── */
  const aprobar = async (id: string) => {
    await StockController.aprobarSolicitud(id);
    await reloadSolicitudes();
    refrescarStock();
    toast(t("stock.requestApproved"), "success");
  };

  const rechazar = (id: string) => {
    confirm({
      title: t("stock.rejectTitle"),
      message: t("stock.rejectMsg"),
      confirmLabel: t("stock.reject"),
      onConfirm: () => {
        void StockController.rechazarSolicitud(id).then(() => {
          void reloadSolicitudes();
          toast(t("stock.requestRejected"), "success");
        });
      },
    });
  };

  /* ── Pestañas según rol ─────────────────────────────────── */
  const tabs = esGlobal
    ? [
        { id: "catalogo", label: t("stock.tabCatalogo") },
        { id: "stock", label: t("stock.tabStock") },
        {
          id: "solicitudes",
          label: (
            <>
              {t("stock.tabSolicitudes")}
              {pendientes > 0 && <span className={styles.tabBadge}>{pendientes}</span>}
            </>
          ),
        },
      ]
    : [
        { id: "mi-stock", label: t("stock.tabMiStock", { sede: session?.sedeName || "—" }) },
        { id: "mis-sol", label: t("stock.tabMisSolicitudes") },
      ];

  /* Una sede sin asignar no puede operar sobre existencias */
  if (!esGlobal && !session?.sedeId) {
    return (
      <Panel>
        <EmptyState icon="box" title={t("stock.noBranchTitle")} message={t("stock.noBranchMsg")} />
      </Panel>
    );
  }

  return (
    <>
      <Tabs tabs={tabs} active={tab} onChange={setTab} />

      {/* ══ Catálogo global de insumos (superadmin / dueño) ══ */}
      {tab === "catalogo" && (
        <>
          <Toolbar>
            <SearchBox
              value={buscarCatalogo}
              onChange={setBuscarCatalogo}
              placeholder={t("stock.searchPlaceholder")}
            />
            <ToolbarActions>
              <Button onClick={() => setNuevoOpen(true)}>{t("stock.newInsumo")}</Button>
            </ToolbarActions>
          </Toolbar>
          <Panel>
            {catalogo.length === 0 ? (
              <EmptyState icon="box" title={t("stock.emptyCatalogTitle")} message={t("stock.emptyCatalogMsg")} />
            ) : (
              <DataTable
                headers={[
                  t("stock.product"), t("common.category"), t("stock.unit"),
                  t("stock.refPrice"), "",
                ]}
              >
                {catalogo.map((i) => (
                  <tr key={i.id}>
                    <td><b>{i.nombre}</b></td>
                    <td><Tag>{i.categoria}</Tag></td>
                    <td>{i.unidad}</td>
                    <PriceCell value={i.precioRef} />
                    <td className={styles.rowEnd}>
                      <IconButton
                        danger
                        aria-label={t("stock.deleteAria", { nombre: i.nombre })}
                        onClick={() => eliminarInsumo(i)}
                      >
                        <Icon name="trash" />
                      </IconButton>
                    </td>
                  </tr>
                ))}
              </DataTable>
            )}
          </Panel>
        </>
      )}

      {/* ══ Existencias por sede (superadmin / dueño) ══ */}
      {tab === "stock" && (
        sedesVisibles.length === 0 ? (
          <Panel>
            <EmptyState icon="mapPin" title={t("stock.noSedesTitle")} message={t("stock.noSedesMsg")} />
          </Panel>
        ) : (
          stockPorSede.map(({ sede, items }) => (
            <div key={sede.id} className={styles.sedeGroup}>
              <h3 className={styles.sedeTitle}>
                {sede.nombre}
                <Badge kind="activo">{t("stock.branchActive")}</Badge>
              </h3>
              <Panel>
                {items.length === 0 ? (
                  <EmptyState icon="box" title={t("stock.emptyStockTitle")} message={t("stock.emptyStockMsg")} />
                ) : (
                  <DataTable
                    headers={[
                      t("stock.product"), t("common.category"),
                      t("stock.stock"), t("stock.level"), "",
                    ]}
                  >
                    {items.map((it) => (
                      <tr key={it.insumoId}>
                        <td><b>{it.insumo.nombre}</b></td>
                        <td><Tag>{it.insumo.categoria}</Tag></td>
                        <td><StockCell item={it} criticoLabel={t("stock.critical")} /></td>
                        <td><NivelBar stock={it.stock} max={it.max} /></td>
                        <td className={styles.rowEnd}>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => void reponer(sede.id, it.insumoId)}
                            disabled={it.stock >= it.max}
                          >
                            {t("stock.restock")}
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </DataTable>
                )}
              </Panel>
            </div>
          ))
        )
      )}

      {/* ══ Solicitudes recibidas (superadmin / dueño) ══ */}
      {tab === "solicitudes" && (
        solicitudes.length === 0 ? (
          <Panel>
            <EmptyState icon="box" title={t("stock.emptyRequestsTitle")} message={t("stock.emptyRequestsMsg")} />
          </Panel>
        ) : (
          solicitudes.map((sol) => (
            <SolicitudCard
              key={sol.id}
              solicitud={sol}
              nombreInsumo={nombreInsumo}
              mostrarSede
              onAprobar={(id) => void aprobar(id)}
              onRechazar={rechazar}
            />
          ))
        )
      )}

      {/* ══ Stock de mi sede (usuario de sede) ══ */}
      {tab === "mi-stock" && (
        <>
          <Toolbar>
            <SearchBox
              value={buscarStock}
              onChange={setBuscarStock}
              placeholder={t("stock.searchPlaceholder")}
            />
            <ToolbarActions>
              <Button onClick={abrirSolicitud}>{t("stock.requestInventory")}</Button>
            </ToolbarActions>
          </Toolbar>
          <Panel>
            {(stockPorSede[0]?.items.length ?? 0) === 0 ? (
              <EmptyState icon="box" title={t("stock.emptyStockTitle")} message={t("stock.emptyStockMsg")} />
            ) : (
              <DataTable
                headers={[t("stock.product"), t("common.category"), t("stock.currentStock"), t("stock.level")]}
              >
                {stockPorSede[0].items.map((it) => (
                  <tr key={it.insumoId}>
                    <td><b>{it.insumo.nombre}</b></td>
                    <td><Tag>{it.insumo.categoria}</Tag></td>
                    <td><StockCell item={it} criticoLabel={t("stock.critical")} /></td>
                    <td><NivelBar stock={it.stock} max={it.max} /></td>
                  </tr>
                ))}
              </DataTable>
            )}
          </Panel>
        </>
      )}

      {/* ══ Mis solicitudes (usuario de sede) ══ */}
      {tab === "mis-sol" && (
        solicitudes.length === 0 ? (
          <Panel>
            <EmptyState icon="box" title={t("stock.emptyRequestsTitle")} message={t("stock.emptyMyRequestsMsg")} />
          </Panel>
        ) : (
          solicitudes.map((sol) => (
            <SolicitudCard
              key={sol.id}
              solicitud={sol}
              nombreInsumo={nombreInsumo}
              mostrarSede={false}
            />
          ))
        )
      )}

      {/* ── Modal: nuevo insumo ── */}
      <Modal open={nuevoOpen} onClose={() => setNuevoOpen(false)}>
        <ModalTitle>{t("stock.newInsumoTitle")}</ModalTitle>
        <ModalText>{t("stock.newInsumoSub")}</ModalText>
        <Field label={t("stock.product")} htmlFor="ni-nombre">
          <input id="ni-nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} />
        </Field>
        <Field label={t("common.category")} htmlFor="ni-cat">
          <input
            id="ni-cat"
            value={categoria}
            onChange={(e) => setCategoria(e.target.value)}
            placeholder={t("stock.categoryPlaceholder")}
          />
        </Field>
        <Field label={t("stock.unit")} htmlFor="ni-unidad">
          <input
            id="ni-unidad"
            value={unidad}
            onChange={(e) => setUnidad(e.target.value)}
            placeholder={t("stock.unitPlaceholder")}
          />
        </Field>
        <Field label={t("stock.refPriceEur")} htmlFor="ni-precio">
          <input
            id="ni-precio"
            type="number"
            min="0"
            step="0.01"
            value={precio}
            onChange={(e) => setPrecio(e.target.value)}
            placeholder="4.50"
          />
        </Field>
        <ModalActions>
          <Button variant="ghost" block onClick={() => setNuevoOpen(false)}>{t("common.cancel")}</Button>
          <Button block onClick={() => void crearInsumo()}>{t("stock.createInsumo")}</Button>
        </ModalActions>
      </Modal>

      {/* ── Modal: solicitar inventario ── */}
      <Modal open={solicitarOpen} onClose={() => setSolicitarOpen(false)} maxWidth={520}>
        <ModalTitle>{t("stock.requestTitle")}</ModalTitle>
        <ModalText>{t("stock.requestSub")}</ModalText>
        <div className={styles.requestList}>
          {catalogo.map((i) => {
            const actual = stockPorSede[0]?.items.find((it) => it.insumoId === i.id);
            return (
              <div key={i.id} className={styles.requestRow}>
                <div>
                  <div className={styles.insumoName}>{i.nombre}</div>
                  <div className={styles.insumoCat}>
                    {i.categoria} · {t("stock.currentStockShort", {
                      n: actual?.stock ?? 0,
                      unidad: i.unidad,
                    })}
                  </div>
                </div>
                <div className={styles.stepper}>
                  <button
                    type="button"
                    onClick={() => cambiarCantidad(i.id, -1)}
                    aria-label={t("stock.decrease", { nombre: i.nombre })}
                  >
                    −
                  </button>
                  <input
                    type="number"
                    min="0"
                    value={cantidades[i.id] || 0}
                    onChange={(e) =>
                      setCantidades((prev) => ({
                        ...prev,
                        [i.id]: Math.max(0, Number(e.target.value) || 0),
                      }))
                    }
                    aria-label={t("stock.quantity", { nombre: i.nombre })}
                  />
                  <button
                    type="button"
                    onClick={() => cambiarCantidad(i.id, 1)}
                    aria-label={t("stock.increase", { nombre: i.nombre })}
                  >
                    +
                  </button>
                </div>
              </div>
            );
          })}
        </div>
        <Field label={t("stock.notesLabel")} htmlFor="sol-notas">
          <input
            id="sol-notas"
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
            placeholder={t("stock.notesPlaceholder")}
          />
        </Field>
        <ModalActions>
          <Button variant="ghost" block onClick={() => setSolicitarOpen(false)}>{t("common.cancel")}</Button>
          <Button block onClick={() => void enviarSolicitud()}>{t("stock.sendRequest")}</Button>
        </ModalActions>
      </Modal>
    </>
  );
}
