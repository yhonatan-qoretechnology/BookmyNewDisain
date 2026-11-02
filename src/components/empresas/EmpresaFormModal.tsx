"use client";
/* ============================================================
   EmpresaFormModal — alta y edición de una empresa (superadmin).

   Mismo formulario que el módulo de empresas de Bookmy-Admin:
   POST /empresas y PATCH /empresas/:id en multipart, con el logo
   en el campo "logo". Además pide el país en el alta, porque de él
   salen la moneda, los impuestos y los festivos (y no se cambia).

   En edición carga la empresa con GET /empresas/:id para no pisar
   los campos que la lista no trae (redes, descripción larga…).
============================================================ */
import { useEffect, useState } from "react";
import { EmpresasApi } from "@/api/modules";
import type { ApiEmpresa } from "@/api/types";
import { useI18n } from "@/i18n";
import { useUi } from "@/context/UiContext";
import Modal, { ModalTitle, ModalText, ModalActions, Field } from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import styles from "./EmpresaFormModal.module.css";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/* Los mercados en los que se puede dar de alta un negocio */
const PAISES = [
  { iso: "ES", nombre: "España" },
  { iso: "CO", nombre: "Colombia" },
] as const;

type Form = {
  nombre: string;
  paisIso: string;
  telefono: string;
  email: string;
  nit: string;
  descripcion: string;
  descripcionLarga: string;
  facebookUrl: string;
  instagramUrl: string;
  tiktokUrl: string;
  webUrl: string;
};

const VACIO: Form = {
  nombre: "", paisIso: "ES", telefono: "", email: "", nit: "",
  descripcion: "", descripcionLarga: "",
  facebookUrl: "", instagramUrl: "", tiktokUrl: "", webUrl: "",
};

const REDES = ["facebookUrl", "instagramUrl", "tiktokUrl", "webUrl"] as const;

/** "instagram.com/x" → "https://instagram.com/x": el backend exige URL completa */
function conProtocolo(url: string) {
  const u = url.trim();
  return !u || /^https?:\/\//i.test(u) ? u : `https://${u}`;
}

function esUrl(url: string) {
  try {
    const u = new URL(url);
    return u.hostname.includes(".");
  } catch {
    return false;
  }
}

