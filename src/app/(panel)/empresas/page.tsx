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
import { EmpresasApi } from "@/api/modules";
import type { Negocio, Sede } from "@/models";
import { ImagenesApi } from "@/api/modules";
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
import ImageUpload from "@/components/ui/ImageUpload";
import EmpresaSedesPanel from "@/components/empresas/EmpresaSedesPanel";
import KycPendientes from "@/components/kyc/KycPendientes";
import KycEmpresaModal from "@/components/kyc/KycEmpresaModal";
import { BADGE_KYC } from "@/components/kyc/KycPanel";
import styles from "./empresas.module.css";

export default function EmpresasPage() {
  const router = useRouter();
  const { session, updateSession } = useSession();
  const booking = useBooking();
  const { toast } = useUi();
  const { t, locale } = useI18n();

  const [search, setSearch] = useState("");
  /* El superadmin es el unico que ve negocios de varios mercados a la vez:
     sin este filtro, una lista con Espana y Colombia mezcladas no se puede
     leer. Es el unico control nuevo que ha traido la separacion por paises
     a todo el panel. */
  const [paisFiltro, setPaisFiltro] = useState("");
  /** Empresa cuyo plan se está cambiando (para bloquear su botón) */
  const [cambiandoPlan, setCambiandoPlan] = useState<string | null>(null);
  /** Empresa cuyo bloqueo se está guardando (para bloquear su botón) */
  const [bloqueando, setBloqueando] = useState<string | null>(null);
  /** Empresa elegida para bloquear: el modal pide el motivo */
  const [bloqueandoA, setBloqueandoA] = useState<Negocio | null>(null);
  const [motivoBloqueo, setMotivoBloqueo] = useState("");
  /** Cola de verificaciones de identidad por revisar */
  const [verificaciones, setVerificaciones] = useState(false);
  /** Empresa cuya verificación se está mirando (desde su propia tarjeta) */
  const [kycDe, setKycDe] = useState<Negocio | null>(null);
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

  /**
   * Marca la empresa como Pro (ha pagado) o la devuelve a Free.
   * Es lo único que hace falta mientras el cobro se cierre a mano.
   */
  const cambiarPlan = async (n: { id: string; plan?: "FREE" | "PRO" }) => {
    if (cambiandoPlan) return;
    setCambiandoPlan(n.id);
    try {
      await EmpresasApi.cambiarPlan(Number(n.id), n.plan === "PRO" ? "FREE" : "PRO");
      toast(t("plan.changed"), "success");
      await reload();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Error", "error");
    } finally {
      setCambiandoPlan(null);
    }
  };

  /**
   * Bloquear corta el acceso: sus admins y profesionales no pueden entrar
   * al panel y sus sedes dejan de admitir reservas. El motivo es opcional,
   * pero es lo que verá quien intente entrar.
   */
  const bloquear = async () => {
    if (!bloqueandoA) return;
    setBloqueando(bloqueandoA.id);
    try {
      await NegociosController.bloquear(bloqueandoA.id, motivoBloqueo);
      toast(t("empresas.bloqueadaOk", { empresa: bloqueandoA.nombre }), "success");
      setBloqueandoA(null);
      setMotivoBloqueo("");
      await reload();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Error", "error");
    } finally {
      setBloqueando(null);
    }
  };

  const desbloquear = async (n: Negocio) => {
    setBloqueando(n.id);
    try {
      await NegociosController.desbloquear(n.id);
      toast(t("empresas.desbloqueadaOk", { empresa: n.nombre }), "success");
      await reload();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Error", "error");
    } finally {
      setBloqueando(null);
    }
  };

  const { data: sedeCounts } = useData(async () => {
    const counts: Record<string, number> = {};
    await Promise.all(todas.map(async (n) => { counts[n.id] = await NegociosController.countSedes(n.id); }));
    return counts;
  }, [todas], {} as Record<string, number>);
  const lista = useMemo(() => {
    const q = search.toLowerCase();
    return todas
      .filter((n) => !paisFiltro || n.paisIso === paisFiltro)
      .filter((n) => (n.nombre + n.rubro).toLowerCase().includes(q));
  }, [todas, search, paisFiltro]);

  /* Solo se ofrecen los paises que de verdad tienen negocios: mientras no
     haya ninguno colombiano, el filtro no aparece y la pantalla queda como
     estaba. */
  const paisesConNegocios = useMemo(() => {
    const vistos = new Map<string, string>();
    for (const n of todas) {
      if (n.paisIso) vistos.set(n.paisIso, n.paisNombre || n.paisIso);
    }
    return [...vistos].sort((a, b) => a[1].localeCompare(b[1]));
  }, [todas]);

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

  /* ── Drill-down "Sedes" de una empresa (editar, profesionales, reseñas) ── */
  const [viendoSedesDe, setViendoSedesDe] = useState<Negocio | null>(null);

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

  /**
   * PATCH /empresas/:id/logo (multipart, campo "logo").
   * El logo encabeza las facturas (EmisorController lo lee de aquí),
   * por eso se recarga la lista al terminar.
   */
  const subirLogo = async (negocio: Negocio, file: File) => {
    const actualizada = await ImagenesApi.empresaLogo(Number(negocio.id), file);
    await reload();
    toast(t("imagen.actualizada"), "success");
    return actualizada?.logo ?? null;
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
        {viendoSedesDe ? (
          <>
            <PanelHead title={t("empresaSedes.panelTitle", { empresa: viendoSedesDe.nombre })} sub={t("empresaSedes.panelSub", { n: sedeCounts[viendoSedesDe.id] ?? 0 })} />
            <EmpresaSedesPanel negocio={viendoSedesDe} onBack={() => setViendoSedesDe(null)} />
          </>
        ) : (
          <>
            <PanelHead title={t("empresas.panelTitle")} sub={t("empresas.panelSub", { n: lista.length })} />
            <Toolbar>
              <SearchBox value={search} onChange={setSearch} placeholder={t("empresas.searchPlaceholder")} />
              {paisesConNegocios.length > 1 && (
                <select
                  value={paisFiltro}
                  onChange={(e) => setPaisFiltro(e.target.value)}
                  aria-label={t("empresas.filtroPais")}
                  className={styles.filtroPais}
                >
                  <option value="">{t("empresas.todosLosPaises")}</option>
                  {paisesConNegocios.map(([iso, nombre]) => (
                    <option key={iso} value={iso}>{nombre}</option>
                  ))}
                </select>
              )}
              <ToolbarActions>
                <Button variant="ghost" onClick={() => setVerificaciones(true)}>
                  {t("kyc.verificaciones")}
                </Button>
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
                        {/* Cabecera: el logo como avatar cuadrado junto al
                            nombre. Antes ocupaba un banner entero y, sin logo
                            subido, la tarjeta era casi todo hueco gris.
                            Cambiarlo solo se puede en la empresa que se
                            administra; el superadmin, en cualquiera. */}
                        <div className={styles.cardHead}>
                          <ImageUpload
                            value={n.logo}
                            nombre={n.nombre}
                            variant="avatar"
                            disabled={!activa && session.role !== "superadmin"}
                            onUpload={(file) => subirLogo(n, file)}
                          />
                          <div className={styles.cardHeadText}>
                            <h3>{n.nombre}</h3>
                            <Muted>{n.rubro}</Muted>
                          </div>
                        </div>
                        <TagRow>
                          <Tag>{t("empresas.sedesCount", { n: sedeCounts[n.id] ?? 0 })}</Tag>
                          {/* Plan del negocio: lo que decide qué módulos ve */}
                          <Badge kind={n.plan === "PRO" || n.enPrueba ? "activo" : "inactivo"}>
                            {n.plan === "PRO" ? t("plan.pro") : n.enPrueba ? t("plan.pro") : t("plan.free")}
                          </Badge>
                          {n.enPrueba && n.trialEndsAt && (
                            <Tag>{t("plan.trialUntil", { fecha: new Date(n.trialEndsAt).toLocaleDateString(locale) })}</Tag>
                          )}
                          {/* Verificación de identidad: se ve en TODAS, también
                              en las que aún no han subido nada */}
                          <Badge kind={BADGE_KYC[n.kycEstado ?? "PENDIENTE"]}>
                            {t(`kyc.estados.${n.kycEstado ?? "PENDIENTE"}`)}
                          </Badge>
                          {n.bloqueada && (
                            <Badge kind="cancelado">
                              {n.bloqueadaMotivo
                                ? t("empresas.bloqueadaPor", { motivo: n.bloqueadaMotivo })
                                : t("empresas.bloqueada")}
                            </Badge>
                          )}
                        </TagRow>
                        <div style={{ marginTop: 12, display: "flex", gap: 8, flexWrap: "wrap" }}>
                          {activa ? (
                            <Tag>{t("empresas.current")}</Tag>
                          ) : (
                            <Button variant="ghost" size="sm" onClick={() => seleccionar(n.id, n.nombre)}>
                              {t("empresas.select")}
                            </Button>
                          )}
                          <Button variant="ghost" size="sm" onClick={() => setViendoSedesDe(n)}>
                            {t("empresas.viewSedes")}
                          </Button>
                          {/* Abre la verificación de ESA empresa, esté en la
                              cola o no: ver documentos, aprobar o rechazar */}
                          <Button variant="ghost" size="sm" onClick={() => setKycDe(n)}>
                            {t("kyc.verEmpresa")}
                          </Button>
                          {/* El superadmin marca aquí quién ha pagado Pro */}
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={cambiandoPlan === n.id}
                            onClick={() => cambiarPlan(n)}
                          >
                            {t("plan.changeTo", {
                              plan: n.plan === "PRO" ? t("plan.free") : t("plan.pro"),
                            })}
                          </Button>
                          {/* Bloqueo: sus admins no entran y sus sedes no admiten reservas */}
                          <Button
                            variant={n.bloqueada ? "ghost" : "danger"}
                            size="sm"
                            disabled={bloqueando === n.id}
                            onClick={() => (n.bloqueada ? void desbloquear(n) : setBloqueandoA(n))}
                          >
                            {n.bloqueada ? t("empresas.desbloquear") : t("empresas.bloquear")}
                          </Button>
                        </div>
                      </SimpleCard>
                    </div>
                  );
                })}
              </CardGrid>
            )}
          </>
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

      <KycPendientes
        abierto={verificaciones}
        onClose={() => { setVerificaciones(false); void reload(); }}
      />

      <KycEmpresaModal
        empresaId={kycDe ? Number(kycDe.id) : null}
        empresaNombre={kycDe?.nombre || ""}
        onClose={() => setKycDe(null)}
        onResuelto={() => void reload()}
      />

      {/* Bloquear una empresa: el motivo se le muestra a quien intente entrar */}
      <Modal open={!!bloqueandoA} onClose={() => { setBloqueandoA(null); setMotivoBloqueo(""); }}>
        <ModalTitle>{t("empresas.bloquearTitulo", { empresa: bloqueandoA?.nombre || "" })}</ModalTitle>
        <ModalText>{t("empresas.bloquearSub")}</ModalText>
        <Field label={t("empresas.bloquearMotivo")} htmlFor="bloq-motivo">
          <input
            id="bloq-motivo"
            value={motivoBloqueo}
            onChange={(e) => setMotivoBloqueo(e.target.value)}
            placeholder={t("empresas.bloquearMotivoPlaceholder")}
          />
        </Field>
        <ModalActions>
          <Button variant="ghost" onClick={() => { setBloqueandoA(null); setMotivoBloqueo(""); }}>
            {t("common.cancel")}
          </Button>
          <Button variant="danger" disabled={!!bloqueando} onClick={() => void bloquear()}>
            {t("empresas.bloquear")}
          </Button>
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
