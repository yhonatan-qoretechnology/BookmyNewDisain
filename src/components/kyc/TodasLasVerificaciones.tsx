"use client";
/* ============================================================
   TodasLasVerificaciones — el estado de verificación de TODAS

   La cola solo lista lo que está EN_REVISION. Con la cola vacía, el
   superadmin leía "nada pendiente" mientras un negocio veía en su panel
   "Sin verificar": dos pantallas diciendo cosas que parecían opuestas.
   No lo eran —ese negocio no ha enviado nada, así que no hay nada que
   revisar—, pero no había dónde comprobarlo. Aquí están todas, y desde
   cada una se abre su documentación.
============================================================ */
import { useMemo, useState } from "react";
import { useData } from "@/hooks/useData";
import { NegociosController } from "@/controllers/NegociosController";
import { useI18n } from "@/i18n";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import DataTable from "@/components/ui/DataTable";
import { SearchBox } from "@/components/ui/Toolbar";
import KycEmpresaModal from "./KycEmpresaModal";
import { BADGE_KYC } from "./estados";
import styles from "./Kyc.module.css";

/** Las que piden atención primero: en revisión, luego rechazadas, etc. */
const ORDEN = { EN_REVISION: 0, RECHAZADA: 1, PENDIENTE: 2, APROBADA: 3 } as const;

export default function TodasLasVerificaciones({ onResuelto }: { onResuelto?: () => void }) {
  const { t } = useI18n();
  const [busca, setBusca] = useState("");
  const [abierta, setAbierta] = useState<{ id: number; nombre: string } | null>(null);

  const { data: empresas, reload } = useData(() => NegociosController.getAll(), [], []);

  const filas = useMemo(() => {
    const q = busca.trim().toLowerCase();
    return empresas
      .filter((e) => !q || e.nombre.toLowerCase().includes(q))
      .map((e) => ({ ...e, estado: e.kycEstado ?? ("PENDIENTE" as const) }))
      .sort((a, b) => ORDEN[a.estado] - ORDEN[b.estado] || a.nombre.localeCompare(b.nombre));
  }, [empresas, busca]);

  return (
    <>
      <div className={styles.todasBarra}>
        <SearchBox value={busca} onChange={setBusca} placeholder={t("common.search")} />
      </div>

      {filas.length === 0 ? (
        <p className={styles.vacio}>{t("kyc.todasVacio")}</p>
      ) : (
        <DataTable headers={[t("empresas.name"), t("common.state"), t("common.actions")]}>
          {filas.map((e) => (
            <tr key={e.id}>
              <td><b>{e.nombre}</b></td>
              <td>
                <Badge kind={BADGE_KYC[e.estado]}>{t(`kyc.estados.${e.estado}`)}</Badge>
              </td>
              <td>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setAbierta({ id: Number(e.id), nombre: e.nombre })}
                >
                  {t("kyc.verDocumentos")}
                </Button>
              </td>
            </tr>
          ))}
        </DataTable>
      )}

      <KycEmpresaModal
        empresaId={abierta?.id ?? null}
        empresaNombre={abierta?.nombre ?? ""}
        onClose={() => setAbierta(null)}
        onResuelto={() => {
          void reload();
          onResuelto?.();
        }}
      />
    </>
  );
}
