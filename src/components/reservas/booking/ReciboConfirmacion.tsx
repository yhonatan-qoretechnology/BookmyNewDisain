"use client";
/* ============================================================
   ReciboConfirmacion — comprobante de la reserva (tipo factura)
   ------------------------------------------------------------
   Presenta la información completa antes de confirmar con
   apariencia de recibo profesional: sede, cliente, profesional,
   servicio, datos de la reserva (fecha, hora, zona horaria),
   resumen económico y método de pago.
============================================================ */
import { memo, useMemo } from "react";
import type {
  ClienteOpcion, MetodoPago, ProfesionalCard, SedeOpcion, ServicioOpcion,
} from "@/models";
import { fmtFechaLarga, fmtMoneda, initials } from "@/constants";
import { useI18n } from "@/i18n";
import Icon from "@/components/ui/Icon";
import { Field } from "@/components/ui/Modal";
import styles from "./booking.module.css";

export interface CardDraft { number: string; expiry: string; cvv: string }

interface ReciboProps {
  empresaNombre: string;
  sede: SedeOpcion | null;
  sedeNombre: string;
  cliente: ClienteOpcion;
  profesional: ProfesionalCard;
  servicio: ServicioOpcion;
  fecha: string | null;
  hora: string | null;
  metodoPago: MetodoPago | null;
  onMetodoPago: (m: MetodoPago) => void;
  card: CardDraft;
  onCardChange: (patch: Partial<CardDraft>) => void;
}

