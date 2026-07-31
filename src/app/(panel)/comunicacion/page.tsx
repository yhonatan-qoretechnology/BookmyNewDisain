"use client";
/* ============================================================
   Comunicación — chat entre sedes (View, demo)
============================================================ */
import { useEffect, useRef, useState } from "react";
import { ComunicacionController } from "@/controllers/ComunicacionController";
import { ChatExportController, puedeExportarChats } from "@/controllers/ChatExportController";
import { useSession } from "@/context/SessionContext";
import { useUi } from "@/context/UiContext";
import { useData } from "@/hooks/useData";
import { useI18n } from "@/i18n";
import Icon from "@/components/ui/Icon";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import { fotoUrl, initials } from "@/constants";
import type { Mensaje } from "@/models";
import EmojiPicker from "emoji-picker-react";
import styles from "./comunicacion.module.css";

/** Sondeo de la conversación activa (el backend también ofrece
    Socket.IO; esta vista usa la vía REST del ChatMessageModule). */
const POLL_MS = 5000;

/** Restricciones del endpoint POST /ChatMessage/upload. */
const ADJUNTO_TIPOS = ["image/jpeg", "image/png", "image/gif", "image/webp", "application/pdf"];
const ADJUNTO_MAX_BYTES = 10 * 1024 * 1024;
const AUDIO_EXT = /\.(webm|mp3|wav|ogg|m4a)(\?.*)?$/i;

/** Nombre de archivo a partir de una URL (última porción del path). */
function nombreArchivo(url: string): string {
  try {
    const limpio = url.split("?")[0].split("#")[0];
    return decodeURIComponent(limpio.substring(limpio.lastIndexOf("/") + 1)) || "archivo";
  } catch {
    return "archivo";
  }
}

/**
 * Contenido de una burbuja: imagen en miniatura, ícono de archivo/PDF,
 * reproductor de audio (mensajes antiguos) o texto simple.
 */
function ContenidoMensaje({ m, onImageClick }: { m: Mensaje; onImageClick: (url: string) => void }) {
  const esImagen = m.messageType === "IMAGE" && !!m.fileUrl;
  const esAudio = !!m.fileUrl && AUDIO_EXT.test(m.fileUrl);
  const esArchivo = m.messageType === "FILE" && !!m.fileUrl && !esAudio;
  const esAudioLegado = !m.fileUrl && !!m.texto && m.texto.startsWith("[Archivo:");
  const caption = m.texto && !m.texto.startsWith("[Archivo:") ? m.texto : "";

  return (
    <>
      {esImagen && (
        <button
          type="button"
          onClick={() => onImageClick(m.fileUrl!)}
          className={styles.messageImageLink}
          aria-label="Ver imagen"
        >
          <img src={m.fileUrl!} alt={caption || "Imagen adjunta"} loading="lazy" className={styles.messageImage} />
        </button>
      )}
      {m.messageType === "FILE" && m.fileUrl && esAudio && (
        <div className={styles.messageAudio}>
          <audio controls src={m.fileUrl} className={styles.messageAudioPlayer} />
        </div>
      )}
      {esArchivo && (
        <a href={m.fileUrl!} target="_blank" rel="noopener noreferrer" className={styles.messageFile}>
          <Icon name="fileText" width={26} height={26} className={styles.messageFileIcon} />
          <span className={styles.messageFileName}>{nombreArchivo(m.fileUrl!)}</span>
        </a>
      )}
      {esAudioLegado && (
        <div className={styles.messageAudio}>
          <audio controls className={styles.messageAudioPlayer} />
        </div>
      )}
      {caption && <span className={esImagen || esArchivo ? styles.messageCaption : undefined}>{caption}</span>}
    </>
  );
}

/**
 * Avatar de un contacto del chat: muestra su foto de perfil y cae a
 * las iniciales si no tiene o si la imagen falla al cargar.
 */
function ChatAvatar({
  nombre,
  foto,
  online = false,
  className = "",
}: {
  nombre: string;
  foto?: string | null;
  online?: boolean;
  className?: string;
}) {
  const [error, setError] = useState(false);
  const src = error ? null : fotoUrl(foto);
  const base = `${styles.comAv} ${online ? styles.online : ""} ${className}`.trim();
  return src ? (
    <img
      src={src}
      alt=""
      loading="lazy"
      className={`${base} ${styles.comAvImg}`}
      onError={() => setError(true)}
    />
  ) : (
    <span className={base}>{initials(nombre)}</span>
  );
}

