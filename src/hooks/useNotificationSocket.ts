"use client";
/* ============================================================
   useNotificationSocket — push en tiempo real de notificaciones
   ------------------------------------------------------------
   Se conecta al namespace "/notifications" del backend (separado
   del namespace de chat, que usa el default "/"). Al conectar,
   emite "connect_user" con el userId de la sesión; el backend
   responde por el evento "new_notification" cada vez que se crea
   una notificación para ese usuario (ver notification.gateway.ts).
============================================================ */
import { useEffect, useRef } from "react";
import { io, type Socket } from "socket.io-client";
import { API_URL } from "@/api/config";
import type { ApiNotification } from "@/api/types";
import { playNotificationSound } from "@/lib/notificationSound";

export function useNotificationSocket(
  userId: string | null | undefined,
  onNewNotification: (notification: ApiNotification) => void,
) {
  const socketRef = useRef<Socket | null>(null);
  const callbackRef = useRef(onNewNotification);

  useEffect(() => {
    callbackRef.current = onNewNotification;
  }, [onNewNotification]);

  useEffect(() => {
    if (!userId || !API_URL) {
      // eslint-disable-next-line no-console
      console.warn(
        `[notifications-socket] no conecta: userId=${userId} API_URL=${API_URL || "(vacío)"}`,
      );
      return;
    }

    const url = `${API_URL}/notifications`;
    // eslint-disable-next-line no-console
    console.log(`[notifications-socket] conectando a ${url} como userId=${userId}...`);

    const socket = io(url, {
      transports: ["websocket"],
      reconnectionAttempts: 5,
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      // eslint-disable-next-line no-console
      console.log(`[notifications-socket] CONECTADO (socket.id=${socket.id}) — registrando userId=${userId}`);
      socket.emit("connect_user", { userId: Number(userId) });
    });

    socket.on("user_connected", (data) => {
      // eslint-disable-next-line no-console
      console.log("[notifications-socket] usuario registrado en el backend:", data);
    });

    socket.on("new_notification", (notification: ApiNotification) => {
      // eslint-disable-next-line no-console
      console.log("[notifications-socket] notificación nueva recibida:", notification);
      playNotificationSound();
      callbackRef.current(notification);
    });

    socket.on("disconnect", (reason) => {
      // eslint-disable-next-line no-console
      console.warn(`[notifications-socket] desconectado: ${reason}`);
    });

    socket.on("connect_error", (error) => {
      // eslint-disable-next-line no-console
      console.error("[notifications-socket] ERROR DE CONEXIÓN:", error.message, error);
    });

    return () => {
      socket.disconnect();
    };
  }, [userId]);
}
