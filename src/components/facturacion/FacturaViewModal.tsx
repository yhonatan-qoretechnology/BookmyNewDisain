"use client";
/* ============================================================
   FacturaViewModal — popup de la factura
   Encabeza con los datos del emisor (logo, empresa, sede y
   contacto) y permite descargarla en PDF o imprimirla.
============================================================ */
import { useState } from "react";
import { fmtFechaLarga, fmtMoneda, initials } from "@/constants";
import { FacturasController, type Emisor, type Factura } from "@/controllers/FacturacionControllers";
import { useI18n } from "@/i18n";
import { useUi } from "@/context/UiContext";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Icon from "@/components/ui/Icon";
import { AnimatePresence } from "framer-motion";
import Modal from "./Modal";
import { descargarFacturaPdf } from "./facturaPdf";
import styles from "./facturacion.module.css";

function Contenido({
  factura,
  emisor,
  onClose,
  onActualizada,
}: {
  factura: Factura;
  emisor: Emisor | null;
  onClose: () => void;
  /** Se llama tras añadir un adicional, para recargar la lista y el total. */
  onActualizada?: () => void;
}) {
  const { t } = useI18n();
  const { toast } = useUi();
  const [generando, setGenerando] = useState(false);

  /* Alta de un concepto adicional. El total NO se toca aquí: lo recalcula el
     backend (tarifa del servicio + adicionales) y la lista se recarga. */
  const [anadiendo, setAnadiendo] = useState(false);
  const [concepto, setConcepto] = useState("");
  const [cantidad, setCantidad] = useState("1");
  const [precio, setPrecio] = useState("");
  const [guardandoItem, setGuardandoItem] = useState(false);

  const f = factura;

  /* Respaldo mínimo si aún no cargaron los datos de la empresa */
  const em: Emisor = emisor ?? {
    nombre: "—", nit: null, telefono: null, email: null, web: null, logo: null,
    sedeNombre: f.sedeNombre ?? null, sedeDireccion: null, sedeTelefono: null,
  };

  const guardarAdicional = async () => {
    const importe = Number(precio);
    const uds = Number(cantidad);
    if (!concepto.trim() || !Number.isFinite(importe) || importe < 0 || !Number.isFinite(uds) || uds < 1) {
      toast(t("facturacion.adicionalInvalido"), "error");
      return;
    }
    setGuardandoItem(true);
    try {
      await FacturasController.anadirAdicional(f.apiId as number, {
        concepto: concepto.trim(), cantidad: uds, precioUnitario: importe,
      });
      setConcepto(""); setCantidad("1"); setPrecio(""); setAnadiendo(false);
      toast(t("facturacion.adicionalAnadido"), "success");
      onActualizada?.();
    } catch (e) {
      toast(e instanceof Error ? e.message : t("facturacion.adicionalError"), "error");
    } finally {
      setGuardandoItem(false);
    }
  };

  const descargar = async () => {
    setGenerando(true);
    try {
      await descargarFacturaPdf(f, em, {
        factura: t("facturacion.panelTitle"),
        emitida: t("facturacion.emitida"),
        receptor: t("facturacion.receptor"),
        concepto: t("facturacion.concepto"),
        cantidad: t("facturacion.cantidad"),
        precio: t("facturacion.precio"),
        subtotal: t("facturacion.subtotal"),
        total: t("gastos.total"),
        estado: t("common.state"),
        reserva: t("facturacion.reserva"),
        sede: t("facturacion.sede"),
        nit: t("facturacion.nit"),
        servicio: t("common.service"),
        fecha: t("common.date"),
        cliente: t("common.client"),
        metodoPago: t("common.price"),
        profesional: t("common.specialist"),
        pie: t("facturacion.panelTitle"),
      });
      toast(t("facturacion.pdfListo"), "success");
    } catch {
      toast(t("facturacion.pdfError"), "error");
    } finally {
      setGenerando(false);
    }
  };

  const badgeKind = f.estado === "pagado" ? "pagado" : f.estado === "cancelado" ? "cancelado" : "pendiente";

  const meta: Array<{ label: string; value: string }> = [
    { label: t("common.client"), value: f.cliente },
    { label: t("facturacion.reserva"), value: f.reservaId },
    { label: t("common.service"), value: f.servicio },
    { label: t("common.date"), value: `${fmtFechaLarga(f.fecha)}${f.hora && f.hora !== "—" ? ` · ${f.hora}` : ""}` },
  ];
  if (f.profesional) meta.push({ label: t("common.specialist"), value: f.profesional });
  if (f.clienteEmail && f.clienteEmail !== "—") meta.push({ label: t("common.email"), value: f.clienteEmail });

  return (
    <Modal
      title={`${t("facturacion.panelTitle")} ${f.id}`}
      subtitle={`${t("facturacion.receptor")}: ${f.cliente}`}
      onClose={onClose}
      size="lg"
      closeLabel={t("common.close")}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>{t("common.close")}</Button>
          <Button variant="ghost" onClick={() => window.print()}>
            <Icon name="printer" /> {t("facturacion.imprimir")}
          </Button>
          <Button onClick={descargar} disabled={generando}>
            <Icon name="download" />
            {generando ? t("facturacion.generando") : t("facturacion.descargarPdf")}
          </Button>
        </>
      }
    >
      {/* ── Emisor: logo, empresa, sede y contacto ── */}
      <div className={styles.emisor}>
        {em.logo ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img src={em.logo} alt={em.nombre} className={styles.logo} />
        ) : (
          <div className={styles.logoFallback}>{initials(em.nombre).slice(0, 1)}</div>
        )}

        <div className={styles.emisorInfo}>
          <span className={styles.emisorNombre}>{em.nombre}</span>
          {em.nit && (
            <span className={styles.emisorLinea}>
              <Icon name="shield" /> {t("facturacion.nit")}: {em.nit}
            </span>
          )}
          {(em.sedeNombre || em.sedeDireccion) && (
            <span className={styles.emisorLinea}>
              <Icon name="mapPin" />
              {[em.sedeNombre, em.sedeDireccion].filter(Boolean).join(" · ")}
            </span>
          )}
          {(em.sedeTelefono || em.telefono) && (
            <span className={styles.emisorLinea}>
              <Icon name="phone" /> {em.sedeTelefono || em.telefono}
            </span>
          )}
          {em.email && (
            <span className={styles.emisorLinea}>
              <Icon name="mail" /> {em.email}
            </span>
          )}
          {em.web && (
            <span className={styles.emisorLinea}>
              <Icon name="grid" /> {em.web}
            </span>
          )}
        </div>

        <div className={styles.emisorDoc}>
          <span className={styles.facturaId}>{f.id}</span>
          <span className={styles.facturaFecha}>{fmtFechaLarga(f.fecha)}</span>
          <Badge kind={badgeKind}>{t(`factura.${f.estado}`)}</Badge>
        </div>
      </div>

      {/* ── Datos de la reserva facturada ── */}
      <div className={styles.metaGrid}>
        {meta.map((m) => (
          <div key={m.label} className={styles.metaItem}>
            <span className={styles.metaLabel}>{m.label}</span>
            <span className={styles.metaValue}>{m.value}</span>
          </div>
        ))}
      </div>

      {/* ── Detalle ── */}
      <table className={styles.tabla}>
        <thead>
          <tr>
            <th>{t("facturacion.concepto")}</th>
            <th className={styles.c}>{t("facturacion.cantidad")}</th>
            <th className={styles.r}>{t("facturacion.precio")}</th>
            <th className={styles.r}>{t("facturacion.subtotal")}</th>
          </tr>
        </thead>
        <tbody>
          {f.items.map((it, i) => (
            <tr key={i}>
              <td>{it.concepto}</td>
              <td className={styles.c}>{it.cantidad}</td>
              <td className={styles.r}>{fmtMoneda(it.precio, f.moneda)}</td>
              <td className={styles.r}>{fmtMoneda(it.precio * it.cantidad, f.moneda)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {f.apiId != null && (
        anadiendo ? (
          <div className={styles.adicionalForm}>
            <input
              value={concepto}
              onChange={(e) => setConcepto(e.target.value)}
              placeholder={t("facturacion.adicionalConcepto")}
              aria-label={t("facturacion.adicionalConcepto")}
            />
            <input
              type="number" min={1} value={cantidad}
              onChange={(e) => setCantidad(e.target.value)}
              aria-label={t("facturacion.cantidad")}
            />
            <input
              type="number" min={0} step="0.01" value={precio}
              onChange={(e) => setPrecio(e.target.value)}
              placeholder={t("facturacion.precio")}
              aria-label={t("facturacion.precio")}
            />
            <Button size="sm" disabled={guardandoItem} onClick={() => void guardarAdicional()}>
              {guardandoItem ? t("booking.loading") : t("common.save")}
            </Button>
            <Button size="sm" variant="ghost" disabled={guardandoItem} onClick={() => setAnadiendo(false)}>
              {t("common.cancel")}
            </Button>
          </div>
        ) : (
          <Button size="sm" variant="ghost" onClick={() => setAnadiendo(true)}>
            <Icon name="plus" /> {t("facturacion.anadirAdicionales")}
          </Button>
        )
      )}

      <div className={styles.totales}>
        <div className={styles.totalGrande}>
          <span>{t("gastos.total")}</span>
          <span>{fmtMoneda(f.total, f.moneda)}</span>
        </div>
      </div>
    </Modal>
  );
}

/**
 * El AnimatePresence vive aquí y no dentro de `Modal`: es este
 * envoltorio el que decide si hay factura que mostrar, así que es el
 * único punto donde se puede retener el nodo mientras se anima la
 * salida. Con el `return null` anterior, el modal desaparecía de golpe.
 */
export default function FacturaViewModal({
  factura,
  emisor,
  onClose,
  onActualizada,
}: {
  factura: Factura | null;
  emisor: Emisor | null;
  onClose: () => void;
  /** Recarga la lista tras añadir un adicional (el total lo recalcula el backend). */
  onActualizada?: () => void;
}) {
  return (
    <AnimatePresence>
      {factura && <Contenido factura={factura} emisor={emisor} onClose={onClose} />}
    </AnimatePresence>
  );
}
