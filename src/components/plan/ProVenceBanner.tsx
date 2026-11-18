"use client";
/* ============================================================
   ProVenceBanner — «Tu plan Pro vence en X días»
   ------------------------------------------------------------
   Solo al dueño y solo cuando toca: le quedan pocos días de Pro
   pagado (o de regalo/prueba) o ya venció hace poco. Botón directo
   a pagar la membresía. Se puede cerrar por hoy.
============================================================ */
import { useState } from "react";
import Link from "next/link";
import { ROUTES } from "@/constants";
import { MembresiaApi } from "@/api/modules";
import type { ApiMembresiaMia } from "@/api/types";
import { useData } from "@/hooks/useData";
import { useSession } from "@/context/SessionContext";
import { useI18n } from "@/i18n";
import Icon from "@/components/ui/Icon";
import styles from "./ProVenceBanner.module.css";

const CLAVE = "bm_pro_vence_oculto";
const hoy = () => new Date().toISOString().slice(0, 10);

export default function ProVenceBanner() {
  const { session } = useSession();
  const { t } = useI18n();
  const esDueno = session?.role === "owner";
  const [oculto, setOculto] = useState(() => {
    try { return localStorage.getItem(CLAVE) === hoy(); } catch { return false; }
  });
  const { data } = useData(
    () => (esDueno ? MembresiaApi.mia().catch(() => null) : Promise.resolve(null)),
    [esDueno, session?.negocioId],
    null as ApiMembresiaMia | null
  );

  if (!esDueno || oculto || !data || data.contratadoManual) return null;
  const dias = data.diasRestantes;
  /* Vencido hace 30 días o menos (después ya lo cuenta el plan gratuito) */
  const vencido = dias != null && dias < 0 && dias >= -30 && !!data.estado.proPagadoHasta;
  if (!data.porVencer && !vencido) return null;

  const cerrar = () => {
    try { localStorage.setItem(CLAVE, hoy()); } catch { /* sin almacenamiento */ }
    setOculto(true);
  };

  return (
    <div className={`${styles.banner} ${vencido ? styles.vencido : ""}`} role="status">
      <span className={styles.icono}><Icon name={vencido ? "clock" : "star"} /></span>
      <p className={styles.texto}>
        <b>
          {vencido
            ? t("membresia.vencido")
            : dias === 0
              ? t("membresia.venceHoy")
              : t("membresia.venceEn", { n: dias ?? 0 })}
        </b>
        <span>{t("membresia.venceTexto")}</span>
      </p>
      <Link href={ROUTES.planPagar} className={styles.boton}>{t("membresia.actualizarPago")}</Link>
      <button type="button" className={styles.cerrar} onClick={cerrar} aria-label={t("common.close")}>
        <Icon name="x" />
      </button>
    </div>
  );
}
