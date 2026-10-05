"use client";
/* ============================================================
   KycPanel — verificación del negocio (la ve su dueño)
   ------------------------------------------------------------
   Sube la documentación a POST /empresas/:id/kyc y queda EN_REVISION
   hasta que el superadmin la apruebe. No bloquea nada: el negocio
   sigue trabajando igual mientras espera.

   Los archivos que no se vuelvan a subir conservan los anteriores,
   para poder corregir solo lo que pidió el superadmin.
============================================================ */
import { useState } from "react";
import type { ApiEmpresaKyc, ApiKycEstado } from "@/api/types";
import { ARCHIVOS_KYC, KycController, type ArchivoKyc } from "@/controllers/KycController";
import { useData } from "@/hooks/useData";
import { useSession } from "@/context/SessionContext";
import { useUi } from "@/context/UiContext";
import { useI18n } from "@/i18n";
import Panel, { PanelHead } from "@/components/ui/Panel";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import styles from "./Kyc.module.css";

const TIPOS_DOCUMENTO = ["DNI", "NIE", "Pasaporte"] as const;

/** Cómo se pinta cada estado con los colores que ya usa el panel. */
export const BADGE_KYC: Record<ApiKycEstado, "activo" | "pendiente" | "inactivo" | "cancelado"> = {
  APROBADA: "activo",
  EN_REVISION: "pendiente",
  PENDIENTE: "inactivo",
  RECHAZADA: "cancelado",
};

type Archivos = Partial<Record<ArchivoKyc, File | null>>;

export default function KycPanel() {
  const { session } = useSession();
  const { toast } = useUi();
  const { t } = useI18n();

  const empresaId = Number(session?.negocioId) || 0;

  const { data: kyc, reload } = useData<ApiEmpresaKyc | null>(
    () => (empresaId ? KycController.estado(empresaId).catch(() => null) : Promise.resolve(null)),
    [empresaId],
    null,
  );

  const [nifCif, setNifCif] = useState("");
  const [documentoTipo, setDocumentoTipo] = useState("");
  const [archivos, setArchivos] = useState<Archivos>({});
  const [enviando, setEnviando] = useState(false);

  if (!empresaId) return null;

  const estado = kyc?.estado ?? "PENDIENTE";
  const aprobada = estado === "APROBADA";

  const enviar = async () => {
    setEnviando(true);
    try {
      await KycController.enviar(empresaId, {
        nifCif: nifCif || kyc?.nifCif || undefined,
        documentoTipo: documentoTipo || kyc?.documentoTipo || undefined,
        ...archivos,
      });
      setArchivos({});
      await reload();
      toast(t("kyc.enviado"), "success");
    } catch (e) {
      toast(e instanceof Error ? e.message : t("common.error"), "error");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <Panel>
      <PanelHead title={t("kyc.titulo")} sub={t("kyc.sub")} />

      <div className={styles.estadoRow}>
        <Badge kind={BADGE_KYC[estado]}>{t(`kyc.estados.${estado}`)}</Badge>
        {kyc?.enviadoEn && (
          <span className={styles.nota}>
            {t("kyc.enviadoEl", { fecha: new Date(kyc.enviadoEn).toLocaleDateString() })}
          </span>
        )}
      </div>

      {estado === "RECHAZADA" && kyc?.motivoRechazo && (
        <p className={styles.motivo}>{t("kyc.motivoRechazo", { motivo: kyc.motivoRechazo })}</p>
      )}

      {aprobada ? (
        <p className={styles.nota}>{t("kyc.aprobadaMsg")}</p>
      ) : (
        <>
          {estado === "EN_REVISION" && <p className={styles.nota}>{t("kyc.enRevisionMsg")}</p>}

          <div className={styles.form}>
            <div className={styles.fila}>
              <label className={styles.campo}>
                <span>{t("kyc.nifCif")}</span>
                <input
                  value={nifCif || kyc?.nifCif || ""}
                  onChange={(e) => setNifCif(e.target.value)}
                  placeholder={t("kyc.nifCifPlaceholder")}
                />
              </label>
              <label className={styles.campo}>
                <span>{t("kyc.tipoDocumento")}</span>
                <select
                  value={documentoTipo || kyc?.documentoTipo || ""}
                  onChange={(e) => setDocumentoTipo(e.target.value)}
                >
                  <option value="">{t("reservas.selectPlaceholder")}</option>
                  {TIPOS_DOCUMENTO.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </label>
            </div>

            <div className={styles.fila}>
              {ARCHIVOS_KYC.map((campo) => (
                <label key={campo} className={styles.campo}>
                  <span>{t(`kyc.archivos.${campo}`)}</span>
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={(e) =>
                      setArchivos((prev) => ({ ...prev, [campo]: e.target.files?.[0] ?? null }))
                    }
                  />
                  {/* Ya hay uno guardado: subir otro solo si hay que corregirlo */}
                  {kyc?.[campo] && !archivos[campo] && (
                    <span className={styles.subido}>{t("kyc.yaSubido")}</span>
                  )}
                  <small>{t(`kyc.ayuda.${campo}`)}</small>
                </label>
              ))}
            </div>

            <p className={styles.nota}>{t("kyc.nota")}</p>

            <div>
              <Button onClick={() => void enviar()} disabled={enviando}>
                {enviando ? t("kyc.enviando") : t("kyc.enviar")}
              </Button>
            </div>
          </div>
        </>
      )}
    </Panel>
  );
}
