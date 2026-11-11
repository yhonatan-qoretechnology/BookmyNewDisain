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
import { EmpresasApi } from "@/api/modules";
import { fotoUrl } from "@/constants";
import { useData } from "@/hooks/useData";
import { useSession } from "@/context/SessionContext";
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

  const { data: empresa, reload } = useData(
    () => (empresaId ? EmpresasApi.findOne(empresaId).catch(() => null) : Promise.resolve(null)),
    [empresaId],
    null
  );

  if (!empresaId) return null;

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
