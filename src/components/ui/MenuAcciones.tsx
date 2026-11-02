"use client";
/* ============================================================
   MenuAcciones — botón ⋯ que despliega acciones secundarias
   ------------------------------------------------------------
   Para tarjetas con muchas acciones: las importantes quedan a la
   vista y el resto se agrupa aquí. Se cierra al elegir, con
   Escape o al pulsar fuera. Las peligrosas (`peligro`) van en
   rojo y separadas al final.
============================================================ */
import { useEffect, useId, useRef, useState } from "react";
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
  const caja = useRef<HTMLDivElement>(null);
  const id = useId();

  useEffect(() => {
    if (!abierto) return;
    const fuera = (e: MouseEvent) => {
      if (caja.current && !caja.current.contains(e.target as Node)) setAbierto(false);
    };
    const tecla = (e: KeyboardEvent) => { if (e.key === "Escape") setAbierto(false); };
    document.addEventListener("mousedown", fuera);
    document.addEventListener("keydown", tecla);
    return () => {
      document.removeEventListener("mousedown", fuera);
      document.removeEventListener("keydown", tecla);
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
      {abierto && (
        <div id={id} role="menu" className={styles.menu}>
          {normales.map(item)}
          {peligrosas.length > 0 && normales.length > 0 && <hr className={styles.sep} />}
          {peligrosas.map(item)}
        </div>
      )}
    </div>
  );
}
