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
                phone: fullUser.UserData.phone || apiReserva.user.UserData?.phone || "",
                name: fullUser.UserData.name || apiReserva.user.UserData?.name || ""
              } as any
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

  const onEmail = async () => {
    console.log('[ReservaPopup] Email button clicked - START');
    if (!reserva) {
      console.log('[ReservaPopup] No reserva data, returning');
      return;
    }
    console.log('[ReservaPopup] Reserva data for email:', reserva);

    const emailEndpoint = "https://web-3o8dd5nhjvbs.up-de-fra1-k8s-1.apps.run-on-seenode.com/email/send-invoice";
    console.log('[ReservaPopup] Email endpoint:', emailEndpoint);

    try {
      const emailData = {
        to: reserva.email,
        subject: t("popup.mailSubject", { servicio: reserva.servicio }),
        body: t("popup.mailBody", {
          cliente: reserva.cliente,
          servicio: reserva.servicio,
          fecha: fmtFechaLarga(reserva.fecha),
          hora: reserva.hora,
          especialista: espNombre,
          precio: reserva.precio.toFixed(2),
          notas: reserva.notas ? `\n${t("common.notes")}: ${reserva.notas}\n` : "",
          negocio: session?.negocioName || "BookMy",
        }),
        reservaId: reserva.id,
      };

      console.log('[ReservaPopup] Sending email with data:', emailData);

      const response = await fetch(emailEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(emailData),
      });

      console.log('[ReservaPopup] Email response status:', response.status);

      if (response.ok) {
        console.log('[ReservaPopup] Email sent successfully');
        alert('Email enviado correctamente');
      } else {
        console.error('[ReservaPopup] Email send failed:', response.statusText);
        alert('Error al enviar el email');
      }
    } catch (error) {
      console.error('[ReservaPopup] Error sending email:', error);
      alert('Error al enviar el email');
    }
  };

  const onPrint = async () => {
    console.log('[ReservaPopup] Print button clicked - START');
    console.log('[ReservaPopup] Reserva data:', reserva);
    if (!reserva) {
      console.log('[ReservaPopup] No reserva data, returning');
      return;
    }

    try {
      console.log('[ReservaPopup] Importing jsPDF...');
      const jsPDF = (await import("jspdf")).default;
      console.log('[ReservaPopup] jsPDF imported successfully');
      const doc = new jsPDF();
      console.log('[ReservaPopup] jsPDF document created');
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      let y = 20;

      // Header
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text(`BookMy · ${session?.negocioName || ""}`, 20, y);
      y += 12;

      // Title
      doc.setFontSize(22);
      doc.text(t("popup.sheetTitle", { id: reserva.id }), 20, y);
      y += 20;

      // Grid layout
      const fields = [
        { label: t("common.service"), value: reserva.servicio },
        { label: t("common.state"), value: t(`estados.${reserva.estado}`) },
        { label: t("common.client"), value: reserva.cliente },
        { label: t("common.phone"), value: reserva.telefono || "—" },
        { label: t("common.email"), value: reserva.email || "—" },
        { label: t("common.price"), value: `${reserva.precio.toFixed(2)}€` },
        { label: t("common.date"), value: fmtFechaLarga(reserva.fecha) },
        { label: t("common.time"), value: reserva.hora || "—" },
        { label: t("common.duration"), value: `${reserva.duracion} min` },
        { label: t("common.branch"), value: sedeNombre || "—" },
        { label: t("common.specialist"), value: espNombre },
      ];

      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
      
      fields.forEach((field, index) => {
        const col = index % 2 === 0 ? 20 : pageWidth / 2 + 10;
        const rowY = y + Math.floor(index / 2) * 12;
        
        doc.setFont("helvetica", "bold");
        doc.setTextColor(100);
        doc.text(field.label, col, rowY);
        
        doc.setFont("helvetica", "normal");
        doc.setTextColor(0);
        doc.text(field.value, col + 50, rowY);
      });

      y += Math.ceil(fields.length / 2) * 12 + 15;

      // Notes
      if (reserva.notas) {
        doc.setFont("helvetica", "bold");
        doc.setTextColor(0);
        doc.text(`${t("common.notes")}:`, 20, y);
        y += 8;
        doc.setFont("helvetica", "normal");
        doc.setTextColor(60);
        const splitNotes = doc.splitTextToSize(reserva.notas, pageWidth - 40);
        doc.text(splitNotes, 20, y);
        y += splitNotes.length * 6 + 15;
      }

      // Footer
      doc.setFontSize(9);
      doc.setTextColor(100);
      doc.text(t("popup.printedAt", { fecha: new Date().toLocaleString() }) + " · BookMy", 20, pageHeight - 15);

      // Save PDF
      const fileName = `reserva-${reserva.id}.pdf`;
      console.log('[ReservaPopup] Saving PDF as:', fileName);
      doc.save(fileName);
      console.log('[ReservaPopup] PDF saved successfully:', fileName);
    } catch (error) {
      console.error('[ReservaPopup] Error generating PDF:', error);
    }
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
                zIndex: 10,
                pointerEvents: 'none'
              }}>
                <span style={{ color: 'var(--teal-500)', fontWeight: 600 }}>Cargando...</span>
              </div>
            )}
            <div className={`${styles.header} ${styles[reserva.estado]}`}>
              <div className={styles.headerRow}>
                <div>
                  <div className={styles.headerSede}>{sedeNombre || "—"}</div>
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
