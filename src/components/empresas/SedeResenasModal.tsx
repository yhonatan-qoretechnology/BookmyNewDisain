"use client";
/* ============================================================
   SedeResenasModal — reseñas de UNA sede
   ------------------------------------------------------------
   Se abre desde "Ver reseñas" en el drill-down de Empresas → Sedes:
   GET /resenas/sede/:sedeId (a diferencia de /resenas, la vista
   general de superadmin). Aprobar/rechazar es el mismo PATCH
   /resenas/:id/aprobar de siempre, mostrado aquí como un
   activar/desactivar que funciona en los dos sentidos.
============================================================ */
import { useState } from "react";
import { ResenasController } from "@/controllers/CrudControllers";
import { useData } from "@/hooks/useData";
import { useI18n } from "@/i18n";
import { useUi } from "@/context/UiContext";
import Modal, { ModalTitle, ModalActions } from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import { CardGrid, SimpleCard, Muted, TagRow } from "@/components/ui/Cards";
import { PersonRow, Stars } from "@/components/ui/People";
import EmptyState from "@/components/ui/EmptyState";
import type { Resena } from "@/models";

const BADGE: Record<Resena["estado"], "atendida" | "pendiente" | "cancelado"> = {
  aprobada: "atendida",
  pendiente: "pendiente",
  rechazada: "cancelado",
};

export default function SedeResenasModal({
  sedeId,
  sedeNombre,
  onClose,
}: {
  sedeId: number | null;
  sedeNombre: string;
  onClose: () => void;
}) {
  const { t } = useI18n();
  const { toast } = useUi();
  const abierto = sedeId != null;

  const { data: lista, reload } = useData(
    () => (sedeId != null ? ResenasController.searchPorSede(sedeId) : Promise.resolve([])),
    [sedeId],
    [] as Resena[]
  );

  const [cambiandoId, setCambiandoId] = useState<number | null>(null);

  const alternar = async (r: Resena) => {
    setCambiandoId(r.id);
    try {
      await ResenasController.aprobar(r.id, !r.aprobada);
      await reload();
      toast(r.aprobada ? t("sedeResenas.deactivated") : t("sedeResenas.activated"), "success");
    } catch (e) {
      toast(e instanceof Error ? e.message : "Error", "error");
    } finally {
      setCambiandoId(null);
    }
  };

  if (!abierto) return null;

  return (
    <Modal open onClose={onClose} maxWidth={720} contentScroll>
      <ModalTitle>{t("sedeResenas.title", { sede: sedeNombre })}</ModalTitle>

      {lista.length === 0 ? (
        <EmptyState icon="chat" title={t("sedeResenas.emptyTitle")} message={t("sedeResenas.emptyMsg")} />
      ) : (
        <CardGrid>
          {lista.map((r) => (
            <SimpleCard key={r.id}>
              <PersonRow name={r.cliente} photo={r.foto} bold />
              <TagRow>
                <Stars n={r.estrellas} />
                <Badge kind={BADGE[r.estado]}>{t(`resenas.estado.${r.estado}`)}</Badge>
              </TagRow>
              <Muted>&ldquo;{r.texto || t("resenas.noText")}&rdquo;</Muted>
              <Muted>{r.fecha}</Muted>
              <div style={{ marginTop: 12 }}>
                <Button
                  size="sm"
                  variant={r.aprobada ? "danger" : "primary"}
                  onClick={() => void alternar(r)}
                  disabled={cambiandoId === r.id}
                >
                  {cambiandoId === r.id
                    ? t("booking.loading")
                    : r.aprobada
                      ? t("sedeResenas.deactivate")
                      : t("sedeResenas.activate")}
                </Button>
              </div>
            </SimpleCard>
          ))}
        </CardGrid>
      )}

      <ModalActions>
        <Button variant="ghost" block onClick={onClose}>{t("common.close")}</Button>
      </ModalActions>
    </Modal>
  );
}
