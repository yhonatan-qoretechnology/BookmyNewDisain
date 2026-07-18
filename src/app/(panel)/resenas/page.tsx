"use client";
/* ============================================================
   Reseñas — valoraciones de clientas (View)
============================================================ */
import { useState } from "react";
import { ResenasController } from "@/controllers/CrudControllers";
import { useData } from "@/hooks/useData";
import { useUi } from "@/context/UiContext";
import { useI18n } from "@/i18n";
import Panel, { PanelHead } from "@/components/ui/Panel";
import Toolbar, { SearchBox } from "@/components/ui/Toolbar";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import { CardGrid, SimpleCard, Muted, TagRow } from "@/components/ui/Cards";
import { PersonRow, Stars } from "@/components/ui/People";

export default function ResenasPage() {
  const { toast } = useUi();
  const { t } = useI18n();
  const [search, setSearch] = useState("");
  const { data: lista, reload } = useData(() => ResenasController.search(search), [search], []);

  /* MODO API: PATCH /resenas/:id/aprobar */
  const responder = async (id: number) => {
    await ResenasController.responder(id);
    await reload();
    toast(t("resenas.markedAnswered"), "success");
  };

  return (
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
                <Badge kind={r.respondida ? "atendida" : "pendiente"}>
                  {r.respondida ? t("resenas.answered") : t("resenas.unanswered")}
                </Badge>
              </TagRow>
              <Muted>“{r.texto}”</Muted>
              <Muted>{r.fecha}</Muted>
              {!r.respondida && (
                <Button variant="ghost" size="sm" onClick={() => responder(r.id)}>{t("resenas.reply")}</Button>
              )}
            </SimpleCard>
          ))}
        </CardGrid>
      )}
    </Panel>
  );
}
