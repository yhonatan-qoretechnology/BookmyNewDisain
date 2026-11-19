"use client";
/* ============================================================
   Raíl de la izquierda — solo iconos, nunca se despliega
   ------------------------------------------------------------
   Es una columna estrecha de cajitas flotantes. NO se abre ni se
   ensancha: el nombre de cada sección aparece en una burbuja
   flotante a su derecha al pasar el ratón o al llegar con el
   tabulador.

   La burbuja se dibuja en un PORTAL sobre el <body>, no dentro del
   raíl. Si viviera dentro, el `overflow-y: auto` de la columna
   -que hace falta porque el superadmin tiene veintitantas
   secciones- la recortaría contra el borde. Por eso se posiciona a
   mano, con la caja del icono medida en el momento.

   Movimiento (MOTION_SPEC §6.7): las cajitas entran una vez con
   escala tipo gelatina y sus iconos caen en cascada; después, al
   navegar, lo único que se mueve es la píldora del activo, que
   VIAJA de un icono a otro (§6.5).
============================================================ */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, LayoutGroup, motion, useReducedMotion, type Variants } from "framer-motion";
import { navParaSesion } from "@/constants";
import type { NavItem, Rol } from "@/models";
import { useSession } from "@/context/SessionContext";
import { useI18n } from "@/i18n";
import { rutaDeLogin } from "@/lib/loginOrigen";
import { blurInSm, group, spring, stagger } from "@/lib/motion";
import Icon from "@/components/ui/Icon";
import { seccionActiva, seccionesDelRail, seccionesPrincipales } from "./reparto";
import styles from "./Rail.module.css";

/* §10 · con "reducir movimiento" los iconos solo se funden. */
const ICONO_PLANO: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.15 } },
};

/** Lo que se enseña al pasar por un icono: el grupo, el nombre y, si los hay, sus hijos. */
type Burbuja = { texto: string; grupo?: string; hijos?: NavItem[]; y: number; x: number } | null;

/** Margen para llevar el ratón del icono a la burbuja sin que se cierre. */
const GRACIA_MS = 160;

