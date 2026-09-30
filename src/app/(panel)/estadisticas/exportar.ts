/* ============================================================
   Exportación de estadísticas (requisito 2.14)
   ------------------------------------------------------------
   CSV en vez de .xlsx a propósito: Excel abre el CSV sin más y así
   no se añade una dependencia (xlsx/exceljs pesan bastante) para
   volcar cuatro tablas planas. El PDF reutiliza jspdf, que el
   proyecto ya usa para las facturas.
============================================================ */

export interface TablaExport {
  titulo: string;
  cabeceras: string[];
  filas: string[][];
}

/** Escapa un valor para CSV: comillas dobles y separadores. */
function celda(v: string): string {
  let s = v ?? "";
  /* Excel toma como fórmula lo que empieza por = + - @ ("+1,1 pp" acabaría
     en #¿NOMBRE?). Un espacio delante lo deja como texto; los números
     sueltos se quedan como están. */
  if (/^[=+\-@]/.test(s) && !/^[+-]?\d+([.,]\d+)?%?$/.test(s)) s = ` ${s}`;
  return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function exportarCsv(tablas: TablaExport[], periodo: string) {
  /* Separador `;`: es lo que espera Excel en configuración española, donde la
     coma es el separador decimal. Con `,` las columnas salen pegadas. */
  const lineas: string[] = [`Periodo;${celda(periodo)}`, ""];
  for (const t of tablas) {
    lineas.push(celda(t.titulo));
    lineas.push(t.cabeceras.map(celda).join(";"));
    for (const f of t.filas) lineas.push(f.map(celda).join(";"));
    lineas.push("");
  }

  /* BOM para que Excel reconozca UTF-8 y no rompa los acentos. */
  const blob = new Blob(["﻿" + lineas.join("\n")], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `estadisticas-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export async function exportarPdf(tablas: TablaExport[], periodo: string, titulo: string) {
  /* Import dinámico: jspdf pesa y solo hace falta al pulsar el botón. */
  /* jspdf exporta la clase por defecto; desestructurar `jsPDF` del módulo
     dinámico no compila. Mismo patrón que usa facturaPdf.ts. */
  const jsPDF = (await import("jspdf")).default;
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const margen = 40;
  let y = margen;

  doc.setFontSize(16);
  doc.text(titulo, margen, y);
  y += 20;
  doc.setFontSize(10);
  doc.setTextColor(120);
  doc.text(periodo, margen, y);
  doc.setTextColor(0);
  y += 24;

  for (const t of tablas) {
    if (y > 760) { doc.addPage(); y = margen; }
    doc.setFontSize(12);
    doc.text(t.titulo, margen, y);
    y += 16;

    doc.setFontSize(9);
    doc.text(t.cabeceras.join("    |    "), margen, y);
    y += 12;

    for (const f of t.filas) {
      if (y > 780) { doc.addPage(); y = margen; }
      doc.text(f.join("    |    "), margen, y);
      y += 12;
    }
    y += 14;
  }

  doc.save(`estadisticas-${new Date().toISOString().slice(0, 10)}.pdf`);
}
