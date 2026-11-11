"use client";
/* ============================================================
   FacturaViewModal — popup de la factura
   Encabeza con los datos del emisor (logo, empresa, sede y
   contacto) y permite descargarla en PDF, imprimirla, enviarla
   por correo al cliente o compartirla por WhatsApp.
============================================================ */
import { useState } from "react";
import { fmtFechaLarga, fmtMoneda, initials } from "@/constants";
import { FacturasController, type Emisor, type Factura } from "@/controllers/FacturacionControllers";
import { useRegion } from "@/context/RegionContext";
import { useI18n } from "@/i18n";
import { useUi } from "@/context/UiContext";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Icon from "@/components/ui/Icon";
import { AnimatePresence } from "framer-motion";
import Modal from "./Modal";
import { descargarFacturaPdf, facturaPdfComoArchivo, type TextosPdf } from "./facturaPdf";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
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
  /** Se llama tras añadir o quitar un adicional, para recargar la lista y el total. */
  onActualizada?: () => Promise<void> | void;
}) {
  const { t } = useI18n();
  const { pais, etiqueta } = useRegion();
  const { toast } = useUi();
  const [generando, setGenerando] = useState(false);
  /** itemId del adicional que se está quitando (bloquea los demás botones) */
  const [quitando, setQuitando] = useState<number | null>(null);
  /** itemId pendiente de confirmar: el primer clic pide confirmación en la misma fila */
  const [confirmando, setConfirmando] = useState<number | null>(null);
  /** Adicionales ya quitados: se ocultan al momento, sin esperar a que recargue la lista */
  const [quitados, setQuitados] = useState<Set<number>>(() => new Set());

  /* Alta de un concepto adicional. El total NO se toca aquí: lo recalcula el
     backend (tarifa del servicio + adicionales) y la lista se recarga. */
  const [anadiendo, setAnadiendo] = useState(false);
  const [concepto, setConcepto] = useState("");
  const [cantidad, setCantidad] = useState("1");
  const [precio, setPrecio] = useState("");
  const [guardandoItem, setGuardandoItem] = useState(false);

  /* Envío por correo: el destino se puede corregir antes de mandar */
  const [enviandoCorreo, setEnviandoCorreo] = useState(false);
  const [pidiendoCorreo, setPidiendoCorreo] = useState(false);
  const [correo, setCorreo] = useState(
    factura.clienteEmail && factura.clienteEmail !== "—" ? factura.clienteEmail : ""
  );
  const [compartiendo, setCompartiendo] = useState(false);

  const f = factura;
  /* Solo los adicionales (payment_items) llevan itemId: la línea del servicio no se quita. */
  const lineas = f.items.filter((it) => it.itemId == null || !quitados.has(it.itemId));
  const hayAdicionales = lineas.some((it) => it.itemId != null);

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
        /* La moneda del adicional NO se manda: CreatePaymentItemDto del
           backend que corre hoy no la declara, y con forbidNonWhitelisted
           un campo de mas tumba la peticion entera con un 400. En Colombia
           fallaba siempre, porque la factura va en COP y este selector solo
           ofrecia EUR y USD, asi que nunca coincidian. Se vuelve a mandar
           -y vuelve el selector de abajo- cuando el backend con multidivisa
           este desplegado. */
      });
      setConcepto(""); setCantidad("1"); setPrecio("");
      setAnadiendo(false);
      toast(t("facturacion.adicionalAnadido"), "success");
      await onActualizada?.();
    } catch (e) {
      toast(e instanceof Error ? e.message : t("facturacion.adicionalError"), "error");
    } finally {
      setGuardandoItem(false);
    }
  };

  /* Quitar un adicional. La confirmación va en la propia fila y no con
     confirm(): el diálogo global se pinta DEBAJO de este modal (z-index 50
     frente a 60) y Escape cerraba los dos. Igual que al añadir, el total lo
     recalcula el backend; se espera a la recarga antes de soltar el botón
     para que no se pueda pedir dos veces el mismo borrado. */
  const quitarAdicional = async (itemId: number) => {
    setQuitando(itemId);
    try {
      await FacturasController.quitarAdicional(itemId);
      setQuitados((prev) => new Set(prev).add(itemId));
      setConfirmando(null);
      toast(t("facturacion.adicionalQuitado"), "success");
      await onActualizada?.();
    } catch (e) {
      toast(e instanceof Error ? e.message : t("facturacion.adicionalQuitarError"), "error");
    } finally {
      setQuitando(null);
    }
  };

  const textosPdf = (): TextosPdf => ({
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
    nit: etiqueta("fiscal"),
    servicio: t("common.service"),
    fecha: t("common.date"),
    cliente: t("common.client"),
    metodoPago: t("common.price"),
    profesional: t("common.specialist"),
    pie: t("facturacion.panelTitle"),
  });
  const formato = { locale: pais.locale, decimales: pais.decimalesMoneda };

  const descargar = async () => {
    setGenerando(true);
    try {
      await descargarFacturaPdf(f, em, textosPdf(), formato);
      toast(t("facturacion.pdfListo"), "success");
    } catch {
      toast(t("facturacion.pdfError"), "error");
    } finally {
      setGenerando(false);
    }
  };

  const enviarCorreo = async () => {
    if (!EMAIL_RE.test(correo.trim())) {
      toast(t("facturacion.correoInvalido"), "error");
      return;
    }
    setEnviandoCorreo(true);
    try {
      await FacturasController.enviarPorCorreo(f, correo, em.sedeNombre || "");
      toast(t("facturacion.correoEnviado", { correo: correo.trim() }), "success");
      setPidiendoCorreo(false);
    } catch (e) {
      toast(e instanceof Error ? e.message : t("facturacion.correoError"), "error");
    } finally {
      setEnviandoCorreo(false);
    }
  };

  /* WhatsApp: en el móvil se comparte el PDF tal cual (hoja de compartir
     del sistema). Donde no se puede adjuntar un archivo (escritorio), se
     descarga el PDF y se abre el chat del cliente con el mensaje, para
     que lo adjunte. */
  const compartirWhatsApp = async () => {
    setCompartiendo(true);
    const tel = (f.clienteTelefono || "").replace(/\D/g, "");
    const texto = t("facturacion.waMensaje", {
      cliente: f.cliente,
      factura: f.id,
      total: fmtMoneda(f.total, f.moneda, pais.locale, pais.decimalesMoneda),
      negocio: em.nombre,
    });
    try {
      const archivo = await facturaPdfComoArchivo(f, em, textosPdf(), formato);
      if (typeof navigator !== "undefined" && navigator.canShare?.({ files: [archivo] })) {
        await navigator.share({ files: [archivo], text: texto, title: `${t("facturacion.panelTitle")} ${f.id}` });
      } else {
        const url = URL.createObjectURL(archivo);
        const a = document.createElement("a");
        a.href = url; a.download = archivo.name; a.click();
        setTimeout(() => URL.revokeObjectURL(url), 2000);
        window.open(`https://wa.me/${tel}?text=${encodeURIComponent(texto)}`, "_blank", "noopener");
        toast(t("facturacion.waAdjunta"), "default");
      }
    } catch (e) {
      /* Cerrar la hoja de compartir no es un error */
      if (!(e instanceof DOMException && e.name === "AbortError")) toast(t("facturacion.pdfError"), "error");
    } finally {
      setCompartiendo(false);
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
      printable
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>{t("common.close")}</Button>
          <Button variant="ghost" onClick={() => window.print()}>
            <Icon name="printer" /> {t("facturacion.imprimir")}
          </Button>
          <Button variant="ghost" onClick={() => void compartirWhatsApp()} disabled={compartiendo}>
            <Icon name="send" /> {compartiendo ? t("facturacion.generando") : t("facturacion.whatsapp")}
          </Button>
          <Button variant="ghost" onClick={() => setPidiendoCorreo((v) => !v)} disabled={enviandoCorreo}>
            <Icon name="mail" /> {t("facturacion.enviarCorreo")}
          </Button>
          <Button onClick={descargar} disabled={generando}>
            <Icon name="download" />
            {generando ? t("facturacion.generando") : t("facturacion.descargarPdf")}
          </Button>
        </>
      }
    >
      {/* ── Envío por correo: destino editable ── */}
      {pidiendoCorreo && (
        <div className={styles.envioCorreo} data-no-print>
          <label htmlFor="fv-correo">{t("facturacion.correoDestino")}</label>
          <div className={styles.envioFila}>
            <input
              id="fv-correo" type="email" value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              placeholder="cliente@correo.com"
              onKeyDown={(e) => { if (e.key === "Enter") void enviarCorreo(); }}
            />
            <Button size="sm" onClick={() => void enviarCorreo()} disabled={enviandoCorreo}>
              {enviandoCorreo ? t("facturacion.enviando") : t("facturacion.enviar")}
            </Button>
          </div>
          {correo.trim() && !EMAIL_RE.test(correo.trim()) && (
            <span className={styles.envioError} role="alert">{t("facturacion.correoInvalido")}</span>
          )}
        </div>
      )}

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
              <Icon name="shield" /> {etiqueta("fiscal")}: {em.nit}
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
            {hayAdicionales && <th className={styles.quitarCol} data-no-print />}
          </tr>
        </thead>
        <tbody>
          {lineas.map((it, i) => (
            <tr key={i}>
              <td>{it.concepto}</td>
              <td className={styles.c}>{it.cantidad}</td>
              <td className={styles.r}>{fmtMoneda(it.precio, it.moneda || f.moneda, pais.locale, it.moneda ? 2 : pais.decimalesMoneda)}</td>
              <td className={styles.r}>{fmtMoneda(it.precio * it.cantidad, it.moneda || f.moneda, pais.locale, it.moneda ? 2 : pais.decimalesMoneda)}</td>
              {hayAdicionales && (
                <td className={styles.quitarCol} data-no-print>
                  {it.itemId != null &&
                    (confirmando === it.itemId ? (
                      <>
                        <Button
                          size="sm"
                          variant="danger"
                          disabled={quitando !== null}
                          onClick={() => void quitarAdicional(it.itemId as number)}
                        >
                          {quitando === it.itemId ? t("booking.loading") : t("facturacion.adicionalQuitarSi")}
                        </Button>
                        <Button size="sm" variant="ghost" disabled={quitando !== null} onClick={() => setConfirmando(null)}>
                          {t("common.cancel")}
                        </Button>
                      </>
                    ) : (
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={quitando !== null}
                        onClick={() => setConfirmando(it.itemId as number)}
                      >
                        {t("facturacion.adicionalQuitar")}
                      </Button>
                    ))}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>

      {f.apiId != null && (
        <div data-no-print>{anadiendo ? (
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
        )}</div>
      )}

      <div className={styles.totales}>
        <div className={styles.totalGrande}>
          <span>{t("gastos.total")}</span>
          <span>{fmtMoneda(f.total, f.moneda, pais.locale, pais.decimalesMoneda)}</span>
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
  /** Recarga la lista tras añadir o quitar un adicional (el total lo recalcula el backend). */
  onActualizada?: () => Promise<void> | void;
}) {
  return (
    <AnimatePresence>
      {factura && <Contenido factura={factura} emisor={emisor} onClose={onClose} onActualizada={onActualizada} />}
    </AnimatePresence>
  );
}
