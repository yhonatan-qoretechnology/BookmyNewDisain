"use client";
/* ============================================================
   FacturaViewModal — popup con la factura, imprimir y PDF
   "Descargar PDF" e "Imprimir" abren el diálogo de impresión
   del navegador sobre una vista limpia de la factura
   (en el diálogo el usuario puede elegir "Guardar como PDF").
============================================================ */
import { Factura } from "@/controllers/FacturacionControllers";
import Modal from "./Modal";

const money = (n: number) =>
  n.toLocaleString("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 });

function facturaHTML(f: Factura): string {
  const filas = (f.items?.length
    ? f.items
    : [{ concepto: f.servicio, cantidad: 1, precio: f.total }])
    .map(
      (it: { concepto: string; cantidad: number; precio: number }) => `<tr>
        <td>${it.concepto}</td>
        <td class="c">${it.cantidad}</td>
        <td class="r">${money(it.precio)}</td>
        <td class="r">${money(it.precio * it.cantidad)}</td>
      </tr>`
    )
    .join("");

  return `<!doctype html><html lang="es"><head><meta charset="utf-8">
  <title>${f.id}</title>
  <style>
    * { box-sizing: border-box; }
    body { font: 14px/1.5 -apple-system, Segoe UI, Roboto, sans-serif; color:#1a1a1a; margin:40px; }
    h1 { font-size:22px; margin:0; }
    .head { display:flex; justify-content:space-between; align-items:flex-start; border-bottom:2px solid #1a1a1a; padding-bottom:16px; }
    .meta { text-align:right; font-size:13px; color:#444; }
    .meta b { color:#1a1a1a; font-size:15px; }
    table { width:100%; border-collapse:collapse; margin-top:24px; }
    th { text-align:left; font-size:12px; text-transform:uppercase; letter-spacing:.04em; color:#666; border-bottom:1px solid #ccc; padding:8px 6px; }
    td { padding:10px 6px; border-bottom:1px solid #eee; }
    .c { text-align:center; } .r { text-align:right; }
    .total td { border-bottom:none; font-weight:700; font-size:16px; padding-top:16px; }
    .estado { display:inline-block; margin-top:8px; padding:2px 10px; border-radius:99px; font-size:12px; border:1px solid #999; text-transform:capitalize; }
    @media print { body { margin:0; } }
  </style></head><body>
    <div class="head">
      <div>
        <h1>Factura ${f.id}</h1>
        <div class="estado">${f.estado}</div>
      </div>
      <div class="meta">
        <b>${f.cliente}</b><br/>
        Servicio: ${f.servicio}<br/>
        Fecha: ${f.fecha}<br/>
        Reserva: ${f.reservaId}
      </div>
    </div>
    <table>
      <thead><tr><th>Concepto</th><th class="c">Cant.</th><th class="r">Precio</th><th class="r">Subtotal</th></tr></thead>
      <tbody>${filas}</tbody>
      <tfoot><tr class="total"><td colspan="3" class="r">Total</td><td class="r">${money(f.total)}</td></tr></tfoot>
    </table>
  </body></html>`;
}

/** Abre la factura en una ventana lista para imprimir / guardar como PDF */
export function imprimirFactura(f: Factura) {
  const w = window.open("", "_blank", "width=800,height=900");
  if (!w) return;
  w.document.write(facturaHTML(f));
  w.document.close();
  w.focus();
  /* pequeño delay para que cargue el layout antes del diálogo */
  setTimeout(() => w.print(), 300);
}

export default function FacturaViewModal({
  factura,
  onClose,
}: {
  factura: Factura | null;
  onClose: () => void;
}) {
  if (!factura) return null;
  const f = factura;
  const items = f.items?.length ? f.items : [{ concepto: f.servicio, cantidad: 1, precio: f.total }];

  return (
    <Modal title={`Factura ${f.id}`} onClose={onClose}>
      <div className="fv-meta">
        <div>
          <span className="fv-label">Cliente</span>
          <b>{f.cliente}</b>
        </div>
        <div>
          <span className="fv-label">Servicio</span>
          <b>{f.servicio}</b>
        </div>
        <div>
          <span className="fv-label">Fecha</span>
          <b>{f.fecha}</b>
        </div>
        <div>
          <span className="fv-label">Estado</span>
          <b style={{ textTransform: "capitalize" }}>{f.estado}</b>
        </div>
      </div>

      <table className="fv-table">
        <thead>
          <tr>
            <th>Concepto</th>
            <th style={{ textAlign: "center" }}>Cant.</th>
            <th style={{ textAlign: "right" }}>Precio</th>
            <th style={{ textAlign: "right" }}>Subtotal</th>
          </tr>
        </thead>
        <tbody>
          {items.map((it: { concepto: string; cantidad: number; precio: number }, i: number) => (
            <tr key={i}>
              <td>{it.concepto}</td>
              <td style={{ textAlign: "center" }}>{it.cantidad}</td>
              <td style={{ textAlign: "right" }}>{money(it.precio)}</td>
              <td style={{ textAlign: "right" }}>{money(it.precio * it.cantidad)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan={3} style={{ textAlign: "right", fontWeight: 700 }}>Total</td>
            <td style={{ textAlign: "right", fontWeight: 700 }}>{money(f.total)}</td>
          </tr>
        </tfoot>
      </table>

      <div className="fv-actions">
        <button className="btn" onClick={() => imprimirFactura(f)}>Imprimir</button>
        <button className="btn btn-primary" onClick={() => imprimirFactura(f)}>Descargar PDF</button>
      </div>

      <style jsx>{`
        .fv-meta { display:grid; grid-template-columns:repeat(2,1fr); gap:12px 24px; margin-bottom:16px; }
        .fv-label { display:block; font-size:12px; color:var(--muted,#777); text-transform:uppercase; letter-spacing:.04em; }
        .fv-table { width:100%; border-collapse:collapse; font-size:14px; }
        .fv-table th { text-align:left; font-size:12px; color:var(--muted,#777); border-bottom:1px solid var(--border,#e3e3e3); padding:8px 6px; }
        .fv-table td { padding:10px 6px; border-bottom:1px solid var(--border,#eee); }
        .fv-actions { display:flex; justify-content:flex-end; gap:8px; margin-top:20px; }
      `}</style>
    </Modal>
  );
}
