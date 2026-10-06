"use client";
/* ============================================================
   KycWizard — verificación del negocio, paso a paso
   ------------------------------------------------------------
   Antes era un formulario plano con cuatro campos de archivo: no
   se veía qué se había subido, ni en qué punto estaba la cosa.
   Ahora va por pasos (datos → documento → selfie → repaso) y, una
   vez enviado, enseña en qué estado está la revisión.

   La revisión la hace una persona (el superadmin), así que todo
   esto es recoger bien la documentación, no verificarla sola.
============================================================ */
import { useState } from "react";
import type { ApiEmpresaKyc } from "@/api/types";
import { KycController } from "@/controllers/KycController";
import { useData } from "@/hooks/useData";
import { useSession } from "@/context/SessionContext";
import { useUi } from "@/context/UiContext";
import { useI18n } from "@/i18n";
import Panel, { PanelHead } from "@/components/ui/Panel";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Icon from "@/components/ui/Icon";
import SubidaArchivo from "./SubidaArchivo";
import { BADGE_KYC } from "./estados";
import styles from "./KycWizard.module.css";

const TIPOS_DOCUMENTO = ["DNI", "NIE", "Pasaporte"] as const;
const PASOS = ["datos", "documento", "selfie", "repaso"] as const;
type Paso = (typeof PASOS)[number];

interface Archivos {
  documentoFrente: File | null;
  documentoDorso: File | null;
  selfie: File | null;
  justificante: File | null;
}

const SIN_ARCHIVOS: Archivos = {
  documentoFrente: null, documentoDorso: null, selfie: null, justificante: null,
};

