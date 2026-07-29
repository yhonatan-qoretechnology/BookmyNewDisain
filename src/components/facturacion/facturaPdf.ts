/* ============================================================
   facturaPdf — genera y descarga la factura en PDF (jsPDF)
   La cabecera lleva los datos del emisor: logo, nombre de la
   empresa, NIT, sede, dirección, teléfono, email y web.
============================================================ */
import { fmtFechaLarga, fmtMoneda } from "@/constants";
import type { Emisor, Factura } from "@/controllers/FacturacionControllers";

/* Paleta del design system trasladada al PDF */
const NAVY: [number, number, number] = [27, 37, 89];
const TEAL: [number, number, number] = [5, 184, 154];
const SLATE: [number, number, number] = [131, 146, 171];
const BORDE: [number, number, number] = [222, 230, 241];

/** Descarga una imagen (URL o dataURL) como dataURL para incrustarla */
async function comoDataUrl(src: string): Promise<{ data: string; formato: string } | null> {
  try {
    if (src.startsWith("data:")) {
      const formato = /^data:image\/(\w+)/.exec(src)?.[1]?.toUpperCase() || "PNG";
      return { data: src, formato: formato === "JPG" ? "JPEG" : formato };
    }
    const res = await fetch(src, { mode: "cors" });
    if (!res.ok) return null;
    const blob = await res.blob();
    const data = await new Promise<string>((resolve, reject) => {
      const fr = new FileReader();
      fr.onload = () => resolve(fr.result as string);
      fr.onerror = reject;
      fr.readAsDataURL(blob);
    });
    const formato = (blob.type.split("/")[1] || "png").toUpperCase();
    return { data, formato: formato === "JPG" ? "JPEG" : formato };
  } catch {
    return null;
  }
}

export interface TextosPdf {
  factura: string;
  emitida: string;
  receptor: string;
  concepto: string;
  cantidad: string;
  precio: string;
  subtotal: string;
  total: string;
  estado: string;
  reserva: string;
  sede: string;
  nit: string;
  servicio: string;
  fecha: string;
  cliente: string;
  metodoPago: string;
  profesional: string;
  pie: string;
}

/**
 * Construye el PDF de una factura y lo descarga.
 * @param f      Factura a imprimir.
 * @param emisor Datos de la empresa/sede que encabezan el documento.
 * @param x      Etiquetas ya traducidas (i18n).
 */
