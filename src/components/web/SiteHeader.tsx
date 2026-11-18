"use client";
/* ============================================================
   Cabecera de la web pública
   ------------------------------------------------------------
   Dos cabeceras en una: la del mundo APP (reservar citas, enlaces
   a las tiendas) y la del mundo CRM (planes, asistente, prueba
   gratis). El conmutador del centro pasa de una a otra.

   El despliegue de los menús, el menú de móvil y la cabecera que
   se esconde al bajar NO se programan aquí: los lleva el motor
   (src/lib/web/motor.ts) a través de los atributos data-dd,
   data-mobile-menu y data-mm-group, que son los mismos que usaba
   la web estática. Este componente solo pone el marcado y los
   textos traducidos.

   El enlace activo se marca con aria-current comparando la ruta,
   y no con una clase escrita a mano, para que al navegar sin
   recargar siga señalando donde toca.
============================================================ */
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useWebT } from "./useWebT";
import Marca from "./Marca";
import { FUERA, WEB, type Mundo } from "@/lib/web/rutas";
import { CLAVE_CTA } from "@/lib/web/oferta";

/** ¿Esta ruta es la que se está viendo? Las anclas no cuentan. */
const esActiva = (href: string, ruta: string) => href.split("#")[0] === ruta;

function Conmutador({ mundo, variante }: { mundo: Mundo; variante: "bar" | "menu" }) {
  const { w } = useWebT();
  return (
    <nav className={`sw sw--${variante}`} aria-label={w("comun.mundos.etiqueta")}>
      <Link className="sw__opt t-app" href={WEB.app} aria-current={mundo === "app" ? "true" : undefined}>
        <i className="i i-smartphone" aria-hidden />
        {w("comun.mundos.app")}
      </Link>
      <Link className="sw__opt t-crm" href={WEB.crm} aria-current={mundo === "crm" ? "true" : undefined}>
        <i className="i i-bar-chart" aria-hidden />
        {w("comun.mundos.crm")}
      </Link>
    </nav>
  );
}

