"use client";
/* ============================================================
   NotificationBell — campana con contador real + panel en vivo
   ------------------------------------------------------------
   Reemplaza el bellCount fijo que traía Topbar (placeholder sin
   conectar). Carga el historial por REST al montar y se actualiza
   sola por socket cuando llega una notificación nueva (ver
   useNotificationSocket / notification.gateway.ts en el backend).
============================================================ */
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/context/SessionContext";
import { useI18n } from "@/i18n";
import { ROUTES } from "@/constants";
import { NotificationsController } from "@/controllers/NotificationsController";
import { useNotificationSocket } from "@/hooks/useNotificationSocket";
import Icon from "@/components/ui/Icon";
import type { Notificacion } from "@/models";
import styles from "./NotificationBell.module.css";

function tiempoDesde(iso: string): string {
  const minutos = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (minutos < 1) return "ahora";
  if (minutos < 60) return `hace ${minutos} min`;
  const horas = Math.floor(minutos / 60);
  if (horas < 24) return `hace ${horas} h`;
  return `hace ${Math.floor(horas / 24)} d`;
}

export default function NotificationBell() {
  const { session } = useSession();
  const { t } = useI18n();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Notificacion[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [markingAll, setMarkingAll] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const userId = session?.id ?? null;

  const load = useCallback(async () => {
    if (!userId) return;
    // Solo no leídas: una vez que se marca como leída (clic o "marcar
    // todas"), desaparece de la lista — no queda dando vueltas.
    const { items, unreadCount } = await NotificationsController.findAll({
      onlyUnread: true,
      limit: 15,
    });
    setItems(items);
    setUnreadCount(unreadCount);
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  useNotificationSocket(userId, (raw) => {
    const notificacion = NotificationsController.mapFromSocket(raw);
    setItems((prev) => [notificacion, ...prev].slice(0, 15));
    setUnreadCount((prev) => prev + 1);
  });

  // Cierra el panel al hacer clic fuera — mismo patrón que LanguageToggle
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const handleItemClick = async (n: Notificacion) => {
    // La lista solo tiene no leídas, así que tocarla siempre la saca de acá.
    setItems((prev) => prev.filter((x) => x.id !== n.id));
    setUnreadCount((prev) => Math.max(0, prev - 1));
    void NotificationsController.markAsRead(n.id);

    // Lleva a la reserva de la que habla la notificación (ej. "Nueva reserva").
    const appointmentId = n.datos?.appointmentId;
    if (typeof appointmentId === "number") {
      setOpen(false);
      router.push(ROUTES.reservas);
    }
  };

  const handleMarkAll = async () => {
    if (unreadCount === 0) return;
    setMarkingAll(true);
    await NotificationsController.markAllAsRead();
    setItems([]);
    setUnreadCount(0);
    setMarkingAll(false);
  };

  if (!userId) return null;

  return (
    <div className={styles.wrap} ref={ref}>
      <button
        className={styles.bellButton}
        onClick={() => setOpen((o) => !o)}
        aria-label={t("topbar.notifications")}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <Icon name="bell" />
        {unreadCount > 0 && (
          <span className={styles.bellDot}>{unreadCount > 99 ? "99+" : unreadCount}</span>
        )}
      </button>

      {open && (
        <div className={styles.panel} role="dialog" aria-label={t("topbar.notifications")}>
          <div className={styles.panelHead}>
            <span className={styles.panelTitle}>{t("topbar.notifications")}</span>
            <button
              className={styles.markAll}
              onClick={handleMarkAll}
              disabled={unreadCount === 0 || markingAll}
            >
              Marcar todas como leídas
            </button>
          </div>

          {items.length === 0 ? (
            <div className={styles.empty}>No tenés notificaciones nuevas.</div>
          ) : (
            items.map((n) => (
              <button
                key={n.id}
                className={`${styles.item} ${styles.itemUnread}`}
                onClick={() => handleItemClick(n)}
              >
                <div className={styles.itemTitleRow}>
                  <span className={styles.itemDot} />
                  <span className={styles.itemTitle}>{n.titulo}</span>
                </div>
                <p className={styles.itemBody}>{n.cuerpo}</p>
                <span className={styles.itemTime}>{tiempoDesde(n.creadaEn)}</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
