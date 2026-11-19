"use client";
/* ============================================================
   El marco de una página de la web pública
   ------------------------------------------------------------
   Cabecera, contenido y pie, más el arranque del motor de
   animación. Lo usa cada pantalla salvo el portal de la portada,
   que no lleva ni cabecera ni pie y tiene el suyo propio.

   POR QUÉ EL MOTOR SE ARRANCA AQUÍ Y NO EN EL LAYOUT
   El motor trabaja sobre el marcado que hay en pantalla
   (data-reveal, data-scene, data-stack…). En el layout se
   montaría una sola vez y las páginas siguientes llegarían sin
   animar, porque Next no vuelve a montar un layout al navegar.
   Aquí se monta y se desmonta con cada pantalla, que es
   exactamente cuando cambia el marcado que tiene que mover.

   La clase `page-X` va en este <div> y no en el <body>: el CSS la
   usa como selector de ancestro, no necesita que sea el body, y
   así no hay que manosear el DOM desde un efecto.
============================================================ */
import { useEffect, useRef, type ReactNode } from "react";
import SiteHeader from "./SiteHeader";
import SiteFooter from "./SiteFooter";
import { useWebT } from "./useWebT";
import { nombreMoneda, nombrePais } from "@/lib/web/money";
import type { Mundo } from "@/lib/web/rutas";

export default function PaginaWeb({
  mundo,
  pagina,
  cta,
  children,
}: {
  mundo: Mundo;
  /** El nombre de la pantalla: sale como `page-<nombre>` y como `data-page`. */
  pagina: string;
  /** La llamada a la acción propia de esta pantalla, encima del pie. */
  cta?: ReactNode;
  children: ReactNode;
}) {
  const { w, locale } = useWebT();
  const raiz = useRef<HTMLDivElement>(null);

  /* El acento de toda la página (verde de la app o lima del CRM) lo
     elige `data-section` en el <html>, que es el ÚNICO sitio donde
     bookmy.css define la paleta del CRM (`:root[data-section="crm"]`).
     Tiene que ir ahí arriba y no en un envoltorio porque también tiñe
     el fondo de estrellas, que vive fuera de esta página.

     Va en su propio efecto, antes que el del motor: así se aplica
     aunque el motor no llegue a cargar, y se quita al salir para que
     la pantalla siguiente no herede el color de la anterior. */
  useEffect(() => {
    const html = document.documentElement;
    const anterior = html.getAttribute("data-section");
    html.setAttribute("data-section", mundo);
    return () => {
      if (anterior) html.setAttribute("data-section", anterior);
      else html.removeAttribute("data-section");
    };
  }, [mundo]);

  useEffect(() => {
    const nodo = raiz.current;
    if (!nodo) return;

    let parar: (() => void) | null = null;
    let vivo = true;

    /* Los dos módulos se cargan en caliente: son bastantes kilobytes de
       canvas y de scroll que no hacen falta para leer la página, y así
       el servidor no los evalúa nunca. */
    Promise.all([import("@/lib/web/motor"), import("@/lib/web/particulas")])
      .then(([{ iniciarMotor }, particulas]) => {
        if (!vivo) return;
        parar = iniciarMotor(nodo, {
          particulas,
          /* El campo de estrellas lo enciende FondoWeb, que vive en el
             marco común para que no se reinicie al navegar. Si lo
             encendiera también el motor habría dos campos pintando
             sobre el mismo lienzo. */
          fondoEstrellas: false,
          textos: {
            menuAbrir: w("comun.nav.abrirMenu"),
            menuCerrar: w("comun.nav.cerrarMenu"),
            localeNumeros: w("comun.motor.localeNumeros"),
            /* Los nombres de país y de moneda los sabe el navegador en
               cualquier idioma (Intl); los dos genéricos no son países
               de verdad y llevan su texto en el diccionario. */
            etiquetaPais: ({ code, cur, nombre, generico }) => {
              if (generico) {
                return cur === "EUR" ? w("comun.motor.paisEuros") : w("comun.motor.paisDolares");
              }
              const pais = nombrePais(code, locale) ?? nombre;
              return `${pais} · ${nombreMoneda(cur, locale)}`;
            },
            newsletterHecho: w("comun.motor.newsletterHecho"),
            newsletterFallo: w("comun.motor.newsletterFallo"),
            newsletterPorCorreo: w("comun.motor.newsletterPorCorreo"),
            newsletterAsunto: w("comun.motor.newsletterAsunto"),
            /* El cuerpo del mailto. Si no se pasa, el motor usa su texto
               de respaldo, que está en español: quien navegara en inglés
               recibía un correo escrito en español. */
            newsletterCuerpo: (correo: string) => w("comun.motor.newsletterCuerpo", { correo }),
          },
        });
      })
      .catch(() => {
        /* Sin motor la página se lee entera igual: el CSS deja visible
           todo lo que el motor habría ido descubriendo. No se avisa de
           nada porque no hay nada que el visitante pueda hacer. */
      });

    return () => {
      vivo = false;
      parar?.();
    };
    /* Se vuelve a montar al cambiar de idioma: los textos que el motor
       escribe desde JavaScript ya están dentro de él y no hay forma de
       cambiárselos en caliente. */
  }, [locale, w]);

  return (
    <div className={`page-${pagina}`} data-page={pagina} ref={raiz}>
      <a className="skip-link" href="#contenido">{w("comun.saltar.contenido")}</a>
      <SiteHeader mundo={mundo} />
      <main id="contenido">{children}</main>
      <SiteFooter mundo={mundo} cta={cta} />
    </div>
  );
}