export default function KycWizard() {
  const { session } = useSession();
  const { toast } = useUi();
  const { t } = useI18n();

  const empresaId = Number(session?.negocioId) || 0;
  const puedeEnviar = session?.role === "owner";

  const { data: kyc, reload } = useData<ApiEmpresaKyc | null>(
    () => (empresaId ? KycController.estado(empresaId).catch(() => null) : Promise.resolve(null)),
    [empresaId],
    null,
  );

  const [paso, setPaso] = useState<Paso>("datos");
  const [corrigiendo, setCorrigiendo] = useState(false);
  const [nifCif, setNifCif] = useState("");
  const [documentoTipo, setDocumentoTipo] = useState("");
  const [archivos, setArchivos] = useState<Archivos>(SIN_ARCHIVOS);
  const [enviando, setEnviando] = useState(false);

  if (!empresaId) {
    return (
      <Panel>
        <PanelHead title={t("kyc.titulo")} sub={t("kyc.sub")} />
        <p className={styles.nota}>{t("kyc.sinNegocio")}</p>
      </Panel>
    );
  }

  const estado = kyc?.estado ?? "PENDIENTE";
  const nif = nifCif || kyc?.nifCif || "";
  const tipo = documentoTipo || kyc?.documentoTipo || "";
  /* El pasaporte no tiene reverso: pedirlo solo confunde. */
  const pideDorso = tipo !== "Pasaporte";
  const tieneFrente = !!archivos.documentoFrente || !!kyc?.documentoFrente;

  /* ── Estado de la revisión: cuando ya se envió, manda esto ── */
  const enCurso = estado === "EN_REVISION" || estado === "APROBADA";
  if (!corrigiendo && (enCurso || estado === "RECHAZADA")) {
    /* Aquí ya se envió: lo único por decidir es si hay resolución. */
    const hitos = [
      { clave: "enviada", hecho: true },
      { clave: "revisando", hecho: true },
      { clave: "resuelta", hecho: estado !== "EN_REVISION" },
    ];

    return (
      <Panel>
        <PanelHead title={t("kyc.titulo")} sub={t("kyc.sub")} />

        <div className={styles.estadoCabecera}>
          <Badge kind={BADGE_KYC[estado]}>{t(`kyc.estados.${estado}`)}</Badge>
          {kyc?.enviadoEn && (
            <span className={styles.nota}>
              {t("kyc.enviadoEl", { fecha: new Date(kyc.enviadoEn).toLocaleDateString() })}
            </span>
          )}
        </div>

        <ol className={styles.linea}>
          {hitos.map((h) => (
            <li key={h.clave} className={h.hecho ? styles.hitoHecho : styles.hitoPendiente}>
              <Icon name={h.hecho ? "circle-check" : "clock"} width={17} height={17} />
              <div>
                <b>{t(`kyc.linea.${h.clave}`)}</b>
                <span>{t(`kyc.lineaSub.${h.clave}`)}</span>
              </div>
            </li>
          ))}
        </ol>

        {estado === "RECHAZADA" && kyc?.motivoRechazo && (
          <p className={styles.motivo}>{t("kyc.motivoRechazo", { motivo: kyc.motivoRechazo })}</p>
        )}

        {estado === "APROBADA" ? (
          <p className={styles.nota}>{t("kyc.aprobadaMsg")}</p>
        ) : puedeEnviar ? (
          <Button variant="ghost" onClick={() => { setCorrigiendo(true); setPaso("datos"); }}>
            {estado === "RECHAZADA" ? t("kyc.corregir") : t("kyc.editarEnvio")}
          </Button>
        ) : (
          <p className={styles.nota}>{t("kyc.soloDuenio")}</p>
        )}
      </Panel>
    );
  }

  /* ── Asistente ────────────────────────────────────────────── */
  const indice = PASOS.indexOf(paso);
  const puedeSeguir =
    (paso === "datos" && !!nif.trim() && !!tipo) ||
    (paso === "documento" && tieneFrente) ||
    paso === "selfie" ||
    paso === "repaso";

  const enviar = async () => {
    setEnviando(true);
    try {
      await KycController.enviar(empresaId, { nifCif: nif, documentoTipo: tipo, ...archivos });
      setArchivos(SIN_ARCHIVOS);
      setCorrigiendo(false);
      setPaso("datos");
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

      {/* Dónde estoy y cuánto falta */}
      <ol className={styles.pasos}>
        {PASOS.map((p, i) => (
          <li
            key={p}
            className={[
              styles.paso,
              i < indice ? styles.pasoHecho : "",
              i === indice ? styles.pasoActual : "",
            ].filter(Boolean).join(" ")}
            aria-current={i === indice ? "step" : undefined}
          >
            <span className={styles.pasoNum}>
              {i < indice ? <Icon name="check" width={13} height={13} /> : i + 1}
            </span>
            {t(`kyc.pasos.${p}`)}
          </li>
        ))}
      </ol>

      <div className={styles.cuerpo}>
        {paso === "datos" && (
          <>
            <p className={styles.lead}>{t("kyc.pasoDatosLead")}</p>
            <div className={styles.rejilla}>
              <label className={styles.campo}>
                <span>{t("kyc.nifCif")}</span>
                <input value={nif} onChange={(e) => setNifCif(e.target.value)} placeholder={t("kyc.nifCifPlaceholder")} />
              </label>
              <label className={styles.campo}>
                <span>{t("kyc.tipoDocumento")}</span>
                <select value={tipo} onChange={(e) => setDocumentoTipo(e.target.value)}>
                  <option value="">{t("reservas.selectPlaceholder")}</option>
                  {TIPOS_DOCUMENTO.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              </label>
            </div>
          </>
        )}

        {paso === "documento" && (
          <>
            <p className={styles.lead}>{t("kyc.pasoDocumentoLead")}</p>
            <div className={styles.rejilla}>
              <SubidaArchivo
                etiqueta={t("kyc.archivos.documentoFrente")}
                ayuda={t("kyc.ayuda.documentoFrente")}
                archivo={archivos.documentoFrente}
                guardado={kyc?.documentoFrente}
                onElegir={(f) => setArchivos((a) => ({ ...a, documentoFrente: f }))}
              />
              {pideDorso && (
                <SubidaArchivo
                  etiqueta={t("kyc.archivos.documentoDorso")}
                  ayuda={t("kyc.ayuda.documentoDorso")}
                  archivo={archivos.documentoDorso}
                  guardado={kyc?.documentoDorso}
                  onElegir={(f) => setArchivos((a) => ({ ...a, documentoDorso: f }))}
                />
              )}
            </div>
          </>
        )}

        {paso === "selfie" && (
          <>
            <p className={styles.lead}>{t("kyc.pasoSelfieLead")}</p>
            <div className={styles.rejilla}>
              <SubidaArchivo
                etiqueta={t("kyc.archivos.selfie")}
                ayuda={t("kyc.ayuda.selfie")}
                archivo={archivos.selfie}
                guardado={kyc?.selfie}
                onElegir={(f) => setArchivos((a) => ({ ...a, selfie: f }))}
              />
            </div>
          </>
        )}

        {paso === "repaso" && (
          <>
            <p className={styles.lead}>{t("kyc.pasoRepasoLead")}</p>
            <div className={styles.rejilla}>
              <SubidaArchivo
                etiqueta={t("kyc.archivos.justificante")}
                ayuda={t("kyc.ayuda.justificante")}
                archivo={archivos.justificante}
                guardado={kyc?.justificante}
                onElegir={(f) => setArchivos((a) => ({ ...a, justificante: f }))}
              />
            </div>

            <ul className={styles.repaso}>
              <li><span>{t("kyc.nifCif")}</span><b>{nif || "—"}</b></li>
              <li><span>{t("kyc.tipoDocumento")}</span><b>{tipo || "—"}</b></li>
              <li>
                <span>{t("kyc.archivos.documentoFrente")}</span>
                <b className={tieneFrente ? styles.ok : styles.falta}>
                  {tieneFrente ? t("kyc.listo") : t("kyc.falta")}
                </b>
              </li>
              <li>
                <span>{t("kyc.archivos.selfie")}</span>
                <b className={archivos.selfie || kyc?.selfie ? styles.ok : styles.falta}>
                  {archivos.selfie || kyc?.selfie ? t("kyc.listo") : t("kyc.opcional")}
                </b>
              </li>
            </ul>
            <p className={styles.nota}>{t("kyc.nota")}</p>
          </>
        )}
      </div>

      <div className={styles.navegacion}>
        <Button
          variant="ghost"
          disabled={indice === 0 || enviando}
          onClick={() => setPaso(PASOS[Math.max(0, indice - 1)])}
        >
          {t("kyc.atras")}
        </Button>

        {paso === "repaso" ? (
          <Button disabled={!tieneFrente || enviando || !puedeEnviar} onClick={() => void enviar()}>
            {enviando ? t("kyc.enviando") : t("kyc.enviar")}
          </Button>
        ) : (
          <Button disabled={!puedeSeguir} onClick={() => setPaso(PASOS[indice + 1])}>
            {t("kyc.siguiente")}
          </Button>
        )}
      </div>

      {!puedeEnviar && <p className={styles.nota}>{t("kyc.soloDuenio")}</p>}
    </Panel>
  );
}