export async function descargarFacturaPdf(f: Factura, emisor: Emisor, x: TextosPdf): Promise<void> {
  const jsPDF = (await import("jspdf")).default;
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const M = 18;                 // margen lateral
  let y = 20;

  /* ── Cabecera: logo + datos del emisor ───────────────── */
  let xTexto = M;
  if (emisor.logo) {
    const img = await comoDataUrl(emisor.logo);
    if (img) {
      try {
        doc.addImage(img.data, img.formato, M, y - 4, 22, 22, undefined, "FAST");
        xTexto = M + 28;
      } catch {
        /* logo ilegible: seguimos sin él */
      }
    }
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.setTextColor(...NAVY);
  doc.text(emisor.nombre, xTexto, y + 2);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...SLATE);

  const lineas: string[] = [];
  if (emisor.nit) lineas.push(`${x.nit}: ${emisor.nit}`);
  if (emisor.sedeNombre) lineas.push(`${x.sede}: ${emisor.sedeNombre}`);
  if (emisor.sedeDireccion) lineas.push(emisor.sedeDireccion);
  const contacto = [emisor.sedeTelefono || emisor.telefono, emisor.email].filter(Boolean).join("  ·  ");
  if (contacto) lineas.push(contacto);
  if (emisor.web) lineas.push(emisor.web);

  let yl = y + 8;
  for (const linea of lineas) {
    doc.text(linea, xTexto, yl);
    yl += 4.4;
  }

  /* Bloque derecho: nº de factura y fecha */
  doc.setFont("helvetica", "bold");
  doc.setFontSize(19);
  doc.setTextColor(...NAVY);
  doc.text(f.id, W - M, y + 2, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...SLATE);
  doc.text(`${x.emitida}: ${fmtFechaLarga(f.fecha)}`, W - M, y + 8, { align: "right" });
  doc.text(`${x.estado}: ${f.estado}`, W - M, y + 12.4, { align: "right" });

  y = Math.max(yl, y + 26) + 4;
  doc.setDrawColor(...TEAL);
  doc.setLineWidth(0.8);
  doc.line(M, y, W - M, y);
  y += 10;

  /* ── Datos del receptor y de la reserva ──────────────── */
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(...NAVY);
  doc.text(x.receptor.toUpperCase(), M, y);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(f.cliente, M, y + 6);
  doc.setFontSize(9);
  doc.setTextColor(...SLATE);
  let yr = y + 11;
  for (const linea of [f.clienteEmail, f.clienteTelefono].filter((v): v is string => !!v && v !== "—")) {
    doc.text(linea, M, yr);
    yr += 4.4;
  }

  /* Columna derecha con el detalle de la cita */
  const detalle: Array<[string, string]> = [
    [x.reserva, f.reservaId],
    [x.servicio, f.servicio],
    [x.fecha, `${fmtFechaLarga(f.fecha)}${f.hora && f.hora !== "—" ? ` · ${f.hora}` : ""}`],
  ];
  if (f.profesional) detalle.push([x.profesional, f.profesional]);
  if (f.sedeNombre) detalle.push([x.sede, f.sedeNombre]);
  if (f.metodoPago) detalle.push([x.metodoPago, f.metodoPago]);

  let yd = y;
  for (const [k, v] of detalle) {
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...SLATE);
    doc.text(`${k}:`, W - M - 62, yd);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...NAVY);
    doc.text(doc.splitTextToSize(v, 60), W - M, yd, { align: "right" });
    yd += 5;
  }

  y = Math.max(yr, yd) + 8;

  /* ── Tabla de conceptos ──────────────────────────────── */
  const colCant = W - M - 74;
  const colPrecio = W - M - 38;

  doc.setFillColor(244, 247, 251);
  doc.rect(M, y - 5, W - M * 2, 9, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(...SLATE);
  doc.text(x.concepto.toUpperCase(), M + 3, y + 1);
  doc.text(x.cantidad.toUpperCase(), colCant, y + 1, { align: "center" });
  doc.text(x.precio.toUpperCase(), colPrecio, y + 1, { align: "right" });
  doc.text(x.subtotal.toUpperCase(), W - M - 3, y + 1, { align: "right" });
  y += 11;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  for (const it of f.items) {
    const nombre = doc.splitTextToSize(it.concepto, 82) as string[];
    doc.setTextColor(...NAVY);
    doc.text(nombre, M + 3, y);
    doc.text(String(it.cantidad), colCant, y, { align: "center" });
    doc.text(fmtMoneda(it.precio, f.moneda), colPrecio, y, { align: "right" });
    doc.text(fmtMoneda(it.precio * it.cantidad, f.moneda), W - M - 3, y, { align: "right" });
    y += Math.max(nombre.length * 5, 5) + 3;

    doc.setDrawColor(...BORDE);
    doc.setLineWidth(0.2);
    doc.line(M, y - 2, W - M, y - 2);
  }

  /* ── Total ───────────────────────────────────────────── */
  y += 6;
  doc.setDrawColor(...NAVY);
  doc.setLineWidth(0.6);
  doc.line(W - M - 76, y - 4, W - M, y - 4);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...NAVY);
  doc.text(x.total.toUpperCase(), W - M - 76, y + 4);
  doc.setFontSize(15);
  doc.setTextColor(...TEAL);
  doc.text(fmtMoneda(f.total, f.moneda), W - M, y + 4, { align: "right" });

  /* ── Pie ─────────────────────────────────────────────── */
  doc.setDrawColor(...BORDE);
  doc.setLineWidth(0.2);
  doc.line(M, H - 20, W - M, H - 20);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...SLATE);
  doc.text(`${emisor.nombre} · ${x.pie}`, M, H - 14);
  doc.text(new Date().toLocaleString(), W - M, H - 14, { align: "right" });

  doc.save(`${f.id}-${f.cliente.replace(/\s+/g, "-").toLowerCase()}.pdf`);
}
