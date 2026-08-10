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
import type { Negocio, SedeDetalle } from "@/models";
import { SedesController } from "@/controllers/CrudControllers";
import { useData } from "@/hooks/useData";
import { useUi } from "@/context/UiContext";
import { useI18n } from "@/i18n";
import { fotoUrl } from "@/constants";
import Toolbar, { SearchBox, ToolbarActions } from "@/components/ui/Toolbar";
import Button from "@/components/ui/Button";
import Icon from "@/components/ui/Icon";
import EmptyState from "@/components/ui/EmptyState";
import Modal, { ModalTitle, ModalActions, Field } from "@/components/ui/Modal";
import { CardGrid, SimpleCard, Muted, TagRow } from "@/components/ui/Cards";
import { Tag } from "@/components/ui/Badge";
import ImageGallery from "@/components/ui/ImageGallery";
import SedeProfesionalesModal from "./SedeProfesionalesModal";
import SedeResenasModal from "./SedeResenasModal";

export default function EmpresaSedesPanel({
  negocio,
  onBack,
}: {
  negocio: Negocio;
  onBack: () => void;
}) {
  const { toast } = useUi();
  const { t } = useI18n();
  const [search, setSearch] = useState("");

  const { data: sedes, reload } = useData(
    () => SedesController.getByEmpresa(negocio.id),
    [negocio.id],
    [] as SedeDetalle[]
  );

  const lista = sedes.filter((s) => (s.nombre + s.direccion).toLowerCase().includes(search.toLowerCase()));

  /* ── Edición de sede (datos + imágenes) ──────────────────── */
  const [editando, setEditando] = useState<SedeDetalle | null>(null);
  const [eNombre, setENombre] = useState("");
  const [eDireccion, setEDireccion] = useState("");
  const [eTelefono, setETelefono] = useState("");
  const [eProvincia, setEProvincia] = useState("");
  const [guardando, setGuardando] = useState(false);

  const abrirEdicion = (s: SedeDetalle) => {
    setEditando(s);
    setENombre(s.nombre);
    setEDireccion(s.direccion);
    setETelefono(s.telefono);
    setEProvincia(s.provincia);
  };

  const guardarEdicion = async () => {
    if (!editando) return;
    if (!eNombre.trim() || !eDireccion.trim()) {
      toast(t("common.requiredName"), "error");
      return;
    }
    setGuardando(true);
    try {
      await SedesController.update(editando.id, {
        nombre: eNombre, direccion: eDireccion, telefono: eTelefono, provincia: eProvincia,
        latitud: editando.latitud, longitud: editando.longitud,
      });
      await reload();
      toast(t("empresaSedes.updated"), "success");
      setEditando(null);
    } catch (e) {
      toast(e instanceof Error ? e.message : "Error", "error");
    } finally {
      setGuardando(false);
    }
  };

  /* Imágenes de la sede que se está editando (se recargan solas al subir/borrar) */
  const subirImagen = async (file: File) => {
    if (!editando) return [];
    const imagenes = await SedesController.subirImagen(editando.id, file);
    await reload();
    return imagenes;
  };
  const borrarImagen = async (ruta: string) => {
    if (!editando) return [];
    const imagenes = await SedesController.borrarImagen(editando.id, ruta);
    await reload();
    return imagenes;
  };

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
                  <Button size="sm" variant="ghost" onClick={() => abrirEdicion(s)}>
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

      {/* Edición de sede */}
      <Modal open={!!editando} onClose={() => setEditando(null)} maxWidth={560}>
        <ModalTitle>{t("empresaSedes.editTitle")}</ModalTitle>
        <Field label={t("common.name")} htmlFor="es-nombre">
          <input id="es-nombre" value={eNombre} onChange={(e) => setENombre(e.target.value)} placeholder={t("sedes.namePlaceholder")} />
        </Field>
        <Field label={t("sedes.address")} htmlFor="es-dir">
          <input id="es-dir" value={eDireccion} onChange={(e) => setEDireccion(e.target.value)} placeholder={t("sedes.addressPlaceholder")} />
        </Field>
        <Field label={t("common.phone")} htmlFor="es-tel">
          <input id="es-tel" value={eTelefono} onChange={(e) => setETelefono(e.target.value)} placeholder="+34 600 000 000" />
        </Field>
        <Field label={t("empresaSedes.province")} htmlFor="es-prov">
          <input id="es-prov" value={eProvincia} onChange={(e) => setEProvincia(e.target.value)} placeholder={t("empresaSedes.provincePlaceholder")} />
        </Field>
        {editando && (
          <ImageGallery
            label={t("imagen.imagenSede")}
            imagenes={editando.imagenes}
            onAdd={subirImagen}
            onRemove={borrarImagen}
          />
        )}
        <ModalActions>
          <Button variant="ghost" onClick={() => setEditando(null)} disabled={guardando}>{t("common.cancel")}</Button>
          <Button onClick={() => void guardarEdicion()} disabled={guardando}>{t("common.save")}</Button>
        </ModalActions>
      </Modal>

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
