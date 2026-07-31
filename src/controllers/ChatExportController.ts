/* ============================================================
   ChatExportController — exportación de conversaciones
   ------------------------------------------------------------
   Permite al dueño del negocio descargar el histórico de un chat:
     · TXT → archivo de texto plano (Blob + enlace de descarga)
     · PDF → hoja de impresión del navegador ("Guardar como PDF"),
             reutilizando el área #bmPrintArea y las clases
             .print-* que ya usa la ficha de reserva.
   No requiere backend: trabaja con los mensajes ya cargados.
============================================================ */
import type { Canal, Mensaje, Session } from "@/models";

/** Roles autorizados a descargar transcripciones completas */
export function puedeExportarChats(session: Session | null): boolean {
  return session?.role === "owner" || session?.role === "superadmin";
}

/** Nombre de archivo seguro: "Ana Ruiz" → "ana-ruiz" */
function slug(texto: string): string {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "chat";
}

/** Escapa texto antes de inyectarlo en el HTML de impresión */
function esc(texto: string): string {
  return texto
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export interface ExportLabels {
  /** Título de la transcripción */
  title: string;
  /** Etiqueta del participante propio */
  me: string;
  /** Pie con la fecha de generación */
  footer: string;
  /** Texto de un mensaje adjunto sin cuerpo */
  attachment: string;
}

/** Línea de texto de un mensaje, común a TXT y PDF */
const cuerpo = (m: Mensaje, labels: ExportLabels): string =>
  m.texto?.trim() || (m.messageType && m.messageType !== "TEXT" ? labels.attachment : "");

export const ChatExportController = {
  /**
   * Descarga la conversación como .txt
   * @param canal Contacto de la conversación.
   * @param mensajes Mensajes ya cargados en la vista.
   * @param session Sesión activa (para etiquetar los mensajes propios).
   */
  descargarTexto(
    canal: Canal,
    mensajes: Mensaje[],
    session: Session | null,
    labels: ExportLabels
  ): void {
    const yo = session?.name || labels.me;
    const cabecera = [
      labels.title,
      `${yo} ⇄ ${canal.nombre}${canal.email ? ` <${canal.email}>` : ""}`,
      "".padEnd(52, "="),
      "",
    ].join("\n");
    const lineas = mensajes.map(
      (m) => `[${m.hora}] ${m.dir === "out" ? yo : canal.nombre}: ${cuerpo(m, labels)}`
    );
    const contenido = `${cabecera}${lineas.join("\n")}\n\n${labels.footer}\n`;

    const url = URL.createObjectURL(new Blob([contenido], { type: "text/plain;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `chat-${slug(canal.nombre)}.txt`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  },

  /**
   * Abre el diálogo de impresión con la transcripción maquetada
   * (el navegador permite guardarla como PDF).
   */
  descargarPdf(
    canal: Canal,
    mensajes: Mensaje[],
    session: Session | null,
    labels: ExportLabels
  ): void {
    const yo = session?.name || labels.me;
    let area = document.getElementById("bmPrintArea");
    if (!area) {
      area = document.createElement("div");
      area.id = "bmPrintArea";
      document.body.appendChild(area);
    }
    const filas = mensajes
      .map((m) => {
        const quien = m.dir === "out" ? yo : canal.nombre;
        return `<div class="print-msg ${m.dir === "out" ? "out" : ""}">
          <span class="who">${esc(quien)}</span>
          ${esc(cuerpo(m, labels))}
          <span class="when">${esc(m.hora)}</span>
        </div>`;
      })
      .join("");

    area.innerHTML = `
      <div class="print-logo">BookMy · ${esc(session?.negocioName || "")}</div>
      <div class="print-title">${esc(labels.title)}</div>
      <div class="print-grid">
        <div class="print-field"><label>${esc(labels.me)}</label><span>${esc(yo)}</span></div>
        <div class="print-field"><label>${esc(canal.nombre)}</label><span>${esc(canal.email || canal.sub)}</span></div>
      </div>
      <div class="print-chat">${filas}</div>
      <div class="print-footer">${esc(labels.footer)} · BookMy</div>`;

    setTimeout(() => window.print(), 120);
  },
};