export default function ComunicacionPage() {
  const { t } = useI18n();
  const { session } = useSession();
  const { toast } = useUi();
  const [canalId, setCanalId] = useState("");
  const [texto, setTexto] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddContact, setShowAddContact] = useState(false);
  const [modalSearchTerm, setModalSearchTerm] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  /** Adjunto en curso de subida (POST /ChatMessage/upload) para mostrar
      una burbuja "enviando…" con miniatura/ícono hasta que termine. */
  const [subiendo, setSubiendo] = useState<{ previewUrl: string; esPdf: boolean; nombre: string } | null>(null);
  /** URL de la imagen ampliada en el visor modal (null = cerrado). */
  const [imagenAmpliada, setImagenAmpliada] = useState<string | null>(null);
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
  }, [canalId, mensajes.length, subiendo]);

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
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (!file || !canal || subiendo) return;

    if (!ADJUNTO_TIPOS.includes(file.type)) {
      toast("Solo se permiten imágenes (JPG, PNG, GIF, WEBP) o PDF.", "error");
      return;
    }
    if (file.size > ADJUNTO_MAX_BYTES) {
      toast("El archivo supera el tamaño máximo permitido (10MB).", "error");
      return;
    }

    const esPdf = file.type === "application/pdf";
    const previewUrl = esPdf ? "" : URL.createObjectURL(file);
    setSubiendo({ previewUrl, esPdf, nombre: file.name });
    try {
      await ComunicacionController.enviarMensaje(session, canal, "", file);
      await reload();
    } catch {
      toast("No se pudo enviar el adjunto. Inténtalo de nuevo.", "error");
    } finally {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setSubiendo(null);
    }
  };

  /* ── Exportar la conversación (solo dueño / superadmin) ──── */
  const puedeExportar = puedeExportarChats(session);
  const etiquetasExport = {
    title: t("comunicacion.exportTitle"),
    me: t("comunicacion.exportMe"),
    footer: t("comunicacion.exportFooter", { fecha: new Date().toLocaleString() }),
    attachment: t("comunicacion.exportAttachment"),
  };
  const exportar = (formato: "pdf" | "txt") => {
    if (!canal) return;
    if (formato === "pdf") ChatExportController.descargarPdf(canal, mensajes, session, etiquetasExport);
    else ChatExportController.descargarTexto(canal, mensajes, session, etiquetasExport);
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
            <ChatAvatar nombre={c.nombre} foto={c.fotoPerfil} online={c.online} />
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
            <ChatAvatar nombre={canal.nombre} foto={canal.fotoPerfil} online={canal.online} />
            <span className={styles.comBody}>
              <span className={styles.comName}>{canal.nombre}</span>
              <span className={styles.comSub}>{canal.sub}</span>
            </span>
            {/* Descarga del histórico — solo para el dueño del negocio */}
            {puedeExportar && (
              <div className={styles.exportActions}>
                <button
                  type="button"
                  className={styles.exportBtn}
                  onClick={() => exportar("pdf")}
                  disabled={mensajes.length === 0}
                  title={t("comunicacion.exportPdf")}
                >
                  <Icon name="printer" width={16} height={16} />
                  {t("comunicacion.exportPdf")}
                </button>
                <button
                  type="button"
                  className={styles.exportBtn}
                  onClick={() => exportar("txt")}
                  disabled={mensajes.length === 0}
                  title={t("comunicacion.exportTxt")}
                >
                  <Icon name="invoice" width={16} height={16} />
                  {t("comunicacion.exportTxt")}
                </button>
              </div>
            )}
          </div>
        )}

        <div className={styles.chatMsgs} ref={msgsRef}>
          {mensajes.map((m, i) => (
            <div key={i} className={`${styles.msgRow} ${m.dir === "out" ? styles.msgOut : ""}`}>
              {/* Los mensajes entrantes son del contacto: se usa su foto */}
              {m.dir === "in" && (
                fotoUrl(canal?.fotoPerfil) ? (
                  <img
                    src={fotoUrl(canal?.fotoPerfil)!}
                    alt=""
                    loading="lazy"
                    className={`${styles.msgAv} ${styles.msgAvImg}`}
                  />
                ) : (
                  <span className={styles.msgAv}>{m.ini}</span>
                )
              )}
              <span className={styles.bubble}>
                <ContenidoMensaje m={m} onImageClick={setImagenAmpliada} />
                <span className={styles.msgHora}>{m.hora}</span>
              </span>
            </div>
          ))}
          {subiendo && (
            <div className={`${styles.msgRow} ${styles.msgOut}`}>
              <span className={`${styles.bubble} ${styles.bubblePending}`}>
                <div className={styles.uploadingBox}>
                  {subiendo.esPdf ? (
                    <div className={styles.messageFile}>
                      <Icon name="fileText" width={26} height={26} className={styles.messageFileIcon} />
                      <span className={styles.messageFileName}>{subiendo.nombre}</span>
                    </div>
                  ) : (
                    <img src={subiendo.previewUrl} alt="" className={styles.messageImage} />
                  )}
                  <span className={styles.uploadingOverlay}>
                    <Icon name="loader" width={22} height={22} className={styles.spinner} />
                  </span>
                </div>
              </span>
            </div>
          )}
        </div>

        <div className={styles.chatInput}>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept={ADJUNTO_TIPOS.join(",")}
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
            disabled={!!subiendo}
            aria-label="Adjuntar"
            title="Adjuntar archivo"
          >
            {subiendo ? <Icon name="loader" width={20} height={20} className={styles.spinner} /> : <Icon name="paperclip" width={20} height={20} />}
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
                      <ChatAvatar nombre={u.nombre} foto={u.fotoPerfil} />
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

      {/* Visor de imagen adjunta — se queda dentro del proyecto, no navega afuera */}
      <Modal open={!!imagenAmpliada} onClose={() => setImagenAmpliada(null)} maxWidth={720}>
        <div className={styles.imageModalHead}>
          <button
            type="button"
            className={styles.modalCloseBtn}
            onClick={() => setImagenAmpliada(null)}
            aria-label="Cerrar"
          >
            <Icon name="x" width={20} height={20} />
          </button>
        </div>
        {imagenAmpliada && (
          <img src={imagenAmpliada} alt="Imagen adjunta" className={styles.imageModalImg} />
        )}
      </Modal>
    </div>
  );
}
