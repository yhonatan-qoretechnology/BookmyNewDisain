"use client";
/* ============================================================
   DesactivarProfesionalModal — baja de un profesional con motivo
   ------------------------------------------------------------
   Motivo (incapacidad, vacaciones, retiro u otro) y comentario
   obligatorios. Con «Incapacidad» se pide la foto o el PDF del
   certificado (opcional en el resto). PATCH /profesionales/:id/desactivar.
============================================================ */
import { useEffect, useState } from "react";
import type { Empleado } from "@/models";
import { PersonalController, type MotivoBaja } from "@/controllers/CrudControllers";
import { useI18n } from "@/i18n";
import { useUi } from "@/context/UiContext";
import Button from "@/components/ui/Button";
import Icon from "@/components/ui/Icon";
import Modal, { ModalTitle, ModalText, ModalActions, Field } from "@/components/ui/Modal";

const MOTIVOS: MotivoBaja[] = ["INCAPACIDAD", "VACACIONES", "RETIRO", "OTRO"];
const TIPOS = ["image/jpeg", "image/png", "image/webp", "application/pdf"];

export default function DesactivarProfesionalModal({
  profesional,
  onClose,
  onHecho,
}: {
  profesional: Empleado | null;
  onClose: () => void;
  onHecho: () => Promise<void> | void;
}) {
  const { t } = useI18n();
  const { toast } = useUi();
  const [motivo, setMotivo] = useState<MotivoBaja>("INCAPACIDAD");
  const [comentario, setComentario] = useState("");
  const [archivo, setArchivo] = useState<File | null>(null);
  const [guardando, setGuardando] = useState(false);

  /* Cada apertura empieza limpia */
  useEffect(() => {
    if (profesional) { setMotivo("INCAPACIDAD"); setComentario(""); setArchivo(null); }
  }, [profesional]);

  const elegirArchivo = (f: File | undefined) => {
    if (!f) return;
    if (!TIPOS.includes(f.type)) { toast(t("personal.bajaTipoArchivo"), "error"); return; }
    if (f.size > 10 * 1024 * 1024) { toast(t("imagen.errPeso"), "error"); return; }
    setArchivo(f);
  };

  const guardar = async () => {
    if (!profesional) return;
    if (comentario.trim().length < 3) { toast(t("personal.bajaFaltaComentario"), "error"); return; }
    setGuardando(true);
    try {
      await PersonalController.desactivar(profesional.id, motivo, comentario.trim(), archivo);
      toast(t("personal.disabled"), "success");
      await onHecho();
      onClose();
    } catch (e) {
      toast(e instanceof Error ? e.message : t("common.error"), "error");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Modal open={!!profesional} onClose={() => { if (!guardando) onClose(); }}>
      <ModalTitle>{t("personal.disableTitle")}</ModalTitle>
      <ModalText>{t("personal.bajaIntro", { nombre: profesional?.nombre || "" })}</ModalText>

      <Field label={t("personal.bajaMotivo")} htmlFor="baja-motivo">
        <select id="baja-motivo" value={motivo} onChange={(e) => setMotivo(e.target.value as MotivoBaja)}>
          {MOTIVOS.map((m) => <option key={m} value={m}>{t(`personal.motivo_${m}`)}</option>)}
        </select>
      </Field>

      <Field label={t("personal.bajaComentario")} htmlFor="baja-comentario">
        <textarea
          id="baja-comentario"
          rows={3}
          maxLength={1000}
          value={comentario}
          placeholder={t("personal.bajaComentarioPh")}
          onChange={(e) => setComentario(e.target.value)}
        />
      </Field>

      <Field
        label={t(motivo === "INCAPACIDAD" ? "personal.bajaSoporteIncapacidad" : "personal.bajaSoporte")}
        htmlFor="baja-soporte"
      >
        <label
          htmlFor="baja-soporte"
          style={{
            display: "flex", alignItems: "center", gap: 8, padding: "10px 12px",
            border: "1px dashed var(--border)", borderRadius: 10, cursor: "pointer", fontSize: 13,
          }}
        >
          <Icon name="camera" />
          <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {archivo ? archivo.name : t("personal.bajaSoporteElegir")}
          </span>
          {archivo && (
            <button
              type="button"
              onClick={(e) => { e.preventDefault(); setArchivo(null); }}
              aria-label={t("common.delete")}
              style={{ border: "none", background: "none", cursor: "pointer", color: "inherit" }}
            >
              <Icon name="x" />
            </button>
          )}
        </label>
        <input
          id="baja-soporte"
          type="file"
          accept="image/jpeg,image/png,image/webp,application/pdf"
          capture={undefined}
          hidden
          onChange={(e) => { elegirArchivo(e.target.files?.[0]); e.target.value = ""; }}
        />
      </Field>

      <ModalActions>
        <Button variant="ghost" onClick={onClose} disabled={guardando}>{t("common.cancel")}</Button>
        <Button variant="danger" onClick={() => void guardar()} disabled={guardando}>
          {guardando ? t("personal.bajaGuardando") : t("personal.disable")}
        </Button>
      </ModalActions>
    </Modal>
  );
}
