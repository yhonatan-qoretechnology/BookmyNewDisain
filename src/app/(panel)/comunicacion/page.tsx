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
import EmojiPicker from "emoji-picker-react";
import styles from "./comunicacion.module.css";

/** Sondeo de la conversación activa (el backend también ofrece
    Socket.IO; esta vista usa la vía REST del ChatMessageModule). */
const POLL_MS = 5000;

export default function ComunicacionPage() {
  const { t } = useI18n();
  const { session } = useSession();
  const [canalId, setCanalId] = useState("");
  const [texto, setTexto] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddContact, setShowAddContact] = useState(false);
  const [modalSearchTerm, setModalSearchTerm] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  const msgsRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /* Contactos — GET /ChatMessage/contacts/:userId */
  const { data: canales } = useData(
    () => ComunicacionController.getCanales(session),
    [session?.id], []
  );
  
  const { data: searchResults, reload: reloadSearch } = useData(
    () => searchTerm ? ComunicacionController.buscarUsuarios(session, searchTerm) : Promise.resolve([]),
    [session?.id, searchTerm], []
  );
  
  const { data: allUsers } = useData(
    () => showAddContact ? ComunicacionController.buscarUsuarios(session, "") : Promise.resolve([]),
    [session?.id, showAddContact], []
  );
  
  const displayCanales = searchTerm ? (searchResults || []) : canales;
  
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

  const handleEmojiClick = () => {
    setShowEmoji(!showEmoji);
  };

  const handleEmojiSelect = (emoji: any) => {
    setTexto(prev => prev + emoji.emoji);
    setShowEmoji(false);
  };

  const handleAttachmentClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && canal) {
      // Enviar archivo al servidor
      await ComunicacionController.enviarMensaje(session, canal, "", file);
      await reload();
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
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
        <div className={styles.searchContainer}>
          <Icon name="search" width={18} height={18} className={styles.searchIcon} />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar usuarios..."
            className={styles.searchInput}
            aria-label="Buscar usuarios"
          />
          <button
            type="button"
            className={styles.addContactBtn}
            onClick={() => setShowAddContact(true)}
            aria-label="Agregar contacto"
            title="Agregar nuevo contacto"
          >
            <Icon name="plus" width={18} height={18} />
          </button>
        </div>
        {displayCanales.map((c) => (
          <button
            key={c.id}
            className={`${styles.comItem} ${c.id === canalId ? styles.comItemActive : ""}`}
            onClick={() => abrirCanal(c.id)}
          >
            {c.fotoPerfil ? (
              <img
                src={`${process.env.NEXT_PUBLIC_API_BASE_URL_IMG || 'https://bookmy.es/'}${c.fotoPerfil}`}
                alt={c.nombre}
                className={`${styles.comAv} ${styles.comAvImg} ${c.online ? styles.online : ""}`}
              />
            ) : (
              <span className={`${styles.comAv} ${c.online ? styles.online : ""}`}>{initials(c.nombre)}</span>
            )}
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
                {(m.messageType === "FILE" && m.fileUrl) || (m.texto && m.texto.startsWith("[Archivo:")) ? (
                  <div className={styles.messageAudio}>
                    <audio controls src={m.fileUrl || undefined} className={styles.messageAudioPlayer} />
                  </div>
                ) : (
                  m.texto
                )}
                <span className={styles.msgHora}>{m.hora}</span>
              </span>
            </div>
          ))}
        </div>

        <div className={styles.chatInput}>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            className={styles.fileInput}
            aria-label="Adjuntar archivo"
          />
          <button
            type="button"
            className={styles.iconBtn}
            onClick={handleEmojiClick}
            aria-label="Emoji"
            title="Emoji"
          >
            <Icon name="smile" width={20} height={20} />
          </button>
          <button
            type="button"
            className={styles.iconBtn}
            onClick={handleAttachmentClick}
            aria-label="Adjuntar"
            title="Adjuntar archivo"
          >
            <Icon name="paperclip" width={20} height={20} />
          </button>
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
        {showEmoji && (
          <div className={styles.emojiPicker}>
            <EmojiPicker onEmojiClick={handleEmojiSelect} />
          </div>
        )}
        {showAddContact && (
          <div className={styles.modalOverlay} onClick={() => setShowAddContact(false)}>
            <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
              <div className={styles.modalHeader}>
                <h3>Agregar nuevo contacto</h3>
                <button
                  type="button"
                  className={styles.modalCloseBtn}
                  onClick={() => setShowAddContact(false)}
                  aria-label="Cerrar"
                >
                  <Icon name="x" width={20} height={20} />
                </button>
              </div>
              <div className={styles.modalBody}>
                <input
                  type="text"
                  value={modalSearchTerm}
                  onChange={(e) => setModalSearchTerm(e.target.value)}
                  placeholder="Buscar usuario..."
                  className={styles.modalSearchInput}
                />
                <div className={styles.usersList}>
                  {(allUsers || [])
                    .filter(u =>
                      !modalSearchTerm ||
                      u.nombre.toLowerCase().includes(modalSearchTerm.toLowerCase()) ||
                      u.sub.toLowerCase().includes(modalSearchTerm.toLowerCase())
                    )
                    .map((u) => (
                    <button
                      key={u.id}
                      className={styles.userItem}
                      onClick={async () => {
                        await ComunicacionController.agregarContacto(session, Number(u.id));
                        await reload();
                        abrirCanal(u.id);
                        setShowAddContact(false);
                        setModalSearchTerm("");
                      }}
                    >
                      {u.fotoPerfil ? (
                        <img
                          src={`${process.env.NEXT_PUBLIC_API_BASE_URL_IMG || 'https://bookmy.es/'}${u.fotoPerfil}`}
                          alt={u.nombre}
                          className={`${styles.comAv} ${styles.comAvImg}`}
                        />
                      ) : (
                        <span className={styles.comAv}>{initials(u.nombre)}</span>
                      )}
                      <div className={styles.userInfo}>
                        <span className={styles.userName}>{u.nombre}</span>
                        <span className={styles.userEmail}>{u.sub}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
