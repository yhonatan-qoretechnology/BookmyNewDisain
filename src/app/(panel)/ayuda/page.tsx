"use client";
/* ============================================================
   Ayuda / Documentación
   ------------------------------------------------------------
   A la que lleva el botón «Documentación» del menú lateral. Cada
   rol ve solo sus guías (el superadmin, todas): una tarjeta por
   módulo con sus pasos y un enlace a la pantalla, un buscador y
   las preguntas frecuentes. El contenido vive en guias.ts.
============================================================ */
import { useMemo, useState } from "react";
import Link from "next/link";
import { useSession } from "@/context/SessionContext";
import { useI18n } from "@/i18n";
import Panel, { PanelHead } from "@/components/ui/Panel";
import { SearchBox } from "@/components/ui/Toolbar";
import EmptyState from "@/components/ui/EmptyState";
import Icon from "@/components/ui/Icon";
import { contenidoAyuda } from "@/components/ayuda/guias";
import styles from "./ayuda.module.css";

const CORREO_SOPORTE = "contacto@bookmy.es";

const normal = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

export default function AyudaPage() {
  const { session } = useSession();
  const { t, locale } = useI18n();
  const [busqueda, setBusqueda] = useState("");
  const [abierta, setAbierta] = useState<string | null>(null);

  const rol = session?.role ?? "owner";
  const { guias, preguntas } = useMemo(() => contenidoAyuda(locale), [locale]);

  const q = normal(busqueda.trim());
  const coincide = (...textos: string[]) => !q || textos.some((x) => normal(x).includes(q));

  const misGuias = guias
    .filter((g) => rol === "superadmin" || g.roles.includes(rol))
    .filter((g) => coincide(g.titulo, g.resumen, ...g.pasos));
  const misPreguntas = preguntas
    .filter((p) => rol === "superadmin" || p.roles.includes(rol))
    .filter((p) => coincide(p.p, p.r));

  return (
    <>
      <section className={styles.cabecera}>
        <div className={styles.cabeceraTexto}>
          <h2>{t("ayuda.titulo")}</h2>
          <p>{t("ayuda.sub")}</p>
        </div>
        <div className={styles.buscador}>
          <SearchBox value={busqueda} onChange={setBusqueda} placeholder={t("ayuda.buscar")} />
        </div>
      </section>

      {misGuias.length === 0 && misPreguntas.length === 0 ? (
        <Panel><EmptyState icon="search" title={t("ayuda.sinResultados")} message={t("ayuda.sinResultadosMsg")} /></Panel>
      ) : (
        <>
          {misGuias.length > 0 && (
            <div className={styles.grid}>
              {misGuias.map((g, i) => (
                <article key={g.id} className={styles.guia} style={{ "--i": i } as React.CSSProperties}>
                  <div className={styles.guiaTop}>
                    <span className={styles.guiaIcono}><Icon name={g.icono} /></span>
                    <div className={styles.guiaTitulos}>
                      <h3>{g.titulo}</h3>
                      <p>{g.resumen}</p>
                    </div>
                  </div>
                  <ol className={styles.pasos}>
                    {g.pasos.map((p) => <li key={p}>{p}</li>)}
                  </ol>
                  {g.ruta && (
                    <Link href={g.ruta} className={styles.ir}>
                      {t("ayuda.irPantalla")}
                      <Icon name="arrow-right" width={15} height={15} />
                    </Link>
                  )}
                </article>
              ))}
            </div>
          )}

          {misPreguntas.length > 0 && (
            <Panel className={styles.faq}>
              <PanelHead title={t("ayuda.preguntas")} />
              <div className={styles.faqLista}>
                {misPreguntas.map((p) => {
                  const open = abierta === p.p || !!q;
                  return (
                    <div key={p.p} className={`${styles.faqItem} ${open ? styles.faqOpen : ""}`}>
                      <button
                        type="button"
                        className={styles.faqPregunta}
                        aria-expanded={open}
                        onClick={() => setAbierta(abierta === p.p ? null : p.p)}
                      >
                        {p.p}
                        <Icon name="chevron" width={17} height={17} />
                      </button>
                      {open && <p className={styles.faqRespuesta}>{p.r}</p>}
                    </div>
                  );
                })}
              </div>
            </Panel>
          )}
        </>
      )}

      <section className={styles.soporte}>
        <span className={styles.soporteIcono}><Icon name="mail" /></span>
        <div>
          <h3>{t("ayuda.soporteTitulo")}</h3>
          <p>{t("ayuda.soporteTexto")}</p>
        </div>
        <a className={styles.soporteBtn} href={`mailto:${CORREO_SOPORTE}`}>{CORREO_SOPORTE}</a>
      </section>
    </>
  );
}
