"use client";
/* ============================================================
   Verificación del negocio (KYC) — pantalla propia del menú
   ------------------------------------------------------------
   Dos vistas según quién entra:
     · Superadmin → la cola de lo que hay que revisar y, debajo, el
                    estado de TODAS las empresas.
     · Negocio    → en qué punto está su verificación y el
                    formulario para enviarla o corregirla.
   No bloquea nada: el negocio trabaja igual mientras espera.
============================================================ */
import { useState } from "react";
import { useSession } from "@/context/SessionContext";
import { useI18n } from "@/i18n";
import Panel, { PanelHead } from "@/components/ui/Panel";
import ColaKyc from "@/components/kyc/ColaKyc";
import KycWizard from "@/components/kyc/KycWizard";
import TodasLasVerificaciones from "@/components/kyc/TodasLasVerificaciones";

export default function VerificacionPage() {
  const { session } = useSession();
  const { t } = useI18n();
  /* Al resolver una verificación desde el listado hay que recargar la cola */
  const [refresco, setRefresco] = useState(0);

  /* El superadmin no tiene negocio propio: lo suyo es revisar los ajenos.
     Primero lo que hay que hacer (la cola) y debajo todas las empresas: la
     cola vacía decía "nada pendiente" mientras un negocio veía "Sin
     verificar" en su panel, y no había dónde cruzarlo. */
  if (session?.role === "superadmin") {
    return (
      <>
        <Panel>
          <PanelHead title={t("kyc.pendientesTitulo")} sub={t("kyc.colaSub")} />
          <ColaKyc key={`cola-${refresco}`} />
        </Panel>
        <Panel style={{ marginTop: 20 }}>
          <PanelHead title={t("kyc.todasTitulo")} sub={t("kyc.todasSub")} />
          <TodasLasVerificaciones onResuelto={() => setRefresco((n) => n + 1)} />
        </Panel>
      </>
    );
  }

  return <KycWizard />;
}