export default function SiteHeader({ mundo }: { mundo: Mundo }) {
  const { w } = useWebT();
  const ruta = usePathname();

  return (
    <>
      <header className={`site-header site-header--${mundo}`}>
        <div className="nav">
          <Marca mundo={mundo} etiqueta={w("comun.marca.alt")} />
          <Conmutador mundo={mundo} variante="bar" />

          <nav className="nav__links" aria-label={w("comun.nav.principal")}>
            {mundo === "app" ? (
              <>
                {/* Desplegable: las dos caras de la app */}
                <div className="nav__dd" data-dd>
                  <button
                    className={`nav__item ${ruta.startsWith(WEB.app) ? "is-current" : ""}`}
                    type="button"
                    aria-expanded="false"
                    aria-controls="dd-app"
                  >
                    {w("comun.nav.laApp")} <i className="i i-chevron-down" aria-hidden />
                  </button>
                  <div className="nav__dd-panel" id="dd-app">
                    <Link className="dd-item" href={WEB.app} aria-current={esActiva(WEB.app, ruta) ? "page" : undefined}>
                      <span className="ib ib--sm"><i className="i i-user" aria-hidden /></span>
                      <span><b>{w("comun.nav.personas")}</b><small>{w("comun.nav.personasSub")}</small></span>
                    </Link>
                    <Link className="dd-item" href={WEB.appEmpresas} aria-current={esActiva(WEB.appEmpresas, ruta) ? "page" : undefined}>
                      <span className="ib ib--sm ib--solid"><i className="i i-building" aria-hidden /></span>
                      <span><b>{w("comun.nav.empresas")}</b><small>{w("comun.nav.empresasSub")}</small></span>
                    </Link>
                    <div className="dd-foot">
                      <a href="#descargar">{w("comun.nav.descargarApp")} <i className="i i-arrow-right" aria-hidden /></a>
                      <a href={FUERA.apk} download>{w("comun.nav.archivoApk")}</a>
                    </div>
                  </div>
                </div>
                <Link className="nav__item" href={`${WEB.app}#pasos`}>{w("comun.nav.comoReservar")}</Link>
                <Link className="nav__item" href={`${WEB.app}#faq`}>{w("comun.nav.preguntas")}</Link>
                <Link className="nav__item" href={WEB.contacto}>{w("comun.nav.contacto")}</Link>
              </>
            ) : (
              <>
                <Link className={`nav__item ${esActiva(WEB.comoFunciona, ruta) ? "is-current" : ""}`} href={WEB.comoFunciona}>
                  {w("comun.nav.comoFunciona")}
                </Link>

                {/* Desplegable: los planes */}
                <div className="nav__dd" data-dd>
                  <button
                    className={`nav__item ${ruta.startsWith(WEB.planes) ? "is-current" : ""}`}
                    type="button"
                    aria-expanded="false"
                    aria-controls="dd-planes"
                  >
                    {w("comun.nav.planes")} <i className="i i-chevron-down" aria-hidden />
                  </button>
                  <div className="nav__dd-panel" id="dd-planes">
                    <Link className="dd-item" href={WEB.planBasic} aria-current={esActiva(WEB.planBasic, ruta) ? "page" : undefined}>
                      <span className="ib ib--sm"><i className="i i-calendar" aria-hidden /></span>
                      <span><b>{w("comun.nav.planBasic")}</b><small>{w("comun.nav.planBasicSub")}</small></span>
                    </Link>
                    <Link className="dd-item" href={WEB.planPro} aria-current={esActiva(WEB.planPro, ruta) ? "page" : undefined}>
                      <span className="ib ib--sm ib--solid"><i className="i i-layers" aria-hidden /></span>
                      <span>
                        <b>{w("comun.nav.planPro")} <span className="tag tag--lime">{w("comun.nav.masPopular")}</span></b>
                        <small>{w("comun.nav.planProSub")}</small>
                      </span>
                    </Link>
                    <div className="dd-foot">
                      <Link href={WEB.planes}>{w("comun.nav.compararPlanes")} <i className="i i-arrow-right" aria-hidden /></Link>
                      <Link href={WEB.calculadora}>{w("comun.nav.calculadora")}</Link>
                    </div>
                  </div>
                </div>

                <Link className={`nav__item ${esActiva(WEB.asistenteIa, ruta) ? "is-current" : ""}`} href={WEB.asistenteIa}>
                  {w("comun.nav.asistenteIa")} <span className="nav__new">{w("comun.nav.nuevo")}</span>
                </Link>
                <Link className={`nav__item ${esActiva(WEB.quienesSomos, ruta) ? "is-current" : ""}`} href={WEB.quienesSomos}>
                  {w("comun.nav.quienesSomos")}
                </Link>
              </>
            )}
          </nav>

          <div className="nav__actions">
            {mundo === "app" ? (
              <a className="btn btn--primary btn--sm" href="#descargar">
                <i className="i i-download" aria-hidden />
                {w("comun.nav.descargar")}
              </a>
            ) : (
              <>
                <Link className="nav__login" href={WEB.login}>{w("comun.nav.entrar")}</Link>
                <Link className="btn btn--primary btn--sm" href={WEB.crearCuenta}>{w(CLAVE_CTA)}</Link>
              </>
            )}
            <button
              className="nav__toggle"
              type="button"
              aria-expanded="false"
              aria-controls="menu-movil"
              aria-label={w("comun.nav.abrirMenu")}
            >
              <span /><span />
            </button>
          </div>
        </div>
      </header>

      {/* ── Menú de móvil ───────────────────────────────────── */}
      <div className={`mobile-menu mobile-menu--${mundo}`} id="menu-movil" data-mobile-menu>
        <nav className="mobile-menu__nav" aria-label={w("comun.nav.menuMovil")}>
          <Conmutador mundo={mundo} variante="menu" />

          {mundo === "app" ? (
            <>
              <Link href={WEB.app} aria-current={esActiva(WEB.app, ruta) ? "page" : undefined}>
                {w("comun.nav.personas")} <i className="i i-arrow-right" aria-hidden />
              </Link>
              <Link href={WEB.appEmpresas} aria-current={esActiva(WEB.appEmpresas, ruta) ? "page" : undefined}>
                {w("comun.nav.empresas")} <i className="i i-arrow-right" aria-hidden />
              </Link>
              <Link href={`${WEB.app}#pasos`}>{w("comun.nav.comoReservar")} <i className="i i-arrow-right" aria-hidden /></Link>
              <Link href={`${WEB.app}#faq`}>{w("comun.nav.preguntas")} <i className="i i-arrow-right" aria-hidden /></Link>
              <Link href={WEB.contacto}>{w("comun.nav.contacto")} <i className="i i-arrow-right" aria-hidden /></Link>
              <div className="mobile-menu__cta">
                <a className="btn btn--primary" href="#descargar">
                  <i className="i i-download" aria-hidden />
                  {w("comun.nav.descargarApp")}
                </a>
              </div>
            </>
          ) : (
            <>
              <Link href={WEB.crm} aria-current={esActiva(WEB.crm, ruta) ? "page" : undefined}>
                {w("comun.nav.elCrm")} <i className="i i-arrow-right" aria-hidden />
              </Link>
              <Link href={WEB.comoFunciona}>{w("comun.nav.comoFunciona")} <i className="i i-arrow-right" aria-hidden /></Link>

              <div className="mm-group" data-mm-group>
                <button className="mm-group__btn" type="button" aria-expanded="false" aria-controls="mm-planes">
                  {w("comun.nav.planes")} <i className="i i-chevron-down" aria-hidden />
                </button>
                <div className="mm-group__panel" id="mm-planes">
                  <div>
                    <Link href={WEB.planBasic}>
                      <span className="ib ib--sm"><i className="i i-calendar" aria-hidden /></span>
                      <span><b>{w("comun.nav.planBasic")}</b><small>{w("comun.nav.planBasicSub")}</small></span>
                    </Link>
                    <Link href={WEB.planPro}>
                      <span className="ib ib--sm ib--solid"><i className="i i-layers" aria-hidden /></span>
                      <span><b>{w("comun.nav.planPro")}</b><small>{w("comun.nav.planProSub")}</small></span>
                    </Link>
                    <Link href={WEB.planes}>
                      <span className="ib ib--sm"><i className="i i-list-checks" aria-hidden /></span>
                      <span><b>{w("comun.nav.compararPlanes")}</b><small>{w("comun.nav.compararPlanesSub")}</small></span>
                    </Link>
                  </div>
                </div>
              </div>

              <Link href={WEB.asistenteIa}>{w("comun.nav.asistenteIa")} <i className="i i-arrow-right" aria-hidden /></Link>
              <Link href={WEB.quienesSomos}>{w("comun.nav.quienesSomos")} <i className="i i-arrow-right" aria-hidden /></Link>
              <Link href={WEB.contacto}>{w("comun.nav.contacto")} <i className="i i-arrow-right" aria-hidden /></Link>
              <div className="mobile-menu__cta">
                <Link className="btn btn--primary" href={WEB.crearCuenta}>{w(CLAVE_CTA)}</Link>
                <Link className="nav__login" href={WEB.login}>{w("comun.nav.entrar")}</Link>
              </div>
            </>
          )}
        </nav>
      </div>
    </>
  );
}
