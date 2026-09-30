"use client";
/* ============================================================
   Asistente flotante de la web.
   Dos caminos: respuestas guiadas (sin backend, como en la web
   original) o ir al formulario de contacto. El contenido se
   reemplaza en cada paso, nunca se acumula.
============================================================ */
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useWebT } from "./useWebT";

type Estado = "greeting" | "howItWorks" | "plans";
interface Respuesta { etiqueta: string; siguiente?: Estado; accion?: "pricing"; principal?: boolean }

export default function AiWidget() {
  const { w } = useWebT();
  const router = useRouter();
  const [listo, setListo] = useState(false);
  const [abierto, setAbierto] = useState(false);
  const [vista, setVista] = useState<"menu" | "chat">("menu");
  const [estado, setEstado] = useState<Estado>("greeting");

  useEffect(() => {
    const id = window.setTimeout(() => setListo(true), 900);
    return () => clearTimeout(id);
  }, []);

  const guion: Record<Estado, { mensaje: string; respuestas: Respuesta[] }> = {
    greeting: {
      mensaje: w("ai.greetingMsg"),
      respuestas: [
        { etiqueta: w("ai.qHowItWorks"), siguiente: "howItWorks" },
        { etiqueta: w("ai.qPlans"), siguiente: "plans" },
      ],
    },
    howItWorks: {
      mensaje: w("ai.aHowItWorks"),
      respuestas: [
        { etiqueta: w("ai.qHowItWorks"), siguiente: "howItWorks" },
        { etiqueta: w("ai.qPlans"), siguiente: "plans" },
      ],
    },
    plans: {
      mensaje: w("ai.aPlans"),
      respuestas: [
        { etiqueta: w("ai.replyYesPricing"), accion: "pricing", principal: true },
        { etiqueta: w("ai.replyNoThanks"), siguiente: "greeting" },
      ],
    },
  };

  const cerrar = () => {
    setAbierto(false);
    window.setTimeout(() => setVista("menu"), 300);
  };

  const irAPlanes = () => {
    cerrar();
    const destino = document.getElementById("planes");
    if (destino) window.setTimeout(() => destino.scrollIntoView({ behavior: "smooth", block: "start" }), 200);
    else router.push("/#planes");
  };

  const actual = guion[estado];

  return (
    <div className={`ai-widget ${listo ? "is-ready" : ""} ${abierto ? "is-open" : ""}`}>
      <div className="ai-panel">
        <div className={`ai-panel-header ${vista === "chat" ? "has-back" : ""}`}>
          <button className="ai-back" type="button" aria-label={w("ai.back")} onClick={() => setVista("menu")}>
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" aria-hidden><path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
          <div className="ai-header-title">
            <span className="ai-header-icon">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" aria-hidden><path d="M12 3l1.8 4.6L18 9l-4.2 1.9L12 16l-1.8-5.1L6 9l4.2-1.4L12 3Z" fill="currentColor" /><path d="M19 14l.9 2.3L22 17l-2.1.9L19 20l-.9-2.1L16 17l2.1-.7L19 14Z" fill="currentColor" /></svg>
            </span>
            <div>
              <strong>{w("ai.headerTitle")}</strong>
              <small className="ai-status"><span className="dot-status" />{w("ai.online")}</small>
            </div>
          </div>
          <button className="ai-close" type="button" aria-label={w("modal.close")} onClick={cerrar}>✕</button>
        </div>

        <div className="ai-body">
          <div className={`ai-view ai-view-menu ${vista === "menu" ? "is-active" : ""}`}>
            <p className="ai-intro">{w("ai.menuIntro")}</p>

            <button className="ai-option" type="button" onClick={() => { setEstado("greeting"); setVista("chat"); }}>
              <span className="ai-option-icon">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden><path d="M12 3l1.8 4.6L18 9l-4.2 1.9L12 16l-1.8-5.1L6 9l4.2-1.4L12 3Z" fill="currentColor" /></svg>
              </span>
              <span className="ai-option-text">
                <strong>{w("ai.optionAssistTitle")}</strong>
                <small>{w("ai.optionAssistDesc")}</small>
              </span>
              <span className="ai-option-arrow" aria-hidden>→</span>
            </button>

            <button className="ai-option" type="button" onClick={() => { cerrar(); router.push("/contacto#contactFormSection"); }}>
              <span className="ai-option-icon">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden><path d="M4 13.5V12a8 8 0 1 1 16 0v1.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" /><rect x="2.5" y="13" width="5" height="7" rx="2" stroke="currentColor" strokeWidth="1.7" /><rect x="16.5" y="13" width="5" height="7" rx="2" stroke="currentColor" strokeWidth="1.7" /></svg>
              </span>
              <span className="ai-option-text">
                <strong>{w("ai.optionSupportTitle")}</strong>
                <small>{w("ai.optionSupportDesc")}</small>
              </span>
              <span className="ai-option-arrow" aria-hidden>→</span>
            </button>
          </div>

          <div className={`ai-view ai-view-chat ${vista === "chat" ? "is-active" : ""}`}>
            <div className="ai-message">
              <span className="ai-message-icon">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" aria-hidden><path d="M12 3l1.8 4.6L18 9l-4.2 1.9L12 16l-1.8-5.1L6 9l4.2-1.4L12 3Z" fill="currentColor" /></svg>
              </span>
              <p aria-live="polite">{actual.mensaje}</p>
            </div>
            <div className="ai-quick-replies">
              {actual.respuestas.map((r) => (
                <button
                  key={r.etiqueta}
                  type="button"
                  className={`ai-quick-reply ${r.principal ? "is-primary" : ""}`}
                  onClick={() => (r.accion === "pricing" ? irAPlanes() : setEstado(r.siguiente || "greeting"))}
                >
                  {r.etiqueta}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <button className="ai-fab" type="button" aria-label={w("ai.headerTitle")} aria-expanded={abierto} onClick={() => (abierto ? cerrar() : setAbierto(true))}>
        <svg viewBox="0 0 24 24" width="24" height="24" fill="none" aria-hidden><path d="M12 2.5l2.2 5.6L20 10l-5.3 2.4L12 18l-2.2-5.6L4 10l5.8-1.9L12 2.5Z" fill="currentColor" /><path d="M19 15.5l1 2.4 2.5 1-2.5 1-1 2.4-1-2.4-2.5-1 2.5-1 1-2.4Z" fill="currentColor" /></svg>
        <span className="ai-fab-pulse" aria-hidden />
      </button>
    </div>
  );
}
