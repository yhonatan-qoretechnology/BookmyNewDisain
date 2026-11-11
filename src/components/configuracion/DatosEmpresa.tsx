"use client";
/* ============================================================
   DatosEmpresa — la ficha pública del negocio, editable por su
   dueño desde Configuración: nombre, teléfono, correo, NIT,
   descripción, redes y logo. Es lo que ven los clientes en la app.
   Usa el mismo formulario que el superadmin en Empresas
   (PATCH /empresas/:id, que ya admite al COMPANY_ADMIN de esa
   empresa).
============================================================ */
import { useState } from "react";
import { EmpresasApi, ImagenesApi } from "@/api/modules";
import { fotoUrl } from "@/constants";
import { useData } from "@/hooks/useData";
import { useSession } from "@/context/SessionContext";
import { useUi } from "@/context/UiContext";
import { useI18n } from "@/i18n";
import Panel, { PanelHead } from "@/components/ui/Panel";
import Button from "@/components/ui/Button";
import Icon from "@/components/ui/Icon";
import EmpresaFormModal from "@/components/empresas/EmpresaFormModal";
import styles from "./DatosEmpresa.module.css";

export default function DatosEmpresa() {
  const { t } = useI18n();
  const { session, updateSession } = useSession();
  const empresaId = Number(session?.negocioId) || 0;
  const [editando, setEditando] = useState(false);
  const { toast } = useUi();
  const [subiendoBanner, setSubiendoBanner] = useState(false);

  const { data: empresa, reload } = useData(
    () => (empresaId ? EmpresasApi.findOne(empresaId).catch(() => null) : Promise.resolve(null)),
    [empresaId],
    null
  );

  if (!empresaId) return null;

  /* Portada: imagen ancha que encabeza el negocio en la app */
  const cambiarBanner = async (file: File | undefined) => {
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) { toast(t("imagen.errTipo"), "error"); return; }
    if (file.size > 10 * 1024 * 1024) { toast(t("imagen.errPeso"), "error"); return; }
    setSubiendoBanner(true);
    try {
      await ImagenesApi.empresaBanner(empresaId, file);
      await reload();
      toast(t("configuracion.bannerListo"), "success");
    } catch (e) {
      toast(e instanceof Error ? e.message : t("imagen.errSubida"), "error");
    } finally {
      setSubiendoBanner(false);
    }
  };
  const quitarBanner = async () => {
    setSubiendoBanner(true);
    try {
      await ImagenesApi.quitarEmpresaBanner(empresaId);
      await reload();
    } catch (e) {
      toast(e instanceof Error ? e.message : t("common.error"), "error");
    } finally {
      setSubiendoBanner(false);
    }
  };

  const redes = [
    { etiqueta: "Web", url: empresa?.webUrl },
    { etiqueta: "Instagram", url: empresa?.instagramUrl },
    { etiqueta: "Facebook", url: empresa?.facebookUrl },
    { etiqueta: "TikTok", url: empresa?.tiktokUrl },
  ].filter((r) => r.url);

  return (
    <Panel>
      <PanelHead
        title={t("configuracion.empresaTitulo")}
        sub={t("configuracion.empresaSub")}
        right={
          <Button size="sm" onClick={() => setEditando(true)}>
            <Icon name="edit" /> {t("configuracion.empresaEditar")}
          </Button>
        }
      />

      {empresa && (
        <div className={styles.banner}>
          {empresa.banner ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={fotoUrl(empresa.banner) || ""} alt="" />
          ) : (
            <span className={styles.bannerVacio}>{t("configuracion.bannerVacio")}</span>
          )}
          <div className={styles.bannerAcciones}>
            <label className={styles.bannerBtn} aria-busy={subiendoBanner}>
              <Icon name="camera" />
              {subiendoBanner ? t("imagen.subiendo") : t(empresa.banner ? "configuracion.bannerCambiar" : "configuracion.bannerSubir")}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                hidden
                disabled={subiendoBanner}
                onChange={(e) => { void cambiarBanner(e.target.files?.[0]); e.target.value = ""; }}
              />
            </label>
            {empresa.banner && (
              <button type="button" className={styles.bannerBtn} onClick={() => void quitarBanner()} disabled={subiendoBanner}>
                <Icon name="trash" /> {t("configuracion.bannerQuitar")}
              </button>
            )}
          </div>
        </div>
      )}

      {empresa ? (
        <div className={styles.ficha}>
          {empresa.logo ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={fotoUrl(empresa.logo) || ""} alt="" className={styles.logo} />
          ) : (
            <div className={styles.logoVacio}><Icon name="building" /></div>
          )}
          <div className={styles.datos}>
            <b className={styles.nombre}>{empresa.nombre}</b>
            {empresa.descripcion && <p className={styles.descripcion}>{empresa.descripcion}</p>}
            <dl className={styles.lista}>
              {empresa.telefono && (<><dt>{t("common.phone")}</dt><dd>{empresa.telefono}</dd></>)}
              {empresa.email && (<><dt>{t("common.email")}</dt><dd>{empresa.email}</dd></>)}
              {empresa.nit && (<><dt>{t("configuracion.empresaNit")}</dt><dd>{empresa.nit}</dd></>)}
            </dl>
            {redes.length > 0 ? (
              <div className={styles.redes}>
                {redes.map((r) => (
                  <a key={r.etiqueta} href={r.url!} target="_blank" rel="noopener noreferrer">{r.etiqueta}</a>
                ))}
              </div>
            ) : (
              <p className={styles.aviso}>{t("configuracion.empresaSinRedes")}</p>
            )}
          </div>
        </div>
      ) : (
        <p className={styles.aviso}>{t("common.loading")}</p>
      )}

      <EmpresaFormModal
        open={editando}
        empresaId={empresaId}
        onClose={() => setEditando(false)}
        onGuardada={async (e) => {
          await reload();
          if (e?.nombre && e.nombre !== session?.negocioName) updateSession({ negocioName: e.nombre });
        }}
      />
    </Panel>
  );
}
