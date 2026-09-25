"use client";
/* ============================================================
   Acordeón de preguntas frecuentes.
   Solo una abierta a la vez, como en la web original, pero con
   el estado en React y los atributos aria que faltaban.
============================================================ */
import { useState } from "react";

export default function FaqList({ items }: { items: { q: string; a: string }[] }) {
  const [abierta, setAbierta] = useState<number | null>(null);

  return (
    <div className="faq-list">
      {items.map((item, i) => {
        const open = abierta === i;
        return (
          <div className={`faq-item ${open ? "is-open" : ""}`} key={item.q}>
            <button
              className="faq-q"
              type="button"
              aria-expanded={open}
              aria-controls={`faq-a-${i}`}
              id={`faq-q-${i}`}
              onClick={() => setAbierta(open ? null : i)}
            >
              <span>{item.q}</span>
              <span className="faq-plus" aria-hidden>+</span>
            </button>
            <div className="faq-a" id={`faq-a-${i}`} role="region" aria-labelledby={`faq-q-${i}`}>
              <p>{item.a}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
