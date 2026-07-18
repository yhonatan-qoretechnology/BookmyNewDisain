"use client";
/* ============================================================
   Comunicación — chat entre sedes (View, demo)
============================================================ */
import { useEffect, useRef, useState } from "react";
import { ComunicacionController } from "@/controllers/ComunicacionController";
import { useSession } from "@/context/SessionContext";
import { useData } from "@/hooks/useData";
import { useI18n } from "@/i18n";
import Icon from "@/components/ui/Icon";
import Button from "@/components/ui/Button";
import { initials } from "@/constants";
import styles from "./comunicacion.module.css";

/** Sondeo de la conversación activa (el backend también ofrece
    Socket.IO; esta vista usa la vía REST del ChatMessageModule). */
const POLL_MS = 5000;

export default function ComunicacionPage() {
  const { t } = useI18n();
  const { session } = useSession();
  const [canalId, setCanalId] = useState("");
  const [texto, setTexto] = useState("");
  const msgsRef = useRef<HTMLDivElement>(null);

  /* Contactos — GET /ChatMessage/contacts/:userId */
  const { data: canales } = useData(
    () => ComunicacionController.getCanales(session),
    [session?.id], []
  );
  useEffect(() => {
    if (!canalId && canales.length > 0) setCanalId(canales[0].id);
  }, [canales, canalId]);

  const canal = canales.find((c) => c.id === canalId) || null;

  /* Conversación — GET /ChatMessage/messages/:a/:b (con sondeo) */
  const { data: mensajes, reload } = useData(
    () => (canalId ? ComunicacionController.getMensajes(session, canalId) : Promise.resolve([])),
    [session?.id, canalId], []
  );
  useEffect(() => {
    if (!canalId) return;
    const timer = setInterval(() => { void reload(); }, POLL_MS);
    return () => clearInterval(timer);
  }, [canalId, reload]);

  useEffect(() => {
    msgsRef.current?.scrollTo({ top: msgsRef.current.scrollHeight, behavior: "smooth" });
  }, [canalId, mensajes.length]);

  const abrirCanal = (id: string) => {
    void ComunicacionController.marcarLeido(session, id);
    setCanalId(id);
  };

  /** Envía por POST /ChatMessage/messages y recarga la conversación. */
  const enviar = async () => {
    const cuerpo = texto.trim();
    if (!cuerpo || !canal) return;
    setTexto("");
    await ComunicacionController.enviarMensaje(session, canal, cuerpo);
    await reload();
  };

  return (
    <div className={styles.comWrap}>
      <div className={styles.channels}>
        {canales.map((c) => (
          <button
            key={c.id}
            className={`${styles.comItem} ${c.id === canalId ? styles.comItemActive : ""}`}
            onClick={() => abrirCanal(c.id)}
          >
            <span className={`${styles.comAv} ${c.online ? styles.online : ""}`}>{initials(c.nombre)}</span>
            <span className={styles.comBody}>
              <span className={styles.comName}>{c.nombre}</span>
              <span className={styles.comSub}>{c.sub}</span>
            </span>
            {c.unread > 0 && <span className={styles.unread}>{c.unread}</span>}
          </button>
        ))}
      </div>

      <div className={styles.chat}>
        {canal && (
          <div className={styles.chatHead}>
            <span className={`${styles.comAv} ${canal.online ? styles.online : ""}`}>{initials(canal.nombre)}</span>
            <span className={styles.comBody}>
              <span className={styles.comName}>{canal.nombre}</span>
              <span className={styles.comSub}>{canal.sub}</span>
            </span>
          </div>
        )}

        <div className={styles.chatMsgs} ref={msgsRef}>
          {mensajes.map((m, i) => (
            <div key={i} className={`${styles.msgRow} ${m.dir === "out" ? styles.msgOut : ""}`}>
              {m.dir === "in" && <span className={styles.msgAv}>{m.ini}</span>}
              <span className={styles.bubble}>
                {m.texto}
                <span className={styles.msgHora}>{m.hora}</span>
              </span>
            </div>
          ))}
        </div>

        <div className={styles.chatInput}>
          <input
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") enviar(); }}
            placeholder={canal ? t("comunicacion.writeTo", { canal: canal.nombre }) : "…"}
            aria-label={t("comunicacion.message")}
          />
          <Button onClick={enviar} aria-label={t("common.send")}>
            <Icon name="send" /> {t("common.send")}
          </Button>
        </div>
      </div>
    </div>
  );
}
