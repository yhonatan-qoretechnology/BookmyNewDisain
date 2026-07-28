"use client";
/* ============================================================
   Modal — popup genérico del módulo de facturación
   (cierra con Escape y con click en el fondo)
============================================================ */
import { ReactNode, useEffect } from "react";

export default function Modal({
  title,
  onClose,
  children,
  width = 560,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  width?: number;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div className="m-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-label={title}>
      <div className="m-box" style={{ maxWidth: width }} onClick={(e) => e.stopPropagation()}>
        <div className="m-head">
          <h3>{title}</h3>
          <button className="m-close" onClick={onClose} aria-label="Cerrar">×</button>
        </div>
        <div className="m-body">{children}</div>
      </div>

      <style jsx>{`
        .m-overlay {
          position: fixed; inset: 0; z-index: 1000;
          background: rgba(15, 15, 20, 0.45);
          display: flex; align-items: center; justify-content: center;
          padding: 16px;
        }
        .m-box {
          width: 100%;
          background: var(--panel, #fff);
          color: inherit;
          border-radius: 12px;
          box-shadow: 0 20px 60px rgba(0,0,0,.25);
          max-height: 90vh;
          display: flex; flex-direction: column;
        }
        .m-head {
          display: flex; align-items: center; justify-content: space-between;
          padding: 16px 20px; border-bottom: 1px solid var(--border, #ececec);
        }
        .m-head h3 { margin: 0; font-size: 16px; }
        .m-close {
          border: none; background: none; font-size: 22px; line-height: 1;
          cursor: pointer; color: var(--muted, #888); padding: 4px 8px; border-radius: 6px;
        }
        .m-close:hover { background: var(--hover, #f2f2f2); }
        .m-body { padding: 20px; overflow: auto; }
      `}</style>
    </div>
  );
}
