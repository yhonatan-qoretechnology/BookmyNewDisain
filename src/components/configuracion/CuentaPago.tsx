"use client";
/* ============================================================
   CuentaPago — configurar pagos online: a dónde liquida Bookmy
   al negocio (cuenta Wise o cuenta bancaria)
   ------------------------------------------------------------
   Es una configuración de TODA la empresa, no de una sede, así que
   la gestionan su dueño (role "owner" = COMPANY_ADMIN) y el
   superadmin, que elige primero la empresa — el mismo alcance que
   GET/POST /empresas/:id/cuenta-pago. Distinto de /liquidaciones,
   que lista lo que Bookmy YA pagó.

   La etiqueta y la validación del número dependen del país de la
   EMPRESA, no de la sesión: el superadmin configura negocios de
   cualquier país.
============================================================ */
import { useEffect, useMemo, useState } from "react";
import { EmpresasApi, PaisesApi } from "@/api/modules";
import type { ApiMetodoCobroOnline } from "@/api/types";
import { ApiError } from "@/api/http";
import { useData } from "@/hooks/useData";
import { useSession } from "@/context/SessionContext";
import { useRegion } from "@/context/RegionContext";
import { useUi } from "@/context/UiContext";
import { useI18n } from "@/i18n";
import Panel, { PanelHead } from "@/components/ui/Panel";
import Button from "@/components/ui/Button";
import Icon from "@/components/ui/Icon";
import styles from "../../app/(panel)/configuracion/configuracion.module.css";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** IBAN sin espacios y en mayúsculas, tal como se guarda. */
const normalizarIban = (v: string) => v.replace(/\s+/g, "").toUpperCase();

/**
 * Comprobación ISO 13616 (mod 97). Atrapa en el formulario las
 * erratas que, si no, Wise rechazaría al crear el destinatario.
 */
function ibanValido(valor: string): boolean {
  const iban = normalizarIban(valor);
  if (!/^[A-Z]{2}\d{2}[A-Z0-9]{11,30}$/.test(iban)) return false;
  const reordenado = iban.slice(4) + iban.slice(0, 4);
  let resto = 0;
  for (const ch of reordenado) {
    const n = ch >= "A" ? String(ch.charCodeAt(0) - 55) : ch;
    for (const d of n) resto = (resto * 10 + Number(d)) % 97;
  }
  return resto === 1;
}

/** El IBAN en grupos de 4, como se lee en un extracto. */
const agruparIban = (v: string) => normalizarIban(v).replace(/(.{4})(?=.)/g, "$1 ");

