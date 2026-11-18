"use client";
/* ============================================================
   PersonalizarPanelModal — colores del panel del negocio
   ------------------------------------------------------------
   El dueño elige el color de su marca (sugeridos o uno propio)
   y lo ve aplicado al momento en todo el panel. Se guarda en la
   empresa (PATCH /empresas/:id/tema) para que lo vea su equipo.
============================================================ */
import { useEffect, useState } from "react";
import { EmpresasApi } from "@/api/modules";
import { useSession } from "@/context/SessionContext";
import { useUi } from "@/context/UiContext";
import { useI18n } from "@/i18n";
import { aplicarTema, COLORES_SUGERIDOS, esColorValido, temaRecordado } from "@/lib/temaPanel";
import Button from "@/components/ui/Button";
import Icon from "@/components/ui/Icon";
import Modal, { ModalTitle, ModalText, ModalActions, Field } from "@/components/ui/Modal";
import styles from "./PersonalizarPanel.module.css";

const BOOKMY = COLORES_SUGERIDOS[0];

export default function PersonalizarPanelModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useI18n();
  const { toast } = useUi();
  const { session } = useSession();
  const [inicial, setInicial] = useState<string>(BOOKMY);
  const [color, setColor] = useState<string>(BOOKMY);
  const [texto, setTexto] = useState<string>(BOOKMY);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (!open) return;
    const actual = temaRecordado() || BOOKMY;
    setInicial(actual); setColor(actual); setTexto(actual);
  }, [open]);

  /* Vista previa en vivo sobre el panel real */
  useEffect(() => { if (open) aplicarTema(color === BOOKMY ? null : color); }, [open, color]);

  const elegir = (c: string) => { setColor(c); setTexto(c); };

  const cerrar = () => {
    /* Cancelar deshace la vista previa */
    aplicarTema(inicial === BOOKMY ? null : inicial);
    onClose();
  };

  const guardar = async () => {
    const empresaId = Number(session?.negocioId);
    if (!empresaId) return;
    setGuardando(true);
    try {
      await EmpresasApi.tema(empresaId, color === BOOKMY ? null : color);
      aplicarTema(color === BOOKMY ? null : color);
      setInicial(color);
      toast(t("tema.guardado"), "success");
      onClose();
    } catch (e) {
      toast(e instanceof Error ? e.message : t("common.error"), "error");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Modal open={open} onClose={() => { if (!guardando) cerrar(); }} maxWidth={520}>
      <ModalTitle>{t("tema.titulo")}</ModalTitle>
      <ModalText>{t("tema.texto")}</ModalText>

      <div className={styles.paleta} role="radiogroup" aria-label={t("tema.sugeridos")}>
        {COLORES_SUGERIDOS.map((c) => (
          <button
            key={c}
            type="button"
            role="radio"
            aria-checked={color.toLowerCase() === c}
            aria-label={c === BOOKMY ? t("tema.bookmy") : c}
            title={c === BOOKMY ? t("tema.bookmy") : c}
            className={`${styles.muestra} ${color.toLowerCase() === c ? styles.muestraOn : ""}`}
            style={{ background: c }}
            onClick={() => elegir(c)}
          >
            {color.toLowerCase() === c && <Icon name="check" />}
          </button>
        ))}
      </div>

      <Field label={t("tema.propio")} htmlFor="tema-propio">
        <div className={styles.propio}>
          <input
            type="color"
            aria-label={t("tema.propio")}
            value={color}
            onChange={(e) => elegir(e.target.value)}
          />
          <input
            id="tema-propio"
            className={styles.hex}
            value={texto}
            maxLength={7}
            onChange={(e) => {
              const v = e.target.value.trim();
              setTexto(v);
              if (esColorValido(v)) setColor(v.toLowerCase());
            }}
          />
        </div>
      </Field>

      {/* Muestra de cómo queda */}
      <div className={styles.preview}>
        <span className={styles.previewIcono}><Icon name="star" /></span>
        <div className={styles.previewTexto}>
          <b>{session?.negocioName || "Bookmy"}</b>
          <span>{t("tema.previewSub")}</span>
        </div>
        <span className={styles.previewBoton}>{t("tema.previewBoton")}</span>
      </div>

      <ModalActions>
        <Button variant="ghost" onClick={() => elegir(BOOKMY)} disabled={guardando}>{t("tema.restablecer")}</Button>
        <Button variant="ghost" onClick={cerrar} disabled={guardando}>{t("common.cancel")}</Button>
        <Button onClick={() => void guardar()} disabled={guardando}>{guardando ? t("marketing.guardando") : t("tema.guardar")}</Button>
      </ModalActions>
    </Modal>
  );
}
