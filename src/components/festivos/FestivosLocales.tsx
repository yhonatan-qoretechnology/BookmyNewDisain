"use client";
/* ============================================================
   FestivosLocales — los festivos de cada municipio
   ------------------------------------------------------------
   La sincronización con la API oficial trae los nacionales y los
   de cada comunidad, pero NO los patronos de cada pueblo: son
   justo los que hacen que Benalmádena y Marbella no cierren los
   mismos días. Se cargan aquí a mano, una vez al año.

   El municipio se compara sin tildes ni mayúsculas, así que da
   igual escribirlo como "Benalmádena" o "Benalmadena".
============================================================ */
import { useState } from "react";
import type { ApiFestivo } from "@/api/types";
import { FestivosApi } from "@/api/modules";
import { useData } from "@/hooks/useData";
import { useUi } from "@/context/UiContext";
import { useI18n } from "@/i18n";
import Modal, { ModalActions, ModalText, ModalTitle } from "@/components/ui/Modal";
import Button, { IconButton } from "@/components/ui/Button";
import Icon from "@/components/ui/Icon";
import styles from "./FestivosLocales.module.css";

export default function FestivosLocales({
  abierto,
  anio,
  onClose,
  onCambios,
}: {
  abierto: boolean;
  anio: number;
  onClose: () => void;
  /** Para repintar el calendario cuando se añade o se quita uno */
  onCambios: () => void;
}) {
  const { t, locale } = useI18n();
  const { toast, confirm } = useUi();

  const { data: festivos, reload } = useData<ApiFestivo[]>(
    () => (abierto ? FestivosApi.locales(anio).catch(() => []) : Promise.resolve([])),
    [abierto, anio],
    [],
  );

  const [fecha, setFecha] = useState("");
  const [nombre, setNombre] = useState("");
  const [municipio, setMunicipio] = useState("");
  const [guardando, setGuardando] = useState(false);

  const agregar = async () => {
    if (!fecha || !nombre.trim() || !municipio.trim()) {
      toast(t("festivos.faltanDatos"), "error");
      return;
    }
    setGuardando(true);
    try {
      await FestivosApi.crearLocal({ fecha, nombre: nombre.trim(), municipio: municipio.trim() });
      setFecha(""); setNombre("");
      /* El municipio se conserva: lo normal es cargar varios seguidos
         del mismo pueblo. */
      await reload();
      onCambios();
      toast(t("festivos.agregado"), "success");
    } catch (e) {
      toast(e instanceof Error ? e.message : t("common.error"), "error");
    } finally {
      setGuardando(false);
    }
  };

  const quitar = (f: ApiFestivo) => {
    confirm({
      title: t("festivos.borrarTitulo"),
      message: t("festivos.borrarMsg", { nombre: f.nombre, municipio: f.municipio || "—" }),
      confirmLabel: t("common.delete"),
      onConfirm: async () => {
        try {
          await FestivosApi.borrarLocal(f.id);
          await reload();
          onCambios();
          toast(t("festivos.borrado"), "success");
        } catch (e) {
          toast(e instanceof Error ? e.message : t("common.error"), "error");
        }
      },
    });
  };

  return (
    <Modal open={abierto} onClose={onClose} maxWidth={640} contentScroll>
      <ModalTitle>{t("festivos.localesTitulo", { anio })}</ModalTitle>
      <ModalText>{t("festivos.localesSub")}</ModalText>

      <div className={styles.alta}>
        <label className={styles.campo}>
          <span>{t("common.date")}</span>
          <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
        </label>
        <label className={styles.campo}>
          <span>{t("festivos.municipio")}</span>
          <input
            value={municipio}
            onChange={(e) => setMunicipio(e.target.value)}
            placeholder={t("festivos.municipioPlaceholder")}
          />
        </label>
        <label className={`${styles.campo} ${styles.ancho}`}>
          <span>{t("common.name")}</span>
          <input
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder={t("festivos.nombrePlaceholder")}
          />
        </label>
        <Button disabled={guardando} onClick={() => void agregar()}>
          {guardando ? t("common.saving") : t("festivos.agregar")}
        </Button>
      </div>

      {festivos.length === 0 ? (
        <p className={styles.vacio}>{t("festivos.sinLocales")}</p>
      ) : (
        <ul className={styles.lista}>
          {festivos.map((f) => (
            <li key={f.id}>
              <span className={styles.fecha}>
                {new Date(f.fecha).toLocaleDateString(locale, { day: "2-digit", month: "short" })}
              </span>
              <span className={styles.nombre}>
                <b>{f.nombre}</b>
                <small>{f.municipio}</small>
              </span>
              <IconButton danger aria-label={t("common.delete")} onClick={() => quitar(f)}>
                <Icon name="trash" width={15} height={15} />
              </IconButton>
            </li>
          ))}
        </ul>
      )}

      <ModalActions>
        <Button variant="ghost" block onClick={onClose}>{t("common.close")}</Button>
      </ModalActions>
    </Modal>
  );
}
