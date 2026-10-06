"use client";
/* ============================================================
   Plan — pantalla propia del menú
   ------------------------------------------------------------
   Dos vistas según quién entra:
     · Negocio    → qué plan tiene, qué incluye cada uno y cómo
                    pasar a Pro (o activar la prueba de 30 días).
     · Superadmin → el plan de cada empresa, para marcarlo cuando
                    cobra. Es lo mismo que hay en Empresas, pero
                    reunido y sin el resto de la ficha.
============================================================ */
import { useState } from "react";
import { EmpresasApi } from "@/api/modules";
import { NegociosController } from "@/controllers/NegociosController";
import { useData } from "@/hooks/useData";
import { useSession } from "@/context/SessionContext";
import { useUi } from "@/context/UiContext";
import { useI18n } from "@/i18n";
import { usePlan } from "@/components/plan/usePlan";
import Panel, { PanelHead } from "@/components/ui/Panel";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Icon from "@/components/ui/Icon";
import EmptyState from "@/components/ui/EmptyState";
import styles from "./plan.module.css";

const VENTAS = "https://wa.me/34651026700?text=Hola%2C%20quiero%20Bookmy%20CRM%20Pro";
/** Lo que entra en el plan gratuito, con el nombre que usa el menú. */
const INCLUYE_FREE = ["reservas", "clientes", "servicios", "personal", "calendario", "resenas"] as const;
/** Lo que añade Pro, en el orden en el que mejor se vende. */
const INCLUYE_PRO = ["f1", "f2", "f3", "f4", "f5", "f6"] as const;

export default function PlanPage() {
  const { session } = useSession();
  const { t, locale } = useI18n();
  const { toast } = useUi();
  const { estado, activarPrueba } = usePlan();
  const [activando, setActivando] = useState(false);
  const [cambiando, setCambiando] = useState<string | null>(null);

  /* ── Vista del superadmin: el plan de cada negocio ───────── */
  const { data: negocios, reload } = useData(
    () => (session?.role === "superadmin" ? NegociosController.getAll() : Promise.resolve([])),
    [session?.role],
    [],
  );

  const cambiarPlan = async (id: string, plan?: "FREE" | "PRO") => {
    setCambiando(id);
    try {
      await EmpresasApi.cambiarPlan(Number(id), plan === "PRO" ? "FREE" : "PRO");
      toast(t("plan.changed"), "success");
      await reload();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Error", "error");
    } finally {
      setCambiando(null);
    }
  };

  if (session?.role === "superadmin") {
    return (
      <Panel>
        <PanelHead title={t("plan.empresasTitulo")} sub={t("plan.empresasSub")} />
        {negocios.length === 0 ? (
          <EmptyState icon="building" title={t("empresas.emptyTitle")} message={t("empresas.emptyMsg")} />
        ) : (
          <div className={styles.lista}>
            {negocios.map((n) => {
              const pro = n.plan === "PRO" || n.enPrueba;
              return (
                <div key={n.id} className={styles.fila}>
                  <div className={styles.filaInfo}>
                    <b>{n.nombre}</b>
                    <span>
                      {n.enPrueba && n.trialEndsAt
                        ? t("plan.trialUntil", { fecha: new Date(n.trialEndsAt).toLocaleDateString(locale) })
                        : n.rubro}
                    </span>
                  </div>
                  <Badge kind={pro ? "activo" : "inactivo"}>
                    {pro ? t("plan.pro") : t("plan.free")}
                  </Badge>
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={cambiando === n.id}
                    onClick={() => void cambiarPlan(n.id, n.plan)}
                  >
                    {t("plan.changeTo", { plan: n.plan === "PRO" ? t("plan.free") : t("plan.pro") })}
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </Panel>
    );
  }

  /* ── Vista del negocio: qué tiene y qué le falta ─────────── */
  const pro = estado?.planEfectivo === "PRO";
  const puedeProbar = session?.role === "owner" && (estado?.puedeProbar ?? false);

  const probar = async () => {
    if (activando) return;
    setActivando(true);
    try {
      await activarPrueba();
      toast(t("plan.tryDone"), "success");
    } catch (e) {
      toast(e instanceof Error ? e.message : "Error", "error");
    } finally {
      setActivando(false);
    }
  };

  return (
    <Panel>
      <PanelHead title={t("plan.panelTitle")} sub={t("plan.panelSub")} />

      {/* Estado de hoy, antes que la comparativa: es lo que vienen a mirar */}
      <div className={styles.estado}>
        <span className={styles.estadoPlan}>
          <Badge kind={pro ? "activo" : "inactivo"}>{pro ? t("plan.pro") : t("plan.free")}</Badge>
        </span>
        <p className={styles.estadoTexto}>
          {estado?.enPrueba
            ? estado.diasDePrueba <= 1
              ? t("plan.trialBannerOne")
              : t("plan.trialBanner", { n: estado.diasDePrueba })
            : pro
              ? t("plan.proActivo")
              : t("plan.freeActivo")}
        </p>
      </div>

      <div className={styles.planes}>
        {/* Gratuito */}
        <article className={`${styles.card} ${!pro ? styles.actual : ""}`}>
          <header className={styles.cardHead}>
            <h3>{t("plan.free")}</h3>
            {!pro && <span className={styles.chipActual}>{t("plan.actual")}</span>}
          </header>
          <p className={styles.cardLead}>{t("plan.freeDesc")}</p>
          <ul className={styles.lista2}>
            {INCLUYE_FREE.map((clave) => (
              <li key={clave}>
                <Icon name="circle-check" width={15} height={15} />
                {t(`nav.${clave}`)}
              </li>
            ))}
          </ul>
        </article>

        {/* Pro */}
        <article className={`${styles.card} ${styles.cardPro} ${pro ? styles.actual : ""}`}>
          <header className={styles.cardHead}>
            <h3>
              <Icon name="star" width={16} height={16} /> {t("plan.badge")}
            </h3>
            {pro && <span className={styles.chipActual}>{t("plan.actual")}</span>}
          </header>
          <p className={styles.cardLead}>{t("plan.proDesc")}</p>
          <ul className={styles.lista2}>
            {INCLUYE_PRO.map((clave) => (
              <li key={clave}>
                <Icon name="circle-check" width={15} height={15} />
                {t(`plan.${clave}`)}
              </li>
            ))}
          </ul>

          {!pro && (
            <div className={styles.cta}>
              {puedeProbar ? (
                <>
                  <Button onClick={() => void probar()} disabled={activando}>
                    {activando ? t("plan.trying") : t("plan.tryCta")}
                  </Button>
                  <small>{t("plan.tryLead")}</small>
                </>
              ) : (
                <>
                  <a className={styles.ventas} href={VENTAS} target="_blank" rel="noopener noreferrer">
                    <Icon name="message" width={15} height={15} />
                    {t("plan.salesCta")}
                  </a>
                  <small>{t("plan.trialOverText")}</small>
                </>
              )}
            </div>
          )}
        </article>
      </div>
    </Panel>
  );
}
