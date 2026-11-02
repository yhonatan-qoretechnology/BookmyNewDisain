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
import Badge from "@/components/ui/Badge";
import { bandera } from "@/components/accesos/formato";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import Modal, { ModalTitle, ModalText, ModalActions, Field } from "@/components/ui/Modal";
import { CardGrid, SimpleCard } from "@/components/ui/Cards";
import MenuAcciones from "@/components/ui/MenuAcciones";
import Icon from "@/components/ui/Icon";
import ImageUpload from "@/components/ui/ImageUpload";
import EmpresaSedesPanel from "@/components/empresas/EmpresaSedesPanel";
import EmpresaFormModal from "@/components/empresas/EmpresaFormModal";
import KycPendientes from "@/components/kyc/KycPendientes";
import KycEmpresaModal from "@/components/kyc/KycEmpresaModal";
import { BADGE_KYC } from "@/components/kyc/estados";
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
  /* Formulario de empresa: abierto en alta (id null) o en edición (id) */
  const [modalOpen, setModalOpen] = useState(false);
  const [editandoId, setEditandoId] = useState<number | null>(null);

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
                <Button onClick={() => { setEditandoId(null); setModalOpen(true); }}>{t("empresas.new")}</Button>
              </ToolbarActions>
            </Toolbar>

            {lista.length === 0 ? (
              <EmptyState icon="shield" title={t("empresas.emptyTitle")} message={t("empresas.emptyMsg")} />
            ) : (
              <CardGrid>
                {lista.map((n) => {
                  const activa = n.id === session.negocioId;
                  const esPro = n.plan === "PRO" || n.enPrueba;
                  const kyc = n.kycEstado ?? "PENDIENTE";
                  return (
                    <SimpleCard
                      key={n.id}
                      className={`${styles.tarjeta} ${activa ? styles.current : ""} ${n.bloqueada ? styles.apagada : ""}`}
                    >
                      {/* Cabecera: logo, nombre, rubro en una línea y país.
                          Lo secundario (editar, verificación, plan, desactivar)
                          va al menú ⋯ para que la tarjeta se lea de un vistazo. */}
                      <div className={styles.cabeza}>
                        <ImageUpload
                          value={n.logo}
                          nombre={n.nombre}
                          variant="avatar"
                          disabled={!activa && session.role !== "superadmin"}
                          onUpload={(file) => subirLogo(n, file)}
                        />
                        <div className={styles.cabezaTexto}>
                          <h3 className={styles.nombre} title={n.nombre}>{n.nombre}</h3>
                          <p className={styles.rubro} title={n.rubro}>{n.rubro}</p>
                          {n.paisNombre && (
                            <span className={styles.pais}>
                              {bandera(n.paisIso ?? null)} {n.paisNombre}
                            </span>
                          )}
                        </div>
                        <MenuAcciones
                          etiqueta={t("empresas.masAcciones", { empresa: n.nombre })}
                          acciones={[
                            { etiqueta: t("empresas.edit"), icono: "edit", onClick: () => { setEditandoId(Number(n.id)); setModalOpen(true); } },
                            { etiqueta: t("kyc.verEmpresa"), icono: "shield", onClick: () => setKycDe(n) },
                            {
                              etiqueta: t("plan.changeTo", { plan: n.plan === "PRO" ? t("plan.free") : t("plan.pro") }),
                              icono: "star",
                              deshabilitada: cambiandoPlan === n.id,
                              onClick: () => void cambiarPlan(n),
                            },
                            n.bloqueada
                              ? { etiqueta: t("empresas.desbloquear"), icono: "play", deshabilitada: bloqueando === n.id, onClick: () => void desbloquear(n) }
                              : { etiqueta: t("empresas.bloquear"), icono: "power", peligro: true, onClick: () => setBloqueandoA(n) },
                          ]}
                        />
                      </div>

                      {/* Estado en una fila: plan, sedes y verificación */}
                      <div className={styles.datos}>
                        <span className={`${styles.dato} ${esPro ? styles.datoPro : ""}`}>
                          <Icon name="star" width={14} height={14} />
                          {n.plan === "PRO" ? t("plan.pro") : n.enPrueba ? t("empresas.enPrueba") : t("plan.free")}
                        </span>
                        <span className={styles.dato}>
                          <Icon name="mapPin" width={14} height={14} />
                          {t("empresas.sedesCount", { n: sedeCounts[n.id] ?? 0 })}
                        </span>
                        <Badge kind={BADGE_KYC[kyc]}>{t(`kyc.estados.${kyc}`)}</Badge>
                      </div>
                      {n.enPrueba && n.trialEndsAt && (
                        <p className={styles.nota}>{t("plan.trialUntil", { fecha: new Date(n.trialEndsAt).toLocaleDateString(locale) })}</p>
                      )}
                      {n.bloqueada && (
                        <p className={`${styles.nota} ${styles.notaBloqueo}`}>
                          {n.bloqueadaMotivo ? t("empresas.bloqueadaPor", { motivo: n.bloqueadaMotivo }) : t("empresas.bloqueada")}
                        </p>
                      )}

                      {/* Dos acciones a la vista: entrar a operar y ver sedes */}
                      <div className={styles.acciones}>
                        {activa ? (
                          <span className={styles.actual}>
                            <Icon name="check" width={15} height={15} strokeWidth={2.4} />
                            {t("empresas.current")}
                          </span>
                        ) : (
                          <Button size="sm" onClick={() => seleccionar(n.id, n.nombre)} title={t("empresas.selectHint")}>
                            {t("empresas.entrar")}
                            <Icon name="arrow-right" width={15} height={15} />
                          </Button>
                        )}
                        <Button variant="ghost" size="sm" onClick={() => setViendoSedesDe(n)}>
                          {t("empresas.viewSedes")}
                        </Button>
                      </div>
                    </SimpleCard>
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

      <EmpresaFormModal
        open={modalOpen}
        empresaId={editandoId}
        onClose={() => setModalOpen(false)}
        onGuardada={() => reload()}
      />
    </>
  );
}
