"use client";
/* ============================================================
   MenuAcciones — botón ⋯ que despliega acciones secundarias
   ------------------------------------------------------------
   Para tarjetas con muchas acciones: las importantes quedan a la
   vista y el resto se agrupa aquí. Se cierra al elegir, con
   Escape, al pulsar fuera o al desplazar la página. Las
   peligrosas (`peligro`) van en rojo y separadas al final.

   El menú se pinta en un portal sobre <body>, con position: fixed
   junto al botón (y hacia arriba si no cabe debajo): dentro de una
   tabla con scroll uno absoluto quedaría recortado, y dentro de una
   tarjeta animada (transform) un fixed se descolocaría.
============================================================ */
import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Icon, { type IconName } from "./Icon";
import styles from "./MenuAcciones.module.css";

export interface AccionMenu {
  etiqueta: string;
  icono?: IconName;
  onClick: () => void;
  peligro?: boolean;
  deshabilitada?: boolean;
}

export default function MenuAcciones({
  acciones,
  etiqueta,
}: {
  acciones: AccionMenu[];
  /** Texto accesible del botón ⋯ */
  etiqueta: string;
}) {
  const [abierto, setAbierto] = useState(false);
  const [pos, setPos] = useState<React.CSSProperties>({});
  const caja = useRef<HTMLDivElement>(null);
  const boton = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  const id = useId();

  /* Junto al botón, alineado a su derecha; si no cabe debajo, encima */
  useLayoutEffect(() => {
    if (!abierto) { setPos({}); return; }
    if (!boton.current) return;
    const r = boton.current.getBoundingClientRect();
    const alto = menu.current?.offsetHeight ?? 0;
    const abajo = r.bottom + 6 + alto <= window.innerHeight;
    setPos({
      position: "fixed",
      right: Math.max(8, window.innerWidth - r.right),
      ...(abajo ? { top: r.bottom + 6 } : { bottom: window.innerHeight - r.top + 6 }),
    });
  }, [abierto]);

  useEffect(() => {
    if (!abierto) return;
    const fuera = (e: MouseEvent) => {
      const t = e.target as Node;
      if (caja.current?.contains(t) || menu.current?.contains(t)) return;
      setAbierto(false);
    };
    const tecla = (e: KeyboardEvent) => { if (e.key === "Escape") setAbierto(false); };
    const cerrar = () => setAbierto(false);
    document.addEventListener("mousedown", fuera);
    document.addEventListener("keydown", tecla);
    window.addEventListener("scroll", cerrar, true);
    window.addEventListener("resize", cerrar);
    return () => {
      document.removeEventListener("mousedown", fuera);
      document.removeEventListener("keydown", tecla);
      window.removeEventListener("scroll", cerrar, true);
      window.removeEventListener("resize", cerrar);
    };
  }, [abierto]);

  const normales = acciones.filter((a) => !a.peligro);
  const peligrosas = acciones.filter((a) => a.peligro);

  const item = (a: AccionMenu) => (
    <button
      key={a.etiqueta}
      type="button"
      role="menuitem"
      className={`${styles.item} ${a.peligro ? styles.peligro : ""}`}
      disabled={a.deshabilitada}
      onClick={() => { setAbierto(false); a.onClick(); }}
    >
      {a.icono && <Icon name={a.icono} width={16} height={16} />}
      {a.etiqueta}
    </button>
  );

  return (
    <div className={styles.caja} ref={caja}>
      <button
        ref={boton}
        type="button"
        className={`${styles.disparador} ${abierto ? styles.activo : ""}`}
        aria-label={etiqueta}
        aria-haspopup="menu"
        aria-expanded={abierto}
        aria-controls={id}
        onClick={() => setAbierto((v) => !v)}
      >
        <Icon name="more" width={18} height={18} />
      </button>
      {abierto && typeof document !== "undefined" && createPortal(
        <div
          id={id}
          role="menu"
          ref={menu}
          className={styles.menu}
          /* Hasta medirlo, invisible: así no parpadea en otro sitio */
          style={pos.position ? pos : { position: "fixed", top: 0, right: 0, visibility: "hidden" }}
        >
          {normales.map(item)}
          {peligrosas.length > 0 && normales.length > 0 && <hr className={styles.sep} />}
          {peligrosas.map(item)}
        </div>,
        document.body,
      )}
    </div>
  );
}
