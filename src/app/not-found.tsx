"use client";
/* ============================================================
   404 · la página que no está
   ------------------------------------------------------------
   Hasta ahora no había ninguna, así que Next servía la suya: un
   «This page could not be found.» en inglés, sobre fondo blanco,
   sin cabecera, sin pie y sin un solo enlace de vuelta, dentro de
   un sitio que declara <html lang="es">. Y traía además un segundo
   <title> en el mismo <head> —el suyo y el del layout raíz—, de
   modo que el HTML no era válido y el título dependía del
   navegador. Con este archivo, las dos cosas se acaban.

   NO ES UNA PANTALLA CUALQUIERA: es donde aterriza hoy quien pulsa
   cualquiera de los nueve botones de «Descargar APK» (el archivo
   todavía no está subido). Por eso lo primero que ofrece es una
   salida, y no una disculpa.

   ES CLIENTE Y BILINGÜE A MANO
   El idioma se resuelve en el navegador (I18nContext: localStorage
   → navigator.language), así que el texto se elige aquí con
   `locale`, igual que en FormularioContacto. No se pasa por el
   diccionario de la web porque esta pantalla vive FUERA del grupo
   (web) —se pinta con el layout raíz— y no tiene a w() disponible.
============================================================ */
import Link from "next/link";
import { useI18n } from "@/i18n";
import styles from "./not-found.module.css";

const T = {
  es: {
    titulo: "Esta página no existe",
    texto:
      "Puede que el enlace esté mal escrito, que la página haya cambiado de dirección o que todavía no esté publicada.",
    inicio: "Ir al inicio",
    contacto: "Escribirnos",
  },
  en: {
    titulo: "This page doesn't exist",
    texto:
      "The link may be mistyped, the page may have moved, or it may not be published yet.",
    inicio: "Go to the homepage",
    contacto: "Contact us",
  },
} as const;

export default function NoEncontrada() {
  const { locale } = useI18n();
  const t = locale === "en" ? T.en : T.es;

  return (
    <main className={styles.marco}>
      <div className={styles.caja}>
        <p className={styles.numero}>404</p>
        <h1 className={styles.titulo}>{t.titulo}</h1>
        <p className={styles.texto}>{t.texto}</p>
        <div className={styles.salidas}>
          <Link className={styles.boton} href="/">{t.inicio}</Link>
          <Link className={styles.secundario} href="/contacto">{t.contacto}</Link>
        </div>
      </div>
    </main>
  );
}
