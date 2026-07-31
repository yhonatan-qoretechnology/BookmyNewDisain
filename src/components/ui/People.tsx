"use client";
import { useState } from "react";
import { fotoUrl, initials } from "@/constants";
import styles from "./People.module.css";

/**
 * Fila persona: avatar + nombre.
 * Si `photo` trae la ruta de la foto de perfil (columna `fotoPerfil`
 * del backend) se muestra la imagen; si falta o falla la descarga,
 * cae a las iniciales del nombre.
 */
export function PersonRow({
  name,
  photo,
  bold = false,
}: {
  name: string;
  photo?: string | null;
  bold?: boolean;
}) {
  const [error, setError] = useState(false);
  const src = error ? null : fotoUrl(photo);

  return (
    <div className={styles.personRow}>
      <span className={styles.personAvatar} aria-hidden>
        {src ? (
          <img src={src} alt="" loading="lazy" onError={() => setError(true)} />
        ) : (
          initials(name)
        )}
      </span>
      {bold ? <b>{name}</b> : <span>{name}</span>}
    </div>
  );
}

export function Stars({ n }: { n: number }) {
  return <span className={styles.stars}>{"★".repeat(n) + "☆".repeat(5 - n)}</span>;
}
