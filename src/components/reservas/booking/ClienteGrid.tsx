"use client";
/* ============================================================
   ClienteGrid — catálogo de clientes en Grid responsive
   ------------------------------------------------------------
   4 columnas en escritorio, 3 en tablet y 1 en móvil. Cada
   tarjeta muestra únicamente nombre y teléfono (más avatar y
   botón "Seleccionar"), como un catálogo moderno de usuarios.
============================================================ */
import { memo, useState } from "react";
import type { ClienteOpcion } from "@/models";
import { initials } from "@/constants";
import { useI18n } from "@/i18n";
import Icon from "@/components/ui/Icon";
import Button from "@/components/ui/Button";
import styles from "./booking.module.css";

interface ClienteGridProps {
  clientes: ClienteOpcion[];
  selectedId?: string;
  onSelect: (c: ClienteOpcion) => void;
}

const ClienteCard = memo(function ClienteCard({
  cliente, selected, onSelect, selectLabel, selectedLabel,
}: {
  cliente: ClienteOpcion;
  selected: boolean;
  onSelect: (c: ClienteOpcion) => void;
  selectLabel: string;
  selectedLabel: string;
}) {
  const [imageError, setImageError] = useState(false);

  return (
    <article className={`${styles.clienteCard} ${selected ? styles.selected : ""}`}>
      <span className={styles.clienteAvatar} aria-hidden>
        {cliente.foto && !imageError ? (
          <img 
            src={`${process.env.NEXT_PUBLIC_API_BASE_URL_IMG || 'https://bookmy.es/'}${cliente.foto}`} 
            alt=""
            onError={() => setImageError(true)}
          />
        ) : initials(cliente.nombre)}
      </span>
      <span className={styles.clienteNombre} title={cliente.nombre}>{cliente.nombre}</span>
      <span className={styles.clienteTelefono}>
        <Icon name="phone" width={13} height={13} />
        {cliente.telefono || "—"}
      </span>
      <span className={styles.clienteEmail}>
        <Icon name="mail" width={13} height={13} />
        {cliente.email || "—"}
      </span>
      <div className={styles.clienteFoot}>
        {selected ? (
          <span className={styles.selectedTag}>
            <Icon name="check" width={15} height={15} strokeWidth={2.6} />
            {selectedLabel}
          </span>
        ) : (
          <Button size="sm" block onClick={() => onSelect(cliente)}>
            {selectLabel}
          </Button>
        )}
      </div>
    </article>
  );
});

function ClienteGridBase({ clientes, selectedId, onSelect }: ClienteGridProps) {
  const { t } = useI18n();
  return (
    <div className={styles.clienteGrid}>
      {clientes.map((c) => (
        <ClienteCard
          key={c.id}
          cliente={c}
          selected={c.id === selectedId}
          onSelect={onSelect}
          selectLabel={t("booking.select")}
          selectedLabel={t("booking.selectedM")}
        />
      ))}
    </div>
  );
}

export default memo(ClienteGridBase);
