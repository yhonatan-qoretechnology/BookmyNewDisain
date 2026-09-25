"use client";
/* ============================================================
   Cursor de cristal que sigue al ratón.
   Solo con puntero fino (ratón): en táctil no aporta nada y
   gastaría un rAF permanente. Respeta reduced-motion.
============================================================ */
import { useEffect, useRef } from "react";

const SELECTOR_HOVER = "a, button, .btn, input, select, textarea, .lang-btn, .faq-q, .open-modal-btn";

export default function CursorGlow() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const fino = window.matchMedia?.("(pointer: fine)").matches;
    const sinMovimiento = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (!fino || sinMovimiento) return;

    let ratonX = window.innerWidth / 2, ratonY = window.innerHeight / 2;
    let x = ratonX, y = ratonY, activo = false, raf = 0;

    const mover = (e: MouseEvent) => {
      ratonX = e.clientX; ratonY = e.clientY;
      if (!activo) { activo = true; el.classList.add("is-active"); }
    };
    const salir = () => el.classList.remove("is-active");
    const entrar = () => { if (activo) el.classList.add("is-active"); };
    const abajo = () => el.classList.add("is-down");
    const arriba = () => el.classList.remove("is-down");
    const sobre = (e: Event) => {
      const t = e.target as Element | null;
      if (t?.closest?.(SELECTOR_HOVER)) el.classList.add("is-hover");
    };
    const fuera = (e: Event) => {
      const t = e.target as Element | null;
      if (t?.closest?.(SELECTOR_HOVER)) el.classList.remove("is-hover");
    };

    const animar = () => {
      x += (ratonX - x) * 0.16;
      y += (ratonY - y) * 0.16;
      el.style.transform = `translate(${x - el.offsetWidth / 2}px, ${y - el.offsetHeight / 2}px)`;
      raf = requestAnimationFrame(animar);
    };
    raf = requestAnimationFrame(animar);

    window.addEventListener("mousemove", mover);
    document.addEventListener("mouseleave", salir);
    document.addEventListener("mouseenter", entrar);
    window.addEventListener("mousedown", abajo);
    window.addEventListener("mouseup", arriba);
    document.addEventListener("mouseover", sobre);
    document.addEventListener("mouseout", fuera);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", mover);
      document.removeEventListener("mouseleave", salir);
      document.removeEventListener("mouseenter", entrar);
      window.removeEventListener("mousedown", abajo);
      window.removeEventListener("mouseup", arriba);
      document.removeEventListener("mouseover", sobre);
      document.removeEventListener("mouseout", fuera);
    };
  }, []);

  return (
    <div className="cursor-glow" ref={ref} aria-hidden>
      <div className="cursor-glow-ring" />
    </div>
  );
}
