"use client";
/* ============================================================
   CopiaSeguridad — descargar un volcado de la base (superadmin)
   ------------------------------------------------------------
   El archivo lleva los datos de TODAS las empresas, los correos y
   teléfonos de sus clientes y los hashes de las contraseñas. Por eso
   no hay enlace público: se pide por una petición autenticada y el
   navegador lo guarda directamente, sin que quede nada en el servidor.

   Antes de descargar se enseña qué tiene, para que no sea un botón a
   ciegas: cuántas tablas, cuántas filas y lo que ocupa la base.
============================================================ */
import { useState } from "react";
import { BackupApi } from "@/api/modules";
import { useData } from "@/hooks/useData";
import { useUi } from "@/context/UiContext";
import { useI18n } from "@/i18n";
import Panel, { PanelHead } from "@/components/ui/Panel";
import Button from "@/components/ui/Button";
import Icon from "@/components/ui/Icon";
import styles from "./CopiaSeguridad.module.css";

export default function CopiaSeguridad() {
  const { t } = useI18n();
  const { toast } = useUi();
  const [descargando, setDescargando] = useState(false);

  const { data: resumen } = useData(() => BackupApi.resumen().catch(() => null), [], null);

  const descargar = async () => {
    setDescargando(true);
    try {
      const { blob, nombre } = await BackupApi.descargar();
      const url = URL.createObjectURL(blob);
      const enlace = document.createElement("a");
      enlace.href = url;
      enlace.download = nombre ?? `bookmy-backup-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(enlace);
      enlace.click();
      enlace.remove();
      /* El blob se queda en memoria hasta que se libera a mano */
      URL.revokeObjectURL(url);
      toast(t("backup.descargada"), "success");
    } catch (e) {
      toast(e instanceof Error ? e.message : t("common.error"), "error");
    } finally {
      setDescargando(false);
    }
  };

  return (
    <Panel>
      <PanelHead title={t("backup.titulo")} sub={t("backup.sub")} />

      <div className={styles.datos}>
        <div className={styles.dato}>
          <b>{resumen ? resumen.tablas : "—"}</b>
          <span>{t("backup.tablas")}</span>
        </div>
        <div className={styles.dato}>
          <b>{resumen ? resumen.filas.toLocaleString() : "—"}</b>
          <span>{t("backup.filas")}</span>
        </div>
        <div className={styles.dato}>
          <b>{resumen?.tamanoBase ?? "—"}</b>
          <span>{t("backup.tamano")}</span>
        </div>
      </div>

      <p className={styles.aviso}>
        <Icon name="shield" width={16} height={16} />
        <span>{t("backup.aviso")}</span>
      </p>

      <Button disabled={descargando} onClick={() => void descargar()}>
        {descargando ? t("backup.generando") : t("backup.descargar")}
      </Button>
      <p className={styles.nota}>{t("backup.nota")}</p>
    </Panel>
  );
}
