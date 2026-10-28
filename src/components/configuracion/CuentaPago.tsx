"use client";
/* ============================================================
   CuentaPago — cómo cobra online el negocio (Wise o banco)
   ------------------------------------------------------------
   Solo el dueño del negocio (role "owner" = COMPANY_ADMIN) la carga:
   es una configuración de TODA la empresa, no de una sede. Distinto
   de /liquidaciones (que es del superadmin y lista lo que Bookmy YA
   pagó) — esto es el dato que el propio negocio entrega una vez para
   que Bookmy sepa a dónde liquidarle.
============================================================ */
import { useEffect, useState } from "react";
import { EmpresasApi } from "@/api/modules";
import type { ApiMetodoCobroOnline } from "@/api/types";
import { ApiError } from "@/api/http";
import { useData } from "@/hooks/useData";
import { useSession } from "@/context/SessionContext";
import { useRegion } from "@/context/RegionContext";
import { useUi } from "@/context/UiContext";
import { useI18n } from "@/i18n";
import Panel, { PanelHead } from "@/components/ui/Panel";
import Button from "@/components/ui/Button";
import styles from "../../app/(panel)/configuracion/configuracion.module.css";

export default function CuentaPago() {
  const { session } = useSession();
  const { pais } = useRegion();
  const { toast } = useUi();
  const { t } = useI18n();
  const empresaId = session?.negocioId ? Number(session.negocioId) : null;

  const { data: cuenta, reload } = useData(
    () => (empresaId ? EmpresasApi.cuentaPago.obtener(empresaId).catch(() => null) : Promise.resolve(null)),
    [empresaId],
    null
  );

  const [metodo, setMetodo] = useState<ApiMetodoCobroOnline>("WISE");
  const [wiseEmail, setWiseEmail] = useState("");
  const [bancoTitular, setBancoTitular] = useState("");
  const [bancoNumero, setBancoNumero] = useState("");
  const [bancoTipoCuenta, setBancoTipoCuenta] = useState("ahorros");
  const [guardando, setGuardando] = useState(false);

  /* Carga lo ya guardado, si hay. */
  useEffect(() => {
    if (!cuenta) return;
    setMetodo(cuenta.metodo);
    setWiseEmail(cuenta.wiseEmail || "");
    setBancoTitular(cuenta.bancoTitular || "");
    setBancoNumero(cuenta.bancoNumero || "");
    setBancoTipoCuenta(cuenta.bancoTipoCuenta || "ahorros");
  }, [cuenta]);

  const esColombia = pais.isoCode === "CO";
  const etiquetaNumero = esColombia ? t("configuracion.cuentaNumeroCO") : t("configuracion.cuentaNumeroES");

  const guardar = async () => {
    if (!empresaId) return;
    if (metodo === "WISE" && !wiseEmail.trim()) {
      toast(t("configuracion.cuentaFaltaWise"), "error");
      return;
    }
    if (metodo === "BANCO" && (!bancoTitular.trim() || !bancoNumero.trim())) {
      toast(t("configuracion.cuentaFaltaBanco"), "error");
      return;
    }
    setGuardando(true);
    try {
      await EmpresasApi.cuentaPago.guardar(empresaId, {
        metodo,
        wiseEmail: metodo === "WISE" ? wiseEmail.trim() : undefined,
        bancoTitular: metodo === "BANCO" ? bancoTitular.trim() : undefined,
        bancoNumero: metodo === "BANCO" ? bancoNumero.trim() : undefined,
        bancoTipoCuenta: metodo === "BANCO" && esColombia ? bancoTipoCuenta : undefined,
      });
      toast(t("configuracion.cuentaGuardada"), "success");
      await reload();
    } catch (e) {
      toast(e instanceof ApiError ? e.message : t("common.error"), "error");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Panel>
      <PanelHead title={t("configuracion.cuentaTitle")} sub={t("configuracion.cuentaSub")} />
      <div className={styles.formCol}>
        <div>
          <label htmlFor="cp-metodo">{t("configuracion.cuentaMetodo")}</label>
          <select id="cp-metodo" value={metodo} onChange={(e) => setMetodo(e.target.value as ApiMetodoCobroOnline)}>
            <option value="WISE">Wise</option>
            <option value="BANCO">{t("configuracion.cuentaBanco")}</option>
          </select>
        </div>

        {metodo === "WISE" ? (
          <div>
            <label htmlFor="cp-wise">{t("configuracion.cuentaWiseEmail")}</label>
            <input
              id="cp-wise"
              type="email"
              value={wiseEmail}
              onChange={(e) => setWiseEmail(e.target.value)}
              placeholder="pagos@minegocio.com"
            />
          </div>
        ) : (
          <>
            <div>
              <label htmlFor="cp-titular">{t("configuracion.cuentaTitular")}</label>
              <input id="cp-titular" value={bancoTitular} onChange={(e) => setBancoTitular(e.target.value)} />
            </div>
            <div>
              <label htmlFor="cp-numero">{etiquetaNumero}</label>
              <input id="cp-numero" value={bancoNumero} onChange={(e) => setBancoNumero(e.target.value)} />
            </div>
            {esColombia && (
              <div>
                <label htmlFor="cp-tipo">{t("configuracion.cuentaTipo")}</label>
                <select id="cp-tipo" value={bancoTipoCuenta} onChange={(e) => setBancoTipoCuenta(e.target.value)}>
                  <option value="ahorros">{t("configuracion.cuentaAhorros")}</option>
                  <option value="corriente">{t("configuracion.cuentaCorriente")}</option>
                </select>
              </div>
            )}
          </>
        )}

        {/* Wise valida el IBAN o el email al guardar; si lo rechaza, el
            motivo llega en el toast de error. */}
        {cuenta ? (
          <p className={cuenta.wiseRecipientId ? styles.cuentaOk : styles.cuentaPendiente}>
            {cuenta.wiseRecipientId
              ? t("configuracion.cuentaVerificada")
              : t("configuracion.cuentaSinVerificar")}
          </p>
        ) : null}

        <div><Button onClick={() => void guardar()} disabled={guardando}>
          {guardando ? t("configuracion.cuentaGuardando") : t("configuracion.saveChanges")}
        </Button></div>
      </div>
    </Panel>
  );
}
