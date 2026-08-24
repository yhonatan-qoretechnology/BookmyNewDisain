/* ============================================================
   NotificationsController — notificaciones del usuario (campana)
   ------------------------------------------------------------
   Traduce ApiNotification (backend) ↔ Notificacion (dominio).
   Hoy el backend solo notifica al BRANCH_ADMIN de la sede cuando
   se crea una reserva (POST /appointments → notification.service.ts),
   así que para el resto de roles la lista simplemente viene vacía.
============================================================ */
import { NotificationsApi } from "@/api/modules";
import type { ApiNotification } from "@/api/types";
import type { Notificacion } from "@/models";

function mapNotificacion(n: ApiNotification): Notificacion {
  return {
    id: n.id,
    tipo: n.type,
    titulo: n.title,
    cuerpo: n.body,
    leida: n.read,
    creadaEn: n.createdAt,
    datos: n.data,
  };
}

export const NotificationsController = {
  async findAll(params?: { onlyUnread?: boolean; page?: number; limit?: number }): Promise<{
    items: Notificacion[];
    unreadCount: number;
  }> {
    const res = await NotificationsApi.findAll(params);
    return { items: res.items.map(mapNotificacion), unreadCount: res.unreadCount };
  },

  async unreadCount(): Promise<number> {
    const res = await NotificationsApi.unreadCount();
    return res.unreadCount;
  },

  async markAsRead(id: number): Promise<Notificacion> {
    const res = await NotificationsApi.markAsRead(id);
    return mapNotificacion(res);
  },

  markAllAsRead: () => NotificationsApi.markAllAsRead(),

  /** Adapta el payload crudo del socket ("new_notification") al dominio. */
  mapFromSocket: mapNotificacion,
};
