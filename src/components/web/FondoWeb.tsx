"use client";
/* ============================================================
   El fondo de estrellas de la web
   ------------------------------------------------------------
   Un canvas a pantalla completa, detrás de todo. Está en el marco
   común y no en cada página a propósito: así las estrellas NO se
   reinician al navegar de una sección a otra, que es lo que daba
   la sensación de que la web es una sola pieza y no doce páginas
   sueltas.

   El canvas se pinta desde src/lib/web/particulas.ts. Mientras no
   arranca el JavaScript —o si el visitante pidió menos
   movimiento— se queda transparente: el fondo de verdad lo pone
   el color del <body>, así que no se ve ningún hueco.
============================================================ */
import { useEffect, useRef } from "react";

export default function FondoWeb() {
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const lienzo = canvas.current;
    if (!lienzo) return;

    /* El módulo se carga en caliente y no con un import normal por dos
       motivos: no viaja en el JavaScript inicial de la página (son
       varios kilobytes de canvas que no hacen falta para leer), y así
       el servidor no lo evalúa nunca. */
    let parar: (() => void) | null = null;
    let vivo = true;

    import("@/lib/web/particulas")
      .then(({ campoDeEstrellas }) => {
        if (!vivo) return;
        /* Menos estrellas en móvil: el mismo número en una pantalla
           pequeña se ve como ruido y cuesta batería. */
        parar = campoDeEstrellas(lienzo, {
          count: window.innerWidth < 700 ? 70 : 150,
          speed: 0.03,
        });
      })
      .catch(() => {
        /* Sin fondo animado la web se lee igual: no se avisa de nada. */
      });

    return () => {
      vivo = false;
      parar?.();
    };
  }, []);

  return (
    <div className="bg" aria-hidden>
      <canvas className="bg__stars" ref={canvas} />
    </div>
  );
}
