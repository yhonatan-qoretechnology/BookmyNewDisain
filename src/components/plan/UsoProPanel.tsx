"use client";
/* ============================================================
   UsoProPanel — seguimiento del uso de Bookmy CRM Pro
   ------------------------------------------------------------
   EXCLUSIVO DE SUPERADMIN (dentro de Monitoreo Pro). Por cada
   negocio con Pro o en prueba: citas, acciones en el panel,
   último acceso y un estado (Activo / Poco uso / Inactivo / Uso
   inusual) con su motivo, calculado por el backend.

   El backend avisa solo cada lunes; desde aquí se puede lanzar
   la revisión ya o mandar el aviso a un negocio concreto, con un
   mensaje propio si hace falta.
============================================================ */
import { useState } from "react";
import { UsoProApi } from "@/api/modules";
import type { ApiEstadoUsoPro, ApiUsoEmpresaPro } from "@/api/types";
import { ApiError } from "@/api/http";
import { useData } from "@/hooks/useData";
import { useUi } from "@/context/UiContext";
import { useI18n } from "@/i18n";
import Panel, { PanelHead } from "@/components/ui/Panel";
import DataTable from "@/components/ui/DataTable";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import Modal, { ModalTitle, ModalText, ModalActions, Field } from "@/components/ui/Modal";
import styles from "./UsoProPanel.module.css";

const KIND: Record<ApiEstadoUsoPro, "activo" | "pendiente" | "inactivo" | "cancelado"> = {
  ACTIVO: "activo",
  BAJO_USO: "pendiente",
  INACTIVO: "inactivo",
  USO_INUSUAL: "cancelado",
};

/* Lo que más necesita atención, primero. */
const ORDEN: Record<ApiEstadoUsoPro, number> = { USO_INUSUAL: 0, INACTIVO: 1, BAJO_USO: 2, ACTIVO: 3 };

function fmtFecha(iso: string | null, locale: string, nunca: string) {
  if (!iso) return nunca;
  try {
    return new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "es-ES", { dateStyle: "medium" }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export default function UsoProPanel() {
  const { t, locale } = useI18n();
  const { toast } = useUi();
  const { data: filas, loading, reload } = useData(() => UsoProApi.listar(), [], [] as ApiUsoEmpresaPro[]);
  const [revisando, setRevisando] = useState(false);
  const [avisoDe, setAvisoDe] = useState<ApiUsoEmpresaPro | null>(null);
  const [mensaje, setMensaje] = useState("");
  const [enviando, setEnviando] = useState(false);

  const ordenadas = [...filas].sort((a, b) => ORDEN[a.estado] - ORDEN[b.estado] || a.empresa.localeCompare(b.empresa));

  const revisar = async () => {
    setRevisando(true);
    try {
      const r = await UsoProApi.revisar();
      toast(t("usoPro.revisado", { enviados: String(r.enviados), revisadas: String(r.revisadas) }), "success");
      await reload();
    } catch (e) {
      toast(e instanceof ApiError ? e.message : t("common.error"), "error");
    } finally {
      setRevisando(false);
    }
  };

  const enviarAviso = async () => {
    if (!avisoDe) return;
    setEnviando(true);
    try {
      const r = await UsoProApi.avisar(avisoDe.empresaId, mensaje.trim() || undefined);
      toast(r.enviado ? t("usoPro.avisoEnviado") : t("usoPro.avisoNoEnviado"), r.enviado ? "success" : "error");
      if (r.enviado) {
        setAvisoDe(null);
        await reload();
      }
    } catch (e) {
      toast(e instanceof ApiError ? e.message : t("common.error"), "error");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <Panel className={styles.panel}>
      <PanelHead
        title={t("usoPro.title")}
        sub={t("usoPro.sub")}
        right={
          <Button size="sm" onClick={() => void revisar()} disabled={revisando}>
            {revisando ? t("common.saving") : t("usoPro.revisar")}
          </Button>
        }
      />
      <p className={styles.nota}>{t("usoPro.nota")}</p>

      {!loading && ordenadas.length === 0 ? (
        <EmptyState icon="chart" title={t("usoPro.vacio")} />
      ) : (
        <DataTable
          headers={[
            t("usoPro.colEmpresa"),
            t("usoPro.colEstado"),
            t("usoPro.colCitas"),
            t("usoPro.colAcciones"),
            t("usoPro.colUltimo"),
            t("usoPro.colAviso"),
            "",
          ]}
        >
          {ordenadas.map((u) => (
            <tr key={u.empresaId}>
              <td>
                <b>{u.empresa}</b>
                {u.enPrueba && <span className={styles.prueba}> · {t("usoPro.enPrueba")}</span>}
                <span className={styles.sub}>{u.email || t("usoPro.sinEmail")}</span>
              </td>
              <td>
                <Badge kind={KIND[u.estado]}>{t(`usoPro.estados.${u.estado}`)}</Badge>
                <span className={styles.sub}>{u.motivo}</span>
              </td>
              <td>
                <b>{u.citas30}</b>
                {u.canceladas30 > 0 && <span className={styles.sub}>{u.canceladas30} ✕</span>}
              </td>
              <td><b>{u.actividad30}</b></td>
              <td>{fmtFecha(u.ultimoAcceso, locale, t("usoPro.nunca"))}</td>
              <td>
                {u.ultimoAviso ? (
                  <>
                    {t(`usoPro.tiposAviso.${u.ultimoAviso.tipo}`)}
                    <span className={styles.sub}>{fmtFecha(u.ultimoAviso.fecha, locale, "")}</span>
                  </>
                ) : "—"}
              </td>
              <td>
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={!u.email}
                  onClick={() => { setMensaje(""); setAvisoDe(u); }}
                >
                  {t("usoPro.avisar")}
                </Button>
              </td>
            </tr>
          ))}
        </DataTable>
      )}

      <Modal open={!!avisoDe} onClose={() => { if (!enviando) setAvisoDe(null); }} maxWidth={560}>
        <ModalTitle>{t("usoPro.avisoTitulo", { empresa: avisoDe?.empresa ?? "" })}</ModalTitle>
        <ModalText>{t("usoPro.avisoTexto", { motivo: avisoDe?.motivo ?? "" })}</ModalText>
        <Field label={t("usoPro.avisoMensaje")} htmlFor="uso-mensaje">
          <textarea id="uso-mensaje" rows={6} value={mensaje} onChange={(e) => setMensaje(e.target.value)} maxLength={5000} />
        </Field>
        <ModalActions>
          <Button variant="ghost" onClick={() => setAvisoDe(null)} disabled={enviando}>{t("common.cancel")}</Button>
          <Button onClick={() => void enviarAviso()} disabled={enviando}>
            {enviando ? t("common.saving") : t("usoPro.avisoEnviar")}
          </Button>
        </ModalActions>
      </Modal>
    </Panel>
  );
}
