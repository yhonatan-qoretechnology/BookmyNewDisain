"use client";
/* ============================================================
   EmpresaSedesPanel — drill-down "Sedes" de una empresa
   ------------------------------------------------------------
   Se abre desde /empresas con el botón "Sedes" de cada tarjeta
   (superadmin). Sustituye la grilla de empresas por la de sedes de
   ESA empresa, sin depender de session.negocioId (que es la empresa
   "activa" para trabajar, no necesariamente la que se está mirando).
   Cada sede: Editar (datos + imágenes), Ver profesionales, Reseñas.
============================================================ */
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Negocio, SedeDetalle } from "@/models";
import { SedesController } from "@/controllers/CrudControllers";
import { useData } from "@/hooks/useData";
import { useI18n } from "@/i18n";
import { fotoUrl, sedeEditarPath } from "@/constants";
import Toolbar, { SearchBox, ToolbarActions } from "@/components/ui/Toolbar";
import Button from "@/components/ui/Button";
import Icon from "@/components/ui/Icon";
import EmptyState from "@/components/ui/EmptyState";
import { CardGrid, SimpleCard, Muted, TagRow } from "@/components/ui/Cards";
import { Tag } from "@/components/ui/Badge";
import SedeProfesionalesModal from "./SedeProfesionalesModal";
import SedeResenasModal from "./SedeResenasModal";

export default function EmpresaSedesPanel({
  negocio,
  onBack,
}: {
  negocio: Negocio;
  onBack: () => void;
}) {
  const router = useRouter();
  const { t } = useI18n();
  const [search, setSearch] = useState("");

  const { data: sedes } = useData(
    () => SedesController.getByEmpresa(negocio.id),
    [negocio.id],
    [] as SedeDetalle[]
  );

  const lista = sedes.filter((s) => (s.nombre + s.direccion).toLowerCase().includes(search.toLowerCase()));

  /* ── Ver profesionales / reseñas ─────────────────────────── */
  const [profesionalesDe, setProfesionalesDe] = useState<{ id: number; nombre: string } | null>(null);
  const [resenasDe, setResenasDe] = useState<{ id: number; nombre: string } | null>(null);

  return (
    <>
      <Toolbar>
        <SearchBox value={search} onChange={setSearch} placeholder={t("sedes.searchPlaceholder")} />
        <ToolbarActions>
          <Button variant="ghost" onClick={onBack}>
            ← {t("empresaSedes.back")}
          </Button>
        </ToolbarActions>
      </Toolbar>

      {lista.length === 0 ? (
        <EmptyState icon="building" title={t("sedes.emptyTitle")} message={t("sedes.emptyMsg")} />
      ) : (
        <CardGrid>
          {lista.map((s) => {
            const portada = fotoUrl(s.imagenes[0]);
            return (
              <SimpleCard key={s.id}>
                {portada && (
                  <img
                    src={portada}
                    alt=""
                    style={{ width: "100%", height: 130, objectFit: "cover", borderRadius: "var(--r-md)", marginBottom: 10 }}
                  />
                )}
                <h3>{s.nombre}</h3>
                <Muted>{s.direccion}</Muted>
                {s.telefono && <Muted>{s.telefono}</Muted>}
                <TagRow>
                  {s.provincia && <Tag>{s.provincia}</Tag>}
                  <Tag>{t("sedes.team", { n: s.equipo })}</Tag>
                </TagRow>
                <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
                  <Button size="sm" variant="ghost" onClick={() => router.push(sedeEditarPath(s.id))}>
                    <Icon name="edit" /> {t("common.edit")}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setProfesionalesDe({ id: s.id, nombre: s.nombre })}>
                    <Icon name="team" /> {t("empresaSedes.viewProfesionales")}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setResenasDe({ id: s.id, nombre: s.nombre })}>
                    <Icon name="star" /> {t("empresaSedes.viewResenas")}
                  </Button>
                </div>
              </SimpleCard>
            );
          })}
        </CardGrid>
      )}

      <SedeProfesionalesModal
        sedeId={profesionalesDe?.id ?? null}
        sedeNombre={profesionalesDe?.nombre ?? ""}
        onClose={() => setProfesionalesDe(null)}
      />
      <SedeResenasModal
        sedeId={resenasDe?.id ?? null}
        sedeNombre={resenasDe?.nombre ?? ""}
        onClose={() => setResenasDe(null)}
      />
    </>
  );
}
