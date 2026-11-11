"use client";
/* ============================================================
   Empresas — EXCLUSIVO DE SUPERADMIN (control total)
   Lista los negocios (tenants) registrados en la plataforma,
   permite darlos de alta y cambiar el contexto de trabajo.
============================================================ */
import { useEffect, useMemo, useState } from "react";
import { useData } from "@/hooks/useData";
import { useRouter } from "next/navigation";
import { ROUTES, fotoUrl } from "@/constants";
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
import { bandera } from "@/components/accesos/formato";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import Modal, { ModalTitle, ModalText, ModalActions, Field } from "@/components/ui/Modal";
import { CardGrid, SimpleCard } from "@/components/ui/Cards";
import MenuAcciones, { type AccionMenu } from "@/components/ui/MenuAcciones";
import Icon from "@/components/ui/Icon";
import ImageUpload from "@/components/ui/ImageUpload";
import EmpresaSedesPanel from "@/components/empresas/EmpresaSedesPanel";
import EmpresaFormModal from "@/components/empresas/EmpresaFormModal";
import KycPendientes from "@/components/kyc/KycPendientes";
import KycEmpresaModal from "@/components/kyc/KycEmpresaModal";
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
  /* Cuadrícula o lista; se recuerda en este navegador */
  const [vista, setVista] = useState<"grid" | "lista">("grid");
  useEffect(() => {
    try {
      const v = localStorage.getItem("empresas.vista");
      if (v === "grid" || v === "lista") setVista(v);
    } catch { /* sin almacenamiento: se queda en cuadrícula */ }
  }, []);
  const cambiarVista = (v: "grid" | "lista") => {
    setVista(v);
    try { localStorage.setItem("empresas.vista", v); } catch { /* no pasa nada */ }
  };

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
      .filter((n) => [n.nombre, n.rubro, n.email, n.nit, n.telefono].filter(Boolean).join(" ").toLowerCase().includes(q));
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


  /** Menú ⋯ de una empresa, el mismo en cuadrícula y en lista */
  const accionesDe = (n: Negocio): AccionMenu[] => [
    { etiqueta: t("empresas.viewSedes"), icono: "mapPin", onClick: () => setViendoSedesDe(n) },
    { etiqueta: t("empresas.edit"), icono: "edit", onClick: () => { setEditandoId(Number(n.id)); setModalOpen(true); } },
    { etiqueta: t("kyc.verEmpresa"), icono: "shield", onClick: () => setKycDe(n) },
    {
      etiqueta: t("plan.changeTo", { plan: n.plan === "PRO" ? t("plan.free") : t("plan.pro") }),
      icono: "crown",
      deshabilitada: cambiandoPlan === n.id,
      onClick: () => void cambiarPlan(n),
    },
    n.bloqueada
      ? { etiqueta: t("empresas.desbloquear"), icono: "play", deshabilitada: bloqueando === n.id, onClick: () => void desbloquear(n) }
      : { etiqueta: t("empresas.bloquear"), icono: "power", peligro: true, onClick: () => setBloqueandoA(n) },
  ];

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
                <div className={styles.selectorVista} role="group" aria-label={t("empresas.vista")}>
                  <button
                    type="button"
                    className={vista === "grid" ? styles.vistaActiva : undefined}
                    aria-pressed={vista === "grid"}
                    title={t("empresas.vistaGrid")}
                    onClick={() => cambiarVista("grid")}
                  >
                    <Icon name="grid" width={17} height={17} />
                    <span>{t("empresas.vistaGrid")}</span>
                  </button>
                  <button
                    type="button"
                    className={vista === "lista" ? styles.vistaActiva : undefined}
                    aria-pressed={vista === "lista"}
                    title={t("empresas.vistaLista")}
                    onClick={() => cambiarVista("lista")}
                  >
                    <Icon name="menu" width={17} height={17} />
                    <span>{t("empresas.vistaLista")}</span>
                  </button>
                </div>
                <Button variant="ghost" onClick={() => setVerificaciones(true)}>
                  {t("kyc.verificaciones")}
                </Button>
                <Button onClick={() => { setEditandoId(null); setModalOpen(true); }}>{t("empresas.new")}</Button>
              </ToolbarActions>
            </Toolbar>

            {lista.length === 0 ? (
              <EmptyState icon="shield" title={t("empresas.emptyTitle")} message={t("empresas.emptyMsg")} />
            ) : vista === "lista" ? (
              /* ── Vista de lista: una fila por empresa ── */
              <div className={styles.lista} role="table" aria-label={t("empresas.panelTitle")}>
                <div className={`${styles.fila} ${styles.filaCabecera}`} role="row">
                  <span role="columnheader">{t("empresas.colEmpresa")}</span>
                  <span role="columnheader">{t("empresas.colPais")}</span>
                  <span role="columnheader">{t("empresas.casillaPlan")}</span>
                  <span role="columnheader">{t("empresas.casillaSedes")}</span>
                  <span role="columnheader">{t("empresas.casillaKyc")}</span>
                  <span role="columnheader">{t("empresas.estado")}</span>
                  <span role="columnheader" aria-label={t("empresas.colAcciones")} />
                </div>
                {lista.map((n) => {
                  const activa = n.id === session.negocioId;
                  const kyc = n.kycEstado ?? "PENDIENTE";
                  return (
                    <div
                      key={n.id}
                      role="row"
                      className={`${styles.fila} ${activa ? styles.filaActual : ""} ${n.bloqueada ? styles.apagada : ""}`}
                    >
                      <span role="cell" className={styles.celdaEmpresa}>
                        <span className={`${styles.logoMini} ${styles[`aro${kyc}`] ?? ""}`}>
                          {n.logo
                            // eslint-disable-next-line @next/next/no-img-element
                            ? <img src={fotoUrl(n.logo) ?? n.logo} alt="" />
                            : <b>{n.nombre.slice(0, 2).toUpperCase()}</b>}
                        </span>
                        <span className={styles.celdaTexto}>
                          <b title={n.nombre}>{n.nombre}{activa && <em className={styles.chipActualMini}>{t("empresas.current")}</em>}</b>
                          <small title={n.rubro}>{n.rubro}</small>
                        </span>
                      </span>
                      <span role="cell" className={styles.celdaSuave}>
                        {n.paisNombre ? `${bandera(n.paisIso ?? null)} ${n.paisNombre}` : "—"}
                      </span>
                      <span role="cell">
                        <span className={`${styles.pastilla} ${n.plan === "PRO" ? styles.pastillaPro : n.enPrueba ? styles.pastillaPrueba : ""}`}>
                          <Icon name="crown" width={13} height={13} />
                          {n.plan === "PRO" ? "Pro" : n.enPrueba ? t("empresas.prueba") : "Free"}
                        </span>
                      </span>
                      <span role="cell">
                        <button type="button" className={styles.sedesLink} onClick={() => setViendoSedesDe(n)}>
                          <Icon name="building" width={15} height={15} /> {sedeCounts[n.id] ?? 0}
                        </button>
                      </span>
                      <span role="cell">
                        <span className={`${styles.pastilla} ${styles[`kyc${kyc}`] ?? ""}`}>
                          <span className={styles.punto} aria-hidden />{t(`empresas.kycCorto.${kyc}`)}
                        </span>
                      </span>
                      <span role="cell">
                        <span className={`${styles.pastilla} ${n.bloqueada ? styles.pastillaOff : styles.pastillaOn}`} title={n.bloqueadaMotivo || undefined}>
                          {n.bloqueada ? t("empresas.bloqueada") : t("empresas.activa")}
                        </span>
                      </span>
                      <span role="cell" className={styles.celdaAcciones}>
                        <button
                          type="button"
                          className={styles.gestionarMini}
                          onClick={() => (activa ? router.push(ROUTES.dashboard) : void seleccionar(n.id, n.nombre))}
                          title={activa ? undefined : t("empresas.selectHint")}
                        >
                          {activa ? t("empresas.irPanel") : t("empresas.gestionarCorto")}
                          <Icon name="chevron-right" width={15} height={15} />
                        </button>
                        <MenuAcciones etiqueta={t("empresas.masAcciones", { empresa: n.nombre })} acciones={accionesDe(n)} />
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <CardGrid className={styles.rejilla}>
                {lista.map((n) => {
                  const activa = n.id === session.negocioId;
                  const kyc = n.kycEstado ?? "PENDIENTE";
                  const planTxt = n.plan === "PRO" ? "Pro" : n.enPrueba ? t("empresas.prueba") : "Free";
                  return (
                    <SimpleCard
                      key={n.id}
                      className={`${styles.tarjeta} ${activa ? styles.current : ""} ${n.bloqueada ? styles.apagada : ""}`}
                    >
                      {/* ── Arriba: logo con su sello | nombre y descripción ── */}
                      <div className={styles.arriba}>
                        <div className={styles.colLogo}>
                          <div className={`${styles.logo} ${styles[`aro${kyc}`] ?? ""}`}>
                            <ImageUpload
                              value={n.logo}
                              nombre={n.nombre}
                              variant="avatar"
                              disabled={!activa && session.role !== "superadmin"}
                              onUpload={(file) => subirLogo(n, file)}
                            />
                          </div>
                          <span className={`${styles.sello} ${styles[`sello${kyc}`] ?? ""}`}>
                            <Icon name={kyc === "APROBADA" ? "circle-check" : kyc === "RECHAZADA" ? "circle-x" : "clock"} width={15} height={15} />
                            {t(`empresas.kycCorto.${kyc}`)}
                          </span>
                        </div>

                        <div className={styles.colTexto}>
                          <h3 className={styles.nombre} title={n.nombre}>{n.nombre}</h3>
                          {n.paisNombre && (
                            <span className={styles.pais}>{bandera(n.paisIso ?? null)} {n.paisNombre}</span>
                          )}
                          <p className={styles.rubro} title={n.rubro}>{n.rubro}</p>
                          {activa && (
                            <span className={styles.chipActual}>
                              <Icon name="check" width={13} height={13} strokeWidth={2.6} />
                              {t("empresas.current")}
                            </span>
                          )}
                        </div>

                        {/* Lo secundario: sedes, editar, verificación, plan y desactivar */}
                        <div className={styles.menu}>
                          <MenuAcciones
                            etiqueta={t("empresas.masAcciones", { empresa: n.nombre })}
                            acciones={accionesDe(n)}
                          />
                        </div>
                      </div>

                      {/* ── Tres casillas: sedes, plan y estado ── */}
                      <div className={styles.casillas}>
                        <button type="button" className={styles.casilla} onClick={() => setViendoSedesDe(n)} title={t("empresas.viewSedes")}>
                          <Icon name="building" className={styles.icoSedes} />
                          <span className={styles.casillaTexto}>
                            <b>{sedeCounts[n.id] ?? 0}</b>
                            <span>{t("empresas.casillaSedes")}</span>
                          </span>
                        </button>
                        <div className={styles.casilla}>
                          <Icon name="crown" className={n.plan === "PRO" || n.enPrueba ? styles.icoPro : styles.icoFree} />
                          <span className={styles.casillaTexto}>
                            <b>{planTxt}</b>
                            <span>{n.enPrueba && n.trialEndsAt
                              ? t("empresas.hasta", { fecha: new Date(n.trialEndsAt).toLocaleDateString(locale, { day: "numeric", month: "short" }) })
                              : t("empresas.planActual")}</span>
                          </span>
                        </div>
                        <div className={styles.casilla}>
                          <Icon name={n.bloqueada ? "power" : "shield-check"} className={n.bloqueada ? styles.icoOff : styles.icoOn} />
                          <span className={styles.casillaTexto}>
                            <b>{n.bloqueada ? t("empresas.bloqueada") : t("empresas.activa")}</b>
                            <span title={n.bloqueadaMotivo || undefined}>{n.bloqueada && n.bloqueadaMotivo ? n.bloqueadaMotivo : t("empresas.estado")}</span>
                          </span>
                        </div>
                      </div>

                      {/* ── Acción principal a lo ancho ── */}
                      <button
                        type="button"
                        className={styles.gestionar}
                        onClick={() => (activa ? router.push(ROUTES.dashboard) : void seleccionar(n.id, n.nombre))}
                        title={activa ? undefined : t("empresas.selectHint")}
                      >
                        <Icon name="gear" width={19} height={19} />
                        <span>{activa ? t("empresas.irPanel") : t("empresas.gestionar")}</span>
                        <Icon name="chevron-right" width={19} height={19} className={styles.flecha} />
                      </button>
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
