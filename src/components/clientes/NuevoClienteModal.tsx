"use client";
/* ============================================================
   NuevoClienteModal — alta manual de un cliente final.

   Lo usan la página de Clientes y «Nueva factura» (para cobrar a
   alguien que aún no tiene cuenta). Crea la cuenta de la app de
   clientes con POST /auth/register; la contraseña llega generada
   para que el admin solo tenga que entregarla (o el cliente puede
   usar «Olvidé mi contraseña»).

   Se renderiza como hermano del modal que lo abre, nunca dentro:
   la caja del Modal lleva transform y un overlay `fixed` anidado
   quedaría recortado a ella.
============================================================ */
import { useEffect, useState } from "react";
import type { ClienteOpcion } from "@/models";
import { ClientesController, GENEROS_CLIENTE } from "@/controllers/CrudControllers";
import { useI18n } from "@/i18n";
import { useUi } from "@/context/UiContext";
import { useRegion } from "@/context/RegionContext";
import Modal, { ModalTitle, ModalText, ModalActions, Field } from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import { generarPassword, isStrongPassword } from "@/lib/password";
import styles from "./NuevoClienteModal.module.css";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function NuevoClienteModal({
  open,
  onClose,
  onCreado,
  textoInicial = "",
  empresaId,
}: {
  /** Solo superadmin: negocio al que se vincula el cliente */
  empresaId?: string;
  /** Lo que ya se tecleó en un buscador: se usa como correo si lo
      parece y, si no, como nombre, para no escribirlo dos veces. */
  textoInicial?: string;
  open: boolean;
  onClose: () => void;
  /** Recibe el cliente ya creado (con su id real del backend) */
  onCreado: (cliente: ClienteOpcion) => void | Promise<void>;
}) {
  const { t, locale } = useI18n();
  const { toast } = useUi();
  const { pais } = useRegion();

  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [telefono, setTelefono] = useState("");
  const [genero, setGenero] = useState("");
  const [fechaNacimiento, setFechaNacimiento] = useState("");
  const [password, setPassword] = useState("");
  const [consentimiento, setConsentimiento] = useState(false);
  const [guardando, setGuardando] = useState(false);

  /* Formulario limpio y contraseña nueva cada vez que se abre */
  useEffect(() => {
    if (!open) return;
    const inicial = textoInicial.trim();
    const esCorreo = inicial.includes("@");
    setNombre(esCorreo ? "" : inicial); setEmail(esCorreo ? inicial : ""); setTelefono(""); setGenero(""); setFechaNacimiento("");
    setPassword(generarPassword());
    setConsentimiento(false);
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const crear = async () => {
    if (!nombre.trim()) { toast(t("common.requiredName"), "error"); return; }
    if (!EMAIL_RE.test(email.trim())) { toast(t("clientes.emailInvalid"), "error"); return; }
    if (!telefono.trim()) { toast(t("clientes.phoneRequired"), "error"); return; }
    if (!isStrongPassword(password)) { toast(t("clientes.passwordShort"), "error"); return; }
    if (!consentimiento) { toast(t("clientes.consentRequired"), "error"); return; }

    setGuardando(true);
    try {
      const cliente = await ClientesController.crear({
        nombre, email, telefono, password, genero, fechaNacimiento,
        idioma: locale,
        paisId: pais.id,
        empresaId: empresaId ? Number(empresaId) : undefined,
      });
      toast(t("clientes.added"), "success");
      await onCreado(cliente);
      onClose();
    } catch (e) {
      toast(e instanceof Error ? e.message : t("common.error"), "error");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Modal open={open} onClose={() => { if (!guardando) onClose(); }} maxWidth={560}>
      <ModalTitle>{t("clientes.modalTitle")}</ModalTitle>
      <ModalText>{t("clientes.createIntro")}</ModalText>

      <Field label={t("common.fullName")} htmlFor="nc-nombre">
        <input
          id="nc-nombre"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder={t("clientes.namePlaceholder")}
          maxLength={50}
          autoFocus
        />
      </Field>

      <div className={styles.fila}>
        <Field label={t("common.email")} htmlFor="nc-email">
          <input
            id="nc-email"
            type="email"
            autoComplete="off"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="cliente@correo.com"
          />
        </Field>
        <Field label={t("common.phone")} htmlFor="nc-tel">
          <input
            id="nc-tel"
            type="tel"
            value={telefono}
            onChange={(e) => setTelefono(e.target.value)}
            placeholder={t("common.phonePh")}
          />
        </Field>
      </div>

      <div className={styles.fila}>
        <Field label={`${t("clientes.gender")} · ${t("clientes.optional")}`} htmlFor="nc-genero">
          <select id="nc-genero" value={genero} onChange={(e) => setGenero(e.target.value)}>
            <option value="">{t("clientes.genderUnspecified")}</option>
            {GENEROS_CLIENTE.map((g) => (
              <option key={g} value={g}>{t(`clientes.genders.${g}`)}</option>
            ))}
          </select>
        </Field>
        <Field label={`${t("clientes.birthdate")} · ${t("clientes.optional")}`} htmlFor="nc-nac">
          <input id="nc-nac" type="date" value={fechaNacimiento} onChange={(e) => setFechaNacimiento(e.target.value)} />
        </Field>
      </div>

      <Field label={t("clientes.accessPassword")} htmlFor="nc-pass" hint={t("clientes.accessPasswordHint")}>
        <div className={styles.passRow}>
          <input
            id="nc-pass"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Button size="sm" variant="ghost" type="button" onClick={() => setPassword(generarPassword())}>
            {t("personal.generateShort")}
          </Button>
        </div>
      </Field>

      <label className={styles.consent}>
        <input
          type="checkbox"
          checked={consentimiento}
          onChange={(e) => setConsentimiento(e.target.checked)}
        />
        <span>{t("clientes.consent")}</span>
      </label>

      <ModalActions>
        <Button variant="ghost" onClick={onClose} disabled={guardando}>{t("common.cancel")}</Button>
        <Button onClick={() => void crear()} disabled={guardando}>
          {guardando ? t("common.saving") : t("clientes.create")}
        </Button>
      </ModalActions>
    </Modal>
  );
}