export default function EmpresaFormModal({
  open,
  empresaId,
  onClose,
  onGuardada,
}: {
  open: boolean;
  /** Con id edita esa empresa; sin él da de alta una nueva */
  empresaId?: number | null;
  onClose: () => void;
  onGuardada: (empresa: ApiEmpresa) => void | Promise<void>;
}) {
  const { t } = useI18n();
  const { toast } = useUi();
  const editando = !!empresaId;

  const [form, setForm] = useState<Form>(VACIO);
  const [logo, setLogo] = useState<File | null>(null);
  const [errores, setErrores] = useState<Partial<Record<keyof Form, string>>>({});
  const [cargando, setCargando] = useState(false);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (!open) return;
    setErrores({});
    setLogo(null);
    if (!empresaId) { setForm(VACIO); return; }
    let vivo = true;
    setCargando(true);
    EmpresasApi.findOne(empresaId)
      .then((e) => {
        if (!vivo) return;
        setForm({
          nombre: e.nombre ?? "",
          paisIso: e.country?.isoCode ?? "ES",
          telefono: e.telefono ?? "",
          email: e.email ?? "",
          nit: e.nit ?? "",
          descripcion: e.descripcion ?? "",
          descripcionLarga: e.descripcionLarga ?? "",
          facebookUrl: e.facebookUrl ?? "",
          instagramUrl: e.instagramUrl ?? "",
          tiktokUrl: e.tiktokUrl ?? "",
          webUrl: e.webUrl ?? "",
        });
      })
      .catch((err) => toast(err instanceof Error ? err.message : t("common.error"), "error"))
      .finally(() => { if (vivo) setCargando(false); });
    return () => { vivo = false; };
  }, [open, empresaId]); // eslint-disable-line react-hooks/exhaustive-deps

  const set = (campo: keyof Form, valor: string) => {
    setForm((f) => ({ ...f, [campo]: valor }));
    setErrores((e) => ({ ...e, [campo]: undefined }));
  };

  const validar = () => {
    const e: Partial<Record<keyof Form, string>> = {};
    if (!form.nombre.trim()) e.nombre = t("empresas.form.errNombre");
    if (!form.telefono.trim()) e.telefono = t("empresas.form.errTelefono");
    if (!form.email.trim()) e.email = t("empresas.form.errEmail");
    else if (!EMAIL_RE.test(form.email.trim())) e.email = t("empresas.form.errEmailInvalido");
    if (!form.nit.trim()) e.nit = t("empresas.form.errNit");
    if (!form.descripcion.trim()) e.descripcion = t("empresas.form.errDescripcion");
    for (const r of REDES) {
      const u = conProtocolo(form[r]);
      if (u && !esUrl(u)) e[r] = t("empresas.form.errUrl");
    }
    setErrores(e);
    return Object.keys(e).length === 0;
  };

  const guardar = async () => {
    if (!validar()) return;
    const fd = new FormData();
    fd.append("nombre", form.nombre.trim());
    /* El país solo se elige en el alta: después no se cambia */
    if (!editando) fd.append("paisIso", form.paisIso);
    fd.append("telefono", form.telefono.trim());
    fd.append("email", form.email.trim());
    fd.append("nit", form.nit.trim());
    fd.append("descripcion", form.descripcion.trim());
    if (form.descripcionLarga.trim()) fd.append("descripcionLarga", form.descripcionLarga.trim());
    for (const r of REDES) {
      const u = conProtocolo(form[r]);
      if (u) fd.append(r, u);
    }
    if (logo) fd.append("logo", logo);

    setGuardando(true);
    try {
      const empresa = editando
        ? await EmpresasApi.actualizarForm(empresaId!, fd)
        : await EmpresasApi.crearForm(fd);
      toast(editando ? t("empresas.updated") : t("empresas.created"), "success");
      await onGuardada(empresa);
      onClose();
    } catch (err) {
      toast(err instanceof Error ? err.message : t("common.error"), "error");
    } finally {
      setGuardando(false);
    }
  };

  const err = (campo: keyof Form) =>
    errores[campo] ? <small className={styles.error}>{errores[campo]}</small> : null;

  return (
    <Modal open={open} onClose={() => { if (!guardando) onClose(); }} maxWidth={640}>
      <ModalTitle>{editando ? t("empresas.editTitle") : t("empresas.modalTitle")}</ModalTitle>
      <ModalText>{editando ? t("empresas.form.introEditar") : t("empresas.form.intro")}</ModalText>

      {cargando ? (
        <ModalText>{t("common.loading")}</ModalText>
      ) : (
        <>
          <div className={styles.fila}>
            <Field label={`${t("common.name")} *`} htmlFor="em-nombre">
              <input
                id="em-nombre"
                value={form.nombre}
                onChange={(e) => set("nombre", e.target.value)}
                placeholder={t("empresas.namePlaceholder")}
                autoFocus
              />
              {err("nombre")}
            </Field>
            <Field
              label={`${t("empresas.form.pais")} *`}
              htmlFor="em-pais"
              hint={editando ? t("empresas.form.paisFijo") : t("empresas.form.paisHint")}
            >
              <select
                id="em-pais"
                value={form.paisIso}
                onChange={(e) => set("paisIso", e.target.value)}
                disabled={editando}
              >
                {PAISES.map((p) => <option key={p.iso} value={p.iso}>{p.nombre}</option>)}
              </select>
            </Field>
          </div>

          <div className={styles.fila}>
            <Field label={`${t("common.phone")} *`} htmlFor="em-tel">
              <input id="em-tel" type="tel" value={form.telefono} onChange={(e) => set("telefono", e.target.value)} />
              {err("telefono")}
            </Field>
            <Field label={`${t("common.email")} *`} htmlFor="em-email">
              <input id="em-email" type="email" value={form.email} onChange={(e) => set("email", e.target.value)} />
              {err("email")}
            </Field>
          </div>

          <Field label={`${form.paisIso === "CO" ? "NIT" : "NIF / CIF"} *`} htmlFor="em-nit">
            <input id="em-nit" value={form.nit} onChange={(e) => set("nit", e.target.value)} />
            {err("nit")}
          </Field>

          <Field label={`${t("empresas.form.descripcion")} *`} htmlFor="em-desc">
            <textarea
              id="em-desc"
              rows={2}
              value={form.descripcion}
              onChange={(e) => set("descripcion", e.target.value)}
              placeholder={t("empresas.rubroPlaceholder")}
            />
            {err("descripcion")}
          </Field>

          <Field label={t("empresas.form.descripcionLarga")} htmlFor="em-desc-larga">
            <textarea
              id="em-desc-larga"
              rows={3}
              value={form.descripcionLarga}
              onChange={(e) => set("descripcionLarga", e.target.value)}
            />
          </Field>

          <div className={styles.fila}>
            <Field label="Facebook" htmlFor="em-fb">
              <input id="em-fb" value={form.facebookUrl} onChange={(e) => set("facebookUrl", e.target.value)} placeholder="facebook.com/tuempresa" />
              {err("facebookUrl")}
            </Field>
            <Field label="Instagram" htmlFor="em-ig">
              <input id="em-ig" value={form.instagramUrl} onChange={(e) => set("instagramUrl", e.target.value)} placeholder="instagram.com/tuempresa" />
              {err("instagramUrl")}
            </Field>
            <Field label="TikTok" htmlFor="em-tt">
              <input id="em-tt" value={form.tiktokUrl} onChange={(e) => set("tiktokUrl", e.target.value)} placeholder="tiktok.com/@tuempresa" />
              {err("tiktokUrl")}
            </Field>
            <Field label={t("empresas.form.web")} htmlFor="em-web">
              <input id="em-web" value={form.webUrl} onChange={(e) => set("webUrl", e.target.value)} placeholder="www.tuempresa.com" />
              {err("webUrl")}
            </Field>
          </div>

          <Field label={t("empresas.form.logo")} htmlFor="em-logo" hint={editando ? t("empresas.form.logoHintEditar") : undefined}>
            <input
              id="em-logo"
              type="file"
              accept="image/*"
              onChange={(e) => setLogo(e.target.files?.[0] ?? null)}
            />
          </Field>
        </>
      )}

      <ModalActions>
        <Button variant="ghost" onClick={onClose} disabled={guardando}>{t("common.cancel")}</Button>
        <Button onClick={() => void guardar()} disabled={guardando || cargando}>
          {guardando ? t("common.saving") : t("common.save")}
        </Button>
      </ModalActions>
    </Modal>
  );
}
