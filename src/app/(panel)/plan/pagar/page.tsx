"use client";
/* ============================================================
   Pagar membresía — Bookmy CRM Pro
   ------------------------------------------------------------
   El dueño elige mensual o anual y, si las necesita, sedes extra;
   ve el total y paga en la página segura de Stripe. Al volver
   (?ok=1&session_id=…) se confirma el pago con una animación de
   carga y de éxito. Si cancela (?cancelado=1), se le avisa.
============================================================ */
import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ROUTES } from "@/constants";
import { MembresiaApi } from "@/api/modules";
import type { ApiCicloPro, ApiMembresiaMia } from "@/api/types";
import { useData } from "@/hooks/useData";
import { useSession } from "@/context/SessionContext";
import { useUi } from "@/context/UiContext";
import { useI18n } from "@/i18n";
import Panel, { PanelHead } from "@/components/ui/Panel";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Icon from "@/components/ui/Icon";
import { SkTable } from "@/components/ui/Skeleton";
import styles from "./pagar.module.css";

function fmtFecha(iso: string | null | undefined, locale: string) {
  if (!iso) return "—";
  try {
    return new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "es-ES", { dateStyle: "long" }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export default function PagarMembresiaPage() {
  return (
    <Suspense fallback={<Panel><SkTable cols={3} rows={4} person={-1} /></Panel>}>
      <PagarMembresia />
    </Suspense>
  );
}

function PagarMembresia() {
  const { t, locale } = useI18n();
  const { toast } = useUi();
  const { session } = useSession();
  const router = useRouter();
  const params = useSearchParams();
  const reduce = useReducedMotion();
  const { data, loading, reload } = useData(
    () => (session?.role === "owner" ? MembresiaApi.mia() : Promise.resolve(null)),
    [session?.role, session?.negocioId],
    null as ApiMembresiaMia | null
  );
  const [ciclo, setCiclo] = useState<ApiCicloPro>("MENSUAL");
  const [sedesExtra, setSedesExtra] = useState(0);
  const [yendo, setYendo] = useState(false);
  /* Vuelta de Stripe: confirmando → listo (o pendiente) */
  const [vuelta, setVuelta] = useState<"confirmando" | "listo" | "pendiente" | null>(null);
  const [hasta, setHasta] = useState<string | null>(null);

  const sessionId = params.get("session_id");
  const ok = params.get("ok") === "1";
  const cancelado = params.get("cancelado") === "1";

  useEffect(() => {
    if (session && session.role !== "owner") router.replace(ROUTES.plan);
  }, [session, router]);

  /* Recupera la elección anterior y las sedes que ya necesita */
  useEffect(() => {
    if (!data) return;
    if (data.ciclo) setCiclo(data.ciclo);
    const minimo = Math.max(0, data.sedes.usadas - data.precios.sedesIncluidas);
    setSedesExtra((s) => Math.max(s, minimo, data.sedes.extra));
  }, [data]);

  useEffect(() => {
    if (!ok || !sessionId) return;
    let vigente = true;
    setVuelta("confirmando");
    /* Stripe puede tardar unos segundos en dar el pago por cobrado */
    const intentar = async (n: number): Promise<void> => {
      try {
        const r = await MembresiaApi.confirmar(sessionId);
        if (!vigente) return;
        if (r.pagado) {
          setHasta(r.hasta ?? null);
          setVuelta("listo");
          void reload();
          return;
        }
      } catch { /* se reintenta */ }
      if (n < 5 && vigente) {
        await new Promise((res) => setTimeout(res, 2000));
        return intentar(n + 1);
      }
      if (vigente) setVuelta("pendiente");
    };
    void intentar(0);
    return () => { vigente = false; };
  }, [ok, sessionId]); // eslint-disable-line react-hooks/exhaustive-deps

  const p = data?.precios;
  const minimoSedes = data ? Math.max(0, data.sedes.usadas - data.precios.sedesIncluidas) : 0;
  const resumen = useMemo(() => {
    if (!p) return null;
    const meses = ciclo === "ANUAL" ? 12 : 1;
    const plan = ciclo === "ANUAL" ? p.precioAnual : p.precioMensual;
    const sedes = sedesExtra * p.precioSedeExtra * meses;
    const ahorro = ciclo === "ANUAL" ? p.precioMensual * 12 - p.precioAnual : 0;
    return { meses, plan, sedes, total: plan + sedes, ahorro };
  }, [p, ciclo, sedesExtra]);

  const fmt = (n: number) => {
    try {
      return new Intl.NumberFormat(locale === "en" ? "en-GB" : "es-ES", { style: "currency", currency: p?.moneda || "EUR" }).format(n);
    } catch {
      return `${n.toFixed(2)} ${p?.moneda || "EUR"}`;
    }
  };

  const pagar = async () => {
    setYendo(true);
    try {
      const r = await MembresiaApi.checkout(ciclo, sedesExtra);
      window.location.href = r.url;
    } catch (e) {
      toast(e instanceof Error ? e.message : t("common.error"), "error");
      setYendo(false);
    }
  };

  /* ── Vuelta de Stripe ── */
  if (vuelta) {
    return (
      <Panel>
        <div className={styles.vuelta} aria-live="polite">
          <AnimatePresence mode="wait">
            {vuelta === "confirmando" && (
              <motion.div key="c" className={styles.vueltaCaja}
                initial={reduce ? false : { opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <span className={styles.spinner} aria-hidden />
                <h2>{t("membresia.confirmando")}</h2>
                <p>{t("membresia.confirmandoTexto")}</p>
              </motion.div>
            )}
            {vuelta === "listo" && (
              <motion.div key="l" className={styles.vueltaCaja}
                initial={reduce ? false : { opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }}
                transition={{ type: "spring", stiffness: 260, damping: 22 }}>
                <motion.span className={styles.check}
                  initial={reduce ? false : { scale: 0 }} animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 320, damping: 16, delay: 0.1 }}>
                  <Icon name="check" />
                </motion.span>
                <h2>{t("membresia.listo")}</h2>
                <p>{t("membresia.listoTexto", { fecha: fmtFecha(hasta, locale) })}</p>
                <Button onClick={() => router.push(ROUTES.dashboard)}>{t("membresia.irAlPanel")}</Button>
              </motion.div>
            )}
            {vuelta === "pendiente" && (
              <motion.div key="p" className={styles.vueltaCaja} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <span className={styles.pendiente}><Icon name="clock" /></span>
                <h2>{t("membresia.pendiente")}</h2>
                <p>{t("membresia.pendienteTexto")}</p>
                <Button variant="ghost" onClick={() => router.replace(ROUTES.planPagar)}>{t("membresia.volver")}</Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </Panel>
    );
  }

  if (loading && !data) return <Panel><SkTable cols={3} rows={4} person={-1} /></Panel>;
  if (!data || !p || !resumen) return null;

  return (
    <div className={styles.layout}>
      <Panel>
        <PanelHead title={t("membresia.titulo")} sub={t("membresia.sub")} />

        {cancelado && <div className={styles.aviso}>{t("membresia.cancelado")}</div>}

        {/* Estado actual */}
        <div className={styles.estado}>
          <Badge kind={data.estado.planEfectivo === "PRO" ? "activo" : "inactivo"}>
            {data.estado.planEfectivo === "PRO" ? t("plan.pro") : t("plan.free")}
          </Badge>
          <span>
            {data.contratadoManual
              ? t("membresia.manual")
              : data.proHasta
                ? (data.diasRestantes ?? 0) >= 0
                  ? t("membresia.activoHasta", { fecha: fmtFecha(data.proHasta, locale), n: data.diasRestantes ?? 0 })
                  : t("membresia.vencioEl", { fecha: fmtFecha(data.proHasta, locale) })
                : t("membresia.sinPro")}
          </span>
        </div>

        {/* Ciclo */}
        <h3 className={styles.bloque}>{t("membresia.eligeCiclo")}</h3>
        <div className={styles.ciclos} role="radiogroup">
          {(["MENSUAL", "ANUAL"] as const).map((c) => (
            <button
              key={c}
              type="button"
              role="radio"
              aria-checked={ciclo === c}
              className={`${styles.ciclo} ${ciclo === c ? styles.cicloOn : ""}`}
              onClick={() => setCiclo(c)}
            >
              <span className={styles.cicloNombre}>{t(c === "ANUAL" ? "membresia.anual" : "membresia.mensual")}</span>
              <span className={styles.cicloPrecio}>
                {fmt(c === "ANUAL" ? p.precioAnual : p.precioMensual)}
                <small>{t(c === "ANUAL" ? "membresia.porAnio" : "membresia.porMes")}</small>
              </span>
              {c === "ANUAL" && p.precioMensual * 12 > p.precioAnual && (
                <span className={styles.ahorro}>{t("membresia.ahorras", { n: fmt(p.precioMensual * 12 - p.precioAnual) })}</span>
              )}
            </button>
          ))}
        </div>

        {/* Sedes */}
        <h3 className={styles.bloque}>{t("membresia.sedesTitulo")}</h3>
        <p className={styles.ayuda}>
          {t("membresia.sedesTexto", { incluidas: p.sedesIncluidas, usadas: data.sedes.usadas, precio: fmt(p.precioSedeExtra) })}
        </p>
        <div className={styles.sedes}>
          <button type="button" className={styles.paso} aria-label={t("membresia.menosSedes")}
            onClick={() => setSedesExtra((s) => Math.max(minimoSedes, s - 1))} disabled={sedesExtra <= minimoSedes}>−</button>
          <span className={styles.sedesNum}>
            <b>{sedesExtra}</b> {t("membresia.sedesExtra")}
          </span>
          <button type="button" className={styles.paso} aria-label={t("membresia.masSedes")}
            onClick={() => setSedesExtra((s) => Math.min(500, s + 1))}>+</button>
          <span className={styles.sedesTotal}>
            {t("membresia.sedesTotal", { n: p.sedesIncluidas + sedesExtra })}
          </span>
        </div>
        {minimoSedes > 0 && <p className={styles.ayuda}>{t("membresia.minimoSedes", { n: minimoSedes })}</p>}
      </Panel>

      {/* Resumen */}
      <aside className={styles.resumen}>
        <h3>{t("membresia.resumen")}</h3>
        <dl>
          <dt>{t(ciclo === "ANUAL" ? "membresia.planAnual" : "membresia.planMensual")}</dt>
          <dd>{fmt(resumen.plan)}</dd>
          {sedesExtra > 0 && (
            <>
              <dt>{t("membresia.lineaSedes", { n: sedesExtra, meses: resumen.meses })}</dt>
              <dd>{fmt(resumen.sedes)}</dd>
            </>
          )}
        </dl>
        <div className={styles.total}>
          <span>{t("membresia.total")}</span>
          <b>{fmt(resumen.total)}</b>
        </div>
        {resumen.ahorro > 0 && <p className={styles.ahorroLinea}>{t("membresia.ahorras", { n: fmt(resumen.ahorro) })}</p>}
        <Button block onClick={() => void pagar()} disabled={yendo || !data.stripeActivo}>
          <Icon name="wallet" /> {yendo ? t("membresia.redirigiendo") : t("membresia.pagar")}
        </Button>
        {!data.stripeActivo && <p className={styles.ayuda}>{t("membresia.sinStripe")}</p>}
        <p className={styles.seguro}><Icon name="shield" /> {t("membresia.seguro")}</p>

        {data.pagos.filter((x) => x.estado === "PAGADO").length > 0 && (
          <div className={styles.historial}>
            <h4>{t("membresia.historial")}</h4>
            {data.pagos.filter((x) => x.estado === "PAGADO").slice(0, 6).map((x) => (
              <div key={x.id} className={styles.pago}>
                <span>{fmtFecha(x.pagadoEn, locale)}</span>
                <span>{x.cubiertoPorReferidos ? t("membresia.porReferidos") : t(x.ciclo === "ANUAL" ? "membresia.anual" : "membresia.mensual")}</span>
                <b>{x.cubiertoPorReferidos ? "—" : fmt(x.monto)}</b>
              </div>
            ))}
          </div>
        )}
      </aside>
    </div>
  );
}
