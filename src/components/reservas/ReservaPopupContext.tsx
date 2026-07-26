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

const IMG_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL_IMG || "https://bookmy.es/";

interface ReservaPopupValue {
  open: (idOrReserva: string | Reserva) => Promise<void>;
  close: () => void;
}

const ReservaPopupContext = createContext<ReservaPopupValue>({
  open: async () => {},
  close: () => {},
});

export function ReservaPopupProvider({ children }: { children: React.ReactNode }) {
  const { t, locale } = useI18n();
  const { session } = useSession();
  const [reserva, setReserva] = useState<Reserva | null>(null);
  const [loading, setLoading] = useState(false);

  const open = useCallback(async (idOrReserva: string | Reserva) => {
    setLoading(true);
    try {
      let apiId: number;
      
      if (typeof idOrReserva === 'string') {
        apiId = parseInt(idOrReserva.replace('R-', ''), 10);
        console.log('[ReservaPopup] Opening appointment by ID:', idOrReserva, 'API ID:', apiId);
      } else {
        apiId = idOrReserva.apiId!;
        console.log('[ReservaPopup] Opening appointment with object, API ID:', apiId);
      }
      
      const { AppointmentsApi, ServicesApi, AuthApi, PaymentsApi } = await import("@/api/modules");
      const { mapAppointment } = await import("@/api/mappers");
      
      // Get service names for current language
      const services = await ServicesApi.findAll(locale).catch(() => []);
      const serviceNames = new Map(services.map((s: any) => [s.id, s.name]));
      
      const apiReserva = await AppointmentsApi.findOne(apiId);
      console.log('[ReservaPopup] API Response:', apiReserva);
      console.log('[ReservaPopup] User data:', apiReserva.user);
      console.log('[ReservaPopup] Payment data:', apiReserva.Payment);
      
      // Fetch payment separately since it's not included
      let payment = apiReserva.Payment;
      if (!payment) {
        try {
          const payments = await PaymentsApi.findAll();
          payment = payments.find(p => p.appointmentId === apiId);
          console.log('[ReservaPopup] Fetched payment separately:', payment);
        } catch (e) {
          console.warn('[ReservaPopup] Could not fetch payment:', e);
        }
      }
      
      // Fetch user data separately to get phone and name
      let userWithPhone = apiReserva.user;
      if (apiReserva.user && (!apiReserva.user.UserData?.phone || !apiReserva.user.UserData?.name)) {
        try {
          const users = await AuthApi.findAllUsers();
          const fullUser = users.find(u => u.id === apiReserva.user?.id);
          if (fullUser?.UserData) {
            userWithPhone = { 
              ...apiReserva.user, 
              UserData: { 
                ...apiReserva.user.UserData, 
                phone: fullUser.UserData.phone || apiReserva.user.UserData?.phone,
                name: fullUser.UserData.name || apiReserva.user.UserData?.name
              } 
            };
            console.log('[ReservaPopup] Fetched user data separately:', fullUser.UserData);
          }
        } catch (e) {
          console.warn('[ReservaPopup] Could not fetch user data:', e);
        }
      }
      
      // Merge the fetched data
      const enhancedReserva = {
        ...apiReserva,
        Payment: payment,
        user: userWithPhone
      };
      
      const mapped = mapAppointment(enhancedReserva, serviceNames);
      console.log('[ReservaPopup] Mapped reservation:', mapped);
      
      setReserva(mapped);
    } catch (error) {
      console.error('[ReservaPopup] Error fetching appointment:', error);
      // Fallback to cache if API fails
      if (typeof idOrReserva === 'string') {
        const r = ReservasController.getById(idOrReserva);
        if (r) {
          console.log('[ReservaPopup] Using cache fallback:', r);
          setReserva(r);
        }
      } else {
        console.log('[ReservaPopup] Using passed object as fallback:', idOrReserva);
        setReserva(idOrReserva);
      }
    } finally {
      setLoading(false);
    }
  }, [locale]);

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
    console.log('[ReservaPopup] WhatsApp button clicked');
    if (!reserva) return;
    const tel = (reserva.telefono || "").replace(/\D/g, "");
    console.log('[ReservaPopup] Phone number:', tel);
    if (!tel) {
      console.warn('[ReservaPopup] No phone number available');
      return;
    }
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
    const url = `https://wa.me/${tel}?text=${msg}`;
    console.log('[ReservaPopup] Opening WhatsApp:', url);
    window.open(url, "_blank");
  };

  const onEmail = () => {
    console.log('[ReservaPopup] Email button clicked');
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
    const url = `mailto:${reserva.email}?subject=${subj}&body=${body}`;
    console.log('[ReservaPopup] Opening email:', url);
    window.location.href = url;
  };

  const onPrint = () => {
    console.log('[ReservaPopup] Print button clicked');
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
        <div class="print-field"><label>${t("common.duration")}</label><span>${reserva.duracion} min</span></div>
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
            {loading && (
              <div style={{ 
                position: 'absolute', 
                inset: 0, 
                background: 'rgba(255,255,255,0.8)', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                borderRadius: 'inherit',
                zIndex: 10 
              }}>
                <span style={{ color: 'var(--teal-500)', fontWeight: 600 }}>Cargando...</span>
              </div>
            )}
            <div className={`${styles.header} ${styles[reserva.estado]}`}>
              {reserva.sedeImagenes && reserva.sedeImagenes.length > 0 && (
                <img 
                  src={`${IMG_BASE_URL}${reserva.sedeImagenes[0]}`} 
                  alt={sedeNombre} 
                  style={{ 
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    opacity: 0.15,
                    zIndex: 0
                  }} 
                />
              )}
              <div style={{ position: 'relative', zIndex: 1 }}>
                <div className={styles.headerRow}>
                  <div>
                    <div style={{ fontSize: '13px', opacity: 0.9, marginBottom: '4px' }}>{sedeNombre || "—"}</div>
                    <div className={styles.service}>{reserva.servicio}</div>
                    <span className={styles.badge}>{t(`estados.${reserva.estado}`)}</span>
                  </div>
                  <button className={styles.close} onClick={close} aria-label={t("popup.close")}>
                    <Icon name="close" strokeWidth={2.2} width={16} height={16} />
                  </button>
                </div>
              </div>
            </div>

            <div className={styles.body}>
              <div className={styles.grid}>
                <div className={styles.field}>
                  <label>{t("common.client")}</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {reserva.clienteFoto && (
                      <img 
                        src={`${IMG_BASE_URL}${reserva.clienteFoto}`} 
                        alt=""
                        style={{ 
                          width: '40px', 
                          height: '40px', 
                          borderRadius: '50%',
                          objectFit: 'cover'
                        }} 
                      />
                    )}
                    <span>{reserva.cliente || "—"}</span>
                  </div>
                </div>
                <div className={styles.field}><label>{t("common.phone")}</label><span>{reserva.telefono || "—"}</span></div>
                <div className={styles.field}><label>{t("common.email")}</label><span style={{ wordBreak: "break-all" }}>{reserva.email || "—"}</span></div>
                <div className={styles.field}><label>{t("common.price")}</label><span className={styles.price}>{reserva.precio.toFixed(2)}€</span></div>
                <div className={styles.field}><label>{t("common.date")}</label><span>{fmtFechaLarga(reserva.fecha)}</span></div>
                <div className={styles.field}><label>{t("common.time")}</label><span>{reserva.hora || "—"}</span></div>
                <div className={styles.field}><label>{t("common.duration")}</label><span>{reserva.duracion} min</span></div>
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