export default function CuentaPago() {
  const { session } = useSession();
  const { pais: paisSesion } = useRegion();
  const { toast } = useUi();
  const { t } = useI18n();
  const esSuperadmin = session?.role === "superadmin";

  /* El superadmin no pertenece a ninguna empresa: elige cuál configura */
  const [empresaElegida, setEmpresaElegida] = useState("");
  const { data: empresas } = useData(
    () => (esSuperadmin ? EmpresasApi.findAll().catch(() => []) : Promise.resolve([])),
    [esSuperadmin],
    []
  );
  const { data: paises } = useData(
    () => (esSuperadmin ? PaisesApi.listar().catch(() => []) : Promise.resolve([])),
    [esSuperadmin],
    []
  );

  const empresaId = esSuperadmin
    ? (empresaElegida ? Number(empresaElegida) : null)
    : (session?.negocioId ? Number(session.negocioId) : null);

  /* País de la empresa configurada; al dueño le basta el de su sesión */
  const isoPais = useMemo(() => {
    if (!esSuperadmin) return paisSesion.isoCode;
    const empresa = empresas.find((e) => e.id === empresaId);
    return paises.find((p) => p.id === empresa?.paisId)?.isoCode ?? paisSesion.isoCode;
  }, [esSuperadmin, empresas, paises, empresaId, paisSesion.isoCode]);
  const esColombia = isoPais === "CO";

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

  /* Carga lo ya guardado; al cambiar de empresa sin datos, se vacía */
  useEffect(() => {
    setMetodo(cuenta?.metodo ?? "WISE");
    setWiseEmail(cuenta?.wiseEmail || "");
    setBancoTitular(cuenta?.bancoTitular || "");
    setBancoNumero(cuenta?.bancoNumero ? (esColombia ? cuenta.bancoNumero : agruparIban(cuenta.bancoNumero)) : "");
    setBancoTipoCuenta(cuenta?.bancoTipoCuenta || "ahorros");
  }, [cuenta]); // eslint-disable-line react-hooks/exhaustive-deps

  const guardar = async () => {
    if (!empresaId) return;
    if (metodo === "WISE" && !EMAIL_RE.test(wiseEmail.trim())) {
      toast(t("configuracion.cuentaFaltaWise"), "error");
      return;
    }
    if (metodo === "BANCO") {
      if (!bancoTitular.trim() || !bancoNumero.trim()) {
        toast(t("configuracion.cuentaFaltaBanco"), "error");
        return;
      }
      if (!esColombia && !ibanValido(bancoNumero)) {
        toast(t("configuracion.cuentaIbanInvalido"), "error");
        return;
      }
    }
    setGuardando(true);
    try {
      await EmpresasApi.cuentaPago.guardar(empresaId, {
        metodo,
        wiseEmail: metodo === "WISE" ? wiseEmail.trim() : undefined,
        bancoTitular: metodo === "BANCO" ? bancoTitular.trim() : undefined,
        bancoNumero: metodo === "BANCO"
          ? (esColombia ? bancoNumero.replace(/\s+/g, "") : normalizarIban(bancoNumero))
          : undefined,
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

  const opciones: { valor: ApiMetodoCobroOnline; icono: string; titulo: string; detalle: string }[] = [
    { valor: "WISE", icono: "wallet", titulo: "Wise", detalle: t("configuracion.cuentaWiseDetalle") },
    {
      valor: "BANCO",
      icono: "building",
      titulo: t("configuracion.cuentaBanco"),
      detalle: esColombia ? t("configuracion.cuentaBancoDetalleCO") : t("configuracion.cuentaBancoDetalleES"),
    },
  ];

  return (
    <Panel>
      <PanelHead title={t("configuracion.cuentaTitle")} sub={t("configuracion.cuentaSub")} />
      <div className={styles.formCol}>
        {esSuperadmin && (
          <div>
            <label htmlFor="cp-empresa">{t("configuracion.cuentaEmpresa")}</label>
            <select id="cp-empresa" value={empresaElegida} onChange={(e) => setEmpresaElegida(e.target.value)}>
              <option value="">{t("configuracion.cuentaEmpresaPlaceholder")}</option>
              {empresas.map((e) => <option key={e.id} value={e.id}>{e.nombre}</option>)}
            </select>
          </div>
        )}

        {empresaId == null ? (
          <p className={styles.cuentaPendiente}>{t("configuracion.cuentaEligeEmpresa")}</p>
        ) : (
          <>
            <div>
              <span className={styles.cuentaLabel} id="cp-metodo">{t("configuracion.cuentaMetodo")}</span>
              <div className={styles.metodoGrid} role="radiogroup" aria-labelledby="cp-metodo">
                {opciones.map((o) => {
                  const activo = metodo === o.valor;
                  return (
                    <button
                      key={o.valor}
                      type="button"
                      role="radio"
                      aria-checked={activo}
                      className={`${styles.metodo} ${activo ? styles.metodoActivo : ""}`}
                      onClick={() => setMetodo(o.valor)}
                    >
                      <span className={styles.metodoIcono}><Icon name={o.icono} /></span>
                      <span className={styles.metodoTexto}>
                        <b>{o.titulo}</b>
                        <span>{o.detalle}</span>
                      </span>
                      <span className={styles.metodoRadio} aria-hidden />
                    </button>
                  );
                })}
              </div>
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
                  <input id="cp-titular" value={bancoTitular} onChange={(e) => setBancoTitular(e.target.value)} maxLength={160} />
                </div>
                <div>
                  <label htmlFor="cp-numero">
                    {esColombia ? t("configuracion.cuentaNumeroCO") : t("configuracion.cuentaNumeroES")}
                  </label>
                  <input
                    id="cp-numero"
                    value={bancoNumero}
                    inputMode={esColombia ? "numeric" : "text"}
                    autoComplete="off"
                    spellCheck={false}
                    placeholder={esColombia ? "0123456789" : "ES76 2077 0024 0031 0257 5766"}
                    onChange={(e) => setBancoNumero(e.target.value)}
                    onBlur={() => { if (!esColombia && bancoNumero) setBancoNumero(agruparIban(bancoNumero)); }}
                  />
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
          </>
        )}
      </div>
    </Panel>
  );
}
