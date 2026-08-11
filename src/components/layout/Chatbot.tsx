"use client";
/* ============================================================
   Chatbot — asistente de ayuda del panel
   ------------------------------------------------------------
   Widget flotante (esquina inferior derecha) con tres estados:
     CLOSED  → solo el botón flotante
     TOOLTIP → tarjeta de saludo (se muestra una vez por navegador)
     OPEN    → ventana con las preguntas frecuentes

   · El contenido vive en el diccionario i18n (`chatbot.faq`), así
     que se traduce como el resto del panel.
   · Las preguntas se filtran por rol: no se explican menús que el
     usuario no puede ver (p. ej. Empresas es de superadmin).
   · "Hablar con el equipo" abre el módulo de Comunicación real.
============================================================ */
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { NAV_BY_ROLE, ROUTES } from "@/constants";
import { useSession } from "@/context/SessionContext";
import { useI18n } from "@/i18n";
import Icon from "@/components/ui/Icon";
import Button from "@/components/ui/Button";
import styles from "./Chatbot.module.css";

type ChatState = "CLOSED" | "TOOLTIP" | "OPEN";

/** Recuerda que ya se saludó, para no repetir la tarjeta cada visita */
const SEEN_KEY = "bookmy-chatbot-seen";

/**
 * Sección del menú que explica cada pregunta. Se usa para ocultar
 * las respuestas de secciones que el rol activo no tiene en su
 * navegación (NAV_BY_ROLE), en lugar de mantener una lista de roles
 * aparte que se desincronizaría al cambiar el menú.
 */
const FAQ_SECCION: Record<string, string> = {
  reserva: "reservas",
  reagendar: "dashboard",
  cliente: "clientes",
  servicio: "servicios",
  profesional: "personal",
  acceso: "personal",
  sede: "sedes",
  empresa: "empresas",
  resena: "resenas",
  facturacion: "facturacion",
  preferencias: "configuracion",
};

export default function Chatbot() {
  const router = useRouter();
  const { session } = useSession();
  const { t, tList } = useI18n();

  const [state, setState] = useState<ChatState>("CLOSED");
  const [pregunta, setPregunta] = useState<string | null>(null);

  /* El saludo aparece solo la primera vez (evita desajuste de
     hidratación: el estado inicial siempre es CLOSED en el servidor) */
  useEffect(() => {
    try {
      if (!localStorage.getItem(SEEN_KEY)) setState("TOOLTIP");
    } catch { /* almacenamiento bloqueado */ }
  }, []);

  const marcarVisto = useCallback(() => {
    try { localStorage.setItem(SEEN_KEY, "1"); } catch { /* noop */ }
  }, []);

  const cerrar = useCallback(() => {
    setState("CLOSED");
    setPregunta(null);
    marcarVisto();
  }, [marcarVisto]);

  const abrir = useCallback(() => {
    setState("OPEN");
    marcarVisto();
  }, [marcarVisto]);

  /* Escape cierra, igual que los modales del panel */
  useEffect(() => {
    if (state === "CLOSED") return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") cerrar(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [state, cerrar]);

  /* Secciones que el rol activo tiene en su menú */
  const seccionesVisibles = useMemo(() => {
    const set = new Set<string>();
    for (const item of NAV_BY_ROLE[session?.role || ""] ?? []) {
      set.add(item.id);
      for (const hijo of item.children ?? []) set.add(hijo.id);
    }
    return set;
  }, [session?.role]);

  const ids = tList("chatbot.faq.ids").filter((id) => {
    const seccion = FAQ_SECCION[id];
    return !seccion || seccionesVisibles.has(seccion);
  });

  const puedeContactar = seccionesVisibles.has("comunicacion");

  return (
    <div className={styles.wrap}>
      {/* ── Saludo inicial ── */}
      {state === "TOOLTIP" && (
        <div className={styles.tooltip} role="dialog" aria-label={t("chatbot.title")}>
          <span className={styles.tooltipAvatar} aria-hidden>
            <Icon name="bot" width={24} height={24} />
          </span>
          <div className={styles.tooltipTitle}>{t("chatbot.tooltipTitle")}</div>
          <p className={styles.tooltipText}>{t("chatbot.tooltipText")}</p>
          <Button size="sm" block onClick={abrir}>{t("chatbot.tooltipCta")}</Button>
        </div>
      )}

      {/* ── Ventana de ayuda ── */}
      {state === "OPEN" && (
        <section className={styles.window} role="dialog" aria-label={t("chatbot.title")}>
          <header className={styles.header}>
            <span className={styles.headerIcon} aria-hidden>
              <Icon name="bot" width={21} height={21} />
            </span>
            <div className={styles.headerText}>
              <div className={styles.headerTitle}>{t("chatbot.title")}</div>
              <div className={styles.status}>
                <span className={styles.statusDot} aria-hidden />
                {t("chatbot.online")}
              </div>
            </div>
            <button
              type="button"
              className={styles.headerClose}
              onClick={cerrar}
              aria-label={t("chatbot.minimize")}
            >
              <Icon name="close" width={16} height={16} strokeWidth={2.2} />
            </button>
          </header>

          <div className={styles.body}>
            <div className={styles.msgRow}>
              <span className={styles.msgAvatar} aria-hidden>
                <Icon name="bot" width={16} height={16} />
              </span>
              <div className={styles.bubble}>
                {pregunta ? (
                  <>
                    <h4 className={styles.answerTitle}>{t(`chatbot.faq.${pregunta}.q`)}</h4>
                    {tList(`chatbot.faq.${pregunta}.a`).map((parrafo, i) => (
                      <p key={i}>{parrafo}</p>
                    ))}
                    <button type="button" className={styles.backBtn} onClick={() => setPregunta(null)}>
                      <Icon name="chevron-left" width={14} height={14} strokeWidth={2.4} />
                      {t("chatbot.back")}
                    </button>
                  </>
                ) : (
                  <>
                    <p className={styles.bubbleLead}>{t("chatbot.welcome")}</p>
                    <p>{t("chatbot.intro")}</p>
                    <p>{t("chatbot.prompt")}</p>
                    <div className={styles.optionsLabel}>{t("chatbot.optionsLabel")}</div>
                    <div className={styles.options}>
                      {ids.map((id) => (
                        <button
                          key={id}
                          type="button"
                          className={styles.option}
                          onClick={() => setPregunta(id)}
                        >
                          <Icon name="help" width={15} height={15} />
                          <span className={styles.optionText}>{t(`chatbot.faq.${id}.q`)}</span>
                          <Icon name="chevron-right" width={14} height={14} strokeWidth={2.2} />
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          <footer className={styles.footer}>
            {puedeContactar && (
              <button
                type="button"
                className={styles.quick}
                onClick={() => { cerrar(); router.push(ROUTES.comunicacion); }}
              >
                <Icon name="message" width={14} height={14} />
                {t("chatbot.contactCta")}
              </button>
            )}
            <button
              type="button"
              className={styles.quick}
              onClick={() => setPregunta(null)}
              disabled={!pregunta}
            >
              <Icon name="help" width={14} height={14} />
              {t("chatbot.faqCta")}
            </button>
          </footer>
        </section>
      )}

      {/* ── Botón flotante ── */}
      {state !== "OPEN" && (
        <button
          type="button"
          className={styles.fab}
          onClick={abrir}
          aria-label={t("chatbot.fab")}
          aria-expanded={false}
        >
          <Icon name="bot" width={27} height={27} />
        </button>
      )}
    </div>
  );
}
