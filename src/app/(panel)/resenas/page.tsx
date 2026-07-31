"use client";
/* ============================================================
   Reseñas — moderación de valoraciones (View)
   ------------------------------------------------------------
   · Aprobar  → PATCH /resenas/:id/aprobar (publica la reseña)
   · Responder→ redacta la respuesta y la envía por correo al
     autor. El ResenaModule no expone endpoint para almacenar
     respuestas, así que se usa el mismo mecanismo de correo que
     el popup de reservas (mailto:).
============================================================ */
import { useState } from "react";
import type { Resena } from "@/models";
import { ResenasController } from "@/controllers/CrudControllers";
import { useData } from "@/hooks/useData";
import { useUi } from "@/context/UiContext";
import { useSession } from "@/context/SessionContext";
import { useI18n } from "@/i18n";
import Panel, { PanelHead } from "@/components/ui/Panel";
import Toolbar, { SearchBox } from "@/components/ui/Toolbar";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import Modal, { ModalTitle, ModalActions, Field } from "@/components/ui/Modal";
import { CardGrid, SimpleCard, Muted, TagRow } from "@/components/ui/Cards";
import { PersonRow, Stars } from "@/components/ui/People";
import styles from "./resenas.module.css";

/** Badge según el estado de moderación */
const BADGE: Record<Resena["estado"], "atendida" | "pendiente" | "cancelado"> = {
  aprobada: "atendida",
  pendiente: "pendiente",
  rechazada: "cancelado",
};

export default function ResenasPage() {
  const { toast } = useUi();
  const { t } = useI18n();
  const { session } = useSession();
  const [search, setSearch] = useState("");
  const { data: lista, reload } = useData(() => ResenasController.search(search), [search], []);

  /* ── Aprobar — PATCH /resenas/:id/aprobar ────────────────── */
  const [aprobandoId, setAprobandoId] = useState<number | null>(null);
  const aprobar = async (id: number) => {
    setAprobandoId(id);
    try {
      await ResenasController.aprobar(id);
      await reload();
      toast(t("resenas.approved"), "success");
    } catch (e) {
      toast(e instanceof Error ? e.message : "Error", "error");
    } finally {
      setAprobandoId(null);
    }
  };

  /* ── Responder — correo al autor de la reseña ────────────── */
  const [respondiendo, setRespondiendo] = useState<Resena | null>(null);
  const [respuesta, setRespuesta] = useState("");

  const abrirRespuesta = (r: Resena) => {
    setRespondiendo(r);
    setRespuesta("");
  };

  const enviarRespuesta = () => {
    if (!respondiendo || !respuesta.trim()) {
      toast(t("resenas.replyRequired"), "error");
      return;
    }
    const negocio = session?.negocioName || "BookMy";
    const asunto = encodeURIComponent(t("resenas.mailSubject", { negocio }));
    const cuerpo = encodeURIComponent(
      t("resenas.mailBody", {
        cliente: respondiendo.cliente,
        respuesta: respuesta.trim(),
        negocio,
      })
    );
    window.location.href = `mailto:${respondiendo.email}?subject=${asunto}&body=${cuerpo}`;
    setRespondiendo(null);
    toast(t("resenas.replySent"), "success");
  };

  return (
    <>
      <Panel>
        <PanelHead title={t("resenas.panelTitle")} sub={t("resenas.panelSub")} />
        <Toolbar>
          <SearchBox value={search} onChange={setSearch} placeholder={t("resenas.searchPlaceholder")} />
        </Toolbar>

        {lista.length === 0 ? (
          <EmptyState icon="chat" title={t("resenas.emptyTitle")} message={t("resenas.emptyMsg")} />
        ) : (
          <CardGrid>
            {lista.map((r) => (
              <SimpleCard key={r.id}>
                <PersonRow name={r.cliente} bold />
                <TagRow>
                  <Stars n={r.estrellas} />
                  <Badge kind={BADGE[r.estado]}>{t(`resenas.estado.${r.estado}`)}</Badge>
                </TagRow>
                <Muted>“{r.texto}”</Muted>
                <Muted>{r.fecha}</Muted>
                <div className={styles.cardActions}>
                  {!r.aprobada && (
                    <Button
                      size="sm"
                      onClick={() => void aprobar(r.id)}
                      disabled={aprobandoId === r.id}
                    >
                      {aprobandoId === r.id ? t("booking.loading") : t("resenas.approve")}
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => abrirRespuesta(r)}
                    disabled={!r.email}
                    title={r.email ? undefined : t("resenas.noEmail")}
                  >
                    {t("resenas.reply")}
                  </Button>
                </div>
              </SimpleCard>
            ))}
          </CardGrid>
        )}
      </Panel>

      <Modal open={!!respondiendo} onClose={() => setRespondiendo(null)} maxWidth={560}>
        <ModalTitle>{t("resenas.replyTitle", { cliente: respondiendo?.cliente || "" })}</ModalTitle>
        {respondiendo && (
          <div className={styles.quote}>
            <b><Stars n={respondiendo.estrellas} /></b>
            “{respondiendo.texto || t("resenas.noText")}”
          </div>
        )}
        <Field label={t("resenas.replyLabel")} htmlFor="rs-reply">
          <textarea
            id="rs-reply"
            className={styles.replyArea}
            value={respuesta}
            onChange={(e) => setRespuesta(e.target.value)}
            placeholder={t("resenas.replyPlaceholder")}
          />
        </Field>
        <ModalActions>
          <Button variant="ghost" block onClick={() => setRespondiendo(null)}>{t("common.cancel")}</Button>
          <Button block onClick={enviarRespuesta}>{t("resenas.sendReply")}</Button>
        </ModalActions>
      </Modal>
    </>
  );
}
