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
import { useRegion } from "@/context/RegionContext";
import { useI18n, esPaisIso, PAIS_POR_DEFECTO, type PaisIso } from "@/i18n";
import Panel, { PanelHead } from "@/components/ui/Panel";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Icon from "@/components/ui/Icon";
import SubidaArchivo from "./SubidaArchivo";
import { BADGE_KYC } from "./estados";
import styles from "./KycWizard.module.css";

/* Los documentos de identidad no se parecen entre países: pedirle un DNI a
   un colombiano es pedirle algo que no existe. El país cuelga de la empresa
   y se fija en el alta, así que la lista se elige sola y no hay que
   preguntar nada. Se guardan las siglas tal cual, como ya se hacía con las
   españolas: son las que el superadmin lee en la cola de revisión. */
const TIPOS_DOCUMENTO: Record<PaisIso, readonly string[]> = {
  ES: ["DNI", "NIE", "Pasaporte"],
  CO: ["CC", "CE", "Pasaporte", "NIT"],
};

/* Ninguno de estos tiene reverso que fotografiar: pedirlo solo confunde. */
const SIN_REVERSO = ["Pasaporte", "NIT"];

const PASOS = ["datos", "documento", "selfie", "repaso"] as const;
type Paso = (typeof PASOS)[number];

interface Archivos {
  documentoFrente: File | null;
  documentoDorso: File | null;
  selfie: File | null;
  justificante: File | null;
}

const ARCHIVOS_WIZARD = [
  "documentoFrente", "documentoDorso", "selfie", "justificante",
] as const;

const SIN_ARCHIVOS: Archivos = {
  documentoFrente: null, documentoDorso: null, selfie: null, justificante: null,
};

