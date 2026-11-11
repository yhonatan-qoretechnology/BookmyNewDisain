/* ============================================================
   ComunicacionController — chat (ChatMessageModule, REST)
     GET  /ChatMessage/contacts/:userId
     GET  /ChatMessage/messages/:userA/:userB
     POST /ChatMessage/messages   (SendMessageDto, messageType TEXT/IMAGE/FILE)
     POST /ChatMessage/messages/read
     POST /ChatMessage/upload     (multipart, adjunto imagen/PDF)
     POST /ChatMessage/upload-audio (multipart, nota de voz)
   Todos estos endpoints requieren sesión (Authorization: Bearer);
   http.ts ya adjunta el token a cada petición automáticamente.
   El backend también expone un gateway Socket.IO; este panel usa
   la vía REST con sondeo ligero desde la vista.
============================================================ */
import type { Canal, Mensaje, Session } from "@/models";
import { ChatApi, AuthApi } from "@/api/modules";
import { http, qs } from "@/api/http";
import { EP } from "@/api/endpoints";
import { initials } from "@/constants";

/** Respuesta de GET /ChatMessage/users?email= */
interface UsuarioChat {
  id: number;
  email: string;
  role?: string;
  fotoPerfil?: string | null;
  UserData?: { name?: string | null } | null;
  AdminProfile?: { empresa?: { nombre: string } | null; sede?: { nombre: string } | null } | null;
  /** Si se buscó el correo de una empresa: la empresa, y esto es su admin */
  empresaBuscada?: string;
}

const ROL_CHAT: Record<string, string> = {
  SUPER_ADMIN: "Bookmy",
  COMPANY_ADMIN: "Administrador",
  BRANCH_ADMIN: "Administrador de sede",
  EMPLOYEE: "Especialista",
  CLIENT: "Cliente",
};

/** «Cliente · maria@x.com», «Administrador de sede · Glow Marbella»… */
function subtituloChat(u: UsuarioChat): string {
  if (u.empresaBuscada) return `${u.empresaBuscada} · ${ROL_CHAT.COMPANY_ADMIN}`;
  const rol = ROL_CHAT[u.role ?? ""] ?? "";
  const lugar = u.AdminProfile?.sede?.nombre || u.AdminProfile?.empresa?.nombre || "";
  return [rol, lugar || u.email].filter(Boolean).join(" · ");
}

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
        /* El backend dice quién tiene ahora el chat abierto */
        online: !!(c as { online?: boolean }).online,
        unread: 0,
        email: u.email,
      };
    });
  },

  /**
   * Buscar usuarios en toda la plataforma (excluyendo CLIENT role).
   * @param session Sesión activa.
   * @param query Término de búsqueda (vacío = todos los usuarios).
   */
  async buscarUsuarios(session: Session | null, query: string): Promise<Canal[]> {
    if (!session) return [];
    const users = await AuthApi.findAllUsers().catch(() => []);
    const filtered = (users || [])
      .filter(u => u.role !== "CLIENT")
      .filter(u =>
        !query ||
        u.UserData?.name?.toLowerCase().includes(query.toLowerCase()) ||
        u.email?.toLowerCase().includes(query.toLowerCase())
      );

    const canales: Canal[] = filtered.map((u) => ({
      id: String(u.id),
      nombre: u.UserData?.name || u.email.split("@")[0],
      sub: u.email,
      online: u.state === "enabled",
      unread: 0,
      email: u.email,
      fotoPerfil: u.fotoPerfil || null,
    }));

    /* GET /users solo devuelve la gente del propio negocio (y al superadmin,
       todos): con el correo COMPLETO de alguien se le busca en toda la
       plataforma (GET /ChatMessage/users?email=, búsqueda exacta), sea
       cliente, administrador o especialista. */
    const correo = query.trim().toLowerCase();
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo) && !canales.some((c) => c.email?.toLowerCase() === correo)) {
      const u = await http
        .get<UsuarioChat | null>(EP.chatUsers + qs({ email: correo }))
        .catch(() => null);
      if (u?.id && String(u.id) !== String(session.id)) {
        canales.unshift({
          id: String(u.id),
          nombre: u.UserData?.name || u.email.split("@")[0],
          sub: subtituloChat(u),
          online: false,
          unread: 0,
          email: u.email,
          fotoPerfil: u.fotoPerfil || null,
        });
      }
    }
    return canales;
  },

  /**
   * Agregar un nuevo contacto — POST /ChatMessage/contacts.
   * @param session Sesión activa (owner).
   * @param contactUserId ID del usuario a agregar como contacto.
   */
  async agregarContacto(session: Session | null, contactUserId: number): Promise<boolean> {
    if (!session) return false;
    /* Devuelve si se guardó: antes el error se tragaba y la persona
       parecía añadida pero no aparecía en la lista. */
    try {
      await http.post(EP.chatCreateContact, {
        ownerUserId: Number(session.id),
        contactUserId,
      });
      return true;
    } catch {
      return false;
    }
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
      messageType: m.message_type || "TEXT",
      fileUrl: m.file_url || null,
      leido: !!m.is_read,
    }));
  },

  /**
   * Envía un mensaje de texto o un adjunto (imagen/PDF) — sube el
   * archivo con POST /ChatMessage/upload y luego crea el mensaje con
   * POST /ChatMessage/messages, usando el fileUrl devuelto por el upload.
   * @param session Remitente.
   * @param contacto Canal destino (id + email).
   * @param texto Contenido del mensaje (o caption del adjunto).
   * @param archivo Archivo opcional (imagen o PDF).
   */
  async enviarMensaje(session: Session | null, contacto: Canal, texto: string, archivo?: File | null): Promise<void> {
    if (!session) return;

    let messageType: "TEXT" | "IMAGE" | "FILE" = "TEXT";
    let fileUrl: string | undefined;

    if (archivo) {
      const subida = await ChatApi.upload(archivo);
      messageType = subida.messageType;
      fileUrl = subida.fileUrl;
    }

    await ChatApi.send({
      senderId: Number(session.id),
      receiverId: Number(contacto.id),
      senderEmail: session.email,
      receiverEmail: contacto.email || contacto.sub,
      messageType,
      message: texto,
      fileUrl,
    });
  },

  /**
   * Envía una nota de voz — sube el audio con POST /ChatMessage/upload-audio
   * y luego crea el mensaje (messageType "AUDIO") con POST /ChatMessage/messages.
   * @param session Remitente.
   * @param contacto Canal destino (id + email).
   * @param audio Grabación capturada con MediaRecorder.
   */
  async enviarAudio(session: Session | null, contacto: Canal, audio: Blob): Promise<void> {
    if (!session) return;
    const subida = await ChatApi.uploadAudio(audio);
    await ChatApi.send({
      senderId: Number(session.id),
      receiverId: Number(contacto.id),
      senderEmail: session.email,
      receiverEmail: contacto.email || contacto.sub,
      messageType: subida.messageType,
      fileUrl: subida.fileUrl,
    });
  },

  /** Marca la conversación como leída — POST /ChatMessage/messages/read. */
  async marcarLeido(session: Session | null, contactId: string): Promise<void> {
    if (!session) return;
    await ChatApi.markRead({ userId: Number(session.id), contactId: Number(contactId) }).catch(() => undefined);
  },
};