export default function Rail() {
  const pathname = usePathname();
  const router = useRouter();
  const { session, logout } = useSession();
  const { t } = useI18n();
  const reduce = useReducedMotion();
  const [burbuja, setBurbuja] = useState<Burbuja>(null);
  const [montado, setMontado] = useState(false);
  const cierre = useRef<number | null>(null);
  useEffect(() => setMontado(true), []);

  const role: Rol = session?.role || "superadmin";
  const pro = session?.plan?.planEfectivo === "PRO";
  const menu = useMemo(() => navParaSesion(role, pro), [role, pro]);
  const principales = useMemo(() => seccionesPrincipales(role, menu), [role, menu]);
  const { grupos, pie } = useMemo(() => seccionesDelRail(role, menu, principales), [role, menu, principales]);
  const idActivo = useMemo(() => seccionActiva(menu, pathname), [menu, pathname]);

  /* Se sale por la misma puerta por la que se entró (BookMy o QoreTech) */
  const loginHref = rutaDeLogin();
  const handleLogout = (e: React.MouseEvent) => {
    e.preventDefault();
    cerrarBurbuja();
    logout();
    router.push(loginHref);
  };

  /* El cierre va con retardo porque la burbuja YA NO ES SOLO UN
     RÓTULO: cuando la sección tiene submenú lleva enlaces, y hay que
     poder llevar el ratón hasta ellos. Sin esa gracia, el hueco entre
     el icono y la burbuja la cerraría a medio camino. */
  const cancelarCierre = useCallback(() => {
    if (cierre.current !== null) { window.clearTimeout(cierre.current); cierre.current = null; }
  }, []);

  const abrirBurbuja = useCallback(
    (e: React.MouseEvent | React.FocusEvent, texto: string, grupo?: string, hijos?: NavItem[]) => {
      cancelarCierre();
      const c = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const x = c.right + 12;

      /* Un rótulo de una línea se centra con el icono y ya. Una con
         submenú mide bastante más, y centrada en el primer o el último
         icono del raíl se saldría de la pantalla, así que esa se ancla
         por arriba y se sube lo justo para que quepa entera. */
      if (hijos?.length) {
        const alto = 58 + hijos.length * 34;     // basta con aproximarlo
        const margen = 12;
        const y = Math.max(margen, Math.min(c.top - 8, window.innerHeight - alto - margen));
        setBurbuja({ texto, grupo, hijos, x, y });
        return;
      }
      setBurbuja({ texto, grupo, x, y: c.top + c.height / 2 });
    },
    [cancelarCierre],
  );

  const cerrarBurbuja = useCallback(() => { cancelarCierre(); setBurbuja(null); }, [cancelarCierre]);

  const cerrarConGracia = useCallback(() => {
    cancelarCierre();
    cierre.current = window.setTimeout(() => setBurbuja(null), GRACIA_MS);
  }, [cancelarCierre]);

  /* Al navegar, el puntero se queda donde estaba y la burbuja se
     quedaría colgada sobre la pantalla nueva. */
  useEffect(() => cerrarBurbuja(), [pathname, cerrarBurbuja]);
  useEffect(() => cancelarCierre, [cancelarCierre]);

  const iconoVar = reduce ? ICONO_PLANO : blurInSm;

  const pintarItem = (item: NavItem, esPrincipal: boolean, grupoId?: string) => {
    const activo = item.id === idActivo;
    const nombre = t(`nav.${item.id}`);
    const esLogout = item.id === "logout";
    const grupo = grupoId ? t(`nav.grupos.${grupoId}`) : undefined;

    return (
      <motion.div key={item.id} variants={iconoVar} data-primaria={esPrincipal || undefined}>
        <Link
          href={esLogout ? loginHref : item.href}
          onClick={esLogout ? handleLogout : undefined}
          className={`${styles.item} ${activo ? styles.itemActivo : ""} ${esLogout ? styles.salir : ""}`}
          aria-label={nombre}
          aria-current={activo ? "page" : undefined}
          onMouseEnter={(e) => abrirBurbuja(e, nombre, grupo, item.children)}
          onMouseLeave={cerrarConGracia}
          onFocus={(e) => abrirBurbuja(e, nombre, grupo, item.children)}
          onBlur={cerrarBurbuja}
        >
          {/* La píldora del activo es un solo nodo compartido: por eso
              VIAJA de un icono a otro en vez de aparecer y desaparecer. */}
          {activo && (
            <motion.span
              layoutId="rail-activo"
              className={styles.fondoActivo}
              transition={reduce ? { duration: 0 } : spring.indicator}
              aria-hidden
            />
          )}
          <span className={styles.icono}><Icon name={item.icon} /></span>
        </Link>
      </motion.div>
    );
  };

  const caja = (contenido: React.ReactNode, extra = "", soloMovil = false) => (
    <motion.div
      className={`${styles.caja} ${extra}`}
      data-solo-movil={soloMovil || undefined}
      initial={reduce ? false : { scale: 0.94 }}
      animate={reduce ? undefined : { scale: 1 }}
      transition={spring.jelly}
    >
      <motion.div
        className={styles.lista}
        variants={group(stagger.nav, 0.1)}
        initial="hidden"
        animate="show"
      >
        {contenido}
      </motion.div>
    </motion.div>
  );

  return (
    <LayoutGroup id="rail">
      <nav className={styles.rail} data-app-chrome aria-label={t("topbar.menu")}>
        <div className={styles.pila}>
          {grupos.map((g) =>
            <div key={g.id}>{caja(g.items.map((i) => pintarItem(i, principales.some((p) => p.id === i.id), g.id)), "", g.soloMovil)}</div>
          )}
        </div>

        {pie.length > 0 && caja(pie.map((i) => pintarItem(i, false, "cuenta")), styles.cajaPie)}
      </nav>

      {/* La burbuja, fuera del raíl para que no la recorte su scroll */}
      {montado && createPortal(
        <AnimatePresence>
          {burbuja && (
            <motion.div
              className={`${styles.burbuja} ${burbuja.hijos?.length ? styles.burbujaMenu : ""}`}
              style={{ left: burbuja.x, top: burbuja.y }}
              initial={reduce ? { opacity: 0 } : { opacity: 0, x: -6, scale: 0.94 }}
              animate={reduce ? { opacity: 1 } : { opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, transition: { duration: 0.1 } }}
              transition={reduce ? { duration: 0.12 } : spring.pop}
              role="tooltip"
              /* Mientras el ratón esté encima, no se cierra: si no, no
                 habría forma de pulsar un submenú. */
              onMouseEnter={cancelarCierre}
              onMouseLeave={cerrarBurbuja}
            >
              {burbuja.grupo && <span className={styles.burbujaGrupo}>{burbuja.grupo}</span>}
              <span className={styles.burbujaNombre}>{burbuja.texto}</span>

              {/* El submenú. Los enlaces van fuera del orden del
                  tabulador (tabIndex -1) a propósito: la burbuja se
                  dibuja en un portal al final del <body>, así que
                  tabular entraría aquí dando un salto raro. Quien
                  navega con teclado llega a lo mismo por las pestañas
                  de la sección, que sí están en su sitio. */}
              {burbuja.hijos?.length ? (
                <span className={styles.burbujaHijos}>
                  {burbuja.hijos.map((h) => {
                    const dentro = pathname === h.href || pathname.startsWith(`${h.href}/`);
                    return (
                      <Link
                        key={h.id}
                        href={h.href}
                        tabIndex={-1}
                        className={`${styles.burbujaHijo} ${dentro ? styles.burbujaHijoActivo : ""}`}
                        onClick={cerrarBurbuja}
                      >
                        <Icon name={h.icon} width={14} height={14} />
                        {t(`nav.${h.id}`)}
                      </Link>
                    );
                  })}
                </span>
              ) : null}
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </LayoutGroup>
  );
}
