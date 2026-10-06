"use client";
/* ============================================================
   Verificación del negocio (KYC) — pantalla propia del menú
   ------------------------------------------------------------
   Dos vistas según quién entra:
     · Superadmin → la cola de lo que hay que revisar.
     · Negocio    → en qué punto está su verificación y el
                    formulario para enviarla o corregirla.
   No bloquea nada: el negocio trabaja igual mientras espera.
============================================================ */
import { useSession } from "@/context/SessionContext";
import { useI18n } from "@/i18n";
import Panel, { PanelHead } from "@/components/ui/Panel";
import ColaKyc from "@/components/kyc/ColaKyc";
import KycPanel from "@/components/kyc/KycPanel";

export default function VerificacionPage() {
  const { session } = useSession();
  const { t } = useI18n();

  /* El superadmin no tiene negocio propio: lo suyo es revisar los ajenos. */
  if (session?.role === "superadmin") {
    return (
      <Panel>
        <PanelHead title={t("kyc.pendientesTitulo")} sub={t("kyc.colaSub")} />
        <ColaKyc />
      </Panel>
    );
  }

  return <KycPanel />;
}
