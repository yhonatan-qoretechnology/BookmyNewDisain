"use client";
/* ============================================================
   Empresas — EXCLUSIVO DE SUPERADMIN (control total)
   Lista los negocios (tenants) registrados en la plataforma,
   permite darlos de alta y cambiar el contexto de trabajo.
============================================================ */
import { useEffect, useMemo, useState } from "react";
import { useData } from "@/hooks/useData";
import { useRouter } from "next/navigation";
import { ROUTES } from "@/constants";
import { NegociosController } from "@/controllers/NegociosController";
import type { Sede } from "@/models";
import { useSession } from "@/context/SessionContext";
import { useBooking } from "@/context/BookingContext";
import { useUi } from "@/context/UiContext";
import { useI18n } from "@/i18n";
import Panel, { PanelHead } from "@/components/ui/Panel";
import Toolbar, { SearchBox, ToolbarActions } from "@/components/ui/Toolbar";
import Badge, { Tag } from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import Modal, { ModalTitle, ModalText, ModalActions, Field } from "@/components/ui/Modal";
import { CardGrid, SimpleCard, Muted, TagRow } from "@/components/ui/Cards";
import styles from "./empresas.module.css";

export default function EmpresasPage() {
  const router = useRouter();
  const { session, updateSession } = useSession();
  const booking = useBooking();
  const { toast } = useUi();
  const { t } = useI18n();

  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [nombre, setNombre] = useState("");
  const [rubro, setRubro] = useState("");

  /* GUARD DE ROL: esta vista solo existe para superadmin */
  useEffect(() => {
    if (session && session.role !== "superadmin") router.replace(ROUTES.dashboard);
  }, [session, router]);
  if (session?.role !== "superadmin") return null;

  /* MODO API: GET /empresas */
  const { data: todas, reload } = useData(() => NegociosController.getAll(), [], []);
  const { data: sedeCounts } = useData(async () => {
    const counts: Record<string, number> = {};
    await Promise.all(todas.map(async (n) => { counts[n.id] = await NegociosController.countSedes(n.id); }));
    return counts;
  }, [todas], {} as Record<string, number>);
  const lista = useMemo(() => {
    const q = search.toLowerCase();
    return todas.filter((n) => (n.nombre + n.rubro).toLowerCase().includes(q));
  }, [todas, search]);

  /* ── Selección de empresa → carga automática de sus sedes ──
     La empresa y la sede elegidas se guardan en el estado global
     (BookingContext) para todo el flujo de creación de reservas. */
  const [sedePick, setSedePick] = useState<{ id: string; nombre: string } | null>(null);
  const [sedesEmpresa, setSedesEmpresa] = useState<Sede[]>([]);
  const [loadingSedes, setLoadingSedes] = useState(false);

  const seleccionar = async (id: string, nombreEmpresa: string) => {
    updateSession({ negocioId: id, negocioName: nombreEmpresa });
    toast(t("empresas.switched", { empresa: nombreEmpresa }), "success");
    setSedePick({ id, nombre: nombreEmpresa });
    setLoadingSedes(true);
    try {
      setSedesEmpresa(await NegociosController.getSedes(id));
    } catch {
      setSedesEmpresa([]);
    } finally {
      setLoadingSedes(false);
    }
  };

  const elegirSede = (sede: Sede) => {
    if (!sedePick) return;
    booking.setEmpresaSede({
      empresaId: sedePick.id,
      empresaNombre: sedePick.nombre,
      sedeId: sede.id,
      sedeNombre: sede.nombre,
    });
    setSedePick(null);
    toast(t("empresas.branchSet", { sede: sede.nombre }), "success");
  };

  const agregar = async () => {
    if (!nombre.trim()) { toast(t("common.requiredName"), "error"); return; }
    try {
      await NegociosController.add({ nombre: nombre.trim(), rubro: rubro.trim() || "—" });
      setModalOpen(false); setNombre(""); setRubro("");
      await reload();
      toast(t("empresas.created"), "success");
    } catch (e) {
      toast(e instanceof Error ? e.message : "Error", "error");
    }
  };

  return (
    <>
      <Panel>
        <PanelHead title={t("empresas.panelTitle")} sub={t("empresas.panelSub", { n: lista.length })} />
        <Toolbar>
          <SearchBox value={search} onChange={setSearch} placeholder={t("empresas.searchPlaceholder")} />
          <ToolbarActions>
            <Button onClick={() => setModalOpen(true)}>{t("empresas.new")}</Button>
          </ToolbarActions>
        </Toolbar>

        {lista.length === 0 ? (
          <EmptyState icon="shield" title={t("empresas.emptyTitle")} message={t("empresas.emptyMsg")} />
        ) : (
          <CardGrid>
            {lista.map((n) => {
              const activa = n.id === session.negocioId;
              return (
                <div key={n.id} className={activa ? styles.current : undefined}>
                  <SimpleCard>
                    <h3>{n.nombre}</h3>
                    <Muted>{n.rubro}</Muted>
                    <TagRow>
                      <Tag>{t("empresas.sedesCount", { n: sedeCounts[n.id] ?? 0 })}</Tag>
                      <Badge kind={n.activo ? "activo" : "inactivo"}>
                        {n.activo ? t("servicios.active") : t("servicios.inactive")}
                      </Badge>
                    </TagRow>
                    <div style={{ marginTop: 12 }}>
                      {activa ? (
                        <Tag>{t("empresas.current")}</Tag>
                      ) : (
                        <Button variant="ghost" size="sm" onClick={() => seleccionar(n.id, n.nombre)}>
                          {t("empresas.select")}
                        </Button>
                      )}
                    </div>
                  </SimpleCard>
                </div>
              );
            })}
          </CardGrid>
        )}
      </Panel>

      {/* Sedes de la empresa seleccionada (carga automática) */}
      <Modal open={!!sedePick} onClose={() => setSedePick(null)}>
        <ModalTitle>{t("empresas.pickBranchTitle", { empresa: sedePick?.nombre || "" })}</ModalTitle>
        {loadingSedes ? (
          <ModalText>{t("empresas.loadingBranches")}</ModalText>
        ) : sedesEmpresa.length === 0 ? (
          <ModalText>{t("empresas.noBranches")}</ModalText>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8, margin: "8px 0 4px" }}>
            {sedesEmpresa.map((s) => (
              <Button key={s.id} variant="ghost" block onClick={() => elegirSede(s)}>
                {s.nombre}{s.ciudad ? ` · ${s.ciudad}` : ""}
              </Button>
            ))}
          </div>
        )}
        <ModalActions>
          <Button variant="ghost" onClick={() => setSedePick(null)}>{t("common.close")}</Button>
        </ModalActions>
      </Modal>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)}>
        <ModalTitle>{t("empresas.modalTitle")}</ModalTitle>
        <Field label={t("common.name")} htmlFor="ne-nombre">
          <input id="ne-nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder={t("empresas.namePlaceholder")} />
        </Field>
        <Field label={t("empresas.rubro")} htmlFor="ne-rubro">
          <input id="ne-rubro" value={rubro} onChange={(e) => setRubro(e.target.value)} placeholder={t("empresas.rubroPlaceholder")} />
        </Field>
        <ModalActions>
          <Button variant="ghost" onClick={() => setModalOpen(false)}>{t("common.cancel")}</Button>
          <Button onClick={agregar}>{t("common.save")}</Button>
        </ModalActions>
      </Modal>
    </>
  );
}
