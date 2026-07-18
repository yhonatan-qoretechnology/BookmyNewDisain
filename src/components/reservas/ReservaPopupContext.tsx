"use client";
/* ============================================================
   ReservaPopup — detalle de reserva con acciones
   (WhatsApp, Email, Imprimir). Se abre desde cualquier vista
   con useReservaPopup().open(id)
============================================================ */
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { Reserva } from "@/models";
import { ReservasController } from "@/controllers/ReservasController";
import { fmtFechaLarga } from "@/constants";
import { useI18n } from "@/i18n";
import { useSession } from "@/context/SessionContext";
import Icon, { WhatsAppIcon } from "@/components/ui/Icon";
import styles from "./ReservaPopup.module.css";

interface ReservaPopupValue {
  open: (id: string) => void;
  close: () => void;
}

const ReservaPopupContext = createContext<ReservaPopupValue>({
  open: () => {},
  close: () => {},
});

export function ReservaPopupProvider({ children }: { children: React.ReactNode }) {
  const { t } = useI18n();
  const { session } = useSession();
  const [reserva, setReserva] = useState<Reserva | null>(null);

  const open = useCallback((id: string) => {
    const r = ReservasController.getById(id);
    if (r) setReserva(r);
  }, []);

  const close = useCallback(() => setReserva(null), []);

  useEffect(() => {
    if (!reserva) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") close(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [reserva, close]);

  /* Nombres resueltos por los includes de Prisma (sede, profesional) */
  const sedeNombre = reserva?.sedeName || "";
  const espNombre = reserva?.empleadoName || "—";

  const onWhatsApp = () => {
    if (!reserva) return;
    const tel = (reserva.telefono || "").replace(/\D/g, "");
    const msg = encodeURIComponent(
      t("popup.waMessage", {
        cliente: reserva.cliente,
        sede: sedeNombre,
        servicio: reserva.servicio,
        fecha: fmtFechaLarga(reserva.fecha),
        hora: reserva.hora,
        precio: reserva.precio.toFixed(2),
      })
    );
    window.open(`https://wa.me/${tel}?text=${msg}`, "_blank");
  };

  const onEmail = () => {
    if (!reserva) return;
    const subj = encodeURIComponent(t("popup.mailSubject", { servicio: reserva.servicio }));
    const body = encodeURIComponent(
      t("popup.mailBody", {
        cliente: reserva.cliente,
        servicio: reserva.servicio,
        fecha: fmtFechaLarga(reserva.fecha),
        hora: reserva.hora,
        especialista: espNombre,
        precio: reserva.precio.toFixed(2),
        notas: reserva.notas ? `\n${t("common.notes")}: ${reserva.notas}\n` : "",
        negocio: session?.negocioName || "BookMy",
      })
    );
    window.location.href = `mailto:${reserva.email}?subject=${subj}&body=${body}`;
  };

  const onPrint = () => {
    if (!reserva) return;
    let area = document.getElementById("bmPrintArea");
    if (!area) {
      area = document.createElement("div");
      area.id = "bmPrintArea";
      document.body.appendChild(area);
    }
    area.innerHTML = `
      <div class="print-logo">BookMy · ${session?.negocioName || ""}</div>
      <div class="print-title">${t("popup.sheetTitle", { id: reserva.id })}</div>
      <div class="print-grid">
        <div class="print-field"><label>${t("common.service")}</label><span>${reserva.servicio}</span></div>
        <div class="print-field"><label>${t("common.state")}</label><span>${t(`estados.${reserva.estado}`)}</span></div>
        <div class="print-field"><label>${t("common.client")}</label><span>${reserva.cliente}</span></div>
        <div class="print-field"><label>${t("common.phone")}</label><span>${reserva.telefono}</span></div>
        <div class="print-field"><label>${t("common.email")}</label><span>${reserva.email}</span></div>
        <div class="print-field"><label>${t("common.price")}</label><span>${reserva.precio.toFixed(2)}€</span></div>
        <div class="print-field"><label>${t("common.date")}</label><span>${fmtFechaLarga(reserva.fecha)}</span></div>
        <div class="print-field"><label>${t("common.time")}</label><span>${reserva.hora}</span></div>
        <div class="print-field"><label>${t("common.branch")}</label><span>${sedeNombre || "—"}</span></div>
        <div class="print-field"><label>${t("common.specialist")}</label><span>${espNombre}</span></div>
      </div>
      ${reserva.notas ? `<div class="print-notes"><strong>${t("common.notes")}:</strong> ${reserva.notas}</div>` : ""}
      <div class="print-footer">${t("popup.printedAt", { fecha: new Date().toLocaleString() })} · BookMy</div>`;
    close();
    setTimeout(() => window.print(), 120);
  };

  return (
    <ReservaPopupContext.Provider value={{ open, close }}>
      {children}

      {reserva && (
        <div className={styles.overlay} onClick={(e) => { if (e.target === e.currentTarget) close(); }}>
          <div className={styles.popup}>
            <div className={`${styles.header} ${styles[reserva.estado]}`}>
              <div className={styles.headerRow}>
                <div>
                  <div className={styles.service}>{reserva.servicio}</div>
                  <span className={styles.badge}>{t(`estados.${reserva.estado}`)}</span>
                </div>
                <button className={styles.close} onClick={close} aria-label={t("popup.close")}>
                  <Icon name="close" strokeWidth={2.2} width={16} height={16} />
                </button>
              </div>
            </div>

            <div className={styles.body}>
              <div className={styles.grid}>
                <div className={styles.field}><label>{t("common.client")}</label><span>{reserva.cliente || "—"}</span></div>
                <div className={styles.field}><label>{t("common.phone")}</label><span>{reserva.telefono || "—"}</span></div>
                <div className={styles.field}><label>{t("common.email")}</label><span style={{ wordBreak: "break-all" }}>{reserva.email || "—"}</span></div>
                <div className={styles.field}><label>{t("common.price")}</label><span className={styles.price}>{reserva.precio.toFixed(2)}€</span></div>
                <div className={styles.field}><label>{t("common.date")}</label><span>{fmtFechaLarga(reserva.fecha)}</span></div>
                <div className={styles.field}><label>{t("common.time")}</label><span>{reserva.hora || "—"}</span></div>
                <div className={styles.field}><label>{t("common.branch")}</label><span>{sedeNombre || "—"}</span></div>
                <div className={styles.field}><label>{t("common.specialist")}</label><span>{espNombre}</span></div>
                {reserva.metodoPago && (
                  <div className={styles.field}>
                    <label>{t("reservas.paymentMethod")}</label>
                    <span>{t(`reservas.pay.${reserva.metodoPago}`)}</span>
                  </div>
                )}
              </div>
              <div className={styles.notes}>{reserva.notas || t("popup.noNotes")}</div>
            </div>

            <div className={styles.actions}>
              <button className={`${styles.actionBtn} ${styles.whatsapp}`} onClick={onWhatsApp}>
                <WhatsAppIcon width={22} height={22} />
                WhatsApp
              </button>
              <button className={`${styles.actionBtn} ${styles.email}`} onClick={onEmail}>
                <Icon name="mail" width={22} height={22} />
                Email
              </button>
              <button className={`${styles.actionBtn} ${styles.print}`} onClick={onPrint}>
                <Icon name="printer" width={22} height={22} />
                {t("popup.print")}
              </button>
            </div>
          </div>
        </div>
      )}
    </ReservaPopupContext.Provider>
  );
}

export const useReservaPopup = () => useContext(ReservaPopupContext);