function ReciboConfirmacionBase({
  empresaNombre, sede, sedeNombre, cliente, profesional, servicio,
  fecha, hora, metodoPago, onMetodoPago, card, onCardChange,
}: ReciboProps) {
  const { t } = useI18n();
  const needsCard = metodoPago === "tarjeta";

  /* Zona horaria del navegador (informativa en el comprobante) */
  const zonaHoraria = useMemo(
    () => Intl.DateTimeFormat().resolvedOptions().timeZone || "—",
    []
  );

  const subtotal = servicio.precio;
  const total = servicio.precio;

  return (
    <div className={styles.recibo}>
      {/* Cabecera del comprobante */}
      <header className={styles.reciboHead}>
        <span className={styles.reciboLogo} aria-hidden>
          {sede?.imagen
            ? <img src={sede.imagen} alt="" />
            : <Icon name="mapPin" width={22} height={22} strokeWidth={1.8} />}
        </span>
        <div className={styles.reciboHeadTxt}>
          <div className={styles.reciboTitulo}>{t("booking.receiptTitle")}</div>
          <div className={styles.reciboSub}>{t("booking.receiptSub")}</div>
        </div>
        <div className={styles.reciboEmpresa}>
          {empresaNombre}<br />{sedeNombre}
        </div>
      </header>

      <div className={styles.reciboBody}>
        <div className={styles.reciboGrid}>
          {/* Información de la sede */}
          <section className={styles.reciboBlock}>
            <h4>{t("booking.branchInfo")}</h4>
            <div className={styles.reciboRow}><label>{t("booking.name")}</label><span>{sede?.nombre || sedeNombre}</span></div>
            <div className={styles.reciboRow}><label>{t("booking.address")}</label><span>{sede?.direccion || "—"}</span></div>
            <div className={styles.reciboRow}><label>{t("booking.phone")}</label><span>{sede?.telefono || "—"}</span></div>
          </section>

          {/* Información del cliente */}
          <section className={styles.reciboBlock}>
            <h4>{t("booking.clientInfo")}</h4>
            <div className={styles.reciboRow}><label>{t("booking.fullName")}</label><span>{cliente.nombre}</span></div>
            <div className={styles.reciboRow}><label>{t("booking.document")}</label><span>{cliente.documento || "—"}</span></div>
            <div className={styles.reciboRow}><label>{t("booking.email")}</label><span>{cliente.email}</span></div>
            <div className={styles.reciboRow}><label>{t("booking.phone")}</label><span>{cliente.telefono || "—"}</span></div>
          </section>

          {/* Información del profesional */}
          <section className={styles.reciboBlock}>
            <h4>{t("booking.proInfo")}</h4>
            <div className={styles.reciboPersona}>
              <span className={styles.reciboAvatar} aria-hidden>
                {profesional.foto ? <img src={profesional.foto} alt="" /> : initials(profesional.nombre)}
              </span>
              <div>
                <div className={styles.reciboRow} style={{ padding: 0 }}>
                  <span>{profesional.nombre}</span>
                </div>
              </div>
            </div>
            <div className={styles.reciboRow}>
              <label>{t("booking.specialty")}</label>
              <span>{profesional.especialidad || "—"}</span>
            </div>
          </section>

          {/* Datos de la reserva */}
          <section className={styles.reciboBlock}>
            <h4>{t("booking.bookingInfo")}</h4>
            <div className={styles.reciboRow}><label>{t("booking.date")}</label><span>{fmtFechaLarga(fecha || "")}</span></div>
            <div className={styles.reciboRow}><label>{t("booking.time")}</label><span>{hora || "—"}</span></div>
            <div className={styles.reciboRow}><label>{t("booking.timezone")}</label><span>{zonaHoraria}</span></div>
          </section>
        </div>

        <hr className={styles.reciboSep} />

        {/* Servicio */}
        <section className={styles.reciboBlock}>
          <h4>{t("booking.serviceInfo")}</h4>
          <span className={styles.categoriaChip}>{servicio.categoria}</span>
          <div className={styles.reciboRow}><label>{t("booking.name")}</label><span>{servicio.nombre}</span></div>
          <div className={styles.reciboRow}><label>{t("booking.duration")}</label><span>{t("booking.minutes", { n: servicio.duracion })}</span></div>
          <div className={styles.reciboRow}><label>{t("booking.price")}</label><span>{fmtMoneda(servicio.precio, servicio.moneda)}</span></div>
          <div className={styles.reciboRow}><label>{t("booking.currency")}</label><span>{servicio.moneda}</span></div>
        </section>

        <hr className={styles.reciboSep} />

        {/* Resumen económico */}
        <section className={styles.reciboBlock}>
          <h4>{t("booking.economicSummary")}</h4>
          <div className={styles.reciboRow}>
            <label>{t("booking.subtotal")}</label>
            <span>{fmtMoneda(subtotal, servicio.moneda)}</span>
          </div>
          <div className={styles.reciboRow}>
            <label>{t("booking.currency")}</label>
            <span>{servicio.moneda}</span>
          </div>
          <div className={styles.totalBand}>
            <label>{t("booking.total")}</label>
            <span>{fmtMoneda(total, servicio.moneda)}</span>
          </div>
        </section>

        <hr className={styles.reciboSep} />

        {/* Método de pago */}
        <section className={styles.reciboBlock}>
          <h4 className={styles.pagoTitulo}>{t("booking.paymentMethod")}</h4>
          <div className={styles.payRow}>
            {(["tarjeta", "efectivo"] as MetodoPago[]).map((m) => (
              <button
                key={m}
                type="button"
                className={`${styles.payOption} ${metodoPago === m ? styles.selected : ""}`}
                onClick={() => onMetodoPago(m)}
                aria-pressed={metodoPago === m}
              >
                {m === "tarjeta" ? t("booking.payCard") : t("booking.payCash")}
              </button>
            ))}
          </div>

          {needsCard && (
            <div className={styles.cardFields}>
              <Field label={t("booking.cardNumber")} htmlFor="bk-card">
                <input
                  id="bk-card" inputMode="numeric" placeholder="4242424242424242"
                  value={card.number}
                  onChange={(e) => onCardChange({ number: e.target.value.replace(/\D/g, "") })}
                />
              </Field>
              <Field label={t("booking.cardExpiry")} htmlFor="bk-exp">
                <input
                  id="bk-exp" placeholder="MM/YY" maxLength={5}
                  value={card.expiry}
                  onChange={(e) => onCardChange({ expiry: e.target.value })}
                />
              </Field>
              <Field label={t("booking.cardCvv")} htmlFor="bk-cvv">
                <input
                  id="bk-cvv" inputMode="numeric" placeholder="123" maxLength={4}
                  value={card.cvv}
                  onChange={(e) => onCardChange({ cvv: e.target.value.replace(/\D/g, "") })}
                />
              </Field>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export default memo(ReciboConfirmacionBase);