export default function KycWizard() {
  const { session } = useSession();
  const { toast } = useUi();
  const { t } = useI18n();
  /* El nombre del documento fiscal sale del país de la empresa (NIF/CIF o
     NIT), que es lo que manda el backend en GET /paises: así no hay dos
     verdades sobre cómo se llama el mismo dato. */
  const { pais, etiqueta } = useRegion();

  const empresaId = Number(session?.negocioId) || 0;
  /* La envía cualquier administrador de la empresa, dueño o de sede: hay
     empresas sin cuenta de dueño y, si solo pudiera él, no se verificarían
     nunca. El backend aplica la misma regla (KycService.exigirAcceso). */
  const puedeEnviar = session?.role === "owner" || session?.role === "admin";

  const { data: kyc, reload } = useData<ApiEmpresaKyc | null>(
    () => (empresaId ? KycController.estado(empresaId).catch(() => null) : Promise.resolve(null)),
    [empresaId],
    null,
  );

  const [paso, setPaso] = useState<Paso>("datos");
  const [corrigiendo, setCorrigiendo] = useState(false);
  const [nifCif, setNifCif] = useState("");
  const [documentoTipo, setDocumentoTipo] = useState("");
  const [documentoNumero, setDocumentoNumero] = useState("");
  const [archivos, setArchivos] = useState<Archivos>(SIN_ARCHIVOS);
  const [enviando, setEnviando] = useState(false);

  if (!empresaId) {
    return (
      <Panel>
        <PanelHead title={t("kyc.titulo")} sub={t("kyc.subPorEstado.PENDIENTE")} />
        <p className={styles.nota}>{t("kyc.sinNegocio")}</p>
      </Panel>
    );
  }

  const estado = kyc?.estado ?? "PENDIENTE";
  const nif = nifCif || kyc?.nifCif || "";
  const tipo = documentoTipo || kyc?.documentoTipo || "";
  const numero = documentoNumero || kyc?.documentoNumero || "";
  const pideDorso = !SIN_REVERSO.includes(tipo);

  const iso = pais.isoCode;
  const tiposDelPais = TIPOS_DOCUMENTO[esPaisIso(iso) ? iso : PAIS_POR_DEFECTO];
  /* Un tipo ya guardado que no esté en la lista del país (empresas dadas de
     alta cuando solo se vendía en España) seguiría elegido por dentro pero
     el desplegable se vería vacío, y al guardar se perdería sin avisar. */
  const tipos = tipo && !tiposDelPais.includes(tipo) ? [...tiposDelPais, tipo] : tiposDelPais;
  const tieneFrente = !!archivos.documentoFrente || !!kyc?.documentoFrente;
  /* Hay algo elegido que todavía no ha salido del navegador: mientras no se
     pulse Enviar, el superadmin no ve nada y las dos pantallas parecen
     contradecirse. */
  const hayElegidoSinEnviar = ARCHIVOS_WIZARD.some((campo) => !!archivos[campo]);

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
        <PanelHead title={t("kyc.titulo")} sub={t(`kyc.subPorEstado.${estado}`)} />

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

  /* Quien no es el dueño no ve el asistente: el backend solo acepta el
     envío del dueño de la empresa (o de un superadmin), así que dejarle
     rellenar cuatro pasos para que el botón final estuviera apagado era
     hacerle perder el rato. Ve el estado y quién tiene que enviarlo. */
  if (!puedeEnviar) {
    return (
      <Panel>
        <PanelHead title={t("kyc.titulo")} sub={t(`kyc.subPorEstado.${estado}`)} />
        <div className={styles.estadoCabecera}>
          <Badge kind={BADGE_KYC[estado]}>{t(`kyc.estados.${estado}`)}</Badge>
        </div>
        <p className={styles.bloqueoTitulo}>{t("kyc.soloDuenioTitulo")}</p>
        <p className={styles.nota}>{t("kyc.soloDuenioDetalle")}</p>
      </Panel>
    );
  }

  /* ── Asistente ────────────────────────────────────────────── */
  const indice = PASOS.indexOf(paso);
  /* El número va con el tipo: sin él la verificación llega sin el dato que
     identifica al responsable, que es justo lo que el superadmin compara
     con la foto del documento. */
  const puedeSeguir =
    (paso === "datos" && !!nif.trim() && !!tipo && !!numero.trim()) ||
    (paso === "documento" && tieneFrente) ||
    paso === "selfie" ||
    paso === "repaso";

  const enviar = async () => {
    setEnviando(true);
    try {
      await KycController.enviar(empresaId, {
        nifCif: nif,
        documentoTipo: tipo,
        documentoNumero: numero,
        ...archivos,
      });
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
      <PanelHead title={t("kyc.titulo")} sub={t(`kyc.subPorEstado.${estado}`)} />

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
                <span>{t("kyc.campoFiscal", { fiscal: etiqueta("fiscal") })}</span>
                <input value={nif} onChange={(e) => setNifCif(e.target.value)} placeholder={t("kyc.nifCifPlaceholder")} />
              </label>
              <label className={styles.campo}>
                <span>{t("kyc.tipoDocumento")}</span>
                <select value={tipo} onChange={(e) => setDocumentoTipo(e.target.value)}>
                  <option value="">{t("reservas.selectPlaceholder")}</option>
                  {tipos.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              </label>
              <label className={styles.campo}>
                <span>{t("kyc.documentoNumero")}</span>
                <input
                  value={numero}
                  onChange={(e) => setDocumentoNumero(e.target.value)}
                  placeholder={t("kyc.documentoNumeroPlaceholder")}
                  autoComplete="off"
                />
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
              <li><span>{t("kyc.campoFiscal", { fiscal: etiqueta("fiscal") })}</span><b>{nif || "—"}</b></li>
              <li><span>{t("kyc.tipoDocumento")}</span><b>{tipo || "—"}</b></li>
              <li><span>{t("kyc.documentoNumero")}</span><b>{numero || "—"}</b></li>
              {(["documentoFrente", "selfie"] as const).map((campo) => {
                const elegido = !!archivos[campo];
                const enviado = !!kyc?.[campo];
                /* Tres cosas distintas, que antes se resumían en "Listo":
                   lo que ya está en el servidor, lo que solo está elegido en
                   este navegador y lo que no hay. */
                return (
                  <li key={campo}>
                    <span>{t(`kyc.archivos.${campo}`)}</span>
                    <b className={enviado || elegido ? styles.ok : styles.falta}>
                      {enviado
                        ? t("kyc.yaEnviado")
                        : elegido
                          ? t("kyc.sinEnviar")
                          : campo === "selfie"
                            ? t("kyc.opcional")
                            : t("kyc.falta")}
                    </b>
                  </li>
                );
              })}
            </ul>
            {hayElegidoSinEnviar && <p className={styles.avisoSinEnviar}>{t("kyc.avisoSinEnviar")}</p>}
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
