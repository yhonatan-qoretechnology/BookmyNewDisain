"use client";
/* ============================================================
   useChatSocket — chat en tiempo real (namespace "/" del backend,
   ver chat.gateway.ts)
   ------------------------------------------------------------
   · receive_message → mensaje nuevo (propio o recibido): la vista
     recarga la conversación o sube el contador de no leídos.
   · typing / stop_typing → «Escribiendo…» de cada contacto.
   · message_read → el otro leyó: la vista recarga para pintar ✓✓.
   El handshake va con el JWT; el backend saca de ahí la identidad.
   Si el socket no conecta, la vista sigue con su sondeo de siempre.
============================================================ */
import { useCallback, useEffect, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";
import { API_URL, getToken } from "@/api/config";
import type { ApiChatMessage } from "@/api/types";

/** Tras este silencio sin «typing», se da por terminado */
const TYPING_TTL_MS = 4000;
/** Cada cuánto se reenvía «typing» mientras se sigue escribiendo */
const TYPING_REENVIO_MS = 2000;

export interface ChatSocketHandlers {
  onMensaje?: (m: ApiChatMessage) => void;
  onLeido?: (d: { chatId: number; readerId: number }) => void;
}

export function useChatSocket(userId: string | null | undefined, handlers: ChatSocketHandlers) {
  const socketRef = useRef<Socket | null>(null);
  const handlersRef = useRef(handlers);
  const [conectado, setConectado] = useState(false);
  /** senderId → instante del último «typing» recibido */
  const [escribiendo, setEscribiendo] = useState<Record<number, number>>({});
  /** Cambios de presencia recibidos en vivo: userId → en línea */
  const [presencia, setPresencia] = useState<Record<number, boolean>>({});
  const ultimoTypingRef = useRef<Record<number, number>>({});
  const paradaRef = useRef<Record<number, ReturnType<typeof setTimeout>>>({});

  useEffect(() => { handlersRef.current = handlers; }, [handlers]);

  useEffect(() => {
    if (!userId || !API_URL) return;
    const socket = io(API_URL, {
      auth: { token: getToken() ?? "" },
      transports: ["websocket"],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      socket.emit("connect_user", { userId: Number(userId) });
    });
    socket.on("user_connected", () => setConectado(true));
    socket.on("disconnect", () => setConectado(false));
    socket.on("connect_error", () => setConectado(false));

    socket.on("receive_message", (m: ApiChatMessage) => {
      /* Quien manda un mensaje deja de escribir */
      setEscribiendo((e) => {
        if (!(m.sender_id in e)) return e;
        const { [m.sender_id]: _, ...resto } = e;
        return resto;
      });
      handlersRef.current.onMensaje?.(m);
    });
    socket.on("typing", (d: { senderId: number }) => {
      setEscribiendo((e) => ({ ...e, [d.senderId]: Date.now() }));
    });
    socket.on("stop_typing", (d: { senderId: number }) => {
      setEscribiendo((e) => {
        const { [d.senderId]: _, ...resto } = e;
        return resto;
      });
    });
    socket.on("user_online", (d: { userId: number }) => setPresencia((p) => ({ ...p, [d.userId]: true })));
    socket.on("user_offline", (d: { userId: number }) => setPresencia((p) => ({ ...p, [d.userId]: false })));
    socket.on("message_read", (d: { chatId: number; readerId: number }) => {
      handlersRef.current.onLeido?.(d);
    });

    /* La pestaña en segundo plano puede quedarse sin socket */
    const onVisible = () => {
      if (document.visibilityState === "visible" && !socket.connected) socket.connect();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      Object.values(paradaRef.current).forEach(clearTimeout);
      socket.disconnect();
      socketRef.current = null;
      setConectado(false);
    };
  }, [userId]);

  /* «Escribiendo…» caduca solo si no llega el stop (otro se fue sin avisar) */
  useEffect(() => {
    const ids = Object.keys(escribiendo);
    if (ids.length === 0) return;
    const timer = setInterval(() => {
      const ahora = Date.now();
      setEscribiendo((e) => {
        const vivos = Object.fromEntries(Object.entries(e).filter(([, ts]) => ahora - ts < TYPING_TTL_MS));
        return Object.keys(vivos).length === Object.keys(e).length ? e : vivos;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [escribiendo]);

  /** Avisa de que se está escribiendo a `receiverId` (con freno y parada automática). */
  const avisarEscribiendo = useCallback((receiverId: number) => {
    const s = socketRef.current;
    if (!s?.connected || !userId) return;
    const ahora = Date.now();
    if (ahora - (ultimoTypingRef.current[receiverId] || 0) > TYPING_REENVIO_MS) {
      s.emit("typing", { senderId: Number(userId), receiverId });
      ultimoTypingRef.current[receiverId] = ahora;
    }
    clearTimeout(paradaRef.current[receiverId]);
    paradaRef.current[receiverId] = setTimeout(() => {
      s.emit("stop_typing", { senderId: Number(userId), receiverId });
      ultimoTypingRef.current[receiverId] = 0;
    }, TYPING_TTL_MS - 1000);
  }, [userId]);

  /** Deja de escribir (al enviar o al cambiar de chat). */
  const dejarDeEscribir = useCallback((receiverId: number) => {
    const s = socketRef.current;
    clearTimeout(paradaRef.current[receiverId]);
    if (!s?.connected || !userId || !ultimoTypingRef.current[receiverId]) return;
    s.emit("stop_typing", { senderId: Number(userId), receiverId });
    ultimoTypingRef.current[receiverId] = 0;
  }, [userId]);

  return { conectado, escribiendo, presencia, avisarEscribiendo, dejarDeEscribir };
}
