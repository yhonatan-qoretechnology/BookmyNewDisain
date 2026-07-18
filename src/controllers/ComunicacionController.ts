/* ============================================================
   ComunicacionController — chat (ChatMessageModule, REST)
     GET  /ChatMessage/contacts/:userId
     GET  /ChatMessage/messages/:userA/:userB
     POST /ChatMessage/messages   (SendMessageDto, messageType TEXT)
     POST /ChatMessage/messages/read
   El backend también expone un gateway Socket.IO; este panel usa
   la vía REST con sondeo ligero desde la vista.
============================================================ */
import type { Canal, Mensaje, Session } from "@/models";
import { ChatApi } from "@/api/modules";
import { initials } from "@/constants";

export const ComunicacionController = {
  /**
   * Contactos del usuario como canales de conversación.
   * @param session Sesión activa (owner de la lista de contactos).
   */
  async getCanales(session: Session | null): Promise<Canal[]> {
    if (!session) return [];
    const list = await ChatApi.contacts(Number(session.id)).catch(() => []);
    return (list || []).map((c) => {
      const u = c.users_chat_contact_contact_user_idTousers;
      return {
        id: String(u.id),
        nombre: u.email.split("@")[0],
        sub: u.email,
        online: false,
        unread: 0,
        email: u.email,
      };
    });
  },

  /**
   * Conversación entre la sesión y un contacto.
   * @param session Usuario A.
   * @param contactId Usuario B (id del contacto).
   */
  async getMensajes(session: Session | null, contactId: string): Promise<Mensaje[]> {
    if (!session) return [];
    const rows = await ChatApi.conversation(Number(session.id), Number(contactId)).catch(() => []);
    return (rows || []).map((m) => ({
      dir: m.sender_id === Number(session.id) ? "out" : "in",
      texto: m.message || "",
      hora: new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      ini: initials(m.sender_email.split("@")[0]),
    }));
  },

  /**
   * Envía un mensaje de texto — POST /ChatMessage/messages.
   * @param session Remitente.
   * @param contacto Canal destino (id + email).
   * @param texto Contenido del mensaje.
   */
  async enviarMensaje(session: Session | null, contacto: Canal, texto: string): Promise<void> {
    if (!session) return;
    await ChatApi.send({
      senderId: Number(session.id),
      receiverId: Number(contacto.id),
      senderEmail: session.email,
      receiverEmail: contacto.email || contacto.sub,
      messageType: "TEXT",
      message: texto,
    });
  },

  /** Marca la conversación como leída — POST /ChatMessage/messages/read. */
  async marcarLeido(session: Session | null, contactId: string): Promise<void> {
    if (!session) return;
    await ChatApi.markRead({ userId: Number(session.id), contactId: Number(contactId) }).catch(() => undefined);
  },
};
